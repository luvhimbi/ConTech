import React from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

type OfflineBannerProps = {
    /** Height of your fixed top navbar in px. Example: 64 */
    topOffsetPx?: number;

    /** Ensure it renders above navbar/sidebar */
    zIndex?: number;
};

const OfflineBanner: React.FC<OfflineBannerProps> = ({
                                                         topOffsetPx = 0,
                                                         zIndex = 99999,
                                                     }) => {
    const isOnline = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: "fixed",
                top: topOffsetPx,
                left: 0,
                right: 0,
                width: "100%",
                zIndex,
                padding: "10px 12px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                textAlign: "center",

                // optional: small shadow so it’s visible over content
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
        >
            You’re offline. Changes will sync when you reconnect.
        </div>
    );
};

export default OfflineBanner;
