// src/components/Topbar.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, query, collection, where } from "firebase/firestore";
import { LogOut, Bell, Settings } from "lucide-react";
import BrandLink from "./BrandLink";
import toast from "react-hot-toast";

interface UserBranding {
    companyName?: string;
    branding?: {
        logoUrl?: string | null;
    };
}

interface TopbarProps {
    isSidebarCollapsed?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ isSidebarCollapsed = false }) => {
    const [user, setUser] = useState<User | null>(null);
    const [branding, setBranding] = useState<UserBranding | null>(null);

    // ✅ Track branding load state so we can show app branding until data is ready
    const [brandingLoaded, setBrandingLoaded] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();

    const sidebarWidth = isSidebarCollapsed ? 70 : 260;

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        // Reset when user changes / logs out
        setBranding(null);
        setBrandingLoaded(false);
        setUnreadCount(0);

        if (!user) return;

        const userDocRef = doc(db, "users", user.uid);

        const unsubscribeBranding = onSnapshot(
            userDocRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data() as any;
                    setBranding({
                        companyName: data.companyName,
                        branding: data.branding,
                    });
                } else {
                    setBranding(null);
                }

                // ✅ branding snapshot returned at least once (loaded)
                setBrandingLoaded(true);
            },
            () => {
                // ✅ even if error, consider "loaded" so app doesn't hang on skeleton
                setBrandingLoaded(true);
                setBranding(null);
            }
        );

        const q = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
        const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => {
            unsubscribeBranding();
            unsubscribeNotifs();
        };
    }, [user]);

    const confirmLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error("Logout failed");
        } finally {
            setShowLogoutConfirm(false);
        }
    };

    // ✅ Consider custom branding available ONLY if loaded AND has logo or companyName
    const hasCustomBranding = brandingLoaded && !!(branding?.branding?.logoUrl && branding?.companyName);

    // ✅ If branding not loaded yet, or does not exist => show app branding
    const showAppBranding = !brandingLoaded || !hasCustomBranding;

    return (
        <>
            <header
                style={{
                    height: 64,
                    borderBottom: "1px solid var(--color-border)",
                    background: "var(--color-background)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",

                    position: "fixed",
                    top: 0,
                    right: 0,
                    left: sidebarWidth,
                    zIndex: 90,
                    transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center" }}>
                    {showAppBranding ? (
                        // ✅ App branding fallback while loading or if no branding
                        <BrandLink text="CONTECH" />
                    ) : (
                        // ✅ User branding after it has loaded
                        <Link
                            to="/"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                textDecoration: "none",
                                transition: "opacity 0.2s",
                            }}
                        >
                            {branding?.branding?.logoUrl && (
                                <img
                                    src={branding.branding.logoUrl}
                                    alt="Logo"
                                    style={{
                                        height: 32,
                                        width: "auto",
                                        maxWidth: 160,
                                        objectFit: "contain",
                                    }}
                                />
                            )}

                            {branding?.companyName && (
                                <span
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 16,
                                        color: "var(--color-text)",
                                        whiteSpace: "nowrap",
                                        letterSpacing: "-0.02em",
                                    }}
                                >
                  {branding.companyName}
                </span>
                            )}
                        </Link>
                    )}

                    {/* Optional: tiny loading hint next to app branding */}
                    {!brandingLoaded && user ? (
                        <span
                            style={{
                                marginLeft: 10,
                                fontSize: 12,
                                color: "var(--color-text-secondary)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                            title="Loading branding..."
                        >
              <span
                  style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      display: "inline-block",
                      opacity: 0.8,
                  }}
              />
              Loading...
            </span>
                    ) : null}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {user ? (
                        <>
                            <Link
                                to="/notifications"
                                style={{
                                    position: "relative",
                                    color: "var(--color-text-secondary)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 32,
                                    height: 32,
                                }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: -2,
                                            right: -2,
                                            background: "var(--color-primary)",
                                            color: "white",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            minWidth: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: "2px solid var(--color-background)",
                                        }}
                                    >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                                )}
                            </Link>

                            <Link
                                to="/profile"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    textDecoration: "none",
                                    fontSize: 13,
                                    color: "var(--color-text-secondary)",
                                    padding: "6px 12px",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 999,
                                }}
                            >
                                <Settings size={14} />
                                <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
                            </Link>

                            <button
                                className="btn btn-outline"
                                onClick={() => setShowLogoutConfirm(true)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                }}
                                type="button"
                            >
                                <LogOut size={14} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ textDecoration: "none", color: "var(--color-text)", fontSize: "14px", fontWeight: 500 }}>
                                Sign In
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "13px" }}>
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: "var(--color-background)",
                            borderRadius: 8,
                            padding: 24,
                            width: 320,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                        }}
                    >
                        <h3 style={{ marginBottom: 8 }}>Confirm Logout</h3>
                        <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Are you sure you want to log out?</p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                            <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)} type="button">
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmLogout} type="button">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Topbar;
