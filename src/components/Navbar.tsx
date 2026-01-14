// src/components/Navbar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import BrandLink from "./BrandLink";

import {
    User as UserIcon,
    LogOut,
    LogIn,
    UserPlus,
    Menu,
    X,
    Globe,
    BadgeInfo,
    Tag,
    Mail,
    Home,
} from "lucide-react";

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    useEffect(() => setMenuOpen(false), [location.pathname, user]);

    const handleLogout = () => {
        toast((t) => (
            <span>
                Are you sure you want to log out?
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button
                        className="btn btn-primary"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await signOut(auth);
                            navigate("/login");
                            toast.success("Logged out");
                        }}
                    >
                        Logout
                    </button>
                    <button className="btn btn-outline" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </button>
                </div>
            </span>
        ));
    };

    const baseLink: React.CSSProperties = {
        fontSize: "14px",
        color: "var(--color-text)",
        textDecoration: "none",
        padding: "8px 12px",
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s ease"
    };

    const navStyle = ({ isActive }: { isActive: boolean }) => ({
        ...baseLink,
        background: isActive ? "var(--color-border-light)" : "transparent",
        fontWeight: isActive ? 600 : 400,
    });

    const iconSize = { width: 16, height: 16, color: "var(--color-text-secondary)" };

    /* ---------------- SHARED/BASIC LINKS ---------------- */

    const BasicLinks = (
        <>
            <NavLink to="/" style={navStyle}>
                <Home style={iconSize} /> Home
            </NavLink>
            <NavLink to="/pricing" style={navStyle}>
                <Tag style={iconSize} /> Pricing
            </NavLink>
            <NavLink to="/contact" style={navStyle}>
                <Mail style={iconSize} /> Contact
            </NavLink>
        </>
    );

    return (
        <>
            <Toaster />

            <nav
                style={{
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid var(--color-border)",
                    background: "var(--color-background)",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                        <BrandLink text="CONTECH" />
                        <div className="navbar-desktop" style={{ display: "flex", gap: 4 }}>
                            {BasicLinks}
                        </div>
                    </div>

                    <div className="navbar-desktop" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {!user ? (
                            <>
                                <NavLink to="/login" style={navStyle}>
                                    <LogIn style={iconSize} /> Sign in
                                </NavLink>
                                <Link to="/register" className="btn btn-primary" style={{ height: "38px", display: "flex", alignItems: "center", gap: 8 }}>
                                    <UserPlus size={16} /> Get started
                                </Link>
                            </>
                        ) : (
                            <>
                                <NavLink to="/profile" style={navStyle} title="View Profile">
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        background: "var(--color-primary-light)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--color-primary)",
                                        fontSize: 12,
                                        fontWeight: 700
                                    }}>
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                                        {user.email}
                                    </span>
                                </NavLink>
                                <button className="btn btn-outline" onClick={handleLogout} style={{ height: "38px" }}>
                                    <LogOut size={16} /> Logout
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        className="btn btn-outline navbar-toggle"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{ padding: "8px" }}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {menuOpen && (
                <div style={{
                    position: "fixed",
                    top: "64px",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "var(--color-background)",
                    zIndex: 49,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                }}>
                    {BasicLinks}
                    <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: "10px 0" }} />
                    {!user ? (
                        <>
                            <Link to="/login" className="btn btn-outline" style={{ justifyContent: "center" }}>Sign in</Link>
                            <Link to="/register" className="btn btn-primary" style={{ justifyContent: "center" }}>Get started</Link>
                        </>
                    ) : (
                        <button className="btn btn-outline" onClick={handleLogout} style={{ justifyContent: "center" }}>Logout</button>
                    )}
                </div>
            )}

            <style>{`
                .navbar-toggle { display: none; }
                @media (max-width: 980px) {
                    .navbar-desktop { display: none !important; }
                    .navbar-toggle { display: inline-flex !important; }
                }
            `}</style>
        </>
    );
};

export default Navbar;