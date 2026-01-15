// src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import BrandLink from "./BrandLink";

import {
    LayoutDashboard,
    LogOut,
    LogIn,
    UserPlus,
    Menu,
    X,
    Tag,
    Mail,
    Zap,
    HelpCircle,
} from "lucide-react";

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Listen to Auth State
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    // Close mobile menu on route change
    useEffect(() => setMenuOpen(false), [location.pathname]);

    // Logout Handler
    const handleLogout = () => {
        toast((t) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontWeight: 500 }}>Log out of your account?</span>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        className="btn btn-primary"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await signOut(auth);
                            navigate("/login");
                            toast.success("See you soon!");
                        }}
                        style={{ padding: "8px 16px", fontSize: 13 }}
                    >
                        Confirm
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => toast.dismiss(t.id)}
                        style={{ padding: "8px 16px", fontSize: 13 }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 4000 });
    };

    // --- STYLES ---
    const navHeight = "64px";

    const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
        textDecoration: "none",
        color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
        fontWeight: isActive ? 600 : 500,
        fontSize: "14px",
        padding: "8px 12px",
        borderRadius: "8px",
        background: isActive ? "var(--color-primary-light)" : "transparent",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    });

    const iconProps = { size: 16 };

    return (
        <>
            <Toaster position="top-center" />

            <nav
                style={{
                    height: navHeight,
                    borderBottom: "1px solid var(--color-border)",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div
                    className="container"
                    style={{
                        maxWidth: 1200,
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 20px"
                    }}
                >
                    {/* LEFT: Brand + Desktop Links */}
                    <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                        <BrandLink text="CONTECH" />

                        {/* Desktop Navigation */}
                        <div className="navbar-desktop" style={{ display: "flex", gap: "4px" }}>
                            {/* Show Dashboard if logged in */}
                            {user && (
                                <NavLink to="/dashboard" style={navLinkStyle}>
                                    <LayoutDashboard {...iconProps} /> Dashboard
                                </NavLink>
                            )}

                            <NavLink to="/features" style={navLinkStyle}>
                                <Zap {...iconProps} /> Features
                            </NavLink>
                            <NavLink to="/why-us" style={navLinkStyle}>
                                <HelpCircle {...iconProps} /> Why Us
                            </NavLink>
                            <NavLink to="/pricing" style={navLinkStyle}>
                                <Tag {...iconProps} /> Pricing
                            </NavLink>
                            <NavLink to="/contact" style={navLinkStyle}>
                                <Mail {...iconProps} /> Contact
                            </NavLink>
                        </div>
                    </div>

                    {/* RIGHT: Auth Actions */}
                    <div className="navbar-desktop" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {!user ? (
                            <>
                                <NavLink to="/login" style={{ ...navLinkStyle({ isActive: false }), color: "var(--color-text-primary)" }}>
                                    <LogIn {...iconProps} /> Sign in
                                </NavLink>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                    style={{
                                        height: "36px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "0 16px",
                                        fontSize: "14px"
                                    }}
                                >
                                    <UserPlus size={16} /> Get started
                                </Link>
                            </>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                {/* User Badge */}
                                <Link
                                    to="/profile"
                                    title="Account Settings"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        textDecoration: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    <div style={{ textAlign: "right", lineHeight: 1.2 }}>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                            My Account
                                        </div>
                                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                                            {user.email}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: "var(--color-primary)",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: "14px"
                                    }}>
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                </Link>

                                {/* Logout Icon Button */}
                                <button
                                    className="btn btn-outline"
                                    onClick={handleLogout}
                                    title="Logout"
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid var(--color-border)"
                                    }}
                                >
                                    <LogOut size={16} color="var(--color-text-secondary)" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MOBILE TOGGLE */}
                    <button
                        className="btn btn-outline navbar-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            padding: "8px",
                            display: "none", // Hidden by default, shown via CSS
                            height: "36px",
                            width: "36px",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* --- MOBILE MENU OVERLAY --- */}
            {menuOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: navHeight,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "var(--color-background)",
                        zIndex: 99,
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        overflowY: "auto"
                    }}
                >
                    {user && (
                        <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Signed in as</div>
                            <div style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>{user.email}</div>
                            <Link
                                to="/dashboard"
                                className="btn btn-primary"
                                style={{ marginTop: "12px", width: "100%", justifyContent: "center", display: "flex" }}
                                onClick={() => setMenuOpen(false)}
                            >
                                <LayoutDashboard size={18} style={{ marginRight: 8 }} /> Open Dashboard
                            </Link>
                        </div>
                    )}

                    <NavLink to="/features" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                        <Zap {...iconProps} /> Features
                    </NavLink>
                    <NavLink to="/why-us" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                        <HelpCircle {...iconProps} /> Why Us
                    </NavLink>
                    <NavLink to="/pricing" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                        <Tag {...iconProps} /> Pricing
                    </NavLink>
                    <NavLink to="/contact" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                        <Mail {...iconProps} /> Contact
                    </NavLink>

                    <hr style={{ width: "100%", border: 0, borderTop: "1px solid var(--color-border)", margin: "16px 0" }} />

                    {!user ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <Link to="/login" className="btn btn-outline" style={{ justifyContent: "center", padding: "12px" }} onClick={() => setMenuOpen(false)}>
                                Sign in
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{ justifyContent: "center", padding: "12px" }} onClick={() => setMenuOpen(false)}>
                                Get started
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <Link to="/profile" className="btn btn-outline" style={{ justifyContent: "center", padding: "12px" }} onClick={() => setMenuOpen(false)}>
                                Account Settings
                            </Link>
                            <button className="btn btn-outline" onClick={() => { handleLogout(); setMenuOpen(false); }} style={{ justifyContent: "center", padding: "12px", color: "var(--color-danger)" }}>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* CSS for responsive hiding/showing */}
            <style>{`
                @media (max-width: 980px) {
                    .navbar-desktop { display: none !important; }
                    .navbar-toggle { display: flex !important; }
                }
                @media (min-width: 981px) {
                    .navbar-toggle { display: none !important; }
                }
            `}</style>
        </>
    );
};

export default Navbar;