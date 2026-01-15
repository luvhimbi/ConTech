import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useToast } from "../contexts/ToastContext";
import {
    createClient,
    deleteClient,
    getUserClients,
    type Client
} from "../services/clientService";
import {
    Search,
    UserPlus,
    Mail,
    Phone,
    MapPin,
    Trash2,
    ExternalLink,
    Loader2,
    X,
    Shield
} from "lucide-react";

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

    // ✅ Pagination
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // RESTORED: Your original form logic
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
            showToast("Failed to load clients", "error");
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

    // ✅ Pagination derived values (works on filtered list)
    const totalClients = filtered.length;

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalClients / pageSize));
    }, [totalClients, pageSize]);

    const paginatedClients = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    // keep page valid
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
        if (page < 1) setPage(1);
    }, [page, totalPages]);

    // reset to page 1 when search/pageSize changes
    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    // RESTORED: Your full submission logic
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const name = form.name.trim();
        const email = form.email.trim();
        if (!name || !email) {
            showToast("Name and email are required", "error");
            return;
        }

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
            showToast("Failed to create client", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (clientId: string) => {
        if (!user || !window.confirm("Delete this client?")) return;
        try {
            await deleteClient(user.uid, clientId);
            showToast("Client deleted", "success");
            await loadClients(user.uid);
        } catch (e: any) {
            showToast("Failed to delete client", "error");
        }
    };

    if (loading) {
        return (
            <div style={loaderWrapper}>
                <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 1400 }}>
                {/* Dashboard Header */}
                <div style={headerLayout}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#1e293b" }}>Client Directory</h1>
                        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                            Manage {filtered.length} business contacts
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={searchWrapper}>
                            <Search size={18} style={searchIcon} />
                            <input
                                className="form-control"
                                placeholder="Search directory..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={searchInput}
                            />
                        </div>

                        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={addBtn}>
                            <UserPlus size={18} /> New Client
                        </button>
                    </div>
                </div>

                {/* SLIDE-OVER DRAWER: Full Logic Restored */}
                {showForm && (
                    <div style={drawerOverlay}>
                        <div style={drawerContent}>
                            <div style={drawerHeader}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 20 }}>Add New Client</h3>
                                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Enter full details to update your CRM</p>
                                </div>
                                <button onClick={() => setShowForm(false)} style={closeBtn}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} style={drawerBody}>
                                <div style={formSection}>
                                    <h4 style={sectionTitle}>Primary Contact</h4>

                                    <div className="form-group">
                                        <label className="form-label">Client Name *</label>
                                        <input
                                            className="form-control"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email Address *</label>
                                        <input
                                            className="form-control"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input
                                                className="form-control"
                                                value={form.phone}
                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Pref. Contact</label>
                                            <input
                                                className="form-control"
                                                placeholder="WhatsApp"
                                                value={form.preferredContact}
                                                onChange={(e) => setForm({ ...form, preferredContact: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Office/Site Address</label>
                                        <input
                                            className="form-control"
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={formSection}>
                                    <h4 style={sectionTitle}>CRM & Site Logistics</h4>

                                    <div className="form-group">
                                        <label className="form-label">Tags (comma separated)</label>
                                        <input
                                            className="form-control"
                                            placeholder="VIP, Contractor, Late-Payer"
                                            value={form.tags}
                                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Site Access Rules</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            placeholder="Gate codes, PPE requirements..."
                                            value={form.siteAccessRules}
                                            onChange={(e) => setForm({ ...form, siteAccessRules: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Internal Notes</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={drawerFooter}>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                                        Cancel
                                    </button>

                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                                        {saving ? "Saving..." : "Create Client Profile"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* HIGH-DENSITY TABLE */}
                <div style={tableWrapper}>
                    <table style={tableStyle}>
                        <thead>
                        <tr style={tableHeaderRow}>
                            <th style={thStyle}>Client</th>
                            <th style={thStyle}>Contact Details</th>
                            <th style={thStyle}>Tags</th>
                            <th style={thStyle}>Site Details</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>Manage</th>
                        </tr>
                        </thead>

                        <tbody>
                        {paginatedClients.map((c) => (
                            <tr key={c.id} className="client-row" style={trStyle}>
                                <td style={tdStyle}>
                                    <Link to={`/clients/${c.id}`} style={nameLink}>
                                        <div style={avatarStyle}>{c.name.charAt(0)}</div>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 700 }}>{c.name}</span>
                                            <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
                                                    ID: {c.id?.slice(-6)}
                                                </span>
                                        </div>
                                    </Link>
                                </td>

                                <td style={tdStyle}>
                                    <div style={contactStack}>
                                        <div style={contactLine}>
                                            <Mail size={12} /> {c.email}
                                        </div>
                                        {c.phone && (
                                            <div style={contactLine}>
                                                <Phone size={12} /> {c.phone}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                <td style={tdStyle}>
                                    <div style={tagStack}>
                                        {c.tags?.slice(0, 2).map((t, i) => (
                                            <span key={i} style={miniTag}>
                                                    {t}
                                                </span>
                                        ))}
                                        {c.tags && c.tags.length > 2 && <span style={moreTags}>+{c.tags.length - 2}</span>}
                                    </div>
                                </td>

                                <td style={tdStyle}>
                                    <div style={siteCell}>
                                        {c.address ? (
                                            <div style={contactLine}>
                                                <MapPin size={12} /> {c.address.slice(0, 25)}...
                                            </div>
                                        ) : (
                                            <span style={{ color: "#cbd5e1", fontSize: 12 }}>No address</span>
                                        )}

                                        {c.siteAccessRules && (
                                            <div style={contactLine}>
                                                <Shield size={12} color="#10b981" /> Access Rules Set
                                            </div>
                                        )}
                                    </div>
                                </td>

                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    <div style={actionRow}>
                                        <button onClick={() => handleDelete(c.id!)} style={iconBtn} className="del-btn" type="button">
                                            <Trash2 size={16} />
                                        </button>
                                        <Link to={`/clients/${c.id}`} style={iconBtn}>
                                            <ExternalLink size={16} />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {paginatedClients.length === 0 && (
                            <tr>
                                <td style={{ ...tdStyle, padding: "30px 20px", textAlign: "center", color: "#94a3b8" }} colSpan={5}>
                                    No clients found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* ✅ Pagination Controls */}
                {filtered.length > 0 && (
                    <div
                        style={{
                            marginTop: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        {/* Page size */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>Rows per page:</span>
                            <select
                                className="form-control"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                                style={{ width: 120, fontSize: 14, height: 40, borderRadius: 10 }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Info */}
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                            Showing <strong>{totalClients === 0 ? 0 : (page - 1) * pageSize + 1}</strong> to{" "}
                            <strong>{Math.min(page * pageSize, totalClients)}</strong> of <strong>{totalClients}</strong>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                style={{ fontSize: 12, padding: "6px 12px" }}
                                type="button"
                            >
                                ← Prev
                            </button>

                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const p = idx + 1;

                                    const isEdge = p === 1 || p === totalPages;
                                    const isNear = Math.abs(p - page) <= 1;

                                    if (!isEdge && !isNear) return null;

                                    return (
                                        <button
                                            key={p}
                                            className={page === p ? "btn btn-primary" : "btn btn-outline"}
                                            onClick={() => setPage(p)}
                                            style={{
                                                fontSize: 12,
                                                padding: "6px 10px",
                                                minWidth: 40,
                                            }}
                                            type="button"
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                className="btn btn-outline"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                style={{ fontSize: 12, padding: "6px 12px" }}
                                type="button"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .client-row { transition: all 0.1s ease; border-left: 3px solid transparent; }
                .client-row:hover { background-color: #f8fafc; border-left-color: var(--color-primary); }
                .client-row:hover .del-btn { opacity: 1; color: #ef4444; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

/* ---------------- Styles ---------------- */

const loaderWrapper: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", height: "400px" };
const headerLayout: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 };
const addBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px", borderRadius: 10, fontWeight: 600 };

const searchWrapper: React.CSSProperties = { position: "relative" };
const searchIcon: React.CSSProperties = { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" };
const searchInput: React.CSSProperties = { paddingLeft: 42, width: 300, height: 44, borderRadius: 10, border: "1px solid #e2e8f0" };

const tableWrapper: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const tableHeaderRow: React.CSSProperties = { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" };
const thStyle: React.CSSProperties = { padding: "16px 20px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle: React.CSSProperties = { padding: "16px 20px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" };
const trStyle: React.CSSProperties = { cursor: "pointer" };

const nameLink: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "#0f172a" };
const avatarStyle: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#475569", border: "1px solid #e2e8f0" };

const contactStack: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const contactLine: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" };

const tagStack: React.CSSProperties = { display: "flex", gap: 4, alignItems: "center" };
const miniTag: React.CSSProperties = { padding: "2px 8px", background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#1e40af" };
const moreTags: React.CSSProperties = { fontSize: 11, color: "#94a3b8" };

const siteCell: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const actionRow: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 4 };
const iconBtn: React.CSSProperties = { padding: 8, color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", transition: "all 0.2s" };

/* Drawer Styles */
const drawerOverlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(2px)", display: "flex", justifyContent: "flex-end", zIndex: 1000 };
const drawerContent: React.CSSProperties = { background: "#fff", width: 480, height: "100%", display: "flex", flexDirection: "column", boxShadow: "-10px 0 25px rgba(0,0,0,0.1)" };
const drawerHeader: React.CSSProperties = { padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#94a3b8" };
const drawerBody: React.CSSProperties = { padding: "24px", flex: 1, overflowY: "auto" };
const formSection: React.CSSProperties = { marginBottom: 32 };
const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--color-primary)", marginBottom: 16, letterSpacing: "0.05em" };
const drawerFooter: React.CSSProperties = { padding: "24px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 12, background: "#f8fafc" };

export default Clients;
