// src/hooks/useNotifications.tsx
import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebaseConfig";
import toast from "react-hot-toast";

export const useNotifications = () => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
        Notification.permission
    );

    // 1. Function to request permission (Call this on button click)
    const enableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === "granted") {
                const token = await getToken(messaging, {
                    // Your VAPID Key
                    vapidKey: "BAqED5y8Z-7Wk2tj-WXUOMDXjN9kNb_MBWbYvn6ah-Z_Fd7PfCdVmpcyhK_4wWhSmaYO3I4FYQ_7smac8iTN6fQ"
                });

                if (token) {
                    console.log("FCM Token:", token);
                    setFcmToken(token);
                    // TODO: Save token to Firestore here
                }
            } else {
                toast.error("Notifications denied. Please enable them in browser settings.");
            }
        } catch (error) {
            console.error("Error getting permission:", error);
            toast.error("Failed to enable notifications.");
        }
    };

    // 2. Listen for messages (Only if permission is already granted)
    useEffect(() => {
        if (permissionStatus === "granted") {
            // If already granted, ensure we have the token
            if (!fcmToken) enableNotifications();

            const unsubscribe = onMessage(messaging, (payload) => {
                console.log("Foreground Message:", payload);
                toast.custom((t) => (
                    <div
                        style={{
                            background: "white",
                            padding: "16px",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            border: "1px solid #eee",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            maxWidth: "350px",
                            opacity: t.visible ? 1 : 0,
                            transition: "opacity 0.2s ease-in-out",
                            pointerEvents: "auto"
                        }}
                    >
                        <div style={{ fontSize: "20px" }}>🔔</div>
                        <div>
                            <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#111" }}>
                                {payload.notification?.title}
                            </div>
                            <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.4" }}>
                                {payload.notification?.body}
                            </div>
                        </div>
                    </div>
                ), { duration: 5000 });
            });

            return () => unsubscribe();
        }
    }, [permissionStatus]); // Re-run when status changes

    return { fcmToken, permissionStatus, enableNotifications };
};