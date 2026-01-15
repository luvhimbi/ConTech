import React, { useEffect, useState } from "react";
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
    Check
} from "lucide-react";

// Reusable styles for consistent design
const sectionStyle: React.CSSProperties = {
    padding: "60px 0",
    borderBottom: "1px solid var(--color-border)",
};

const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--border-radius)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "var(--shadow-sm)",
};

const Home: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // ✅ Fix 1: Auth Listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setCheckingAuth(false);
        });

        return () => unsub();
    }, []);

    return (
        <div style={{ width: "100%", overflowX: "hidden" }}>

            {/* --- HERO SECTION --- */}
            <div className="container" style={{ maxWidth: 1200, padding: "80px 20px 60px" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "48px",
                        alignItems: "center",
                    }}
                >
                    {/* Left: Copy & CTA */}
                    <section>
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
                            Built for construction businesses
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
                            Manage projects, clients, and progress.
                        </h1>

                        <p
                            style={{
                                margin: "0 0 24px",
                                color: "var(--color-text-secondary)",
                                fontSize: "18px",
                                lineHeight: 1.6,
                                maxWidth: 540,
                            }}
                        >
                            CONTECH removes the chaos from your day-to-day. Track leads, manage active builds, and keep your client history organized in one simple dashboard.
                        </p>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            {checkingAuth ? (
                                <button className="btn btn-outline" style={{ padding: "12px 24px" }} disabled>
                                    Loading...
                                </button>
                            ) : user ? (
                                <Link to="/dashboard" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "16px" }}>
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "16px" }}>
                                        Get Started Free
                                    </Link>
                                    <Link to="/login" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: "16px" }}>
                                        Sign In
                                    </Link>
                                </>
                            )}

                            <Link to="/features" style={{ marginLeft: 8, textDecoration: "none", color: "var(--color-text-secondary)", fontSize: "15px" }}>
                                How it works &rarr;
                            </Link>
                        </div>

                        {/* Quick Benefits Tags */}
                        <div
                            style={{
                                marginTop: 32,
                                display: "flex",
                                gap: 20,
                                color: "var(--color-text-muted)",
                                fontSize: "13px",
                                fontWeight: 500,
                            }}
                        >
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Check size={16} /> Mobile Ready
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Check size={16} /> Offline Capable
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Check size={16} /> Instant Setup
                            </span>
                        </div>
                    </section>

                    {/* Right: Feature Highlights Card */}
                    <section>
                        <div
                            style={{
                                border: "1px solid var(--color-border)",
                                borderRadius: "16px",
                                background: "var(--color-surface)",
                                padding: "32px",
                                boxShadow: "var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.05))",
                            }}
                        >
                            <h3 style={{ margin: "0 0 20px", fontSize: "20px" }}>Everything you need</h3>

                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
                                <li style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    <div style={{ background: "var(--color-primary-light, #e0f2fe)", color: "var(--color-primary)", padding: "8px", borderRadius: "8px" }}>
                                        <FolderKanban size={20} />
                                    </div>
                                    <div>
                                        <strong style={{ display: "block", color: "var(--color-text-primary)", marginBottom: "4px" }}>Project Tracking</strong>
                                        <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.4, display: "block" }}>
                                            Keep detailed notes and status updates for every job.
                                        </span>
                                    </div>
                                </li>
                                <li style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    <div style={{ background: "var(--color-primary-light, #e0f2fe)", color: "var(--color-primary)", padding: "8px", borderRadius: "8px" }}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <strong style={{ display: "block", color: "var(--color-text-primary)", marginBottom: "4px" }}>Client Directory</strong>
                                        <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.4, display: "block" }}>
                                            Never lose a contact number or client history again.
                                        </span>
                                    </div>
                                </li>
                                <li style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    <div style={{ background: "var(--color-primary-light, #e0f2fe)", color: "var(--color-primary)", padding: "8px", borderRadius: "8px" }}>
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <strong style={{ display: "block", color: "var(--color-text-primary)", marginBottom: "4px" }}>Simple Pipeline</strong>
                                        <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.4, display: "block" }}>
                                            Move work from "Lead" to "In Progress" to "Paid".
                                        </span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>

            {/* --- VALUE PROPOSITION GRID --- */}
            <div style={{ ...sectionStyle, background: "var(--color-surface-muted, #f9fafb)" }}>
                <div className="container" style={{ maxWidth: 1200, padding: "0 20px" }}>
                    <div style={{ textAlign: "center", marginBottom: "40px" }}>
                        <h2 style={{ fontSize: "32px", letterSpacing: "-0.02em", marginBottom: "12px" }}>Why choose Contech?</h2>
                        <p style={{ color: "var(--color-text-secondary)" }}>Designed specifically for independent contractors and small teams.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                        {/* Card 1 */}
                        <div style={cardStyle}>
                            <div style={{ marginBottom: 4, color: "var(--color-primary)" }}>
                                <Zap size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: "18px" }}>Fast & Lightweight</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "15px", lineHeight: 1.5 }}>
                                No complex installation. It loads instantly in your browser, works on old phones, and uses minimal data.
                            </p>
                        </div>
                        {/* Card 2 */}
                        <div style={cardStyle}>
                            <div style={{ marginBottom: 4, color: "var(--color-primary)" }}>
                                <Smartphone size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: "18px" }}>Field Ready</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "15px", lineHeight: 1.5 }}>
                                Update project status from the job site. All data is synced when you get back online.
                            </p>
                        </div>
                        {/* Card 3 */}
                        <div style={cardStyle}>
                            <div style={{ marginBottom: 4, color: "var(--color-primary)" }}>
                                <ShieldCheck size={28} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: "18px" }}>Secure Data</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "15px", lineHeight: 1.5 }}>
                                Your client lists and financial notes are private to you. We use industry-standard encryption.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM CTA --- */}
            <div style={{ padding: "80px 20px", textAlign: "center" }}>
                <h2 style={{ fontSize: "clamp(28px, 4vw, 36px)", marginBottom: "16px" }}>Ready to get organized?</h2>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px", fontSize: "18px" }}>
                    Join other contractors managing their work better today.
                </p>
                {!user && (
                    <Link to="/register" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "18px" }}>
                        Create Free Account
                    </Link>
                )}
            </div>

            {/* --- FOOTER / NAV --- */}
            <div
                style={{
                    borderTop: "1px solid var(--color-border)",
                    padding: "40px 20px",
                    background: "var(--color-surface)",
                }}
            >
                <div
                    className="container"
                    style={{
                        maxWidth: 1200,
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "20px",
                    }}
                >
                    <div style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
                        &copy; {new Date().getFullYear()} CONTECH. All rights reserved.
                    </div>

                    <div style={{ display: "flex", gap: "24px" }}>
                        <Link to="/features" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                            Features
                        </Link>
                        <Link to="/why-us" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                            Why Us
                        </Link>
                        <Link to="/pricing" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                            Pricing
                        </Link>
                        <Link to="/contact" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: "14px" }}>
                            Contact
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;