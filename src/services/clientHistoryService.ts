import { db } from "../firebaseConfig";
import {
    collectionGroup,
    getDocs,
    orderBy,
    query,
    where,
    type DocumentData,
} from "firebase/firestore";

export type ClientHistoryItem =
    | {
    type: "quotation";
    id: string;
    projectId: string;
    number: string;
    status: string;
    total: number;
    createdAt: Date;
}
    | {
    type: "invoice";
    id: string;
    projectId: string;
    number: string;
    status: string;
    total: number;
    createdAt: Date;
};

const toDateSafe = (v: any) => {
    try {
        return v?.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : new Date();
    } catch {
        return new Date();
    }
};

export const getClientHistory = async (userId: string, clientEmail: string): Promise<ClientHistoryItem[]> => {
    const emailLower = (clientEmail || "").trim().toLowerCase();
    if (!emailLower) return [];

    // QUOTATIONS
    const qQuotes = query(
        collectionGroup(db, "quotations"),
        where("userId", "==", userId),
        where("clientEmailLower", "==", emailLower),
        orderBy("createdAt", "desc")
    );

    // INVOICES
    const qInvoices = query(
        collectionGroup(db, "invoices"),
        where("userId", "==", userId),
        where("clientEmailLower", "==", emailLower),
        orderBy("createdAt", "desc")
    );

    const [quotesSnap, invoicesSnap] = await Promise.all([getDocs(qQuotes), getDocs(qInvoices)]);

    const quotes = quotesSnap.docs.map((d) => {
        const data = d.data() as DocumentData;
        const projectId = (d.ref.parent.parent?.id || "") as string;

        return {
            type: "quotation" as const,
            id: d.id,
            projectId,
            number: data.quotationNumber || "QUOTE",
            status: data.status || "draft",
            total: Number(data.total) || 0,
            createdAt: toDateSafe(data.createdAt),
        };
    });

    const invoices = invoicesSnap.docs.map((d) => {
        const data = d.data() as DocumentData;
        const projectId = (d.ref.parent.parent?.id || "") as string;

        return {
            type: "invoice" as const,
            id: d.id,
            projectId,
            number: data.invoiceNumber || "INV",
            status: data.status || "pending",
            total: Number(data.totalAmount) || 0,
            createdAt: toDateSafe(data.createdAt),
        };
    });

    const combined = [...quotes, ...invoices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return combined;
};

