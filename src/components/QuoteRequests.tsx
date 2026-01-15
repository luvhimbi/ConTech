import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    ChevronRight,
    ExternalLink,
    Inbox,
    Mail,
    User,
    Tag
} from "lucide-react";

type RequestRow = {
    id: string;
    answers: Record<string, any>;
    source: string;
    status: string;
    createdAt: Timestamp;
};

const QuoteRequests: React.FC = () => {
    const uid = auth.currentUser?.uid;
    const navigate = useNavigate();

    const [rows, setRows] = useState<RequestRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) return;

        (async () => {
            const q = query(
                collection(db, "users", uid, "quoteRequests"),
                orderBy("createdAt", "desc")
            );

            const snap = await getDocs(q);
            setRows(
                snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
            );
            setLoading(false);
        })();
    }, [uid]);

    // Helper to extract specific common fields if they exist in answers
    const getContactInfo = (answers: Record<string, any>) => {
        const nameKey = Object.keys(answers).find(k => k.toLowerCase().includes('name')) || '';
        const emailKey = Object.keys(answers).find(k => k.toLowerCase().includes('email')) || '';
        return {
            name: answers[nameKey] || "Unknown Client",
            email: answers[emailKey] || "No Email Provided"
        };
    };

    if (loading) return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner">Loading requests…</div>
        </div>
    );

    return (
        <div className="container" style={{ maxWidth: 1200, padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Quote Requests</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                        Manage and respond to inbound leads from your public form.
                    </p>
                </div>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
                    {rows.length} Total Leads
                </div>
            </div>

            {rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--color-surface)', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
                    <Inbox size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <h3>No requests yet</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Share your public link to start receiving quotes.</p>
                </div>
            ) : (
                <div style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    overflow: "hidden"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                            <th style={th}><div style={headerContent}><User size={14} /> Client</div></th>
                            <th style={th}><div style={headerContent}><Mail size={14} /> Contact</div></th>
                            <th style={th}><div style={headerContent}><Tag size={14} /> Status</div></th>
                            <th style={th}><div style={headerContent}><Calendar size={14} /> Received</div></th>
                            <th style={{ ...th, textAlign: 'right' }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r) => {
                            const contact = getContactInfo(r.answers);
                            return (
                                <tr
                                    key={r.id}
                                    className="table-row-hover"
                                    onClick={() => navigate(`/quote-requests/${r.id}`)}
                                    style={rowStyle}
                                >
                                    <td style={td}>
                                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{contact.name}</span>
                                    </td>
                                    <td style={td}>
                                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{contact.email}</span>
                                    </td>
                                    <td style={td}>
                                            <span style={statusBadge(r.status)}>
                                                {r.status || 'New'}
                                            </span>
                                    </td>
                                    <td style={td}>
                                            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                                                {r.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                    </td>
                                    <td style={{ ...td, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--color-primary)' }}>
                                            <button className="btn-icon">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                .table-row-hover:hover {
                    background-color: var(--color-border-light) !important;
                    cursor: pointer;
                }
                .btn-icon {
                    background: transparent;
                    border: none;
                    color: var(--color-text-muted);
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }
                .table-row-hover:hover .btn-icon {
                    color: var(--color-primary);
                    transform: translateX(2px);
                }
            `}</style>
        </div>
    );
};

/* ---------------- styles ---------------- */

const th: React.CSSProperties = {
    textAlign: "left",
    padding: "16px 20px",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
};

const td: React.CSSProperties = {
    padding: "16px 20px",
    borderTop: "1px solid var(--color-border)",
    fontSize: 14,
    verticalAlign: "middle"
};

const headerContent: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8
};

const rowStyle: React.CSSProperties = {
    transition: "background-color 0.2s ease"
};

const statusBadge = (status: string): React.CSSProperties => {
    const s = status?.toLowerCase();
    let bg = "#f3f4f6";
    let color = "#374151";

    if (s === 'lead' || s === 'new') { bg = '#e0f2fe'; color = '#0369a1'; }
    if (s === 'contacted') { bg = '#fef3c7'; color = '#92400e'; }
    if (s === 'converted') { bg = '#dcfce7'; color = '#166534'; }

    return {
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "capitalize",
        background: bg,
        color: color,
        display: 'inline-block'
    };
};

export default QuoteRequests;