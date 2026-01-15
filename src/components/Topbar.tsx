// src/components/Topbar.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig"; // Ensure db is imported
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Import Firestore functions
import { LogOut, LogIn, Bell } from "lucide-react";
import BrandLink from "./BrandLink";
import toast from "react-hot-toast";

const Topbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Listen for Notification Count (Only when logged in)
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const q = query(
            collection(db, "users", user.uid, "notifications"),
            where("read", "==", false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

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
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {user ? (
                    <>
                        {/* Notification Bell */}
                        <Link
                            to="/notifications"
                            style={{
                                position: 'relative',
                                color: 'var(--color-text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32
                            }}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    background: 'var(--color-primary)', // Or red
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    minWidth: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--color-background)'
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>

                        {/* User Email Badge */}
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