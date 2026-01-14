import React from "react";

const Features: React.FC = () => {
    const items = [
        { title: "Projects", desc: "Track project status, locations, notes and documents." },
        { title: "Clients", desc: "Keep client information, history, and tags in one place." },
        { title: "Pipeline", desc: "Move work from lead to quote to invoice with clear stages." },
        { title: "Offline & Sync", desc: "Keep working offline — sync changes when online." },
    ];

    return (
        <div className="container" style={{ maxWidth: 1200, padding: "48px 0" }}>
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.02em" }}>Features</h1>
            <p style={{ marginTop: 8, color: "var(--color-text-secondary)", maxWidth: 640 }}>
                Minimal tools that help you stay organized without adding complexity.
            </p>

            <div
                style={{
                    marginTop: 18,
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: "var(--spacing-lg)",
                }}
            >
                {items.map((f) => (
                    <div
                        key={f.title}
                        style={{
                            gridColumn: "span 6",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--border-radius)",
                            background: "var(--color-background)",
                            padding: "var(--spacing-lg)",
                            boxShadow: "var(--shadow-sm)",
                            minWidth: 280,
                        }}
                    >
                        <div style={{ fontWeight: 700 }}>{f.title}</div>
                        <div style={{ marginTop: 6, color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
                            {f.desc}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Features;
