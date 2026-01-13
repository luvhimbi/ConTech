// src/components/Navbar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import BrandLink from "./BrandLink";

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Close menu when route changes (and after auth changes)
    useEffect(() => {
        setMenuOpen(false);
    }, [user]);

    // Close menu on ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const handleLogout = () => {
        toast(
            (t) => (
                <span>
          Are you sure you want to log out?
          <div
              style={{
                  marginTop: "var(--spacing-sm)",
                  display: "flex",
                  gap: "var(--spacing-xs)",
              }}
          >
            <button
                className="btn btn-primary"
                style={{ padding: "4px 12px", fontSize: "12px" }}
                onClick={async () => {
                    toast.dismiss(t.id);
                    await signOut(auth);
                    setMenuOpen(false);
                    navigate("/login");
                    toast.success("Successfully logged out");
                }}
            >
              Yes, Logout
            </button>
            <button
                className="btn btn-outline"
                style={{ padding: "4px 12px", fontSize: "12px" }}
                onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </span>
            ),
            {
                duration: 6000,
                position: "top-center",
            }
        );
    };

    const linkBaseStyle: React.CSSProperties = useMemo(
        () => ({
            fontSize: "var(--font-size-base)",
            color: "var(--color-text)",
            textDecoration: "none",
            padding: "8px 10px",
            borderRadius: "10px",
            transition: "all var(--transition-base)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
        }),
        []
    );

    const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
        ...linkBaseStyle,
        background: isActive ? "var(--color-border-light)" : "transparent",
    });

    const overlay = menuOpen ? (
        <div
            onClick={() => setMenuOpen(false)}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                zIndex: 40,
            }}
        />
    ) : null;

    return (
        <>
            <Toaster />
            {overlay}

            <nav
                style={{
                    borderBottom: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-background)",
                    padding: "var(--spacing-lg) 0",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div
                    className="container"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "var(--spacing-md)",
                    }}
                >
                    {/* Brand */}
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
                        <BrandLink text="CONTECH" />
                    </div>

                    {/* Desktop links */}
                    <div
                        className="navbar-desktop"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--spacing-xl)",
                        }}
                    >
                        {!user ? (
                            <>
                                <NavLink to="/login" style={navLinkStyle}>
                                    Sign In
                                </NavLink>
                                <Link to="/register" className="btn btn-outline">
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <>
                                <NavLink to="/dashboard" style={navLinkStyle}>
                                    Dashboard
                                </NavLink>
                                <NavLink to="/clients" style={navLinkStyle}>
                                    Clients
                                </NavLink>
                                <NavLink to="/projects" style={navLinkStyle}>
                                    Projects
                                </NavLink>
                                <NavLink to="/profile" style={navLinkStyle}>
                                    Profile
                                </NavLink>

                                <span
                                    style={{
                                        fontSize: "var(--font-size-base)",
                                        color: "var(--color-text-secondary)",
                                        maxWidth: 260,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                    title={user.email || ""}
                                >
                  {user.email}
                </span>

                                <button className="btn btn-outline" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle button */}
                    <button
                        type="button"
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((v) => !v)}
                        className="btn btn-outline navbar-toggle"
                        style={{
                            padding: "8px 10px",
                            display: "none",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
            <span
                style={{
                    display: "inline-block",
                    width: 18,
                    height: 2,
                    background: "var(--color-text)",
                    position: "relative",
                }}
            >
              <span
                  style={{
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: -6,
                      width: 18,
                      height: 2,
                      background: "var(--color-text)",
                  }}
              />
              <span
                  style={{
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 6,
                      width: 18,
                      height: 2,
                      background: "var(--color-text)",
                  }}
              />
            </span>
                    </button>
                </div>

                {/* Mobile dropdown */}
                <div
                    className="navbar-mobile"
                    style={{
                        display: menuOpen ? "block" : "none",
                        borderTop: "1px solid var(--color-border)",
                        background: "var(--color-background)",
                        position: "relative",
                        zIndex: 60,
                    }}
                >
                    <div className="container" style={{ paddingTop: "var(--spacing-md)", paddingBottom: "var(--spacing-md)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {!user ? (
                                <>
                                    <NavLink to="/login" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                                        Sign In
                                    </NavLink>

                                    <Link to="/register" className="btn btn-outline" onClick={() => setMenuOpen(false)}>
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <NavLink to="/dashboard" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                                        Dashboard
                                    </NavLink>
                                    <NavLink to="/projects" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                                        Projects
                                    </NavLink>
                                    <NavLink to="/profile" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
                                        Profile
                                    </NavLink>

                                    <div
                                        style={{
                                            padding: "8px 10px",
                                            borderRadius: "10px",
                                            border: "1px solid var(--color-border)",
                                            color: "var(--color-text-secondary)",
                                            fontSize: "var(--font-size-sm)",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                        title={user.email || ""}
                                    >
                                        {user.email}
                                    </div>

                                    <button
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            handleLogout();
                                        }}
                                        style={{ width: "fit-content" }}
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Responsive behavior using a tiny CSS block */}
            <style>{`
        /* Desktop default */
        .navbar-desktop { display: flex; }
        .navbar-toggle { display: none; }
        .navbar-mobile { display: none; }

        /* Mobile */
        @media (max-width: 860px) {
          .navbar-desktop { display: none !important; }
          .navbar-toggle { display: inline-flex !important; }
        }
      `}</style>
        </>
    );
};

export default Navbar;
