import React from "react";
import { Link } from "react-router-dom";

const WhyUs: React.FC = () => {
    const items = [
        {
            title: "Built for real workflows",
            desc: "Projects, clients, and a simple pipeline — the core things you actually use daily.",
        },
        {
            title: "Minimal and fast",
            desc: "No clutter. Your team can learn it quickly and use it without training.",
        },
        {
            title: "Offline-friendly",
            desc: "Work on-site with poor network. Data syncs when connectivity returns.",
        },
        {
            title: "Clear progress visibility",
            desc: "Know what’s active, what’s stuck, and what needs action next.",
        },
    ];

    return (
        <div className="container" style={{ maxWidth: 1200, padding: "48px 0" }}>
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.02em" }}>
                Why CONTECH
            </h1>
            <p style={{ marginTop: 8, color: "var(--color-text-secondary)", maxWidth: 720 }}>
                Construction teams need tools that stay simple, work in the field, and keep everyone aligned.
            </p>

            <div
                style={{
                    marginTop: 18,
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: "var(--spacing-lg)",
                }}
            >
                {items.map((x) => (
                    <div
                        key={x.title}
                        style={{
                            gridColumn: "span 6",
                            minWidth: 280,
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--border-radius)",
                            background: "var(--color-background)",
                            padding: "var(--spacing-lg)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        <div style={{ fontWeight: 700 }}>{x.title}</div>
                        <div style={{ marginTop: 6, color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
                            {x.desc}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    marginTop: 22,
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: 18,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <Link to="/features" className="btn btn-outline" style={{ padding: "10px 14px" }}>
                    View features
                </Link>
                <Link to="/pricing" className="btn btn-outline" style={{ padding: "10px 14px" }}>
                    Pricing
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: "10px 14px" }}>
                    Get started
                </Link>
            </div>
        </div>
    );
};

export default WhyUs;
