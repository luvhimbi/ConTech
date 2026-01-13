import React, { useEffect, useMemo, useState } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useToast } from "../contexts/ToastContext";
import { createLead, deleteLead, getUserLeads, updateLead, type Lead, type LeadStatus } from "../services/leadService";
import { getUserClients, type Client } from "../services/clientService";

const money = (n: number) => `R${(Number(n) || 0).toFixed(2)}`;

const columns: { key: LeadStatus; title: string }[] = [
    { key: "lead", title: "Leads" },
    { key: "quoted", title: "Quoted" },
    { key: "invoiced", title: "Invoiced" },
];

const Pipeline: React.FC = () => {
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);

    const [clients, setClients] = useState<Client[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        clientId: "",
        clientName: "",
        clientEmail: "",
        title: "",
        valueEstimate: 0,
        source: "",
        notes: "",
    });

    const loadAll = async (uid: string) => {
        try {
            setLoading(true);
            const [c, l] = await Promise.all([getUserClients(uid), getUserLeads(uid)]);
            setClients(c);
            setLeads(l);
        } catch (e: any) {
            showToast("Failed to load pipeline: " + (e?.message || "Unknown error"), "error");
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
            await loadAll(u.uid);
        });
        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const byColumn = useMemo(() => {
        const map: Record<LeadStatus, Lead[]> = { lead: [], quoted: [], invoiced: [] };
        (leads || []).forEach((l) => map[l.status || "lead"].push(l));
        return map;
    }, [leads]);

    const handleSelectClient = (clientId: string) => {
        setForm((p) => ({ ...p, clientId }));
        if (!clientId) return;

        const c = clients.find((x) => x.id === clientId);
        if (!c) return;

        setForm((p) => ({
            ...p,
            clientName: c.name,
            clientEmail: c.email,
        }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const title = form.title.trim();
        const clientName = form.clientName.trim();
        const clientEmail = form.clientEmail.trim();

        if (!title || !clientName || !clientEmail) {
            showToast("Title, client name and email are required", "error");
            return;
        }

        setSaving(true);
        try {
            await createLead(user.uid, {
                clientId: form.clientId || undefined,
                clientName,
                clientEmail,
                title,
                valueEstimate: Number(form.valueEstimate) || 0,
                source: form.source,
                notes: form.notes,
                status: "lead",
            });

            showToast("Lead created", "success");
            setForm({ clientId: "", clientName: "", clientEmail: "", title: "", valueEstimate: 0, source: "", notes: "" });
            setShowForm(false);
            await loadAll(user.uid);
        } catch (e: any) {
            showToast("Failed to create lead: " + (e?.message || "Unknown error"), "error");
        } finally {
            setSaving(false);
        }
    };

    const move = async (lead: Lead, status: LeadStatus) => {
        if (!user || !lead.id) return;
        try {
            await updateLead(user.uid, lead.id, { status });
            await loadAll(user.uid);
        } catch (e: any) {
            showToast("Failed to move item: " + (e?.message || "Unknown error"), "error");
        }
    };

    const remove = async (leadId: string) => {
        if (!user) return;
        if (!window.confirm("Delete this pipeline item?")) return;

        try {
            await deleteLead(user.uid, leadId);
            showToast("Deleted", "success");
            await loadAll(user.uid);
        } catch (e: any) {
            showToast("Failed to delete: " + (e?.message || "Unknown error"), "error");
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
                <div className="container"><p>Please log in.</p></div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 1200 }}>
                <div className="profile-header">
                    <h1 className="profile-title">Pipeline</h1>
                    <p className="profile-subtitle">Lead → Quote → Invoice</p>
                </div>

                <div className="profile-section">
                    {!showForm ? (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Lead</button>
                    ) : (
                        <div className="quotation-form-container">
                            <div className="quotation-form-header">
                                <h3 style={{ margin: 0, fontSize: "var(--font-size-xl)" }}>Create Lead</h3>
                                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)} disabled={saving}>
                                    Close
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="quotation-form">
                                <div className="quotation-form-grid">
                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Client</h4>

                                        <div className="form-group">
                                            <label className="form-label">Select saved client (optional)</label>
                                            <select
                                                className="form-control"
                                                value={form.clientId}
                                                onChange={(e) => handleSelectClient(e.target.value)}
                                                disabled={saving}
                                            >
                                                <option value="">-- Choose saved client --</option>
                                                {clients.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Name *</label>
                                            <input className="form-control" value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Email *</label>
                                            <input type="email" className="form-control" value={form.clientEmail} onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} disabled={saving} />
                                        </div>
                                    </div>

                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Opportunity</h4>

                                        <div className="form-group">
                                            <label className="form-label">Title *</label>
                                            <input className="form-control" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} disabled={saving} placeholder="e.g. Bathroom renovation" />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Value Estimate</label>
                                            <input type="number" className="form-control" value={form.valueEstimate} onChange={(e) => setForm((p) => ({ ...p, valueEstimate: Number(e.target.value) || 0 }))} disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Source</label>
                                            <input className="form-control" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} disabled={saving} placeholder="Referral / WhatsApp / Walk-in" />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} disabled={saving} />
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "Creating..." : "Create Lead"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div style={{ marginTop: "var(--spacing-2xl)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--spacing-lg)" }}>
                            {columns.map((col) => (
                                <div key={col.key} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--border-radius)", padding: "var(--spacing-md)" }}>
                                    <h3 style={{ marginTop: 0 }}>{col.title}</h3>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                                        {byColumn[col.key].length === 0 ? (
                                            <div style={{ color: "var(--color-text-secondary)" }}>No items</div>
                                        ) : (
                                            byColumn[col.key].map((l) => (
                                                <div key={l.id} style={{ border: "1px solid var(--color-border-light)", borderRadius: "var(--border-radius)", padding: "var(--spacing-md)" }}>
                                                    <div style={{ fontWeight: 700 }}>{l.title}</div>
                                                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                                                        {l.clientName} • {l.clientEmail}
                                                    </div>
                                                    <div style={{ marginTop: 6, fontWeight: 600 }}>{money(l.valueEstimate || 0)}</div>

                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "var(--spacing-sm)" }}>
                                                        {col.key !== "lead" && (
                                                            <button className="btn btn-outline" onClick={() => move(l, "lead")}>← Lead</button>
                                                        )}
                                                        {col.key !== "quoted" && (
                                                            <button className="btn btn-outline" onClick={() => move(l, "quoted")}>→ Quoted</button>
                                                        )}
                                                        {col.key !== "invoiced" && (
                                                            <button className="btn btn-outline" onClick={() => move(l, "invoiced")}>→ Invoiced</button>
                                                        )}

                                                        <button className="btn btn-outline" onClick={() => remove(l.id!)}>🗑️</button>
                                                    </div>

                                                    {/* Future: add buttons to actually create quotation / invoice */}
                                                    <div style={{ marginTop: 8, fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                                                        Next: add “Create Quotation” and “Convert to Invoice” actions.
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Pipeline;
