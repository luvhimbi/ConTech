import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type PublicBusiness = {
    uid: string;
    companyName: string;
    slug: string;
};

/**
 * PUBLIC: Resolves a slug (e.g., 'geeks4learning') to a UID.
 * Used by the QuoteRequest form.
 */
export async function resolveBusinessBySlug(slug: string): Promise<PublicBusiness | null> {
    if (!slug) return null;

    const snap = await getDoc(doc(db, "publicBusinesses", slug.toLowerCase()));
    if (!snap.exists()) return null;

    const data = snap.data();
    if (!data.uid) return null;

    return {
        uid: data.uid,
        companyName: data.companyName || "",
        slug: slug.toLowerCase()
    };
}

/**
 * INTERNAL: Updates the user's slug index.
 * It writes to both the user profile and the public index simultaneously.
 */
export async function updateBusinessSlug(
    uid: string,
    newSlug: string,
    companyName: string,
    oldSlug?: string
): Promise<void> {
    const batch = writeBatch(db);
    const slugKey = newSlug.toLowerCase().trim();

    // 1. Update the private user profile
    const userRef = doc(db, "users", uid);
    batch.update(userRef, {
        slug: slugKey,
        companyName: companyName
    });

    // 2. Update the public index (The pointer used by /q/slug)
    const publicRef = doc(db, "publicBusinesses", slugKey);
    batch.set(publicRef, {
        uid: uid,
        companyName: companyName,
        updatedAt: new Date()
    });

    // 3. Optional: If the slug changed, you might want to delete the old index
    // though usually better to keep it as a redirect or just let it exist.
    // if (oldSlug && oldSlug !== slugKey) {
    //    batch.delete(doc(db, "publicBusinesses", oldSlug.toLowerCase()));
    // }

    await batch.commit();
}

/**
 * INITIALIZER: A helper to quickly create the index for an existing user.
 * Run this once in your Profile or Dashboard component if slug index is missing.
 */
export async function syncPublicSlug(uid: string) {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.slug) {
            await setDoc(doc(db, "publicBusinesses", data.slug.toLowerCase()), {
                uid: uid,
                companyName: data.companyName || "Our Business",
                updatedAt: new Date()
            }, { merge: true });
            console.log("Public slug index synced successfully.");
        }
    }
}