// ✅ Fix 1: Your Home page uses `auth.currentUser` ONCE.
// That won’t re-render when auth state changes.
// Use onAuthStateChanged so the CTA updates and routing behaves correctly.

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebaseConfig";

const Home: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setCheckingAuth(false);
        });

        return () => unsub();
    }, []);

    return (
        <div className="container" style={{ maxWidth: 1200, padding: "48px 0" }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: "var(--spacing-xl)",
                    alignItems: "center",
                }}
            >
                {/* Left */}
                <section style={{ gridColumn: "span 6", minWidth: 280 }}>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                        Built for small to medium construction businesses
                    </p>

                    <h1
                        style={{
                            margin: "10px 0 0",
                            fontSize: "clamp(30px, 4vw, 44px)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                        }}
                    >
                        Manage projects, clients, and work progress in one place.
                    </h1>

                    <p
                        style={{
                            margin: "14px 0 0",
                            color: "var(--color-text-secondary)",
                            fontSize: "var(--font-size-md)",
                            maxWidth: 560,
                        }}
                    >
                        CONTECH helps you stay organized: project tracking, client management, and a simple pipeline to move work from lead to quote to invoice.
                    </p>

                    <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {checkingAuth ? (
                            <button className="btn btn-outline" style={{ padding: "10px 14px" }} disabled>
                                Checking session...
                            </button>
                        ) : user ? (
                            <Link to="/dashboard" className="btn btn-primary" style={{ padding: "10px 14px" }}>
                                Open dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary" style={{ padding: "10px 14px" }}>
                                    Get started
                                </Link>
                                <Link to="/login" className="btn btn-outline" style={{ padding: "10px 14px" }}>
                                    Sign in
                                </Link>
                            </>
                        )}

                        <Link to="/features" className="btn btn-outline" style={{ padding: "10px 14px" }}>
                            View features
                        </Link>

                        {/* ✅ New page link */}
                        <Link to="/why-us" className="btn btn-outline" style={{ padding: "10px 14px" }}>
                            Why us
                        </Link>
                    </div>

                    <div
                        style={{
                            marginTop: 22,
                            display: "flex",
                            gap: 14,
                            flexWrap: "wrap",
                            color: "var(--color-text-muted)",
                            fontSize: "var(--font-size-xs)",
                        }}
                    >
                        <span style={{ border: "1px solid var(--color-border)", padding: "6px 10px", borderRadius: 999 }}>
                            Simple setup
                        </span>
                        <span style={{ border: "1px solid var(--color-border)", padding: "6px 10px", borderRadius: 999 }}>
                            Works on mobile
                        </span>
                        <span style={{ border: "1px solid var(--color-border)", padding: "6px 10px", borderRadius: 999 }}>
                            Offline ready
                        </span>
                    </div>
                </section>

                {/* Right */}
                <section style={{ gridColumn: "span 6", minWidth: 280 }}>
                    <div
                        style={{
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--border-radius)",
                            background: "var(--color-surface)",
                            padding: "var(--spacing-xl)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>What you get</div>

                        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
                            <li>Project list with status & notes</li>
                            <li>Client directory (history and tags)</li>
                            <li>Pipeline stages to track work progress</li>
                            <li>Business settings for billing info</li>
                        </ul>

                        <div style={{ marginTop: 16, borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                Tip: Start with one active project and keep updating progress weekly.
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ✅ Optional: add a small secondary nav so user can reach all website pages */}
            <div
                style={{
                    marginTop: 28,
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: 18,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                <Link to="/features" style={{ textDecoration: "none", color: "var(--color-text-secondary)" }}>
                    Features
                </Link>
                <Link to="/why-us" style={{ textDecoration: "none", color: "var(--color-text-secondary)" }}>
                    Why us
                </Link>
                <Link to="/pricing" style={{ textDecoration: "none", color: "var(--color-text-secondary)" }}>
                    Pricing
                </Link>
                <Link to="/contact" style={{ textDecoration: "none", color: "var(--color-text-secondary)" }}>
                    Contact
                </Link>
            </div>
        </div>
    );
};

export default Home;
