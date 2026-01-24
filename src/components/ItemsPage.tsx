// src/pages/items/ItemsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useToast } from "../contexts/ToastContext";

import {
    createCatalogItem,
    deleteCatalogItem,
    getUserCatalogItems,
    updateCatalogItem,
    type CatalogItem,
    type ItemType,
} from "../services/itemService";

const PAGE_SIZES = [5, 10, 20, 50] as const;

function money(n: any) {
    const x = Number(n) || 0;
    return `R${x.toFixed(2)}`;
}

function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

const ItemsPage: React.FC = () => {
    const { showToast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [items, setItems] = useState<CatalogItem[]>([]);
    const [saving, setSaving] = useState(false);

    // UI state
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // table controls
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);

    // sort controls
    const [sortBy, setSortBy] = useState<"name" | "type" | "unitPrice" | "unit" | "isActive">("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const [form, setForm] = useState<{
        name: string;
        description: string;
        unitPrice: string;
        unit: string;
        type: ItemType;
        isActive: boolean;
    }>({
        name: "",
        description: "",
        unitPrice: "0",
        unit: "",
        type: "service",
        isActive: true,
    });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (!u) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                await refresh(u.uid);
            } catch (e: any) {
                showToast("Failed to load items: " + (e?.message ?? "Unknown error"), "error");
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refresh = async (uid: string) => {
        const list = await getUserCatalogItems(uid, false);
        setItems(list || []);
    };

    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            unitPrice: "0",
            unit: "",
            type: "service",
            isActive: true,
        });
        setEditingId(null);
    };

    const startCreate = () => {
        resetForm();
        setShowForm(true);
    };

    const startEdit = (it: CatalogItem) => {
        setEditingId(it.id || null);
        setShowForm(true);
        setForm({
            name: it.name || "",
            description: it.description || "",
            unitPrice: String(Number(it.unitPrice || 0)),
            unit: it.unit || "",
            type: it.type || "service",
            isActive: Boolean(it.isActive ?? true),
        });
    };

    const setSort = (col: typeof sortBy) => {
        setPage(1);
        setSortBy((prev) => {
            if (prev === col) {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                return prev;
            }
            setSortDir("asc");
            return col;
        });
    };

    const filteredSorted = useMemo(() => {
        const q = search.trim().toLowerCase();

        const filtered = !q
            ? items
            : items.filter((it) => {
                const a = (it.name || "").toLowerCase();
                const b = (it.description || "").toLowerCase();
                const c = (it.unit || "").toLowerCase();
                const d = (it.type || "").toLowerCase();
                return a.includes(q) || b.includes(q) || c.includes(q) || d.includes(q);
            });

        const dir = sortDir === "asc" ? 1 : -1;

        const getVal = (it: CatalogItem) => {
            switch (sortBy) {
                case "name":
                    return (it.name || "").toLowerCase();
                case "type":
                    return (it.type || "").toLowerCase();
                case "unit":
                    return (it.unit || "").toLowerCase();
                case "unitPrice":
                    return Number(it.unitPrice || 0);
                case "isActive":
                    return it.isActive ? 1 : 0;
                default:
                    return (it.name || "").toLowerCase();
            }
        };

        const sorted = [...filtered].sort((x, y) => {
            const a = getVal(x) as any;
            const b = getVal(y) as any;

            if (typeof a === "number" && typeof b === "number") {
                if (a === b) return 0;
                return a > b ? dir : -dir;
            }

            const aa = String(a ?? "");
            const bb = String(b ?? "");
            if (aa === bb) return 0;
            return aa > bb ? dir : -dir;
        });

        return sorted;
    }, [items, search, sortBy, sortDir]);

    // keep pagination in sync if filter changes
    useEffect(() => {
        setPage(1);
    }, [search, pageSize, sortBy, sortDir]);

    const totalItems = filteredSorted.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredSorted.slice(start, start + pageSize);
    }, [filteredSorted, safePage, pageSize]);

    const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const to = Math.min(totalItems, safePage * pageSize);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const name = form.name.trim();
        if (!name) {
            showToast("Item name is required.", "error");
            return;
        }

        const price = Number(form.unitPrice);
        if (Number.isNaN(price) || price < 0) {
            showToast("Unit price must be a valid number.", "error");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await updateCatalogItem(user.uid, editingId, {
                    name,
                    description: form.description.trim(),
                    unitPrice: price,
                    unit: form.unit.trim(),
                    type: form.type,
                    isActive: form.isActive,
                });
                showToast("Item updated!", "success");
            } else {
                await createCatalogItem(user.uid, {
                    name,
                    description: form.description.trim() || undefined,
                    unitPrice: price,
                    unit: form.unit.trim() || undefined,
                    type: form.type,
                    isActive: form.isActive,
                });
                showToast("Item created!", "success");
            }

            await refresh(user.uid);
            setShowForm(false);
            resetForm();
        } catch (err: any) {
            showToast("Failed to save item: " + (err?.message ?? "Unknown error"), "error");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (it: CatalogItem) => {
        if (!user || !it.id) return;

        try {
            await updateCatalogItem(user.uid, it.id, { isActive: !it.isActive });
            await refresh(user.uid);
        } catch (err: any) {
            showToast("Failed to update item: " + (err?.message ?? "Unknown error"), "error");
        }
    };

    const removeItem = async (it: CatalogItem) => {
        if (!user || !it.id) return;
        if (!window.confirm(`Delete "${it.name}"? This cannot be undone.`)) return;

        try {
            await deleteCatalogItem(user.uid, it.id);
            showToast("Item deleted.", "success");
            await refresh(user.uid);
        } catch (err: any) {
            showToast("Failed to delete item: " + (err?.message ?? "Unknown error"), "error");
        }
    };

    const SortIcon = ({ col }: { col: typeof sortBy }) => {
        if (sortBy !== col) return <span style={{ opacity: 0.4 }}>↕</span>;
        return <span>{sortDir === "asc" ? "↑" : "↓"}</span>;
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
                    <p>Please log in to manage items.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: 1200 }}>
                <div className="profile-header">
                    <h1 className="profile-title">Items</h1>
                    <p className="profile-subtitle">
                        Pre-add your common products/services so you can insert them quickly into quotes and invoices.
                    </p>
                </div>

                <div className="profile-section">
                    {/* Top controls */}
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            marginBottom: 14,
                        }}
                    >
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <input
                                className="form-control"
                                placeholder="Search items..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ minWidth: 280 }}
                            />

                            <select
                                className="form-control"
                                value={String(pageSize)}
                                onChange={(e) => setPageSize(Number(e.target.value) as any)}
                                style={{ width: 140 }}
                            >
                                {PAGE_SIZES.map((n) => (
                                    <option key={n} value={String(n)}>
                                        {n} / page
                                    </option>
                                ))}
                            </select>

                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                {totalItems} item(s)
                            </div>
                        </div>

                        {!showForm ? (
                            <button className="btn btn-primary" onClick={startCreate}>
                                + New Item
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                disabled={saving}
                            >
                                Close
                            </button>
                        )}
                    </div>

                    {/* Form */}
                    {showForm ? (
                        <div className="quotation-form-container" style={{ marginBottom: 18 }}>
                            <div className="quotation-form-header">
                                <h3 style={{ margin: 0, fontSize: "var(--font-size-xl)" }}>
                                    {editingId ? "Edit Item" : "Create Item"}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="quotation-form">
                                <div className="quotation-form-grid">
                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Item details</h4>

                                        <div className="form-group">
                                            <label className="form-label">Name *</label>
                                            <input
                                                className="form-control"
                                                value={form.name}
                                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                                disabled={saving}
                                                placeholder='e.g. "Labour"'
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                value={form.description}
                                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                                disabled={saving}
                                                rows={3}
                                                placeholder="Optional notes for this item"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Type</label>
                                            <select
                                                className="form-control"
                                                value={form.type}
                                                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ItemType }))}
                                                disabled={saving}
                                            >
                                                <option value="service">Service</option>
                                                <option value="product">Product</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Pricing</h4>

                                        <div className="form-group">
                                            <label className="form-label">Unit Price</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={form.unitPrice}
                                                onChange={(e) => setForm((p) => ({ ...p, unitPrice: e.target.value }))}
                                                disabled={saving}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Unit (optional)</label>
                                            <input
                                                className="form-control"
                                                value={form.unit}
                                                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                                                disabled={saving}
                                                placeholder='e.g. "hour", "item", "kg"'
                                            />
                                        </div>

                                        <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <input
                                                id="isActive"
                                                type="checkbox"
                                                checked={form.isActive}
                                                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                                disabled={saving}
                                            />
                                            <label htmlFor="isActive" className="form-label" style={{ margin: 0 }}>
                                                Active (available in quote/invoice picker)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? "Saving..." : editingId ? "Save Changes" : "Create Item"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : null}

                    {/* Table */}
                    {totalItems === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "var(--spacing-3xl) 0",
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            <p>No items yet.</p>
                            <button className="btn btn-primary" onClick={startCreate}>
                                Create your first item
                            </button>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    overflowX: "auto",
                                    border: "1px solid var(--color-border-light)",
                                    borderRadius: "var(--border-radius)",
                                    background: "var(--color-surface)",
                                }}
                            >
                                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                    <tr style={{ background: "var(--color-surface-alt)" as any }}>
                                        <th
                                            style={{ textAlign: "left", padding: "12px 14px", cursor: "pointer", whiteSpace: "nowrap" }}
                                            onClick={() => setSort("name")}
                                            title="Sort by name"
                                        >
                                            Name <SortIcon col="name" />
                                        </th>

                                        <th
                                            style={{ textAlign: "left", padding: "12px 14px", cursor: "pointer", whiteSpace: "nowrap" }}
                                            onClick={() => setSort("type")}
                                            title="Sort by type"
                                        >
                                            Type <SortIcon col="type" />
                                        </th>

                                        <th
                                            style={{ textAlign: "left", padding: "12px 14px", cursor: "pointer", whiteSpace: "nowrap" }}
                                            onClick={() => setSort("unit")}
                                            title="Sort by unit"
                                        >
                                            Unit <SortIcon col="unit" />
                                        </th>

                                        <th
                                            style={{ textAlign: "right", padding: "12px 14px", cursor: "pointer", whiteSpace: "nowrap" }}
                                            onClick={() => setSort("unitPrice")}
                                            title="Sort by unit price"
                                        >
                                            Unit Price <SortIcon col="unitPrice" />
                                        </th>

                                        <th
                                            style={{ textAlign: "left", padding: "12px 14px", cursor: "pointer", whiteSpace: "nowrap" }}
                                            onClick={() => setSort("isActive")}
                                            title="Sort by active"
                                        >
                                            Status <SortIcon col="isActive" />
                                        </th>

                                        <th style={{ textAlign: "right", padding: "12px 14px", whiteSpace: "nowrap" }}>Actions</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {pageItems.map((it) => {
                                        const active = Boolean(it.isActive);
                                        return (
                                            <tr key={it.id}>
                                                <td style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-light)" }}>
                                                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                                                    {it.description ? (
                                                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                                                            {it.description}
                                                        </div>
                                                    ) : null}
                                                </td>

                                                <td style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-light)" }}>
                                                    {it.type === "product" ? "Product" : "Service"}
                                                </td>

                                                <td style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-light)" }}>
                                                    {it.unit || "—"}
                                                </td>

                                                <td
                                                    style={{
                                                        padding: "12px 14px",
                                                        borderTop: "1px solid var(--color-border-light)",
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {money(it.unitPrice)}
                                                </td>

                                                <td style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-light)" }}>
                            <span
                                className={classNames(
                                    "quotation-status",
                                    active ? "quotation-status-accepted" : "quotation-status-rejected"
                                )}
                            >
                              {active ? "Active" : "Inactive"}
                            </span>
                                                </td>

                                                <td
                                                    style={{
                                                        padding: "12px 14px",
                                                        borderTop: "1px solid var(--color-border-light)",
                                                        textAlign: "right",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                        <button className="btn btn-outline" onClick={() => startEdit(it)} disabled={saving}>
                                                            ✏️ Edit
                                                        </button>

                                                        <button className="btn btn-outline" onClick={() => toggleActive(it)} disabled={saving}>
                                                            {active ? "🚫 Disable" : "✅ Enable"}
                                                        </button>

                                                        <button className="btn btn-outline" onClick={() => removeItem(it)} disabled={saving}>
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 10,
                                    flexWrap: "wrap",
                                    marginTop: 12,
                                }}
                            >
                                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                    Showing <b>{from}</b>–<b>{to}</b> of <b>{totalItems}</b>
                                </div>

                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setPage(1)}
                                        disabled={safePage === 1}
                                        title="First page"
                                    >
                                        ⏮
                                    </button>

                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        title="Previous page"
                                    >
                                        ← Prev
                                    </button>

                                    <div style={{ fontSize: 12 }}>
                                        Page <b>{safePage}</b> of <b>{totalPages}</b>
                                    </div>

                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                        title="Next page"
                                    >
                                        Next →
                                    </button>

                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setPage(totalPages)}
                                        disabled={safePage === totalPages}
                                        title="Last page"
                                    >
                                        ⏭
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemsPage;
