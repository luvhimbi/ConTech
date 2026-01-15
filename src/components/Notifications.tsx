// src/components/Notifications.tsx
import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    writeBatch
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

type Notification = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: any;
    type?: string;
};

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const currentUser = auth.currentUser;

    useEffect(() => {
        fetchNotifications();
    }, [currentUser]);

    const fetchNotifications = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, "users", currentUser.uid, "notifications"),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[];
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!currentUser) return;

        // Mark as read in UI immediately
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));

        // Mark as read in DB
        try {
            const notifRef = doc(db, "users", currentUser.uid, "notifications", notif.id);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Failed to mark read");
        }

        // Navigate if link exists
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const markAllRead = async () => {
        if (!currentUser) return;
        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) return;

        try {
            const batch = writeBatch(db);
            unread.forEach(n => {
                const ref = doc(db, "users", currentUser.uid, "notifications", n.id);
                batch.update(ref, { read: true });
            });
            await batch.commit();

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success("All marked as read");
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: 800, padding: "40px 20px" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, margin: 0 }}>Notifications</h1>
                {notifications.some(n => !n.read) && (
                    <button
                        className="btn btn-outline"
                        onClick={markAllRead}
                        style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
                {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
                        <Bell size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                                background: notif.read ? 'var(--color-surface)' : 'var(--color-background)',
                                border: `1px solid ${notif.read ? 'var(--color-border)' : 'var(--color-primary-light)'}`,
                                padding: 16,
                                borderRadius: 12,
                                cursor: 'pointer',
                                display: 'flex',
                                gap: 16,
                                position: 'relative',
                                transition: 'transform 0.1s',
                                opacity: notif.read ? 0.7 : 1
                            }}
                        >
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: notif.read ? '#f1f5f9' : '#e0f2fe',
                                color: notif.read ? '#64748b' : 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <MessageSquare size={20} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontWeight: notif.read ? 500 : 700, fontSize: 15 }}>
                                        {notif.title}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        {notif.createdAt?.toDate().toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                    {notif.message}
                                </p>
                            </div>

                            {!notif.read && (
                                <div style={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)'
                                }} />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;