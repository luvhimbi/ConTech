import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import {
    FolderKanban,
    Users,
    TrendingUp,
    Zap,
    Smartphone,
    ShieldCheck,
    Check,
    Receipt,
    Clock3,
    BadgeCheck,
    ArrowRight,
} from "lucide-react";

/**
 * Improvements made:
 * - Messaging now targets solo entrepreneurs, contractors, and small businesses who want to get paid.
 * - Added "Get paid faster" theme: invoices, follow-ups, proof of work, pipeline to paid.
 * - Better hierarchy, spacing, and consistent components with small reusable helpers.
 * - Still uses your CSS variables + bootstrap buttons (btn btn-primary / btn-outline).
 */

/* ---------------- reusable UI bits ---------------- */

const sectionBase: React.CSSProperties = {
    padding: "72px 0",
    borderBottom: "1px solid var(--color-border)",
};

const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    padding: "0 20px",
    margin: "0 auto",
};

const cardBase: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    boxShadow: "var(--shadow-sm)",
};

const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "var(--color-surface-active, #f0f4f8)",
    color: "var(--color-primary)",
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid var(--color-border)",
};

function FeatureRow({
                        icon,
                        title,
                        text,
                    }: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <li style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
                style={{
                    flex: "0 0 auto",
                    background: "var(--color-primary-light, #e0f2fe)",
                    color: "var(--color-primary)",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                }}
            >
                {icon}
            </div>
            <div>
                <strong
                    style={{
                        display: "block",
                        color: "var(--color-text-primary)",
                        marginBottom: 4,
                        fontSize: 15,
                    }}
                >
                    {title}
                </strong>
                <span
                    style={{
                        fontSize: 14,
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.45,
                        display: "block",
                    }}
                >
                    {text}
                </span>
            </div>
        </li>
    );
}

function StatChip({
                      icon,
                      label,
                  }: {
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "var(--shadow-xs, 0 2px 10px rgba(0,0,0,0.03))",
            }}
        >
            {icon}
            {label}
        </span>
    );
}

/* ---------------- page ---------------- */

const Home: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Auth listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setCheckingAuth(false);
        });
        return () => unsub();
    }, []);

    const primaryCta = useMemo(() => {
        if (checkingAuth) {
            return (
                <button className="btn btn-outline" style={{ padding: "12px 22px" }} disabled>
                    Loading...
                </button>
            );
        }

        if (user) {
            return (
                <Link
                    to="/dashboard"
                    className="btn btn-primary"
                    style={{ padding: "12px 22px", fontSize: 16, display: "inline-flex", gap: 10, alignItems: "center" }}
                >
                    Go to Dashboard <ArrowRight size={18} />
                </Link>
            );
        }

        return (
            <>
                <Link
                    to="/register"
                    className="btn btn-primary"
                    style={{ padding: "12px 22px", fontSize: 16, display: "inline-flex", gap: 10, alignItems: "center" }}
                >
                    Start Free <ArrowRight size={18} />
                </Link>
                <Link
                    to="/login"
                    className="btn btn-outline"
                    style={{ padding: "12px 22px", fontSize: 16 }}
                >
                    Sign In
                </Link>
            </>
        );
    }, [checkingAuth, user]);

    return (
        <div style={{ width: "100%", overflowX: "hidden" }}>
            {/* ---------------- HERO ---------------- */}
            <div
                style={{
                    padding: "84px 0 64px",
                    background:
                        "radial-gradient(1200px 600px at 20% 10%, rgba(59,130,246,0.10), transparent 55%), radial-gradient(900px 500px at 90% 30%, rgba(16,185,129,0.10), transparent 55%)",
                    borderBottom: "1px solid var(--color-border)",
                }}
            >
                <div style={containerStyle}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                            gap: 52,
                            alignItems: "center",
                        }}
                    >
                        {/* Left copy */}
                        <section>
                            <div style={{ marginBottom: 16 }}>
                                <span style={pillStyle}>
                                    <BadgeCheck size={16} />
                                    Built for solo entrepreneurs, contractors & small teams
                                </span>
                            </div>

                            <h1
                                style={{
                                    margin: "0 0 16px",
                                    fontSize: "clamp(36px, 5vw, 54px)",
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1.06,
                                    fontWeight: 900,
                                    color: "var(--color-text-primary)",
                                }}
                            >
                                Stay organized.
                                <br />
                                <span style={{ color: "var(--color-primary)" }}>Get paid faster.</span>
                            </h1>

                            <p
                                style={{
                                    margin: "0 0 26px",
                                    color: "var(--color-text-secondary)",
                                    fontSize: 18,
                                    lineHeight: 1.65,
                                    maxWidth: 620,
                                }}
                            >
                                CONTECH helps small businesses track leads, manage active jobs, and follow up on payments —
                                all from one simple dashboard. No messy WhatsApp threads. No lost invoices.
                            </p>

                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                {primaryCta}

                                <Link
                                    to="/features"
                                    style={{
                                        textDecoration: "none",
                                        color: "var(--color-text-secondary)",
                                        fontSize: 15,
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        gap: 8,
                                        alignItems: "center",
                                        padding: "10px 6px",
                                    }}
                                >
                                    See how it works <ArrowRight size={16} />
                                </Link>
                            </div>

                            {/* Trust / benefits chips */}
                            <div
                                style={{
                                    marginTop: 28,
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <StatChip icon={<Check size={16} />} label="Mobile ready" />
                                <StatChip icon={<Check size={16} />} label="Offline-friendly" />
                                <StatChip icon={<Check size={16} />} label="Fast setup" />
                                <StatChip icon={<Check size={16} />} label="Built for getting paid" />
                            </div>

                            <div
                                style={{
                                    marginTop: 14,
                                    color: "var(--color-text-muted)",
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                }}
                            >
                                Perfect for: builders, electricians, plumbers, designers, freelancers, agencies, and any small
                                team managing multiple clients.
                            </div>
                        </section>

                        {/* Right highlight card */}
                        <section>
                            <div
                                style={{
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 18,
                                    background: "var(--color-surface)",
                                    padding: 28,
                                    boxShadow: "var(--shadow-lg, 0 12px 34px rgba(0,0,0,0.06))",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                    <h3 style={{ margin: 0, fontSize: 20, letterSpacing: "-0.01em" }}>
                                        From lead → job → invoice → paid
                                    </h3>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 800,
                                            color: "var(--color-primary)",
                                            background: "var(--color-primary-light, #e0f2fe)",
                                            padding: "6px 10px",
                                            borderRadius: 999,
                                            border: "1px solid var(--color-border)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Simple workflow
                                    </span>
                                </div>

                                <p
                                    style={{
                                        margin: "10px 0 18px",
                                        color: "var(--color-text-secondary)",
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Keep your work in one place so you can follow up confidently and get paid without stress.
                                </p>

                                <ul
                                    style={{
                                        listStyle: "none",
                                        padding: 0,
                                        margin: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 18,
                                    }}
                                >
                                    <FeatureRow
                                        icon={<TrendingUp size={20} />}
                                        title="Pipeline that ends in “Paid”"
                                        text='Track every client from “Lead” to “In Progress” to “Invoice Sent” to “Paid”.'
                                    />
                                    <FeatureRow
                                        icon={<Receipt size={20} />}
                                        title="Invoices & payment follow-ups"
                                        text="Send invoices and keep a clear record of who owes you and when to follow up."
                                    />
                                    <FeatureRow
                                        icon={<FolderKanban size={20} />}
                                        title="Project notes & proof of work"
                                        text="Log progress, site notes, photos, and updates so clients trust the process."
                                    />
                                    <FeatureRow
                                        icon={<Users size={20} />}
                                        title="Client directory you can trust"
                                        text="Never lose contact details, job history, or important client info again."
                                    />
                                </ul>

                                <div
                                    style={{
                                        marginTop: 18,
                                        paddingTop: 18,
                                        borderTop: "1px solid var(--color-border)",
                                        display: "flex",
                                        gap: 10,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            gap: 8,
                                            alignItems: "center",
                                            fontSize: 13,
                                            color: "var(--color-text-secondary)",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <Clock3 size={16} /> Less admin
                                    </span>
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            gap: 8,
                                            alignItems: "center",
                                            fontSize: 13,
                                            color: "var(--color-text-secondary)",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <ShieldCheck size={16} /> Safer records
                                    </span>
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            gap: 8,
                                            alignItems: "center",
                                            fontSize: 13,
                                            color: "var(--color-text-secondary)",
                                            fontWeight: 700,
                                        }}
                                    >
                                        <Smartphone size={16} /> Works on-site
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* ---------------- VALUE GRID ---------------- */}
            <div style={{ ...sectionBase, background: "var(--color-surface-muted, #f9fafb)" }}>
                <div style={containerStyle}>
                    <div style={{ textAlign: "center", marginBottom: 42 }}>
                        <h2 style={{ fontSize: 34, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
                            Built for small teams that want to get paid
                        </h2>
                        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 16, lineHeight: 1.6 }}>
                            Less chaos. Better follow-ups. Clearer client communication.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 22,
                        }}
                    >
                        <div style={cardBase}>
                            <div style={{ color: "var(--color-primary)" }}>
                                <Zap size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18 }}>Fast & lightweight</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.55 }}>
                                Open it in your browser and start working. Great on low data, older phones, and slow networks.
                            </p>
                        </div>

                        <div style={cardBase}>
                            <div style={{ color: "var(--color-primary)" }}>
                                <Smartphone size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18 }}>Field-ready</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.55 }}>
                                Update job status on-site, capture notes, and sync when you’re back online.
                            </p>
                        </div>

                        <div style={cardBase}>
                            <div style={{ color: "var(--color-primary)" }}>
                                <ShieldCheck size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18 }}>Private & secure</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.55 }}>
                                Your client and job records stay private to your account with secure authentication.
                            </p>
                        </div>

                        <div style={cardBase}>
                            <div style={{ color: "var(--color-primary)" }}>
                                <Users size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18 }}>Better client communication</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.55 }}>
                                Keep a clean history of what was agreed, what changed, and what’s still outstanding.
                            </p>
                        </div>

                        <div style={cardBase}>
                            <div style={{ color: "var(--color-primary)" }}>
                                <FolderKanban size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18 }}>Clear job tracking</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.55 }}>
                                See every job at a glance: what’s pending, what’s active, and what needs attention today.
                            </p>
                        </div>

                        <div style={cardBase}>
                            <div style={{ color: "var(--color-primary)" }}>
                                <Receipt size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18 }}>Invoices that don’t get lost</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.55 }}>
                                Track invoices and follow-ups so cash flow is predictable and you spend less time chasing money.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------------- CTA ---------------- */}
            <div style={{ padding: "88px 20px", textAlign: "center" }}>
                <h2 style={{ fontSize: "clamp(30px, 4vw, 40px)", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
                    Turn your work into money — without the admin headache
                </h2>
                <p style={{ color: "var(--color-text-secondary)", margin: "0 auto 34px", fontSize: 18, lineHeight: 1.6, maxWidth: 760 }}>
                    Keep your pipeline clear, send invoices confidently, and follow up on time. Start free and set up in minutes.
                </p>

                {!checkingAuth && !user && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/register" className="btn btn-primary" style={{ padding: "14px 34px", fontSize: 18 }}>
                            Create Free Account
                        </Link>
                        <Link to="/pricing" className="btn btn-outline" style={{ padding: "14px 34px", fontSize: 18 }}>
                            View Pricing
                        </Link>
                    </div>
                )}

                {!checkingAuth && user && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Link
                            to="/dashboard"
                            className="btn btn-primary"
                            style={{ padding: "14px 34px", fontSize: 18, display: "inline-flex", gap: 10, alignItems: "center" }}
                        >
                            Go to Dashboard <ArrowRight size={18} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ---------------- FOOTER ---------------- */}
            <div
                style={{
                    borderTop: "1px solid var(--color-border)",
                    padding: "42px 20px",
                    background: "var(--color-surface)",
                }}
            >
                <div
                    style={{
                        ...containerStyle,
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 18,
                        alignItems: "center",
                    }}
                >
                    <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                        &copy; {new Date().getFullYear()} CONTECH. Built for contractors & small businesses.
                    </div>

                    <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                        <Link to="/features" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: 14 }}>
                            Features
                        </Link>
                        <Link to="/why-us" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: 14 }}>
                            Why CONTECH
                        </Link>
                        <Link to="/pricing" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: 14 }}>
                            Pricing
                        </Link>
                        <Link to="/contact" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: 14 }}>
                            Contact
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
