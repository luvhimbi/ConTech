import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type PublicBusiness = {
    uid: string;
    companyName: string;
    slug?: string;
};


export async function resolveBusinessBySlug(identifier: string): Promise<PublicBusiness | null> {
    if (!identifier) return null;
    const cleanId = identifier.toLowerCase().trim();

    // 1. Try to resolve as a SLUG first
    const slugSnap = await getDoc(doc(db, "publicBusinesses", cleanId));
    if (slugSnap.exists()) {
        const data = slugSnap.data();
        return {
            uid: data.uid,
            companyName: data.companyName || "",
            slug: cleanId
        };
    }

    // 2. Fallback: Try to resolve as a direct UID (users/{uid})
    // This handles cases where a user hasn't set a slug yet
    const userSnap = await getDoc(doc(db, "users", identifier));
    if (userSnap.exists()) {
        const data = userSnap.data();
        return {
            uid: identifier,
            companyName: data.companyName || "Your Business",
            slug: data.slug || undefined
        };
    }

    return null;
}


export async function updateBusinessSlug(
    uid: string,
    newSlug: string,
    companyName: string
): Promise<void> {
    const batch = writeBatch(db);
    const slugKey = newSlug.toLowerCase().trim();

    // 1. Update the private user profile
    const userRef = doc(db, "users", uid);
    batch.update(userRef, {
        slug: slugKey,
        companyName: companyName
    });

    // 2. Update the public index pointer
    const publicRef = doc(db, "publicBusinesses", slugKey);
    batch.set(publicRef, {
        uid: uid,
        companyName: companyName,
        updatedAt: serverTimestamp()
    });

    await batch.commit();
}


export async function syncPublicSlug(uid: string) {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.slug) {
            await setDoc(doc(db, "publicBusinesses", data.slug.toLowerCase()), {
                uid: uid,
                companyName: data.companyName || "Our Business",
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    }
}