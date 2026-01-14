import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { LogOut, LogIn } from "lucide-react";
import BrandLink from "./BrandLink";
import toast from "react-hot-toast";

const Topbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error("Logout failed");
        }
    };

    return (
        <header
            style={{
                height: 56,
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-background)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                position: "sticky",
                top: 0,
                zIndex: 100,
            }}
        >
            {/* Brand */}
            <BrandLink text="CONTECH" />

            {/* Conditional User Section */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {user ? (
                    <>
                        {/* Shown when Logged In */}
                        <span
                            style={{
                                fontSize: 13,
                                color: "var(--color-text-secondary)",
                                padding: "6px 12px",
                                border: "1px solid var(--color-border)",
                                borderRadius: 999,
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                            title={user.email || ""}
                        >
                            {user.email}
                        </span>

                        <button
                            className="btn btn-outline"
                            onClick={handleLogout}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                fontSize: "13px"
                            }}
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        {/* Shown when Logged Out */}
                        <Link
                            to="/login"
                            style={{
                                textDecoration: 'none',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            Sign In
                        </Link>

                        <Link
                            to="/register"
                            className="btn btn-primary"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 16px",
                                fontSize: "13px"
                            }}
                        >
                            <LogIn size={14} />
                            Get Started
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Topbar;