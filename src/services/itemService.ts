// src/services/itemService.ts
import { db } from "../firebaseConfig";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    serverTimestamp,
    updateDoc,
    query,
    orderBy,
    where,
    type DocumentData,
    Timestamp, writeBatch,
} from "firebase/firestore";

export type ItemType = "product" | "service";

export type CatalogItem = {
    id?: string;

    userId: string;

    name: string;          // e.g. "Labour"
    description?: string;  // optional long text
    unitPrice: number;     // default unit price
    unit?: string;         // e.g. "hour", "item", "kg"
    type?: ItemType;       // product/service
    isActive: boolean;

    createdAt?: Date;
    updatedAt?: Date;
};

type CatalogItemDoc = Omit<CatalogItem, "id" | "createdAt" | "updatedAt"> & {
    createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
    updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;
};
export async function bulkCreateCatalogItems(
    uid: string,
    items: Array<{
        name: string;
        description?: string;
        unitPrice: number;
        unit?: string;
        type: ItemType;
        isActive: boolean;
    }>
): Promise<void> {
    if (!uid) throw new Error("Missing user id");
    if (!Array.isArray(items) || items.length === 0) return;

    // Optional safety limit (Firestore batch limit is 500 writes)
    if (items.length > 450) {
        throw new Error("Too many items at once. Please upload in smaller batches (max 450).");
    }

    const batch = writeBatch(db);
    const itemsCol = collection(db, "users", uid, "items");

    const now = serverTimestamp();

    for (const it of items) {
        const ref = doc(itemsCol); // auto id
        batch.set(ref, {
            userId: uid,
            name: it.name,
            description: it.description ?? null,
            unitPrice: Number(it.unitPrice) || 0,
            unit: it.unit ?? null,
            type: it.type,
            isActive: Boolean(it.isActive),
            createdAt: now,
            updatedAt: now,
        });
    }

    await batch.commit();
}

function toDateSafe(v: any): Date {
    if (!v) return new Date(0);
    if (v instanceof Date) return v;
    if (typeof v?.toDate === "function") return v.toDate();
    if (typeof v === "number") return new Date(v);
    if (typeof v === "string") return new Date(v);
    return new Date(0);
}

function round2(n: number) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Items live under: users/{userId}/items
 */
function itemsCol(userId: string) {
    return collection(db, "users", userId, "items");
}

function itemDoc(userId: string, itemId: string) {
    return doc(db, "users", userId, "items", itemId);
}

export type CreateCatalogItemInput = {
    name: string;
    description?: string;
    unitPrice: number;
    unit?: string;
    type?: ItemType;
    isActive?: boolean;
};

export async function createCatalogItem(userId: string, input: CreateCatalogItemInput): Promise<string> {
    if (!userId) throw new Error("userId is required");
    if (!input?.name?.trim()) throw new Error("Item name is required");

    const docData: CatalogItemDoc = {
        userId,

        name: input.name.trim(),
        description: (input.description || "").trim() || "",
        unitPrice: round2(Number(input.unitPrice) || 0),
        unit: (input.unit || "").trim() || "",
        type: input.type || "service",
        isActive: input.isActive ?? true,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(itemsCol(userId), docData);
    return ref.id;
}

export async function getUserCatalogItems(userId: string, onlyActive = false): Promise<CatalogItem[]> {
    if (!userId) throw new Error("userId is required");

    const base = itemsCol(userId);

    // If you want only active, use a where() filter
    const qy = onlyActive
        ? query(base, where("isActive", "==", true), orderBy("createdAt", "desc"))
        : query(base, orderBy("createdAt", "desc"));

    const snap = await getDocs(qy);

    return snap.docs.map((d) => {
        const x = d.data() as DocumentData;

        return {
            id: d.id,
            userId: x.userId,

            name: x.name,
            description: x.description || "",
            unitPrice: Number(x.unitPrice) || 0,
            unit: x.unit || "",
            type: (x.type as ItemType) || "service",
            isActive: Boolean(x.isActive ?? true),

            createdAt: toDateSafe(x.createdAt),
            updatedAt: toDateSafe(x.updatedAt),
        } as CatalogItem;
    });
}

export async function getCatalogItemById(userId: string, itemId: string): Promise<CatalogItem | null> {
    if (!userId) throw new Error("userId is required");
    if (!itemId) throw new Error("itemId is required");

    const snap = await getDoc(itemDoc(userId, itemId));
    if (!snap.exists()) return null;

    const x = snap.data() as any;

    return {
        id: snap.id,
        userId: x.userId,

        name: x.name,
        description: x.description || "",
        unitPrice: Number(x.unitPrice) || 0,
        unit: x.unit || "",
        type: (x.type as ItemType) || "service",
        isActive: Boolean(x.isActive ?? true),

        createdAt: toDateSafe(x.createdAt),
        updatedAt: toDateSafe(x.updatedAt),
    };
}

export type UpdateCatalogItemInput = {
    name?: string;
    description?: string;
    unitPrice?: number;
    unit?: string;
    type?: ItemType;
    isActive?: boolean;
};

export async function updateCatalogItem(userId: string, itemId: string, input: UpdateCatalogItemInput): Promise<void> {
    if (!userId) throw new Error("userId is required");
    if (!itemId) throw new Error("itemId is required");

    const patch: any = {
        updatedAt: serverTimestamp(),
    };

    if (input.name !== undefined) patch.name = String(input.name).trim();
    if (input.description !== undefined) patch.description = String(input.description).trim();
    if (input.unitPrice !== undefined) patch.unitPrice = round2(Number(input.unitPrice) || 0);
    if (input.unit !== undefined) patch.unit = String(input.unit).trim();
    if (input.type !== undefined) patch.type = input.type;
    if (input.isActive !== undefined) patch.isActive = Boolean(input.isActive);

    await updateDoc(itemDoc(userId, itemId), patch);
}

export async function deleteCatalogItem(userId: string, itemId: string): Promise<void> {
    if (!userId) throw new Error("userId is required");
    if (!itemId) throw new Error("itemId is required");

    await deleteDoc(itemDoc(userId, itemId));
}
