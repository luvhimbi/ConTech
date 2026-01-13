import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useToast } from "../contexts/ToastContext";
import { createClient, deleteClient, getUserClients, updateClient, type Client } from "../services/clientService";

const tagParse = (s: string) =>
    (s || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

const Clients: React.FC = () => {
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);

    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        address: "",
        phone: "",
        tags: "",
        notes: "",
        preferredContact: "",
        siteAccessRules: "",
    });

    const loadClients = async (uid: string) => {
        try {
            setLoading(true);
            const list = await getUserClients(uid);
            setClients(list);
        } catch (e: any) {
            showToast("Failed to load clients: " + (e?.message || "Unknown error"), "error");
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
            await loadClients(u.uid);
        });
        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        if (!s) return clients;

        return clients.filter((c) => {
            const hay = `${c.name} ${c.email} ${(c.tags || []).join(" ")}`.toLowerCase();
            return hay.includes(s);
        });
    }, [clients, search]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const name = form.name.trim();
        const email = form.email.trim();
        if (!name || !email) {
            showToast("Client name and email are required", "error");
            return;
        }

        // prevent same email duplicate (basic)
        const exists = clients.some((c) => (c.emailLower || "").toLowerCase() === email.toLowerCase());
        if (exists) {
            showToast("A client with this email already exists", "error");
            return;
        }

        setSaving(true);
        try {
            await createClient(user.uid, {
                name,
                email,
                address: form.address,
                phone: form.phone,
                tags: tagParse(form.tags),
                notes: form.notes,
                preferredContact: form.preferredContact,
                siteAccessRules: form.siteAccessRules,
            });

            showToast("Client created successfully!", "success");
            setForm({
                name: "",
                email: "",
                address: "",
                phone: "",
                tags: "",
                notes: "",
                preferredContact: "",
                siteAccessRules: "",
            });
            setShowForm(false);
            await loadClients(user.uid);
        } catch (e: any) {
            showToast("Failed to create client: " + (e?.message || "Unknown error"), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleQuickTag = async (client: Client, tag: string) => {
        if (!user || !client.id) return;
        const next = Array.from(new Set([...(client.tags || []), tag]));
        try {
            await updateClient(user.uid, client.id, { tags: next });
            showToast("Tag added", "success");
            await loadClients(user.uid);
        } catch (e: any) {
            showToast("Failed to update client: " + (e?.message || "Unknown error"), "error");
        }
    };

    const handleDelete = async (clientId: string) => {
        if (!user) return;
        if (!window.confirm("Delete this client?")) return;

        try {
            await deleteClient(user.uid, clientId);
            showToast("Client deleted", "success");
            await loadClients(user.uid);
        } catch (e: any) {
            showToast("Failed to delete client: " + (e?.message || "Unknown error"), "error");
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container"><p>Loading...</p></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-content">
                <div className="container"><p>Please log in to view clients.</p></div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 1200 }}>
                <div className="profile-header">
                    <h1 className="profile-title">Clients</h1>
                    <p className="profile-subtitle">Client directory, notes, tags, and history</p>
                </div>

                <div className="profile-section">
                    <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap", alignItems: "center" }}>
                        <input
                            className="form-control"
                            placeholder="Search clients (name, email, tag)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ minWidth: 260, flex: 1 }}
                        />

                        {!showForm ? (
                            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Client</button>
                        ) : (
                            <button className="btn btn-outline" onClick={() => setShowForm(false)} disabled={saving}>
                                Close Form
                            </button>
                        )}
                    </div>

                    {showForm && (
                        <div className="quotation-form-container" style={{ marginTop: "var(--spacing-lg)" }}>
                            <div className="quotation-form-header">
                                <h3 style={{ margin: 0, fontSize: "var(--font-size-xl)" }}>Create Client</h3>
                            </div>

                            <form onSubmit={handleCreate} className="quotation-form">
                                <div className="quotation-form-grid">
                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Client Info</h4>

                                        <div className="form-group">
                                            <label className="form-label">Name *</label>
                                            <input className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Email *</label>
                                            <input type="email" className="form-control" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input className="form-control" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Address</label>
                                            <input className="form-control" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} disabled={saving} />
                                        </div>
                                    </div>

                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">CRM Notes</h4>

                                        <div className="form-group">
                                            <label className="form-label">Tags (comma separated)</label>
                                            <input className="form-control" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} disabled={saving} placeholder="VIP, slow payer, urgent" />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Preferred Contact</label>
                                            <input className="form-control" value={form.preferredContact} onChange={(e) => setForm((p) => ({ ...p, preferredContact: e.target.value }))} disabled={saving} placeholder="WhatsApp / Email / Call" />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Site Access Rules</label>
                                            <textarea className="form-control" rows={3} value={form.siteAccessRules} onChange={(e) => setForm((p) => ({ ...p, siteAccessRules: e.target.value }))} disabled={saving} placeholder="Gate code, PPE required, check-in office..." />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} disabled={saving} placeholder="Client prefers morning visits, budget limits, etc" />
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "Creating..." : "Create Client"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div style={{ marginTop: "var(--spacing-2xl)" }}>
                        {filtered.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "var(--spacing-3xl) 0", color: "var(--color-text-secondary)" }}>
                                <p>No clients yet.</p>
                            </div>
                        ) : (
                            <div className="quotation-list">
                                {filtered.map((c) => (
                                    <div key={c.id} className="quotation-card">
                                        <div className="quotation-card-header">
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: "var(--font-size-lg)", marginBottom: "var(--spacing-xs)" }}>
                                                    {c.name}
                                                </h4>
                                                <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                                                    {c.email}
                                                </p>
                                                {c.tags?.length > 0 && (
                                                    <div style={{ marginTop: "var(--spacing-xs)", display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                        {c.tags.slice(0, 6).map((t, idx) => (
                                                            <span key={idx} className="quotation-status quotation-status-draft" style={{ fontSize: "10px" }}>
                                {t}
                              </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: "var(--spacing-xs)", flexWrap: "wrap" }}>
                                                <button className="btn btn-outline" onClick={() => handleQuickTag(c, "VIP")}>+ VIP</button>
                                                <button className="btn btn-outline" onClick={() => handleQuickTag(c, "urgent")}>+ urgent</button>
                                                <Link className="btn btn-primary" to={`/clients/${c.id}`}>Open</Link>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "var(--spacing-xs)", marginTop: "var(--spacing-md)", flexWrap: "wrap" }}>
                                            <button className="btn btn-outline" onClick={() => handleDelete(c.id!)}>🗑️ Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Clients;
