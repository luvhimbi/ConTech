import React from "react";
import { Link } from "react-router-dom";

const Pricing: React.FC = () => {
    return (
        <div className="container" style={{ maxWidth: 1200, padding: "48px 0" }}>
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.02em" }}>Pricing</h1>
            <p style={{ marginTop: 8, color: "var(--color-text-secondary)", maxWidth: 680 }}>
                Start simple. You can adjust pricing later. For now, keep it clear and easy to understand.
            </p>

            <div
                style={{
                    marginTop: 18,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--border-radius)",
                    background: "var(--color-background)",
                    padding: "var(--spacing-xl)",
                    boxShadow: "var(--shadow-sm)",
                    maxWidth: 520,
                }}
            >
                <div style={{ fontWeight: 700, fontSize: "var(--font-size-lg)" }}>Starter</div>
                <div style={{ marginTop: 8, color: "var(--color-text-secondary)" }}>
                    Perfect for small teams managing a few active jobs.
                </div>

                <div style={{ marginTop: 14, fontSize: "32px", fontWeight: 800 }}>R0</div>
                <div style={{ marginTop: 4, color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
                    Launch as free while you validate the product.
                </div>

                <ul style={{ marginTop: 14, paddingLeft: 18, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                    <li>Projects</li>
                    <li>Clients</li>
                    <li>Pipeline</li>
                    <li>Basic dashboard</li>
                </ul>

                <div style={{ marginTop: 16 }}>
                    <Link to="/register" className="btn btn-primary" style={{ padding: "10px 14px" }}>
                        Create account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
