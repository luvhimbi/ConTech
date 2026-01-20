import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
    collection,
    getDocs,
    Timestamp,
} from "firebase/firestore";

type Submission = {
    answers: Record<string, any>;
    createdAt: Timestamp;
};

const FormAnalytics: React.FC = () => {
    const uid = auth.currentUser?.uid;

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) return;

        (async () => {
            const snap = await getDocs(
                collection(db, "users", uid, "quoteRequests")
            );

            const rows: Submission[] = snap.docs.map((d) => d.data() as Submission);
            setSubmissions(rows);
            setLoading(false);
        })();
    }, [uid]);

    const now = Date.now();

    const stats = useMemo(() => {
        const total = submissions.length;

        const last7 = submissions.filter(
            (s) => now - s.createdAt.toMillis() <= 7 * 86400000
        ).length;

        const last30 = submissions.filter(
            (s) => now - s.createdAt.toMillis() <= 30 * 86400000
        ).length;

        return { total, last7, last30 };
    }, [submissions, now]);

    if (loading) return <div className="container">Loading analytics…</div>;

    return (
        <div className="container" style={{ maxWidth: 1100 }}>
            <h1>Form Analytics</h1>
            <p style={{ color: "var(--color-text-secondary)" }}>
                Overview of quote form activity
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                    marginTop: 24,
                }}
            >
                <StatCard label="Total submissions" value={stats.total} />
                <StatCard label="Last 7 days" value={stats.last7} />
                <StatCard label="Last 30 days" value={stats.last30} />
            </div>

            <div style={{ marginTop: 32, fontSize: 13, color: "var(--color-text-muted)" }}>
                 Chart visualisations coming soon
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: number }> = ({
                                                                  label,
                                                                  value,
                                                              }) => (
    <div
        style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--border-radius)",
            padding: 20,
            background: "var(--color-surface)",
        }}
    >
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
);

export default FormAnalytics;
