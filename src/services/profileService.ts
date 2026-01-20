// src/services/profileService.ts
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export type Branding = {
    logoUrl?: string | null;
    logoPath?: string | null;
    updatedAt?: Date | Timestamp | null;
};

export interface UserProfile {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    branding?: Branding;
    createdAt: Date;
    updatedAt: Date;
}

function stripUndefined(input: any): any {
    if (Array.isArray(input)) return input.map(stripUndefined);
    if (input !== null && typeof input === "object") {
        const out: any = {};
        Object.keys(input).forEach((key) => {
            const value = input[key];
            if (value === undefined) return;
            out[key] = stripUndefined(value);
        });
        return out;
    }
    return input;
}

function toDateSafe(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") return value.toDate();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
}

function normalizeBranding(raw: any): Branding | undefined {
    if (!raw || typeof raw !== "object") return undefined;
    return {
        logoUrl: raw.logoUrl ?? null,
        logoPath: raw.logoPath ?? null,
        updatedAt: raw.updatedAt ?? null,
    };
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return null;

        const data = userDoc.data();
        return {
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            companyName: data.companyName ?? "",
            email: data.email ?? "",
            branding: normalizeBranding(data.branding),
            createdAt: toDateSafe(data.createdAt),
            updatedAt: toDateSafe(data.updatedAt),
        };
    } catch (error: any) {
        throw new Error("Failed to fetch user profile: " + (error?.message ?? "Unknown error"));
    }
};

export const updateUserProfile = async (
    uid: string,
    updates: any
): Promise<void> => {
    try {
        const userRef = doc(db, "users", uid);

        // Use a flat payload to update fields.
        // This ensures email and createdAt are not affected or removed.
        const payload: any = stripUndefined({
            firstName: updates.firstName,
            lastName: updates.lastName,
            companyName: updates.companyName,
            updatedAt: Timestamp.now(),
        });

        if (updates.branding) {
            if (updates.branding.logoUrl !== undefined) payload["branding.logoUrl"] = updates.branding.logoUrl;
            if (updates.branding.logoPath !== undefined) payload["branding.logoPath"] = updates.branding.logoPath;
            payload["branding.updatedAt"] = Timestamp.now();
        }

        await updateDoc(userRef, payload);
    } catch (error: any) {
        throw new Error("Failed to update user profile: " + (error?.message ?? "Unknown error"));
    }
};