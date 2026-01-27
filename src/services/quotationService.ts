// src/services/quotationService.ts
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  runTransaction,
  type DocumentData,
  type Timestamp as TimestampType,
} from "firebase/firestore";

/**
 * -------------------- TYPES --------------------
 */

//interface contains the structure of how QuotationItem will be
export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

//this are the enums of the Quotation status
export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

export interface Quotation {
  id?: string;

  companyName: string;
  quotationNumber: string;

  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;

  clientEmailLower: string;


  projectId?: string;

  items: QuotationItem[];

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  notes?: string;
  validUntil?: Date;

  status: QuotationStatus;

  userId: string;

  createdAt: Date;
  updatedAt: Date;
}


type QuotationDoc = Omit<Quotation, "id" | "createdAt" | "updatedAt" | "validUntil"> & {
  createdAt: TimestampType | ReturnType<typeof serverTimestamp>;
  updatedAt: TimestampType | ReturnType<typeof serverTimestamp>;
  validUntil?: TimestampType | null;
};


export type UpdateQuotationInput = {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  taxRate: number;
  notes?: string;
  validUntil?: Date;
  status: QuotationStatus;
};


export type CreateQuotationInput = {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;

  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  taxRate: number;

  notes?: string;
  validUntil?: Date;

  status?: QuotationStatus;
};


const QUOTATIONS_SUBCOLLECTION = "quotations"; // under projects/{projectId}/quotations
const STANDALONE_QUOTATIONS_COLLECTION = "quotations_standalone"; // top-level

const USER_COUNTERS_SUBCOLLECTION = "counters";
const QUOTATIONS_COUNTER_DOC = "quotations";


function toDateSafe(value: any): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  return new Date(0);
}

function round2(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function calculateQuotationTotals(items: QuotationItem[], taxRate: number) {
  const cleanedItems = items.map((it) => {
    const quantity = Number(it.quantity) || 0;
    const unitPrice = Number(it.unitPrice) || 0;
    const total = round2(quantity * unitPrice);

    return {
      description: (it.description || "").trim(),
      quantity,
      unitPrice,
      total,
    };
  });

  const subtotal = round2(cleanedItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0));
  const rate = Number(taxRate) || 0;
  const taxAmount = round2((subtotal * rate) / 100);
  const total = round2(subtotal + taxAmount);

  return { items: cleanedItems, subtotal, taxRate: rate, taxAmount, total };
}

export async function getUserCompanyName(userId: string): Promise<string> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return "";
  const data = snap.data() as { companyName?: string };
  return (data.companyName || "").trim();
}

/**
 * ✅ NEW: generate a user-friendly sequential quotation number
 * Example: QT-00023 or QT-2026-00023 (you can customize)
 */
async function generateQuotationNumber(userId: string, prefix = "QT"): Promise<string> {
  const counterRef = doc(db, "users", userId, USER_COUNTERS_SUBCOLLECTION, QUOTATIONS_COUNTER_DOC);

  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? Number((snap.data() as any).next || 1) : 1;
    const nextValue = current + 1;

    tx.set(counterRef, { next: nextValue }, { merge: true });

    return current;
  });

  const padded = String(next).padStart(5, "0"); // 00001
  return `${prefix}-${padded}`;
}

/**
 * Helper to map raw Firestore data to Quotation interface
 */
const mapDocToQuotation = (d: any, defaultProjectId?: string): Quotation => {
  const data = d.data() as DocumentData;
  const clientEmail = (data.clientEmail || "").trim();

  return {
    id: d.id,
    companyName: (data.companyName || "").trim(),
    quotationNumber: data.quotationNumber,
    clientName: data.clientName,
    clientEmail,
    clientAddress: data.clientAddress,
    clientPhone: data.clientPhone || "",
    clientEmailLower: ((data.clientEmailLower || clientEmail) as string).toLowerCase(),

    projectId: data.projectId || defaultProjectId,

    items: (data.items || []) as QuotationItem[],
    subtotal: Number(data.subtotal) || 0,
    taxRate: Number(data.taxRate) || 0,
    taxAmount: Number(data.taxAmount) || 0,
    total: Number(data.total) || 0,
    notes: data.notes || "",
    validUntil: data.validUntil ? toDateSafe(data.validUntil) : undefined,
    status: data.status as QuotationStatus,
    userId: data.userId,
    createdAt: toDateSafe(data.createdAt),
    updatedAt: toDateSafe(data.updatedAt),
  };
};

/**
 * -------------------- PROJECT BASED METHODS --------------------
 * (already working)
 */

export const createQuotation = async (
    projectId: string,
    userId: string,
    input: CreateQuotationInput
): Promise<string> => {
  try {
    if (!projectId) throw new Error("projectId is required");
    if (!userId) throw new Error("userId is required");

    const companyName = await getUserCompanyName(userId);
    if (!companyName) throw new Error("Company name not found. Please complete your profile.");

    // ✅ better number than Date.now()
    const quotationNumber = await generateQuotationNumber(userId, "QT");

    const { items, subtotal, taxRate, taxAmount, total } = calculateQuotationTotals(
        input.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
        })),
        input.taxRate
    );

    const quotationDoc: QuotationDoc = {
      companyName,
      quotationNumber,
      clientName: (input.clientName || "").trim(),
      clientEmail: (input.clientEmail || "").trim(),
      clientAddress: (input.clientAddress || "").trim(),
      clientPhone: (input.clientPhone || "").trim(),
      clientEmailLower: (input.clientEmail || "").trim().toLowerCase(),

      projectId, // ✅ tied to project

      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: (input.notes || "").trim() || "",
      validUntil: input.validUntil ? Timestamp.fromDate(input.validUntil) : null,
      status: input.status || "draft",
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "projects", projectId, QUOTATIONS_SUBCOLLECTION), quotationDoc);
    return ref.id;
  } catch (error: any) {
    throw new Error("Failed to create quotation: " + (error?.message ?? "Unknown error"));
  }
};

export const getProjectQuotations = async (projectId: string): Promise<Quotation[]> => {
  try {
    if (!projectId) throw new Error("projectId is required");

    // ✅ optional: orderBy createdAt desc (requires index sometimes)
    const snap = await getDocs(collection(db, "projects", projectId, QUOTATIONS_SUBCOLLECTION));

    const quotations = snap.docs.map((d) => mapDocToQuotation(d, projectId));
    quotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return quotations;
  } catch (error: any) {
    throw new Error("Failed to fetch quotations: " + (error?.message ?? "Unknown error"));
  }
};

export const updateQuotation = async (
    projectId: string,
    quotationId: string,
    input: UpdateQuotationInput
): Promise<void> => {
  try {
    if (!projectId) throw new Error("projectId is required");
    if (!quotationId) throw new Error("quotationId is required");

    const cleanedEmail = (input.clientEmail || "").trim();
    const cleanedEmailLower = cleanedEmail.toLowerCase();

    const { items, subtotal, taxRate, taxAmount, total } = calculateQuotationTotals(
        input.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
        })),
        input.taxRate
    );

    await updateDoc(doc(db, "projects", projectId, QUOTATIONS_SUBCOLLECTION, quotationId), {
      clientName: (input.clientName || "").trim(),
      clientEmail: cleanedEmail,
      clientEmailLower: cleanedEmailLower,
      clientAddress: (input.clientAddress || "").trim(),
      clientPhone: (input.clientPhone || "").trim(),
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: (input.notes || "").trim() || "",
      validUntil: input.validUntil ? Timestamp.fromDate(input.validUntil) : null,
      status: input.status,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error("Failed to update quotation: " + (error?.message ?? "Unknown error"));
  }
};

export const deleteQuotation = async (projectId: string, quotationId: string): Promise<void> => {
  try {
    if (!projectId) throw new Error("projectId is required");
    if (!quotationId) throw new Error("quotationId is required");
    await deleteDoc(doc(db, "projects", projectId, QUOTATIONS_SUBCOLLECTION, quotationId));
  } catch (error: any) {
    throw new Error("Failed to delete quotation: " + (error?.message ?? "Unknown error"));
  }
};

/**
 * -------------------- STANDALONE METHODS (NO PROJECT) --------------------
 * ✅ This is what you want: create quotations without a project.
 *
 * Data is stored in: quotations_standalone
 * Each doc has:
 *  - userId (for filtering)
 *  - all the quotation fields
 */

export const createStandaloneQuotation = async (userId: string, input: CreateQuotationInput): Promise<string> => {
  try {
    if (!userId) throw new Error("userId is required");

    const companyName = await getUserCompanyName(userId);
    if (!companyName) throw new Error("Company name not found. Please complete your profile.");

    // ✅ Better number for standalone too
    const quotationNumber = await generateQuotationNumber(userId, "QT");

    const { items, subtotal, taxRate, taxAmount, total } = calculateQuotationTotals(
        input.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
        })),
        input.taxRate
    );

    const quotationDoc: QuotationDoc = {
      companyName,
      quotationNumber,
      clientName: (input.clientName || "").trim(),
      clientEmail: (input.clientEmail || "").trim(),
      clientAddress: (input.clientAddress || "").trim(),
      clientPhone: (input.clientPhone || "").trim(),
      clientEmailLower: (input.clientEmail || "").trim().toLowerCase(),

      // ✅ no projectId

      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: (input.notes || "").trim() || "",
      validUntil: input.validUntil ? Timestamp.fromDate(input.validUntil) : null,
      status: input.status || "draft",
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, STANDALONE_QUOTATIONS_COLLECTION), quotationDoc);
    return ref.id;
  } catch (error: any) {
    throw new Error("Failed to create standalone quotation: " + (error?.message ?? "Unknown error"));
  }
};

export const getUserStandaloneQuotations = async (userId: string): Promise<Quotation[]> => {
  try {
    if (!userId) throw new Error("userId is required");

    // ✅ Query by userId. Optional orderBy createdAt desc.
    // NOTE: if you add orderBy, Firestore may ask for an index.
    const q = query(collection(db, STANDALONE_QUOTATIONS_COLLECTION), where("userId", "==", userId));

    const snap = await getDocs(q);
    const quotations = snap.docs.map((d) => mapDocToQuotation(d));
    quotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return quotations;
  } catch (error: any) {
    throw new Error("Failed to fetch standalone quotations: " + (error?.message ?? "Unknown error"));
  }
};

export const updateStandaloneQuotation = async (quotationId: string, input: UpdateQuotationInput): Promise<void> => {
  try {
    if (!quotationId) throw new Error("quotationId is required");

    const cleanedEmail = (input.clientEmail || "").trim();

    const { items, subtotal, taxRate, taxAmount, total } = calculateQuotationTotals(
        input.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
        })),
        input.taxRate
    );

    await updateDoc(doc(db, STANDALONE_QUOTATIONS_COLLECTION, quotationId), {
      clientName: (input.clientName || "").trim(),
      clientEmail: cleanedEmail,
      clientEmailLower: cleanedEmail.toLowerCase(),
      clientAddress: (input.clientAddress || "").trim(),
      clientPhone: (input.clientPhone || "").trim(),
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: (input.notes || "").trim() || "",
      validUntil: input.validUntil ? Timestamp.fromDate(input.validUntil) : null,
      status: input.status,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error("Failed to update standalone quotation: " + (error?.message ?? "Unknown error"));
  }
};

export const deleteStandaloneQuotation = async (quotationId: string): Promise<void> => {
  try {
    if (!quotationId) throw new Error("quotationId is required");
    await deleteDoc(doc(db, STANDALONE_QUOTATIONS_COLLECTION, quotationId));
  } catch (error: any) {
    throw new Error("Failed to delete standalone quotation: " + (error?.message ?? "Unknown error"));
  }
};

/**
 * -------------------- OPTIONAL: UNIFIED FEED --------------------
 * ✅ If you want one screen "All Quotations" that merges:
 *  - standalone quotations
 *  - project quotations across all projects
 *
 * This requires either:
 * A) A top-level "quotations" collection (recommended for global lists), OR
 * B) You store an "all_quotations" collection on write (fan-out), OR
 * C) You query each project's subcollection (slow, multiple reads)
 *
 * For now, here is (C) helper, because it works with your current structure.
 */

export const getAllUserQuotations = async (userId: string): Promise<Quotation[]> => {
  try {
    if (!userId) throw new Error("userId is required");

    // 1) Standalone
    const standalone = await getUserStandaloneQuotations(userId);

    // 2) Project-based: you would need a projects list then loop each project to read subcollection.
    // If you already have getUserProjects(uid), do:
    // const projects = await getUserProjects(userId);
    // const projectReads = await Promise.all(projects.map(p => getProjectQuotations(p.id)));
    // const projectQuotations = projectReads.flat();

    // Returning standalone only for now (you can merge when you add projects).
    return standalone.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    throw new Error("Failed to fetch all quotations: " + (error?.message ?? "Unknown error"));
  }
};

/**
 * -------------------- FIRESTORE SECURITY RULES (IMPORTANT) --------------------
 * Make sure your rules allow:
 * - users to read/write ONLY their own standalone quotations.
 *
 * Example idea (put in firestore.rules):
 *
 * match /quotations_standalone/{qid} {
 *   allow read, write: if request.auth != null
 *     && resource.data.userId == request.auth.uid;
 * }
 *
 * BUT for create: resource doesn't exist, so use request.resource.data.userId
 *
 * match /quotations_standalone/{qid} {
 *   allow create: if request.auth != null
 *     && request.resource.data.userId == request.auth.uid;
 *   allow read, update, delete: if request.auth != null
 *     && resource.data.userId == request.auth.uid;
 * }
 */
