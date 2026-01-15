import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
    CheckCircle2,
    Loader2,
    AlertCircle,
    ShieldCheck,
    Clock,
    ArrowRight,
    Lock
} from "lucide-react";
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

function shouldShowField(field: Field, answers: Record<string, any>): boolean {
    if (!field.condition) return true;
    return answers[field.condition.fieldId] === field.condition.equals;
}

const QuoteRequest: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [ownerUid, setOwnerUid] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [fields, setFields] = useState<Field[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false); // Controls landing vs form view

    useEffect(() => {
        if (!slug) return;

        (async () => {
            try {
                let resolvedUid = "";
                let resolvedName = "";

                const indexSnap = await getDoc(doc(db, "publicBusinesses", slug.toLowerCase()));

                if (indexSnap.exists()) {
                    resolvedUid = indexSnap.data().uid;
                    resolvedName = indexSnap.data().companyName;
                } else {
                    const userSnap = await getDoc(doc(db, "users", slug));
                    if (userSnap.exists()) {
                        resolvedUid = slug;
                        resolvedName = userSnap.data().companyName;
                    }
                }

                if (!resolvedUid) {
                    setLoading(false);
                    return;
                }

                setOwnerUid(resolvedUid);
                setCompanyName(resolvedName || "Our Business");

                const formSnap = await getDoc(
                    doc(db, "users", resolvedUid, "forms", "quoteRequest")
                );

                if (formSnap.exists()) {
                    setFields(formSnap.data().fields || []);
                }
            } catch (error) {
                console.error("Error loading form:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ownerUid) return;

        // 1. Identify Email Field
        // We look for a field with id 'email' or type 'email' to check for duplicates
        const emailFieldId = fields.find(f => f.id === 'email' || f.type === 'email')?.id || 'email';
        const userEmail = answers[emailFieldId];

        if (!userEmail) {
            toast.error("Please provide a valid email address.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 2. CHECK FOR DUPLICATES / ABUSE
            // Query existing requests from this email for this specific business owner
            const q = query(
                collection(db, "users", ownerUid, "quoteRequests"),
                where("answers." + emailFieldId, "==", userEmail)
            );

            const existingDocs = await getDocs(q);

            // Limit: Max 2 submissions per email
            if (existingDocs.size >= 2) {
                toast.error("You have already submitted requests to this business.");
                setIsSubmitting(false);
                return;
            }

            // 3. CREATE QUOTE REQUEST (Critical Step)
            const quoteRef = await addDoc(collection(db, "users", ownerUid, "quoteRequests"), {
                answers,
                source: "public_form",
                sourceSlug: slug,
                status: "lead",
                createdAt: serverTimestamp(),
            });

            // If we get here, the form is effectively successful for the user
            setSubmitted(true);
            toast.success("Request submitted!");

            // 4. CREATE NOTIFICATION (Non-Critical Step)
            // We wrap this in a separate try/catch block so if it fails,
            // the user still sees the success screen.
            try {
                const clientIdentifier = answers['name'] || answers['full_name'] || userEmail || 'A new client';

                await addDoc(collection(db, "users", ownerUid, "notifications"), {
                    type: 'quote_request',
                    title: 'New Quote Request',
                    message: `${clientIdentifier} has requested a quote.`,
                    read: false,
                    link: `/quote-requests/${quoteRef.id}`,
                    createdAt: serverTimestamp()
                });
            } catch (notifError) {
                console.warn("Notification failed to send, but form was saved:", notifError);
                // We intentionally do NOT show an error toast here to avoid confusing the user
            }

        } catch (error) {
            console.error(error);
            toast.error("Submission failed. Please try again.");
            setSubmitted(false); // Ensure we don't show success screen on DB error
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading business profile...</p>
            </div>
        );
    }

    if (!ownerUid) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <AlertCircle size={48} color="var(--color-error)" />
                <div style={{ textAlign: 'center' }}>
                    <h2>Form Not Found</h2>
                    <p>This business link is incorrect or the profile is private.</p>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/')}>Return Home</button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, textAlign: 'center', padding: 20 }}>
                <div style={{ background: '#dcfce7', padding: 20, borderRadius: '50%' }}>
                    <CheckCircle2 size={64} color="#166534" />
                </div>
                <div>
                    <h2 style={{ marginBottom: 8 }}>Request Sent Successfully</h2>
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: 450 }}>
                        Thank you for reaching out to <strong>{companyName}</strong>. Our team will review your requirements and get back to you shortly.
                    </p>
                </div>
                {/* Removed 'Submit Another' button to discourage spam loops immediately after submission */}
                <button className="btn btn-outline" onClick={() => navigate('/')}>Return to Homepage</button>
            </div>
        );
    }

    // --- LANDING PAGE VIEW ---
    if (!showForm) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                        <div style={badgeStyle}>{companyName}</div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
                            Request a Professional Quotation
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
                            Provide us with your project details, and we'll prepare a comprehensive quote tailored to your needs.
                        </p>

                        <div style={infoGridStyle}>
                            <div style={infoItemStyle}>
                                <Clock size={20} color="var(--color-primary)" />
                                <span>Takes ~2 minutes</span>
                            </div>
                            <div style={infoItemStyle}>
                                <ShieldCheck size={20} color="var(--color-primary)" />
                                <span>Secure & Private</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', height: 56, fontSize: 18, borderRadius: 12 }}
                            onClick={() => setShowForm(true)}
                        >
                            Start Request <ArrowRight size={20} style={{ marginLeft: 8 }} />
                        </button>
                    </div>

                    <div style={footerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            <Lock size={12} /> SSL Encrypted Connection
                        </div>
                    </div>
                </div>
                <PoweredBy />
            </div>
        );
    }

    // --- FORM VIEW ---
    return (
        <div style={containerStyle}>
            <Toaster position="top-center" />
            <div style={cardStyle}>
                <div style={{ padding: "32px 40px", borderBottom: "1px solid var(--color-border)", background: '#fafafa' }}>
                    <button
                        onClick={() => setShowForm(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontSize: 13, marginBottom: 12, fontWeight: 600 }}
                    >
                        ← Back to info
                    </button>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{companyName}</h2>
                    <p style={{ margin: "4px 0 0 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
                        Quotation Request Form
                    </p>
                </div>

                <form onSubmit={submit} style={{ padding: "40px", display: "grid", gap: 24 }}>
                    {fields.map((field) =>
                        shouldShowField(field, answers) ? (
                            <div key={field.id}>
                                <label style={{ fontWeight: 600, display: "block", marginBottom: 8, fontSize: 14 }}>
                                    {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                                </label>
                                {field.type === "textarea" ? (
                                    <textarea
                                        className="form-control"
                                        required={field.required}
                                        rows={4}
                                        placeholder="Provide as much detail as possible..."
                                        style={{ borderRadius: 8 }}
                                        onChange={(e) => setAnswers(a => ({ ...a, [field.id]: e.target.value }))}
                                    />
                                ) : field.type === "select" ? (
                                    <select
                                        className="form-control"
                                        required={field.required}
                                        style={{ borderRadius: 8 }}
                                        onChange={(e) => setAnswers(a => ({ ...a, [field.id]: e.target.value }))}
                                    >
                                        <option value="">Select an option</option>
                                        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        className="form-control"
                                        type={field.type}
                                        required={field.required}
                                        style={{ borderRadius: 8, height: 45 }}
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                        onChange={(e) => setAnswers(a => ({ ...a, [field.id]: e.target.value }))}
                                    />
                                )}
                            </div>
                        ) : null
                    )}

                    <div style={{ marginTop: 8 }}>
                        <div style={privacyBoxStyle}>
                            <ShieldCheck size={16} />
                            <span>Your data is protected. By submitting, you agree to allow {companyName} to contact you regarding this request.</span>
                        </div>

                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={isSubmitting}
                            style={{ width: '100%', height: 52, fontSize: 16, fontWeight: 700, borderRadius: 10, marginTop: 16 }}
                        >
                            {isSubmitting ? "Processing..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
            <PoweredBy />
        </div>
    );
};

/* ---------------- sub-components ---------------- */

const PoweredBy = () => (
    <div style={{ marginTop: 32, textAlign: 'center', opacity: 0.7 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
            Powered by <strong style={{ color: 'var(--color-text)', letterSpacing: '1px' }}>CONTECH</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
        </div>
    </div>
);

/* ---------------- styles ---------------- */

const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f8fafc", // Soft slate background
    padding: "60px 20px",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
};

const cardStyle: React.CSSProperties = {
    maxWidth: 600,
    width: '100%',
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
    overflow: "hidden"
};

const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '6px 16px',
    background: '#f1f5f9',
    borderRadius: '100px',
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 20
};

const infoGridStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 40
};

const infoItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: 500
};

const footerStyle: React.CSSProperties = {
    padding: '20px 40px',
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'center'
};

const privacyBoxStyle: React.CSSProperties = {
    background: '#f0f9ff',
    border: '1px solid #e0f2fe',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: 12,
    color: '#0369a1',
    display: 'flex',
    gap: 10,
    lineHeight: 1.5
};

export default QuoteRequest;