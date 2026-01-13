// src/components/BrandLink.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebaseConfig";

type BrandLinkProps = {
    text?: string;
};

const BrandLink: React.FC<BrandLinkProps> = ({ text = "CONTECH" }) => {
    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setCheckingAuth(false);
        });

        return () => unsub();
    }, []);

    // While Firebase is checking auth state, keep the link safe (landing page)
    const target = !checkingAuth && user ? "/dashboard" : "/";

    return (
        <Link
            to={target}
            style={{
                fontSize: "var(--font-size-2xl)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            aria-label="Go to home"
        >
            {text}
        </Link>
    );
};

export default BrandLink;
