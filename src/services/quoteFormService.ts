import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type FieldType = "text" | "email" | "textarea" | "select";

export type Field = {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: string[];
};

const FORM_ID = "quoteRequest";

export async function loadQuoteForm(uid: string): Promise<Field[]> {
    const ref = doc(db, "users", uid, "forms", FORM_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) return [];

    const data = snap.data();
    if (!Array.isArray(data.fields)) return [];

    return data.fields;
}

export async function saveQuoteForm(uid: string, fields: Field[]) {
    const ref = doc(db, "users", uid, "forms", FORM_ID);

    await setDoc(
        ref,
        {
            fields,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}
