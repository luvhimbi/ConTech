import { db } from "../firebaseConfig";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

export type LeadStatus = "lead" | "quoted" | "invoiced";

export type Lead = {
    id?: string;
    userId: string;

    clientId?: string;
    clientName: string;
    clientEmail: string;
    clientEmailLower: string;

    title: string;
    valueEstimate: number;
    status: LeadStatus;

    source?: string;
    notes?: string;

    createdAt?: any;
    updatedAt?: any;
};

export type CreateLeadInput = {
    clientId?: string;
    clientName: string;
    clientEmail: string;
    title: string;
    valueEstimate?: number;
    status?: LeadStatus;
    source?: string;
    notes?: string;
};

export const createLead = async (userId: string, input: CreateLeadInput): Promise<string> => {
    const payload: any = {
        userId,
        clientId: input.clientId || "",
        clientName: (input.clientName || "").trim(),
        clientEmail: (input.clientEmail || "").trim(),
        clientEmailLower: (input.clientEmail || "").trim().toLowerCase(),

        title: (input.title || "").trim(),
        valueEstimate: Number(input.valueEstimate) || 0,
        status: (input.status || "lead") as LeadStatus,

        source: (input.source || "").trim(),
        notes: (input.notes || "").trim(),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "users", userId, "leads"), payload);
    return ref.id;
};

export const getUserLeads = async (userId: string): Promise<Lead[]> => {
    const q = query(collection(db, "users", userId, "leads"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
        const data: any = d.data();
        return {
            id: d.id,
            userId: data.userId,
            clientId: data.clientId || "",
            clientName: data.clientName || "",
            clientEmail: data.clientEmail || "",
            clientEmailLower: data.clientEmailLower || (data.clientEmail || "").toLowerCase(),
            title: data.title || "",
            valueEstimate: Number(data.valueEstimate) || 0,
            status: (data.status as LeadStatus) || "lead",
            source: data.source || "",
            notes: data.notes || "",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    });
};

export const updateLead = async (
    userId: string,
    leadId: string,
    patch: Partial<Omit<Lead, "id" | "userId" | "createdAt">>
): Promise<void> => {
    const ref = doc(db, "users", userId, "leads", leadId);

    const payload: any = {
        updatedAt: serverTimestamp(),
    };

    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.title !== undefined) payload.title = String(patch.title || "").trim();
    if (patch.valueEstimate !== undefined) payload.valueEstimate = Number(patch.valueEstimate) || 0;
    if (patch.source !== undefined) payload.source = String(patch.source || "").trim();
    if (patch.notes !== undefined) payload.notes = String(patch.notes || "").trim();

    if (patch.clientName !== undefined) payload.clientName = String(patch.clientName || "").trim();
    if (patch.clientEmail !== undefined) {
        const em = String(patch.clientEmail || "").trim();
        payload.clientEmail = em;
        payload.clientEmailLower = em.toLowerCase();
    }

    await updateDoc(ref, payload);
};

export const deleteLead = async (userId: string, leadId: string): Promise<void> => {
    await deleteDoc(doc(db, "users", userId, "leads", leadId));
};
