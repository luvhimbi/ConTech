// src/services/invoiceService.ts
import { db } from "../firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    Timestamp,
    orderBy,
    query,
    type DocumentData,
} from "firebase/firestore";

export type InvoiceStatus = "pending" | "paid" | "cancelled";
export type InvoiceTemplateId = "classic" | "modern" | "minimal";

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number; // computed
}

export interface BillingDetails {
    businessName: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;

    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    branchCode?: string;
    accountType?: string;
    paymentReferenceNote?: string;
}

export interface DepositConfig {
    enabled: boolean;
    ratePercent: number;
    amount: number; // computed from invoice totalAmount
    dueDate?: Date;
    notes?: string;
}

export type MilestoneStatus = "not_started" | "in_progress" | "completed";

export interface InvoiceMilestone {
    title: string;
    description?: string;
    dueDate?: Date;
    status: MilestoneStatus;

    // ✅ NEW: items live inside milestone
    items: InvoiceItem[];

    // ✅ NEW: milestone subtotal (computed)
    subtotal: number;
}

export interface Invoice {
    id?: string;
    projectId: string;
    userId: string;
    invoiceNumber: string;

    templateId: InvoiceTemplateId;

    clientName: string;
    clientEmail: string;
    clientEmailLower: string;
    clientAddress?: string;
    clientPhone?: string;

    billing: BillingDetails;

    milestones: InvoiceMilestone[];

    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;

    deposit: DepositConfig;

    status: InvoiceStatus;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

type CreateInvoiceInput = {
    templateId?: InvoiceTemplateId;

    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    clientPhone?: string;

    billing?: Partial<BillingDetails>;

    milestones: Array<{
        title: string;
        description?: string;
        dueDate?: Date;
        status?: MilestoneStatus;
        items: Array<{
            description: string;
            quantity: number;
            unitPrice: number;
        }>;
    }>;

    taxRate: number;
    dueDate?: Date;
    status: InvoiceStatus;

    deposit?: {
        enabled: boolean;
        ratePercent: number;
        dueDate?: Date;
        notes?: string;
    };
};

type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, "milestones">> & {
    milestones?: CreateInvoiceInput["milestones"];
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const normalizeString = (v: any) => (typeof v === "string" ? v.trim() : "");

const normalizeTemplateId = (v: any): InvoiceTemplateId => {
    const t = (typeof v === "string" ? v.trim() : "") as InvoiceTemplateId;
    if (t === "classic" || t === "modern" || t === "minimal") return t;
    return "classic";
};

const toDateSafe = (v: any): Date | undefined => {
    if (!v) return undefined;
    try {
        if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
        if (typeof v?.toDate === "function") {
            const d = v.toDate();
            return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
        }
        const d = new Date(v);
        return isNaN(d.getTime()) ? undefined : d;
    } catch {
        return undefined;
    }
};

const toTsOrNull = (d?: Date) => {
    const dd = toDateSafe(d);
    return dd ? Timestamp.fromDate(dd) : null;
};

const buildBillingDoc = (input?: Partial<BillingDetails>) => {
    return {
        businessName: normalizeString(input?.businessName) || "Company",
        contactName: normalizeString(input?.contactName),
        email: normalizeString(input?.email),
        phone: normalizeString(input?.phone),
        address: normalizeString(input?.address),

        bankName: normalizeString(input?.bankName),
        accountName: normalizeString(input?.accountName),
        accountNumber: normalizeString(input?.accountNumber),
        branchCode: normalizeString(input?.branchCode),
        accountType: normalizeString(input?.accountType),
        paymentReferenceNote: normalizeString(input?.paymentReferenceNote),
    };
};

const normalizeItems = (items: Array<{ description: string; quantity: number; unitPrice: number }>) => {
    const normalized = (items || [])
        .map((it) => {
            const qty = Number(it.quantity) || 0;
            const price = Number(it.unitPrice) || 0;
            const desc = normalizeString(it.description);
            return {
                description: desc,
                quantity: qty,
                unitPrice: price,
                total: qty * price,
            } as InvoiceItem;
        })
        .filter((it) => it.description.length > 0);

    const subtotal = normalized.reduce((sum, it) => sum + (Number(it.total) || 0), 0);

    return { normalized, subtotal };
};

const normalizeMilestones = (milestones: CreateInvoiceInput["milestones"]) => {
    const normalized = (milestones || [])
        .map((m) => {
            const title = normalizeString(m.title);
            const description = normalizeString(m.description);
            const dueDate = toTsOrNull(m.dueDate);
            const status = (m.status ?? "not_started") as MilestoneStatus;

            const { normalized: items, subtotal } = normalizeItems(m.items || []);

            return {
                title,
                description,
                dueDate,
                status,
                items,
                subtotal,
            };
        })
        .filter((m) => m.title.length > 0 && (m.items || []).length > 0);

    return normalized;
};

const calcInvoiceTotalsFromMilestones = (
    milestones: Array<{ subtotal: number }>,
    taxRate: number
) => {
    const subtotal = (milestones || []).reduce((sum, m) => sum + (Number(m.subtotal) || 0), 0);
    const rate = Number(taxRate) || 0;
    const taxAmount = (subtotal * rate) / 100;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

const buildDepositDoc = (totalAmount: number, input?: CreateInvoiceInput["deposit"]) => {
    const enabled = Boolean(input?.enabled);
    const ratePercent = clamp(Number(input?.ratePercent ?? 0) || 0, 0, 100);
    const amount = enabled ? (totalAmount * ratePercent) / 100 : 0;

    return {
        enabled,
        ratePercent,
        amount,
        dueDate: toTsOrNull(input?.dueDate),
        notes: normalizeString(input?.notes),
    };
};

// ---------------- CREATE ----------------
export const createInvoice = async (
    projectId: string,
    userId: string,
    input: CreateInvoiceInput
): Promise<string> => {
    try {
        const invoiceNumber = `INV-${Date.now()}`;
        const templateId = normalizeTemplateId(input.templateId);

        const taxRate = Number(input.taxRate) || 0;

        const milestonesDoc = normalizeMilestones(input.milestones || []);
        if (milestonesDoc.length === 0) {
            throw new Error("Please add at least 1 milestone with at least 1 item.");
        }

        const { subtotal, taxAmount, totalAmount } = calcInvoiceTotalsFromMilestones(
            milestonesDoc,
            taxRate
        );

        const dueDate = toDateSafe(input.dueDate) ?? new Date();
        const billing = buildBillingDoc(input.billing);
        const deposit = buildDepositDoc(totalAmount, input.deposit);

        const payload = {
            projectId,
            userId,
            invoiceNumber,
            templateId,

            clientName: normalizeString(input.clientName),
            clientEmail: normalizeString(input.clientEmail),
            clientEmailLower: (input.clientEmail || "").trim().toLowerCase(),
            clientAddress: normalizeString(input.clientAddress),
            clientPhone: normalizeString(input.clientPhone),

            billing,

            milestones: milestonesDoc,

            subtotal,
            taxRate,
            taxAmount,
            totalAmount,

            deposit,

            status: input.status,
            dueDate: Timestamp.fromDate(dueDate),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const ref = await addDoc(collection(db, "projects", projectId, "invoices"), payload);
        return ref.id;
    } catch (error: any) {
        throw new Error("Failed to create invoice: " + (error?.message ?? "Unknown error"));
    }
};

// ---------------- READ ----------------
export const getProjectInvoices = async (projectId: string): Promise<Invoice[]> => {
    try {
        const q = query(collection(db, "projects", projectId, "invoices"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        return snap.docs.map((d) => {
            const data = d.data() as DocumentData;

            const milestones: InvoiceMilestone[] = (data.milestones || []).map((m: any) => ({
                title: m.title || "",
                description: m.description || "",
                dueDate: m.dueDate?.toDate ? m.dueDate.toDate() : undefined,
                status: (m.status as MilestoneStatus) || "not_started",
                items: (m.items || []).map((it: any) => ({
                    description: it.description || "",
                    quantity: Number(it.quantity) || 0,
                    unitPrice: Number(it.unitPrice) || 0,
                    total: Number(it.total) || 0,
                })),
                subtotal: Number(m.subtotal) || 0,
            }));

            return {
                id: d.id,
                projectId: data.projectId,
                userId: data.userId,
                invoiceNumber: data.invoiceNumber,
                templateId: normalizeTemplateId(data.templateId),

                clientName: data.clientName || "",
                clientEmail: data.clientEmail || "",
                clientEmailLower: data.clientEmailLower || "",
                clientAddress: data.clientAddress || "",
                clientPhone: data.clientPhone || "",

                billing: {
                    businessName: data.billing?.businessName || "Company",
                    contactName: data.billing?.contactName || "",
                    email: data.billing?.email || "",
                    phone: data.billing?.phone || "",
                    address: data.billing?.address || "",
                    bankName: data.billing?.bankName || "",
                    accountName: data.billing?.accountName || "",
                    accountNumber: data.billing?.accountNumber || "",
                    branchCode: data.billing?.branchCode || "",
                    accountType: data.billing?.accountType || "",
                    paymentReferenceNote: data.billing?.paymentReferenceNote || "",
                },

                milestones,

                subtotal: Number(data.subtotal) || 0,
                taxRate: Number(data.taxRate) || 0,
                taxAmount: Number(data.taxAmount) || 0,
                totalAmount: Number(data.totalAmount) || 0,

                deposit: {
                    enabled: Boolean(data.deposit?.enabled),
                    ratePercent: Number(data.deposit?.ratePercent) || 0,
                    amount: Number(data.deposit?.amount) || 0,
                    dueDate: data.deposit?.dueDate?.toDate ? data.deposit.dueDate.toDate() : undefined,
                    notes: (data.deposit?.notes || "").trim() || "",
                },

                status: data.status as InvoiceStatus,
                dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            } as Invoice;
        });
    } catch (error: any) {
        throw new Error("Failed to fetch invoices: " + (error?.message ?? "Unknown error"));
    }
};

// ---------------- UPDATE ----------------
export const updateInvoice = async (
    projectId: string,
    invoiceId: string,
    input: UpdateInvoiceInput
): Promise<void> => {
    try {
        const ref = doc(db, "projects", projectId, "invoices", invoiceId);
        const payload: any = { updatedAt: Timestamp.now() };

        if (input.templateId !== undefined) payload.templateId = normalizeTemplateId(input.templateId);

        if (input.clientName !== undefined) payload.clientName = normalizeString(input.clientName);

        if (input.clientEmail !== undefined) {
            payload.clientEmail = normalizeString(input.clientEmail);
            payload.clientEmailLower = (input.clientEmail || "").trim().toLowerCase();
        }

        if (input.clientAddress !== undefined) payload.clientAddress = normalizeString(input.clientAddress);
        if (input.clientPhone !== undefined) payload.clientPhone = normalizeString(input.clientPhone);

        if (input.status !== undefined) payload.status = input.status;

        if (input.dueDate !== undefined) {
            const dd = toDateSafe(input.dueDate);
            payload.dueDate = dd ? Timestamp.fromDate(dd) : Timestamp.fromDate(new Date());
        }

        if (input.billing !== undefined) payload.billing = buildBillingDoc(input.billing);

        // ✅ Recompute totals if milestones or taxRate or deposit changed
        const shouldRecalc =
            input.milestones !== undefined || input.taxRate !== undefined || input.deposit !== undefined;

        if (input.milestones !== undefined) {
            const milestonesDoc = normalizeMilestones(input.milestones || []);
            if (milestonesDoc.length === 0) {
                throw new Error("Please add at least 1 milestone with at least 1 item.");
            }
            payload.milestones = milestonesDoc;

            const taxRate = Number(input.taxRate ?? 0) || 0;
            const { subtotal, taxAmount, totalAmount } = calcInvoiceTotalsFromMilestones(milestonesDoc, taxRate);

            payload.subtotal = subtotal;
            payload.taxRate = taxRate;
            payload.taxAmount = taxAmount;
            payload.totalAmount = totalAmount;

            if (input.deposit !== undefined) {
                payload.deposit = buildDepositDoc(totalAmount, input.deposit);
            }
        } else if (shouldRecalc) {
            // If taxRate/deposit changed but milestones not provided, you must pass milestones
            // (keeps service simple, consistent, no extra reads)
            throw new Error("To update tax/deposit you must include milestones in the payload.");
        }

        await updateDoc(ref, payload);
    } catch (error: any) {
        throw new Error("Failed to update invoice: " + (error?.message ?? "Unknown error"));
    }
};

// ---------------- DELETE ----------------
export const deleteInvoice = async (projectId: string, invoiceId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "projects", projectId, "invoices", invoiceId));
    } catch (error: any) {
        throw new Error("Failed to delete invoice: " + (error?.message ?? "Unknown error"));
    }
};
