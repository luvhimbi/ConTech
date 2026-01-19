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
  type DocumentData,
} from "firebase/firestore";

//interface contains the structure of how QuotationItem will be
export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
//this are the enums of the Quotation status
//so type can be used to define an enum nice
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
  projectId: string;

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
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;
  validUntil?: Timestamp | null;
};

const QUOTATIONS_SUBCOLLECTION = "quotations";

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

// this part creates the quotation in firebase
export const createQuotation = async (
    projectId: string,
    userId: string,
    input: CreateQuotationInput
): Promise<string> => {
  try {

    if (!projectId) throw new Error("projectId is required");
    if (!userId) throw new Error("userId is required");

    //we are checking for whether the company for this specific user exist in the db
    const companyName = await getUserCompanyName(userId);
    //telling the user that they should complete their profile
    if (!companyName) throw new Error("Company name not found. Please complete your profile.");

    const quotationNumber = `QT-${Date.now()}`;

    const { items, subtotal, taxRate, taxAmount, total } =
        calculateQuotationTotals(
        input.items.map((i) =>
            ({description: i.description,
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
      projectId,
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

// export const getProjectQuotations = async (projectId: string): Promise<Quotation[]> => {
//   try {
//     if (!projectId) throw new Error("projectId is required");
//
//     const snap = await getDocs(collection(db, "projects", projectId, QUOTATIONS_SUBCOLLECTION));
//
//     const quotations: Quotation[] = snap.docs.map((d) => {
//       const data = d.data() as DocumentData;
//
//       return {
//         id: d.id,
//         companyName: (data.companyName || "").trim(),
//         quotationNumber: data.quotationNumber,
//
//         clientName: data.clientName,
//         clientEmail: data.clientEmail,
//         clientAddress: data.clientAddress,
//         clientPhone: data.clientPhone || "",
//         clientEmailLower:data.clientEmailLower,
//         projectId: data.projectId || projectId,
//
//         items: (data.items || []) as QuotationItem[],
//
//         subtotal: Number(data.subtotal) || 0,
//         taxRate: Number(data.taxRate) || 0,
//         taxAmount: Number(data.taxAmount) || 0,
//         total: Number(data.total) || 0,
//
//         notes: data.notes || "",
//         validUntil: data.validUntil ? toDateSafe(data.validUntil) : undefined,
//
//         status: data.status as QuotationStatus,
//
//         userId: data.userId,
//
//         createdAt: toDateSafe(data.createdAt),
//         updatedAt: toDateSafe(data.updatedAt),
//       };
//     });
//
//     quotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
//     return quotations;
//   } catch (error: any) {
//     throw new Error("Failed to fetch quotations: " + (error?.message ?? "Unknown error"));
//   }
// };
export const getProjectQuotations = async (projectId: string): Promise<Quotation[]> => {
  try {
    if (!projectId) throw new Error("projectId is required");

    const snap = await getDocs(collection(db, "projects", projectId, QUOTATIONS_SUBCOLLECTION));

    const quotations: Quotation[] = snap.docs.map((d) => {
      const data = d.data() as DocumentData;

      const clientEmail = (data.clientEmail || "").trim();

      return {
        id: d.id,
        companyName: (data.companyName || "").trim(),
        quotationNumber: data.quotationNumber,

        clientName: data.clientName,
        clientEmail: clientEmail,
        clientAddress: data.clientAddress,
        clientPhone: data.clientPhone || "",

        // ✅ Always guarantee it exists
        clientEmailLower: ((data.clientEmailLower || clientEmail) as string).toLowerCase(),

        projectId: data.projectId || projectId,

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
    });

    quotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return quotations;
  } catch (error: any) {
    throw new Error("Failed to fetch quotations: " + (error?.message ?? "Unknown error"));
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

// -------------------- UPDATE SUPPORT --------------------

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

/**
 * Updates a quotation:
 * - recalculates totals from items + taxRate
 * - updates updatedAt server time
 * - DOES NOT change quotationNumber, companyName, userId, createdAt
 */
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

    const { items, subtotal, taxRate, taxAmount, total } =
        calculateQuotationTotals(
            input.items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
            })),
            input.taxRate
        );

    await updateDoc(
        doc(db, "projects", projectId, QUOTATIONS_SUBCOLLECTION, quotationId),
        {
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
        }
    );
  } catch (error: any) {
    throw new Error("Failed to update quotation: " + (error?.message ?? "Unknown error"));
  }
};

