// src/components/docs/DocsLayout.tsx
import React, { useState } from "react";
import {
    Book,
    ChevronRight,
    FileText,
    Settings,
    Share2,
    Zap,
    ClipboardList,
    Sparkles,
    Receipt,
    Users,
    ShieldCheck,
    Mail
} from "lucide-react";

type ArticleDef = { id: string; title: string };

const DocsLayout: React.FC = () => {
    const [activeId, setActiveId] = useState("getting-started");

    const categories: Array<{
        name: string;
        icon: React.ReactNode;
        articles: ArticleDef[];
    }> = [
        {
            name: "Introduction",
            icon: <Zap size={18} />,
            articles: [
                { id: "getting-started", title: "Getting Started" },
                { id: "core-concepts", title: "Core Concepts" },
            ],
        },
        {
            name: "Quotations & Invoices",
            icon: <Receipt size={18} />,
            articles: [
                { id: "quotations", title: "Creating Quotations" },
                { id: "invoices", title: "Creating Invoices" },
                { id: "templates", title: "Templates & Branding" },
            ],
        },
        {
            name: "Form Builder",
            icon: <FileText size={18} />,
            articles: [
                { id: "creating-forms", title: "Creating Forms" },
                { id: "conditional-logic", title: "Conditional Logic" },
                { id: "sharing-links", title: "Sharing your Link" },
            ],
        },
        {
            name: "Clients & Leads",
            icon: <Users size={18} />,
            articles: [
                { id: "client-directory", title: "Client Directory" },
                { id: "quote-requests", title: "Quote Requests" },
            ],
        },
        {
            name: "Account",
            icon: <Settings size={18} />,
            articles: [
                { id: "profile-setup", title: "Profile & Slugs" },
                { id: "security", title: "Security & Permissions" },
            ],
        },
    ];

    return (
        <div style={{ display: "flex", minHeight: "calc(100vh - 64px)", background: "var(--color-background)" }}>
            {/* Sidebar */}
            <aside
                style={{
                    width: "280px",
                    borderRight: "1px solid var(--color-border)",
                    padding: "32px 16px",
                    position: "sticky",
                    top: "64px",
                    height: "calc(100vh - 64px)",
                    overflowY: "auto",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "0 8px" }}>
                    <Book size={20} color="var(--color-primary)" />
                    <span style={{ fontWeight: 700, fontSize: 18 }}>Docs</span>
                </div>

                {categories.map((cat) => (
                    <div key={cat.name} style={{ marginBottom: 24 }}>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "0 8px 8px 8px",
                            }}
                        >
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
                                    transition: "all 0.2s ease",
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
                <article>{renderContent(activeId)}</article>
            </main>
        </div>
    );
};

/* --- Article Content Switcher --- */

const Pill: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
    <div
        style={{
            background: "var(--color-primary-light)",
            padding: "4px 12px",
            borderRadius: 20,
            color: "var(--color-primary)",
            fontSize: 12,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
        }}
    >
        {icon} {label}
    </div>
);

const Card: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ marginTop: 20, padding: 24, border: "1px solid var(--color-border)", borderRadius: 12 }}>
        <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 0 }}>{title}</h4>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.7 }}>{children}</div>
    </div>
);

const renderContent = (id: string) => {
    switch (id) {
        case "getting-started":
            return (
                <>
                    <Pill label="WELCOME" icon={<Sparkles size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Getting Started</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Welcome to CONTECH. Our platform is built for solo entrepreneurs and freelancers who want a simple way to
                        capture leads, send professional quotations, and turn approved work into invoices—without juggling
                        spreadsheets, WhatsApp threads, and messy notes.
                    </p>

                    <hr style={{ margin: "32px 0", border: 0, borderTop: "1px solid var(--color-border)" }} />

                    <h3 style={{ marginBottom: 16 }}>Quick Start Steps</h3>
                    <ul style={{ display: "grid", gap: 12, paddingLeft: 20 }}>
                        <li>
                            <strong>Create your account:</strong> Sign up and confirm your details.
                        </li>
                        <li>
                            <strong>Set your public link (slug):</strong> Share one URL so clients can request quotes anytime.
                        </li>
                        <li>
                            <strong>Build your form:</strong> Customize what you ask clients (job type, budget, location, photos).
                        </li>
                        <li>
                            <strong>Send your first quote:</strong> Turn a request into a quotation, then invoice when it’s approved.
                        </li>
                    </ul>

                    <Card title={<><ClipboardList size={18} /> What CONTECH helps you do</>}>
                        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 10 }}>
                            <li>Collect quote requests in one place (no more lost messages).</li>
                            <li>Create quotations and invoices with totals, deposits, and milestones/phases.</li>
                            <li>Track clients and job history so you always know what was quoted, what was accepted, and what’s due.</li>
                        </ul>
                    </Card>
                </>
            );

        case "core-concepts":
            return (
                <>
                    <Pill label="INTRODUCTION" icon={<Zap size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Core Concepts</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        CONTECH is organized around a few simple building blocks so freelancers can move from lead → quote → invoice
                        with minimal admin work.
                    </p>

                    <Card title={<><Users size={18} /> Clients</>}>
                        Keep a directory of people and businesses you work with. Save emails, phone numbers, tags, and site access
                        notes so you don’t have to ask the same questions again.
                    </Card>

                    <Card title={<><FileText size={18} /> Quote Requests (Leads)</>}>
                        These are requests that come from your public form link. You can open a request, review the details, and
                        convert it into a quotation.
                    </Card>

                    <Card title={<><Receipt size={18} /> Quotations & Invoices</>}>
                        Quotations help you price the job clearly. Invoices help you request payment. You can include milestones,
                        deposits, and payment details depending on how you run your projects.
                    </Card>
                </>
            );

        case "creating-forms":
            return (
                <>
                    <Pill label="FORM BUILDER" icon={<FileText size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Creating Forms</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Your public form is how clients request quotes. Add only the fields you need so the form stays quick and
                        easy to complete.
                    </p>

                    <Card title={<><ClipboardList size={18} /> Recommended fields</>}>
                        Name, email/phone, location, job description, photos, preferred start date, and budget range.
                    </Card>
                </>
            );

        case "conditional-logic":
            return (
                <>
                    <Pill label="FORM BUILDER" icon={<FileText size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Conditional Logic</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Conditional logic helps you show follow-up questions only when they’re needed (for example: ask for roof
                        type only if the client selects “Roofing”).
                    </p>
                </>
            );

        case "sharing-links":
            return (
                <>
                    <Pill label="FORM BUILDER" icon={<Share2 size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Sharing your Link</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Your public quotation link is the easiest way for new clients to reach you. Share it anywhere and all
                        requests will arrive neatly inside your dashboard.
                    </p>

                    <Card title={<><Share2 size={18} /> Social Media & Email</>}>
                        Paste your link in your Instagram bio, Facebook page, WhatsApp business profile, or include it in your email
                        signature so people can request a quote without back-and-forth.
                    </Card>

                    <Card title={<><Mail size={18} /> Pro tip</>}>
                        Add a short message like: “Request a quote here” and keep your link consistent across all platforms.
                    </Card>
                </>
            );

        case "profile-setup":
            return (
                <>
                    <Pill label="ACCOUNT" icon={<Settings size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Profile & Slugs</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Your profile helps clients recognize your business. Your slug is your unique link that clients use to submit
                        requests.
                    </p>
                </>
            );

        case "security":
            return (
                <>
                    <Pill label="ACCOUNT" icon={<ShieldCheck size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Security & Permissions</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Your data is private to your account. Only you (and team members you invite, if enabled) can view your
                        clients, requests, quotations, and invoices.
                    </p>
                </>
            );

        case "quotations":
            return (
                <>
                    <Pill label="QUOTATIONS" icon={<Receipt size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Creating Quotations</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Create a quotation by adding items, quantities, and prices. You can also include milestones/phases and a
                        deposit to match how you deliver work.
                    </p>
                </>
            );

        case "invoices":
            return (
                <>
                    <Pill label="INVOICES" icon={<Receipt size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Creating Invoices</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Invoices help you request payment clearly. Include your banking details, due dates, and any deposit terms if
                        needed.
                    </p>
                </>
            );

        case "templates":
            return (
                <>
                    <Pill label="BRANDING" icon={<Sparkles size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Templates & Branding</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Templates control the look and feel of your quotation and invoice PDFs. Keep it clean and consistent so your
                        documents look professional across every client.
                    </p>
                </>
            );

        case "client-directory":
            return (
                <>
                    <Pill label="CLIENTS" icon={<Users size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Client Directory</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Save client contact details and notes so you can move faster on repeat work. Tags help you group clients
                        (VIP, contractor, repeat customer, etc.).
                    </p>
                </>
            );

        case "quote-requests":
            return (
                <>
                    <Pill label="LEADS" icon={<ClipboardList size={14} />} />

                    <h1 style={{ fontSize: "40px", fontWeight: 800, marginBottom: 16 }}>Quote Requests</h1>

                    <p style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        Quote requests come from your public form. Open a request to view details and respond with a quotation.
                    </p>
                </>
            );

        default:
            return <div>Select an article from the sidebar to view documentation.</div>;
    }
};

export default DocsLayout;
