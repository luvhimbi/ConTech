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

    if (loading) return <div className="container">Loading requests…</div>;

    return (
        <div className="container" style={{ maxWidth: 1100 }}>
            <h1>Quote Requests</h1>

            <div
                style={{
                    marginTop: 16,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--border-radius)",
                    overflow: "hidden",
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                    <tr style={{ background: "var(--color-border-light)" }}>
                        <th style={th}>Date</th>
                        <th style={th}>Source</th>
                        <th style={th}>Status</th>
                        <th style={th}>Summary</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => (
                        <tr
                            key={r.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/quote-requests/${r.id}`)}
                        >
                            <td style={td}>
                                {r.createdAt.toDate().toLocaleDateString()}
                            </td>
                            <td style={td}>{r.source}</td>
                            <td style={td}>{r.status}</td>
                            <td style={td}>
                                {Object.values(r.answers).slice(0, 2).join(" · ")}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const th: React.CSSProperties = {
    textAlign: "left",
    padding: "12px",
    fontSize: 12,
};

const td: React.CSSProperties = {
    padding: "12px",
    borderTop: "1px solid var(--color-border)",
    fontSize: 14,
};

export default QuoteRequests;
