// src/services/clientService.ts
import { db } from "../firebaseConfig";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    type DocumentData,
} from "firebase/firestore";

export type Client = {
    id: string; // ✅ always present
    name: string;
    email: string;
    emailLower: string;
    address: string;
    phone: string;

    tags: string[];
    notes: string;
    preferredContact: string;
    siteAccessRules: string;

    createdAt?: Date;
    updatedAt?: Date;
};

export type CreateClientInput = {
    name: string;
    email: string;
    address?: string;
    phone?: string;

    tags?: string[];
    notes?: string;
    preferredContact?: string;
    siteAccessRules?: string;
};

export type UpdateClientInput = Partial<CreateClientInput>;

const toDateSafe = (v: any) => {
    try {
        return v?.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : undefined;
    } catch {
        return undefined;
    }
};

const cleanTags = (tags: any): string[] => {
    if (!Array.isArray(tags)) return [];
    return tags.map((t) => String(t).trim()).filter(Boolean);
};

export const createClient = async (userId: string, input: CreateClientInput): Promise<string> => {
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim();
    const emailLower = email.toLowerCase();

    const data = {
        name,
        email,
        emailLower,

        address: String(input.address || "").trim(),
        phone: String(input.phone || "").trim(),

        tags: cleanTags(input.tags),
        notes: String(input.notes || "").trim(),
        preferredContact: String(input.preferredContact || "").trim(),
        siteAccessRules: String(input.siteAccessRules || "").trim(),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "users", userId, "clients"), data);
    return ref.id;
};

export const getUserClients = async (userId: string): Promise<Client[]> => {
    const q = query(collection(db, "users", userId, "clients"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
        const data = d.data() as DocumentData;

        return {
            id: d.id,
            name: data.name || "",
            email: data.email || "",
            emailLower: data.emailLower || (data.email || "").toLowerCase(),
            address: data.address || "",
            phone: data.phone || "",

            tags: Array.isArray(data.tags) ? data.tags : [],
            notes: data.notes || "",
            preferredContact: data.preferredContact || "",
            siteAccessRules: data.siteAccessRules || "",

            createdAt: toDateSafe(data.createdAt),
            updatedAt: toDateSafe(data.updatedAt),
        };
    });
};

export const getClientById = async (userId: string, clientId: string): Promise<Client | null> => {
    const ref = doc(db, "users", userId, "clients", clientId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data() as any;

    return {
        id: snap.id,
        name: data.name || "",
        email: data.email || "",
        emailLower: data.emailLower || (data.email || "").toLowerCase(),
        address: data.address || "",
        phone: data.phone || "",

        tags: Array.isArray(data.tags) ? data.tags : [],
        notes: data.notes || "",
        preferredContact: data.preferredContact || "",
        siteAccessRules: data.siteAccessRules || "",

        createdAt: toDateSafe(data.createdAt),
        updatedAt: toDateSafe(data.updatedAt),
    };
};

export const updateClient = async (
    userId: string,
    clientId: string,
    input: UpdateClientInput
): Promise<void> => {
    const ref = doc(db, "users", userId, "clients", clientId);

    const payload: any = {
        updatedAt: serverTimestamp(),
    };

    if (input.name !== undefined) payload.name = String(input.name || "").trim();

    if (input.email !== undefined) {
        const em = String(input.email || "").trim();
        payload.email = em;
        payload.emailLower = em.toLowerCase();
    }

    if (input.address !== undefined) payload.address = String(input.address || "").trim();
    if (input.phone !== undefined) payload.phone = String(input.phone || "").trim();

    if (input.tags !== undefined) payload.tags = cleanTags(input.tags);
    if (input.notes !== undefined) payload.notes = String(input.notes || "").trim();
    if (input.preferredContact !== undefined)
        payload.preferredContact = String(input.preferredContact || "").trim();
    if (input.siteAccessRules !== undefined)
        payload.siteAccessRules = String(input.siteAccessRules || "").trim();

    await updateDoc(ref, payload);
};

export const deleteClient = async (userId: string, clientId: string): Promise<void> => {
    const ref = doc(db, "users", userId, "clients", clientId);
    await deleteDoc(ref);
};
