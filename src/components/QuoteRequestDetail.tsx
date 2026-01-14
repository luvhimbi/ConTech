import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";

const QuoteRequestDetail: React.FC = () => {
    const uid = auth.currentUser?.uid;
    const { id } = useParams();

    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!uid || !id) return;

        getDoc(doc(db, "users", uid, "quoteRequests", id)).then((snap) => {
            if (snap.exists()) setData(snap.data());
        });
    }, [uid, id]);

    if (!data) return <div className="container">Loading…</div>;

    return (
        <div className="container" style={{ maxWidth: 720 }}>
            <h1>Quote Request</h1>

            <div
                style={{
                    marginTop: 16,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--border-radius)",
                    padding: 24,
                }}
            >
                {Object.entries(data.answers).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                            {key}
                        </div>
                        <div style={{ fontSize: 15 }}>{String(value)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuoteRequestDetail;
