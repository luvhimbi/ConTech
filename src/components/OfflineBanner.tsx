import React from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

const OfflineBanner: React.FC = () => {
    const isOnline = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div
            style={{
                padding: "8px 12px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                borderRadius: "var(--border-radius)",
                marginBottom: "var(--spacing-md)",
                fontSize: "var(--font-size-sm)",
            }}
        >
            You’re offline. Changes will sync when you reconnect.
        </div>
    );
};

export default OfflineBanner;
