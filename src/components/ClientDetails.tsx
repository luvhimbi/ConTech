import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useToast } from "../contexts/ToastContext";
import { getUserClients, updateClient, type Client } from "../services/clientService";
import { getClientHistory, type ClientHistoryItem } from "../services/clientHistoryService";

const money = (n: number) => `R${(Number(n) || 0).toFixed(2)}`;

const ClientDetails: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const { showToast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [history, setHistory] = useState<ClientHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ✅ Include core client fields + CRM fields
    const [edit, setEdit] = useState({
        name: "",
        email: "",
        address: "",
        phone: "",

        tags: "",
        notes: "",
        preferredContact: "",
        siteAccessRules: "",
    });

    const load = async (uid: string) => {
        if (!clientId) return;

        try {
            setLoading(true);

            // You can optimize later with getClientById(), but this is fine for now
            const list = await getUserClients(uid);
            const c = list.find((x) => x.id === clientId) || null;
            setClient(c);

            // ✅ hydrate edit form
            setEdit({
                name: c?.name || "",
                email: c?.email || "",
                address: c?.address || "",
                phone: c?.phone || "",

                tags: (c?.tags || []).join(", "),
                notes: c?.notes || "",
                preferredContact: c?.preferredContact || "",
                siteAccessRules: c?.siteAccessRules || "",
            });

            // ✅ history: use emailLower (more consistent)
            const emailLower = (c?.emailLower || c?.email || "").toLowerCase().trim();
            if (emailLower) {
                const h = await getClientHistory(uid, emailLower);
                setHistory(h);
            } else {
                setHistory([]);
            }
        } catch (e: any) {
            showToast("Failed to load client: " + (e?.message || "Unknown error"), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (!u) {
                setLoading(false);
                return;
            }
            await load(u.uid);
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId]);

    const parsedTags = useMemo(() => {
        return (edit.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
    }, [edit.tags]);

    const handleSave = async () => {
        if (!user || !client?.id) return;

        // Basic validation
        if (!edit.name.trim()) {
            showToast("Client name is required.", "error");
            return;
        }
        if (!edit.email.trim()) {
            showToast("Client email is required.", "error");
            return;
        }

        setSaving(true);
        try {
            await updateClient(user.uid, client.id, {
                name: edit.name.trim(),
                email: edit.email.trim(),
                address: edit.address.trim(),
                phone: edit.phone.trim(),

                tags: parsedTags,
                notes: edit.notes,
                preferredContact: edit.preferredContact,
                siteAccessRules: edit.siteAccessRules,
            });

            showToast("Client updated", "success");
            await load(user.uid);
        } catch (e: any) {
            showToast("Failed to update client: " + (e?.message || "Unknown error"), "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Please log in.</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Client not found.</p>
                    <Link className="btn btn-primary" to="/clients">
                        Back to Clients
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 1200 }}>
                <div style={{ marginBottom: "var(--spacing-lg)" }}>
                    <Link
                        to="/clients"
                        style={{
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-secondary)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "var(--spacing-xs)",
                            marginBottom: "var(--spacing-md)",
                        }}
                    >
                        ← Back to Clients
                    </Link>
                </div>

                <div className="profile-header">
                    <h1 className="profile-title">{client.name}</h1>
                    <p className="profile-subtitle">{client.email}</p>
                </div>

                <div className="profile-section">
                    <div className="quotation-form-grid">
                        {/* ✅ LEFT: Client Info + CRM */}
                        <div className="quotation-form-section">
                            <h4 className="quotation-section-title">Client Information</h4>

                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input
                                    className="form-control"
                                    value={edit.name}
                                    onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input
                                    className="form-control"
                                    type="email"
                                    value={edit.email}
                                    onChange={(e) => setEdit((p) => ({ ...p, email: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    className="form-control"
                                    value={edit.phone}
                                    onChange={(e) => setEdit((p) => ({ ...p, phone: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={edit.address}
                                    onChange={(e) => setEdit((p) => ({ ...p, address: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div style={{ height: 1, background: "var(--color-border-light)", margin: "var(--spacing-lg) 0" }} />

                            <h4 className="quotation-section-title">CRM Notes</h4>

                            <div className="form-group">
                                <label className="form-label">Tags (comma separated)</label>
                                <input
                                    className="form-control"
                                    value={edit.tags}
                                    onChange={(e) => setEdit((p) => ({ ...p, tags: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Preferred Contact</label>
                                <input
                                    className="form-control"
                                    value={edit.preferredContact}
                                    onChange={(e) => setEdit((p) => ({ ...p, preferredContact: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Site Access Rules</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={edit.siteAccessRules}
                                    onChange={(e) => setEdit((p) => ({ ...p, siteAccessRules: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={edit.notes}
                                    onChange={(e) => setEdit((p) => ({ ...p, notes: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>

                            <div className="profile-actions">
                                <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>

                        {/* ✅ RIGHT: Client History */}
                        <div className="quotation-form-section">
                            <h4 className="quotation-section-title">Client History</h4>

                            {history.length === 0 ? (
                                <p style={{ color: "var(--color-text-secondary)" }}>
                                    No quotes or invoices yet for this client.
                                </p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                                    {history.map((h) => (
                                        <div
                                            key={`${h.type}-${h.id}`}
                                            style={{
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "var(--border-radius)",
                                                padding: "var(--spacing-md)",
                                                background: "var(--color-background)",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {h.type === "quotation" ? "Quotation" : "Invoice"}: {h.number}
                                                    </div>
                                                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                                                        {h.createdAt.toLocaleDateString()} • Status: {h.status}
                                                    </div>
                                                </div>

                                                <div style={{ fontWeight: 700 }}>{money(h.total)}</div>
                                            </div>

                                            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <Link className="btn btn-outline" to={`/projects/${h.projectId}`}>
                                                    Open Project
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: "var(--spacing-lg)" }}>
                                <Link className="btn btn-outline" to="/pipeline">
                                    View Pipeline →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClientDetails;
