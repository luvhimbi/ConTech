// src/services/clientHistoryService.ts
import {
    collectionGroup,
    getDocs,
    orderBy,
    query,
    where,
    type DocumentData,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export type ClientHistoryType = "invoice" | "quotation";

export type ClientHistoryItem = {
    type: ClientHistoryType;
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

export const getClientHistory = async (
    userId: string,
    clientEmail: string
): Promise<ClientHistoryItem[]> => {
    const emailLower = (clientEmail || "").trim().toLowerCase();
    if (!emailLower || !userId) return [];

    // Corrected Queries:
    // We filter by equality on userId and clientEmailLower.
    // We only need to orderBy createdAt.
    const invoicesQ = query(
        collectionGroup(db, "invoices"),
        where("userId", "==", userId),
        where("clientEmailLower", "==", emailLower),
        orderBy("createdAt", "desc")
    );

    const quotationsQ = query(
        collectionGroup(db, "quotations"),
        where("userId", "==", userId),
        where("clientEmailLower", "==", emailLower),
        orderBy("createdAt", "desc")
    );

    try {
        const [invSnap, quoSnap] = await Promise.all([getDocs(invoicesQ), getDocs(quotationsQ)]);

        const invoices: ClientHistoryItem[] = invSnap.docs.map((d) => {
            const data = d.data() as DocumentData;
            return {
                type: "invoice",
                id: d.id,
                projectId: String(data.projectId || ""),
                number: String(data.invoiceNumber || ""),
                status: String(data.status || ""),
                total: Number(data.totalAmount || 0),
                createdAt: toDateSafe(data.createdAt),
            };
        });

        const quotations: ClientHistoryItem[] = quoSnap.docs.map((d) => {
            const data = d.data() as DocumentData;
            return {
                type: "quotation",
                id: d.id,
                projectId: String(data.projectId || ""),
                number: String(data.quotationNumber || ""),
                status: String(data.status || ""),
                total: Number(data.total || 0),
                createdAt: toDateSafe(data.createdAt),
            };
        });

        // Combine and sort by date for a unified timeline
        return [...invoices, ...quotations].sort(
            (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        );
    } catch (error) {
        console.error("Error fetching client history:", error);
        throw error;
    }
};