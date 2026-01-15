import React from "react";
import { Link } from "react-router-dom";
import { Hammer, Zap, WifiOff, TrendingUp } from "lucide-react";

const WhyUs: React.FC = () => {
    // Consistent card styling
    const cardStyle: React.CSSProperties = {
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--border-radius)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "var(--shadow-sm)",
        transition: "transform 0.2s ease",
    };

    const items = [
        {
            icon: <Hammer size={24} color="var(--color-primary)" />,
            title: "Built for real workflows",
            desc: "Projects, clients, and a simple pipeline — the core things you actually use daily. We stripped away the bloat found in enterprise software.",
        },
        {
            icon: <Zap size={24} color="var(--color-primary)" />,
            title: "Minimal and fast",
            desc: "No clutter. Your team can learn it in 5 minutes and use it without training. It loads instantly even on older devices.",
        },
        {
            icon: <WifiOff size={24} color="var(--color-primary)" />,
            title: "Offline-friendly",
            desc: "Work on-site with poor network coverage. You can keep adding notes and updates; data syncs automatically when connectivity returns.",
        },
        {
            icon: <TrendingUp size={24} color="var(--color-primary)" />,
            title: "Clear progress visibility",
            desc: "Know exactly what’s active, what’s stuck, and what needs action next. Stop guessing the status of your jobs.",
        },
    ];

    return (
        <div style={{ width: "100%", overflowX: "hidden" }}>

            {/* --- HEADER SECTION --- */}
            <div className="container" style={{ maxWidth: 1200, padding: "80px 20px 40px" }}>
                <div style={{ maxWidth: 800 }}>
                    <div
                        style={{
                            display: "inline-block",
                            background: "var(--color-surface-active, #f0f4f8)",
                            color: "var(--color-primary)",
                            fontSize: "13px",
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: "100px",
                            marginBottom: "16px",
                        }}
                    >
                        Our Philosophy
                    </div>
                    <h1
                        style={{
                            margin: "0 0 16px",
                            fontSize: "clamp(36px, 5vw, 52px)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.1,
                            fontWeight: 800,
                            color: "var(--color-text-primary)",
                        }}
                    >
                        Why CONTECH?
                    </h1>
                    <p
                        style={{
                            margin: "0",
                            color: "var(--color-text-secondary)",
                            fontSize: "20px",
                            lineHeight: 1.6,
                        }}
                    >
                        Construction teams need tools that stay simple, work in the field, and keep everyone aligned. We built CONTECH to be the tool we wished we had.
                    </p>
                </div>
            </div>

            {/* --- GRID SECTION --- */}
            <div
                className="container"
                style={{
                    maxWidth: 1200,
                    padding: "0 20px 80px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "32px",
                    }}
                >
                    {items.map((x) => (
                        <div key={x.title} style={cardStyle}>
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    background: "var(--color-surface-muted, #f3f4f6)",
                                    borderRadius: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {x.icon}
                            </div>
                            <div>
                                <h3 style={{ margin: "0 0 8px", fontSize: "20px", color: "var(--color-text-primary)" }}>
                                    {x.title}
                                </h3>
                                <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "16px", lineHeight: 1.6 }}>
                                    {x.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CALL TO ACTION --- */}
            <div style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface-muted, #f9fafb)" }}>
                <div
                    className="container"
                    style={{
                        maxWidth: 1200,
                        padding: "60px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center"
                    }}
                >
                    <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>See the difference yourself</h2>
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            flexWrap: "wrap",
                            justifyContent: "center",
                        }}
                    >
                        <Link to="/register" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "16px" }}>
                            Get started for free
                        </Link>
                        <Link to="/features" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: "16px" }}>
                            View full features
                        </Link>
                        <Link to="/pricing" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: "16px" }}>
                            Pricing
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhyUs;