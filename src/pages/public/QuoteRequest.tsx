import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { CheckCircle2, Loader2, AlertCircle} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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

const QuoteRequest: React.FC = () => {
    const { slug } = useParams(); // URL: /q/geeks4learning
    const navigate = useNavigate();

    const [ownerUid, setOwnerUid] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [fields, setFields] = useState<Field[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!slug) return;

        (async () => {
            try {
                // 1. Resolve slug to UID (from publicBusinesses collection)
                const indexSnap = await getDoc(doc(db, "publicBusinesses", slug));

                if (!indexSnap.exists()) {
                    setLoading(false);
                    return;
                }

                const data = indexSnap.data();
                const uid = data.uid;
                setOwnerUid(uid);
                setCompanyName(data.companyName || "Our Business");

                // 2. Fetch the specific form configuration for this user
                const formSnap = await getDoc(
                    doc(db, "users", uid, "forms", "quoteRequest")
                );

                if (formSnap.exists()) {
                    setFields(formSnap.data().fields || []);
                }
            } catch (error) {
                console.error("Error loading form:", error);
                toast.error("Failed to load form configuration");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ownerUid) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "users", ownerUid, "quoteRequests"), {
                answers,
                source: "public_form",
                sourceSlug: slug,
                status: "lead",
                createdAt: serverTimestamp(),
            });

            setSubmitted(true);
            toast.success("Request submitted successfully!");
        } catch (error) {
            toast.error("Submission failed. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Loading quotation form...</p>
            </div>
        );
    }

    if (!ownerUid) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <AlertCircle size={48} color="var(--color-error)" />
                <div style={{ textAlign: 'center' }}>
                    <h2>Form Not Found</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>The business link you followed may be expired or incorrect.</p>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Return Home</button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 20 }}>
                <div style={{ background: 'var(--color-success-light)', padding: 24, borderRadius: '50%' }}>
                    <CheckCircle2 size={64} color="var(--color-success)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 8 }}>Request Sent Successfully</h2>
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: 400 }}>
                        Thank you for reaching out to <strong>{companyName}</strong>. A representative will review your details and contact you shortly.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    Submit Another Request
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--color-background-alt, #f9fafb)",
                padding: "60px 20px",
            }}
        >
            <Toaster position="top-center" />

            <div
                style={{
                    maxWidth: 640,
                    margin: "0 auto",
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    overflow: "hidden"
                }}
            >
                {/* Brand Header */}
                <div style={{
                    padding: "32px 40px",
                    borderBottom: "1px solid var(--color-border)",
                    background: "linear-gradient(to right, var(--color-surface), var(--color-background))"
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, background: 'var(--color-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 }}>C</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>CONTECH FORMS</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{companyName}</h1>
                    <p style={{ margin: "8px 0 0 0", color: "var(--color-text-secondary)", fontSize: 15 }}>
                        Complete the form below to receive a formal quotation.
                    </p>
                </div>

                <form onSubmit={submit} style={{ padding: "40px", display: "grid", gap: 20 }}>
                    {fields.map((field) =>
                        shouldShowField(field, answers) ? (
                            <div key={field.id}>
                                <label
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "var(--color-text)",
                                        display: "block",
                                        marginBottom: 8,
                                    }}
                                >
                                    {field.label} {field.required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                                </label>

                                {field.type === "textarea" ? (
                                    <textarea
                                        className="form-control"
                                        required={field.required}
                                        rows={4}
                                        placeholder={`Enter your ${field.label.toLowerCase()}...`}
                                        style={{ resize: 'vertical' }}
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
                                        onChange={(e) =>
                                            setAnswers((a) => ({
                                                ...a,
                                                [field.id]: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">Please select an option</option>
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
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
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

                    <div style={{ marginTop: 10 }}>
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={isSubmitting}
                            style={{ width: '100%', height: 48, fontSize: 16, fontWeight: 600 }}
                        >
                            {isSubmitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Loader2 className="animate-spin" size={18} /> Submitting...
                                </span>
                            ) : "Submit Quotation Request"}
                        </button>
                    </div>
                </form>

                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Secure form powered by <strong>CONTECH</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuoteRequest;