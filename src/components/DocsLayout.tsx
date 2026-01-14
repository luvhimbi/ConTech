// src/components/docs/DocsLayout.tsx
import React, { useState } from "react";
import {
    Book,
    ChevronRight,
    FileText,
    Settings,
    Share2,
    ShieldCheck,
    Zap
} from "lucide-react";

interface DocArticle {
    id: string;
    title: string;
    category: string;
    content: React.ReactNode;
}

const DocsLayout: React.FC = () => {
    const [activeId, setActiveId] = useState("getting-started");

    const categories = [
        {
            name: "Introduction",
            icon: <Zap size={18} />,
            articles: [
                { id: "getting-started", title: "Getting Started" },
                { id: "core-concepts", title: "Core Concepts" }
            ]
        },
        {
            name: "Form Builder",
            icon: <FileText size={18} />,
            articles: [
                { id: "creating-forms", title: "Creating Forms" },
                { id: "conditional-logic", title: "Conditional Logic" },
                { id: "sharing-links", title: "Sharing your Link" }
            ]
        },
        {
            name: "Account",
            icon: <Settings size={18} />,
            articles: [
                { id: "profile-setup", title: "Profile & Slugs" },
                { id: "security", title: "Security & Permissions" }
            ]
        }
    ];

    return (
        <div style={{ display: "flex", minHeight: "calc(100vh - 64px)", background: "var(--color-background)" }}>
            {/* Sidebar */}
            <aside style={{
                width: "280px",
                borderRight: "1px solid var(--color-border)",
                padding: "32px 16px",
                position: "sticky",
                top: "64px",
                height: "calc(100vh - 64px)",
                overflowY: "auto"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "0 8px" }}>
                    <Book size={20} color="var(--color-primary)" />
                    <span style={{ fontWeight: 700, fontSize: 18 }}>Docs</span>
                </div>

                {categories.map((cat) => (
                    <div key={cat.name} style={{ marginBottom: 24 }}>
                        <div style={{
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: "var(--color-text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "0 8px 8px 8px"
                        }}>
                            {cat.icon} {cat.name}
                        </div>
                        {cat.articles.map((art) => (
                            <button
                                key={art.id}
                                onClick={() => setActiveId(art.id)}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: activeId === art.id ? "var(--color-primary-light)" : "transparent",
                                    color: activeId === art.id ? "var(--color-primary)" : "var(--color-text)",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {art.title}
                                {activeId === art.id && <ChevronRight size={14} />}
                            </button>
                        ))}
                    </div>
                ))}
            </aside>

            {/* Content Area */}
            <main style={{ flex: 1, padding: "60px 80px", maxWidth: "900px" }}>
                <article>
                    {renderContent(activeId)}
                </article>
            </main>
        </div>
    );
};

/* --- Article Content Switcher --- */

const renderContent = (id: string) => {
    switch (id) {
        case "getting-started":
            return (
                <>
                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Getting Started</h1>
                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Welcome to CONTECH. Our platform is designed to help construction and trade professionals
                        automate their quotation workflow and manage client leads with ease.
                    </p>
                    <hr style={{ margin: "32px 0", border: 0, borderTop: "1px solid var(--color-border)" }} />
                    <h3 style={{ marginBottom: 16 }}>Quick Start Steps</h3>
                    <ul style={{ display: "grid", gap: 12, paddingLeft: 20 }}>
                        <li><strong>Register your account:</strong> Use your business email to get started.</li>
                        <li><strong>Set your Slug:</strong> Claim your unique business URL (e.g., contech.com/q/your-name).</li>
                        <li><strong>Build a Form:</strong> Head to the Form Builder to customize your intake fields.</li>
                    </ul>
                </>
            );
        case "sharing-links":
            return (
                <>
                    <div style={{ background: "var(--color-primary-light)", padding: "4px 12px", borderRadius: 20, color: "var(--color-primary)", fontSize: 12, fontWeight: 700, display: "inline-block", marginBottom: 16 }}>
                        FORM BUILDER
                    </div>
                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Sharing your Link</h1>
                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Your public quotation link is the gateway for your customers. You can share this link anywhere
                        to start receiving organized leads directly into your dashboard.
                    </p>
                    <div style={{ marginTop: 32, padding: 24, border: "1px solid var(--color-border)", borderRadius: 12 }}>
                        <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Share2 size={18} /> Social Media & Email
                        </h4>
                        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                            Paste your link in your Instagram bio, Facebook page, or include it in your email signature.
                        </p>
                    </div>
                </>
            );
        default:
            return <div>Select an article from the sidebar to view documentation.</div>;
    }
};

export default DocsLayout;