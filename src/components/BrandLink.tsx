import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebaseConfig";

type BrandLinkProps = {
    text?: string;
    size?: "sm" | "md" | "lg";
};

const BrandLink: React.FC<BrandLinkProps> = ({
                                                 text = "CONTECH",
                                                 size = "md",
                                             }) => {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setCheckingAuth(false);
        });
        return () => unsub();
    }, []);

    const target = !checkingAuth && user ? "/dashboard" : "/";

    const dims = useMemo(() => {
        switch (size) {
            case "sm":
                return { box: 28, icon: 16, text: "0.95rem" };
            case "lg":
                return { box: 42, icon: 24, text: "1.25rem" };
            case "md":
            default:
                return { box: 34, icon: 20, text: "1.1rem" };
        }
    }, [size]);

    return (
        <Link
            to={target}
            aria-label="Go to home"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                textDecoration: "none",
                color: "var(--color-text)",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
            {/* Icon container */}
            <span
                aria-hidden
                style={{
                    width: dims.box,
                    height: dims.box,
                    borderRadius: "8px",
                    display: "grid",
                    placeItems: "center",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    flexShrink: 0,
                }}
            >
                {/* Simple geometric mark */}
                <svg
                    width={dims.icon}
                    height={dims.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x="5"
                        y="5"
                        width="14"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            </span>

            {/* Text */}
            <span
                style={{
                    fontSize: dims.text,
                    lineHeight: 1,
                }}
            >
                {text}
            </span>
        </Link>
    );
};

export default BrandLink;
