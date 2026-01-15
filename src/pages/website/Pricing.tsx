import React from "react";
import { Link } from "react-router-dom";
import { Check, HelpCircle } from "lucide-react";

const Pricing: React.FC = () => {
    // Reusable styles
    const cardBaseStyle: React.CSSProperties = {
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--border-radius)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-sm)",
        height: "100%",
    };

    return (
        <div style={{ width: "100%", overflowX: "hidden" }}>

            {/* --- HEADER --- */}
            <div className="container" style={{ maxWidth: 1200, padding: "80px 20px 60px", textAlign: "center" }}>
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
                    Early Access
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
                    Simple, transparent pricing.
                </h1>
                <p
                    style={{
                        margin: "0 auto",
                        color: "var(--color-text-secondary)",
                        fontSize: "20px",
                        lineHeight: 1.6,
                        maxWidth: 600,
                    }}
                >
                    Start completely free while we build the best tool for construction teams. No credit card required.
                </p>
            </div>

            {/* --- PRICING CARDS --- */}
            <div
                className="container"
                style={{
                    maxWidth: 1000,
                    padding: "0 20px 80px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "32px",
                        alignItems: "start",
                    }}
                >
                    {/* Free Tier (Active) */}
                    <div style={{ ...cardBaseStyle, border: "2px solid var(--color-primary)", transform: "scale(1.02)" }}>
                        <div style={{ marginBottom: "24px" }}>
                            <h3 style={{ margin: 0, fontSize: "24px", color: "var(--color-text-primary)" }}>Starter</h3>
                            <p style={{ margin: "8px 0 0", color: "var(--color-text-secondary)" }}>
                                Everything you need to get organized.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                            <span style={{ fontSize: "48px", fontWeight: 800, color: "var(--color-text-primary)" }}>R0</span>
                            <span style={{ color: "var(--color-text-muted)", fontSize: "16px" }}>/ month</span>
                        </div>

                        <div style={{ marginBottom: "32px", flex: 1 }}>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-secondary)" }}>
                                    <Check size={20} color="var(--color-primary)" /> Unlimited Projects
                                </li>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-secondary)" }}>
                                    <Check size={20} color="var(--color-primary)" /> Unlimited Clients
                                </li>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-secondary)" }}>
                                    <Check size={20} color="var(--color-primary)" /> Full Pipeline Access
                                </li>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-secondary)" }}>
                                    <Check size={20} color="var(--color-primary)" /> Basic Dashboard
                                </li>
                            </ul>
                        </div>

                        <Link to="/register" className="btn btn-primary" style={{ padding: "14px", textAlign: "center", fontSize: "16px", width: "100%" }}>
                            Create Free Account
                        </Link>
                        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                            Free forever for early adopters.
                        </div>
                    </div>

                    {/* Pro Tier (Placeholder) */}
                    <div style={{ ...cardBaseStyle, opacity: 0.8, background: "var(--color-surface-muted, #f9fafb)" }}>
                        <div style={{ marginBottom: "24px" }}>
                            <h3 style={{ margin: 0, fontSize: "24px", color: "var(--color-text-primary)" }}>Business</h3>
                            <p style={{ margin: "8px 0 0", color: "var(--color-text-secondary)" }}>
                                For growing teams with more needs.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                            <span style={{ fontSize: "48px", fontWeight: 800, color: "var(--color-text-muted)" }}>R--</span>
                        </div>

                        <div style={{ marginBottom: "32px", flex: 1 }}>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-muted)" }}>
                                    <Check size={20} /> Team Members (Coming Soon)
                                </li>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-muted)" }}>
                                    <Check size={20} /> Document Storage
                                </li>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-muted)" }}>
                                    <Check size={20} /> Advanced Exporting
                                </li>
                                <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--color-text-muted)" }}>
                                    <Check size={20} /> Priority Support
                                </li>
                            </ul>
                        </div>

                        <button className="btn btn-outline" style={{ padding: "14px", width: "100%", cursor: "not-allowed" }} disabled>
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>

            {/* --- FAQ SECTION --- */}
            <div style={{ borderTop: "1px solid var(--color-border)", padding: "80px 20px" }}>
                <div className="container" style={{ maxWidth: 800 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                        <HelpCircle size={28} color="var(--color-primary)" />
                        <h2 style={{ margin: 0, fontSize: "28px" }}>Common Questions</h2>
                    </div>

                    <div style={{ display: "grid", gap: "32px" }}>
                        <div>
                            <h4 style={{ fontSize: "18px", marginBottom: "8px" }}>Is it really free?</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                                Yes. We are currently in our "validation phase." You get full access to the tool for R0. In the future, we may introduce paid features, but early accounts will remain on a generous free tier.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: "18px", marginBottom: "8px" }}>Can I use it on my phone?</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                                Absolutely. CONTECH is a web app designed to work perfectly on mobile browsers (Chrome, Safari) so you can use it on the job site.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: "18px", marginBottom: "8px" }}>What happens to my data?</h4>
                            <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                                Your data is securely stored and linked only to your account. You can export your client list at any time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;