import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";

/* ---------------- types ---------------- */

type FieldType = "text" | "email" | "textarea" | "select";

type Condition = {
    fieldId: string;
    equals: string;
};

type Field = {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: string[];
    condition?: Condition;
};

/* ---------------- helpers ---------------- */

function shouldShowField(
    field: Field,
    answers: Record<string, any>
): boolean {
    if (!field.condition) return true;
    return answers[field.condition.fieldId] === field.condition.equals;
}

/* ---------------- component ---------------- */

const QuotePreview: React.FC = () => {
    const uid = auth.currentUser?.uid;

    const [companyName, setCompanyName] = useState("");
    const [fields, setFields] = useState<Field[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!uid) return;

        (async () => {
            try {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                    setCompanyName(userSnap.data().companyName || "");
                }

                const formSnap = await getDoc(
                    doc(db, "users", uid, "forms", "quoteRequest")
                );

                if (formSnap.exists()) {
                    setFields(formSnap.data().fields || []);
                }
            } catch {
                toast.error("Failed to load preview");
            } finally {
                setLoading(false);
            }
        })();
    }, [uid]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uid) return;

        try {
            await addDoc(collection(db, "users", uid, "quoteRequests"), {
                answers,
                source: "preview",
                status: "lead",
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
            toast.success("Preview submission saved");
        } catch {
            toast.error("Submission failed");
        }
    };

    if (loading) return <div className="container">Loading preview…</div>;
    if (submitted) return <div className="container">Preview submitted ✔</div>;

    return (
        <div
            className="container"
            style={{ maxWidth: 680, padding: "40px 0" }}
        >
            <h1 style={{ marginBottom: 6 }}>Quote Form Preview</h1>
            <p style={{ color: "var(--color-text-secondary)" }}>
                {companyName}
            </p>

            <form
                onSubmit={submit}
                style={{ marginTop: 24, display: "grid", gap: 14 }}
            >
                {fields.map((field) =>
                    shouldShowField(field, answers) ? (
                        <div key={field.id}>
                            <label
                                style={{
                                    fontSize: 12,
                                    color: "var(--color-text-muted)",
                                    display: "block",
                                    marginBottom: 4,
                                }}
                            >
                                {field.label} {field.required && "*"}
                            </label>

                            {field.type === "textarea" ? (
                                <textarea
                                    className="form-control"
                                    required={field.required}
                                    rows={4}
                                    value={answers[field.id] || ""}
                                    onChange={(e) =>
                                        setAnswers((a) => ({
                                            ...a,
                                            [field.id]: e.target.value,
                                        }))
                                    }
                                />
                            ) : field.type === "select" ? (
                                <select
                                    className="form-control"
                                    required={field.required}
                                    value={answers[field.id] || ""}
                                    onChange={(e) =>
                                        setAnswers((a) => ({
                                            ...a,
                                            [field.id]: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Select…</option>
                                    {(field.options || []).map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="form-control"
                                    type={field.type}
                                    required={field.required}
                                    value={answers[field.id] || ""}
                                    onChange={(e) =>
                                        setAnswers((a) => ({
                                            ...a,
                                            [field.id]: e.target.value,
                                        }))
                                    }
                                />
                            )}
                        </div>
                    ) : null
                )}

                <button className="btn btn-primary" type="submit">
                    Submit (Preview)
                </button>
            </form>
        </div>
    );
};

export default QuotePreview;
