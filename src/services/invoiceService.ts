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

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface InvoiceMilestone {
    title: string;
    description?: string;
    amount: number;
    dueDate?: Date;
    status: "not_started" | "in_progress" | "completed";
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
    amount: number;
    dueDate?: Date;
    notes?: string;
}

export interface Invoice {
    id?: string;
    projectId: string;
    userId: string;

    invoiceNumber: string;

    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    clientPhone?: string;

    billing: BillingDetails;
    milestones: InvoiceMilestone[];
    deposit: DepositConfig;

    items: InvoiceItem[];

    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;

    status: InvoiceStatus;
    dueDate: Date;

    createdAt: Date;
    updatedAt: Date;
}

type CreateInvoiceInput = {
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    clientPhone?: string;

    billing?: Partial<BillingDetails>;
    milestones?: Array<{
        title: string;
        description?: string;
        amount: number;
        dueDate?: Date;
        status?: "not_started" | "in_progress" | "completed";
    }>;
    deposit?: {
        enabled: boolean;
        ratePercent: number;
        dueDate?: Date;
        notes?: string;
    };

    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
    }>;

    taxRate: number;
    dueDate?: Date;
    status: InvoiceStatus;
};

type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, "items">> & {
    items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
    }>;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const toDateSafe = (v: any): Date | undefined => {
    if (!v) return undefined;
    try {
        if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
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

// IMPORTANT: Firestore does NOT allow undefined.
// We will use empty strings and nulls instead.

const normalizeString = (v: any) => (typeof v === "string" ? v.trim() : "");

const buildBillingDoc = (input?: Partial<BillingDetails>) => {
    // return ALL keys as string to satisfy strict rules if needed
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

const buildMilestonesDoc = (milestones?: CreateInvoiceInput["milestones"]) => {
    if (!milestones || milestones.length === 0) return [];

    return milestones
        .map((m) => ({
            title: normalizeString(m.title),
            description: normalizeString(m.description),
            amount: Number(m.amount) || 0,
            dueDate: toTsOrNull(m.dueDate), // Timestamp | null
            status: (m.status ?? "not_started") as InvoiceMilestone["status"],
        }))
        .filter((m) => m.title.length > 0);
};

const calcTotals = (
    items: Array<{ description: string; quantity: number; unitPrice: number }>,
    taxRate: number
) => {
    const normalizedItems = items
        .map((it) => {
            const qty = Number(it.quantity) || 0;
            const price = Number(it.unitPrice) || 0;
            const desc = normalizeString(it.description);
            return {
                description: desc,
                quantity: qty,
                unitPrice: price,
                total: qty * price,
            };
        })
        .filter((it) => it.description.length > 0);

    const subtotal = normalizedItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const rate = Number(taxRate) || 0;
    const taxAmount = (subtotal * rate) / 100;
    const totalAmount = subtotal + taxAmount;

    return { normalizedItems, subtotal, taxAmount, totalAmount };
};

const buildDepositDoc = (totalAmount: number, input?: CreateInvoiceInput["deposit"]) => {
    const enabled = Boolean(input?.enabled);
    const ratePercent = clamp(Number(input?.ratePercent ?? 0) || 0, 0, 100);
    const amount = enabled ? (totalAmount * ratePercent) / 100 : 0;

    return {
        enabled,
        ratePercent,
        amount,
        dueDate: toTsOrNull(input?.dueDate), // Timestamp | null
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

        const taxRate = Number(input.taxRate) || 0;
        const { normalizedItems, subtotal, taxAmount, totalAmount } = calcTotals(input.items, taxRate);

        if (normalizedItems.length === 0) {
            throw new Error("Please add at least one valid item.");
        }

        const dueDate = toDateSafe(input.dueDate) ?? new Date();

        const billing = buildBillingDoc(input.billing);
        const milestones = buildMilestonesDoc(input.milestones);
        const deposit = buildDepositDoc(totalAmount, input.deposit);

        const payload = {
            projectId,
            userId,
            invoiceNumber,

            clientName: normalizeString(input.clientName),
            clientEmail: normalizeString(input.clientEmail),
            clientAddress: normalizeString(input.clientAddress),
            clientPhone: normalizeString(input.clientPhone),

            billing,
            milestones,
            deposit,

            items: normalizedItems,

            subtotal,
            taxRate,
            taxAmount,
            totalAmount,

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

            const items: InvoiceItem[] = (data.items || []).map((it: any) => ({
                description: it.description || "",
                quantity: Number(it.quantity) || 0,
                unitPrice: Number(it.unitPrice) || 0,
                total: Number(it.total) || 0,
            }));

            const billing: BillingDetails = {
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
            };

            const milestones: InvoiceMilestone[] = (data.milestones || []).map((m: any) => ({
                title: m.title || "",
                description: m.description || "",
                amount: Number(m.amount) || 0,
                dueDate: m.dueDate?.toDate ? m.dueDate.toDate() : undefined,
                status: (m.status as InvoiceMilestone["status"]) || "not_started",
            }));

            const deposit: DepositConfig = {
                enabled: Boolean(data.deposit?.enabled),
                ratePercent: Number(data.deposit?.ratePercent) || 0,
                amount: Number(data.deposit?.amount) || 0,
                dueDate: data.deposit?.dueDate?.toDate ? data.deposit.dueDate.toDate() : undefined,
                notes: (data.deposit?.notes || "").trim() || "",
            };

            return {
                id: d.id,
                projectId: data.projectId,
                userId: data.userId,
                invoiceNumber: data.invoiceNumber,

                clientName: data.clientName || "",
                clientEmail: data.clientEmail || "",
                clientAddress: data.clientAddress || "",
                clientPhone: data.clientPhone || "",

                billing,
                milestones,
                deposit,

                items,

                subtotal: Number(data.subtotal) || 0,
                taxRate: Number(data.taxRate) || 0,
                taxAmount: Number(data.taxAmount) || 0,
                totalAmount: Number(data.totalAmount) || 0,

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

        const payload: any = {
            updatedAt: Timestamp.now(),
        };

        // client fields (write empty string if provided; otherwise don't touch)
        if (input.clientName !== undefined) payload.clientName = normalizeString(input.clientName);
        if (input.clientEmail !== undefined) payload.clientEmail = normalizeString(input.clientEmail);
        if (input.clientAddress !== undefined) payload.clientAddress = normalizeString(input.clientAddress);
        if (input.clientPhone !== undefined) payload.clientPhone = normalizeString(input.clientPhone);

        if (input.status !== undefined) payload.status = input.status;

        if (input.dueDate !== undefined) {
            const dd = toDateSafe(input.dueDate);
            payload.dueDate = dd ? Timestamp.fromDate(dd) : Timestamp.fromDate(new Date());
        }

        // billing (if provided, sanitize and write full billing object)
        if (input.billing !== undefined) {
            payload.billing = buildBillingDoc(input.billing);
        }

        // milestones (if provided, sanitize)
        if (input.milestones !== undefined) {
            payload.milestones = buildMilestonesDoc(input.milestones);
        }

        // deposit (if provided we must recalc deposit amount based on current/new totals)
        // We will recalc after totals are known.
        const depositInputProvided = input.deposit !== undefined;

        // totals update ONLY if items or taxRate provided
        const itemsProvided = input.items !== undefined;
        const taxRateProvided = input.taxRate !== undefined;

        if (itemsProvided || taxRateProvided || depositInputProvided) {
            // We need to know final totals to compute deposit amount.
            // For correctness, require items when changing deposit/taxRate, otherwise totals would be stale.
            // If your UI always sends items on update, you're safe.
            if (!itemsProvided && (taxRateProvided || depositInputProvided)) {
                throw new Error("To update tax rate or deposit, please include invoice items in the update payload.");
            }

            if (itemsProvided) {
                const taxRate = Number(input.taxRate ?? 0) || 0;
                const { normalizedItems, subtotal, taxAmount, totalAmount } = calcTotals(input.items!, taxRate);

                if (normalizedItems.length === 0) {
                    throw new Error("Please keep at least one valid item.");
                }

                payload.items = normalizedItems;
                payload.subtotal = subtotal;
                payload.taxRate = taxRate;
                payload.taxAmount = taxAmount;
                payload.totalAmount = totalAmount;

                // deposit recalculation if deposit provided OR deposit already exists but you want it consistent
                if (depositInputProvided) {
                    payload.deposit = buildDepositDoc(totalAmount, input.deposit);
                }
            } else {
                // only deposit provided but items not provided - we blocked earlier
            }
        } else {
            // taxRate could still be set alone (but rules might require totals consistency).
            if (input.taxRate !== undefined) {
                // safer to block unless items included
                throw new Error("To update tax rate, include items so totals can be recalculated.");
            }
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
