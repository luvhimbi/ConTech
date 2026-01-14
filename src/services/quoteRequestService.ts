import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function submitQuoteRequest(
    ownerUid: string,
    answers: Record<string, any>,
    source: "preview" | "public"
) {
    await addDoc(collection(db, "users", ownerUid, "quoteRequests"), {
        answers,
        source,
        status: "lead",
        createdAt: serverTimestamp(),
    });
}
