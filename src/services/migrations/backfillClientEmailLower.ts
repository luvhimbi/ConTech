// src/services/migrations/backfillClientEmailLower.ts
import {
    collectionGroup,
    getDocs,
    query,
    where,
    writeBatch,
    doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

export const backfillClientEmailLowerForUser = async (userId: string) => {
    const batch = writeBatch(db);

    const invQ = query(collectionGroup(db, "invoices"), where("userId", "==", userId));
    const quoQ = query(collectionGroup(db, "quotations"), where("userId", "==", userId));

    const [invSnap, quoSnap] = await Promise.all([getDocs(invQ), getDocs(quoQ)]);

    invSnap.docs.forEach((d) => {
        const data: any = d.data();
        const email = String(data.clientEmail || "").trim().toLowerCase();

        // Only update if missing
        if (!data.clientEmailLower && email) {
            const projectId = String(data.projectId || "");
            if (projectId) {
                batch.update(doc(db, "projects", projectId, "invoices", d.id), {
                    clientEmailLower: email,
                });
            }
        }
    });

    quoSnap.docs.forEach((d) => {
        const data: any = d.data();
        const email = String(data.clientEmail || "").trim().toLowerCase();

        if (!data.clientEmailLower && email) {
            const projectId = String(data.projectId || "");
            if (projectId) {
                batch.update(doc(db, "projects", projectId, "quotations", d.id), {
                    clientEmailLower: email,
                });
            }
        }
    });

    await batch.commit();
};
