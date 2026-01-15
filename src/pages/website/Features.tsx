import React from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Users, TrendingUp, WifiOff } from "lucide-react";

const Features: React.FC = () => {
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
            icon: <FolderKanban size={24} color="var(--color-primary)" />,
            title: "Projects",
            desc: "Track project status, site locations, notes, and documents in one central hub. Filter by active or completed jobs.",
        },
        {
            icon: <Users size={24} color="var(--color-primary)" />,
            title: "Clients",
            desc: "Keep client contact info, project history, and specific notes (like gate codes or preferences) organized and searchable.",
        },
        {
            icon: <TrendingUp size={24} color="var(--color-primary)" />,
            title: "Pipeline",
            desc: "Visualize your workflow. Move work from 'Lead' to 'Quote' to 'In Progress' with a simple drag-and-drop style interface.",
        },
        {
            icon: <WifiOff size={24} color="var(--color-primary)" />,
            title: "Offline & Sync",
            desc: "Construction sites don't always have signal. Keep working offline, and we'll automatically sync your changes when you reconnect.",
        },
    ];

    return (
        <div style={{ width: "100%", overflowX: "hidden" }}>

            {/* --- HEADER --- */}
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
                        Core Capabilities
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
                        Features
                    </h1>
                    <p
                        style={{
                            margin: "0",
                            color: "var(--color-text-secondary)",
                            fontSize: "20px",
                            lineHeight: 1.6,
                        }}
                    >
                        Minimal tools that help you stay organized without adding complexity. We focus on the features contractors actually use.
                    </p>
                </div>
            </div>

            {/* --- GRID --- */}
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
                    {items.map((f) => (
                        <div key={f.title} style={cardStyle}>
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
                                {f.icon}
                            </div>
                            <div>
                                <h3 style={{ margin: "0 0 8px", fontSize: "20px", color: "var(--color-text-primary)" }}>
                                    {f.title}
                                </h3>
                                <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "16px", lineHeight: 1.6 }}>
                                    {f.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CTA STRIP --- */}
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
                    <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>Ready to simplify your work?</h2>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                        <Link to="/register" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "16px" }}>
                            Start using Features
                        </Link>
                        <Link to="/pricing" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: "16px" }}>
                            View Pricing
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Features;