// src/pages/StandaloneQuotationsPage.tsx
import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebaseConfig";

import {
    createStandaloneQuotation,
    getUserStandaloneQuotations,
    updateStandaloneQuotation,
    deleteStandaloneQuotation,
    type Quotation,
    type QuotationItem,
    type QuotationStatus,
} from "../services/quotationService";

import { useToast } from "../contexts/ToastContext";

import {
    Plus,
    X,
    Trash2,
    Pencil,
    Save,
    AlertTriangle,
} from "lucide-react";

const money = (n: any) => `R${(Number(n) || 0).toFixed(2)}`;

function sanitizeNumber(value: any, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function formatDate(value: any) {
    try {
        if (!value) return "-";
        if (value?.toLocaleDateString) return value.toLocaleDateString();
        return new Date(value).toLocaleDateString();
    } catch {
        return "-";
    }
}

function deepClone<T>(x: T): T {
    return JSON.parse(JSON.stringify(x));
}

function isSameJson(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
}

const StandaloneQuotationsPage: React.FC = () => {
    const { showToast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        clientName: string;
        clientEmail: string;
        clientAddress: string;
        clientPhone: string;
        items: QuotationItem[];
        taxRate: number;
        notes: string;
        validUntil: string;
        status: QuotationStatus;
    }>({
        clientName: "",
        clientEmail: "",
        clientAddress: "",
        clientPhone: "",
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        taxRate: 0,
        notes: "",
        validUntil: "",
        status: "draft",
    });

    // Unsaved changes guard (same style of logic as ProjectQuotations)
    const initialSnapshotRef = useRef<any>(null);
    const [dirty, setDirty] = useState(false);

    const makeSnapshot = useCallback(() => {
        return {
            editingId,
            showForm,
            formData,
        };
    }, [editingId, showForm, formData]);

    useEffect(() => {
        if (!showForm) {
            setDirty(false);
            initialSnapshotRef.current = null;
            return;
        }

        if (!initialSnapshotRef.current) {
            initialSnapshotRef.current = deepClone(makeSnapshot());
            setDirty(false);
            return;
        }

        const current = makeSnapshot();
        const isDirtyNow = !isSameJson(initialSnapshotRef.current, current);
        setDirty(isDirtyNow);
    }, [showForm, makeSnapshot]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    const confirmDiscard = useCallback(() => {
        if (!dirty) return true;
        return window.confirm("You have unsaved changes. Are you sure you want to leave this page?");
    }, [dirty]);

    const load = async (uid: string) => {
        try {
            const list = await getUserStandaloneQuotations(uid);
            setQuotations(list);
        } catch (e: any) {
            showToast("Failed to load quotations: " + (e?.message ?? "Unknown error"), "error");
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);

            if (!u) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                await load(u.uid);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totals = useMemo(() => {
        const subtotal = formData.items.reduce((sum, it) => sum + sanitizeNumber(it.total, 0), 0);
        const taxRate = sanitizeNumber(formData.taxRate, 0);
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }, [formData.items, formData.taxRate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            if (name === "taxRate") return { ...prev, taxRate: Number(value) || 0 };
            return { ...prev, [name]: value };
        });
    };

    const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
        setFormData((prev) => {
            const newItems = prev.items.map((it, i) => {
                if (i !== index) return it;

                const updated: QuotationItem = {
                    ...it,
                    [field]: field === "description" ? String(value) : Number(value),
                } as QuotationItem;

                const qty = sanitizeNumber(updated.quantity, 0);
                const price = sanitizeNumber(updated.unitPrice, 0);
                updated.total = qty * price;

                return updated;
            });

            return { ...prev, items: newItems };
        });
    };

    const addBlankItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }],
        }));
    };

    const removeItem = (index: number) => {
        setFormData((prev) => {
            const items = prev.items.filter((_, i) => i !== index);
            return {
                ...prev,
                items: items.length ? items : [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            };
        });
    };

    const resetForm = () => {
        setFormData({
            clientName: "",
            clientEmail: "",
            clientAddress: "",
            clientPhone: "",
            items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: 0,
            notes: "",
            validUntil: "",
            status: "draft",
        });

        setEditingId(null);
        initialSnapshotRef.current = null;
        setDirty(false);
    };

    const startEdit = (q: Quotation) => {
        setEditingId(q.id || null);
        setShowForm(true);

        setFormData({
            clientName: q.clientName || "",
            clientEmail: q.clientEmail || "",
            clientAddress: q.clientAddress || "",
            clientPhone: q.clientPhone || "",
            items:
                (q.items || []).length > 0
                    ? q.items.map((it) => ({
                        description: it.description || "",
                        quantity: sanitizeNumber(it.quantity, 1),
                        unitPrice: sanitizeNumber(it.unitPrice, 0),
                        total: sanitizeNumber(it.quantity, 0) * sanitizeNumber(it.unitPrice, 0),
                    }))
                    : [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: sanitizeNumber(q.taxRate, 0),
            notes: q.notes || "",
            validUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : "",
            status: (q.status || "draft") as QuotationStatus,
        });

        initialSnapshotRef.current = null;
        setDirty(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.clientName.trim() || !formData.clientEmail.trim() || !formData.clientAddress.trim()) {
            showToast("Please complete required client fields.", "error");
            return;
        }

        const cleanedItems = formData.items
            .map((it) => ({
                description: (it.description || "").trim(),
                quantity: sanitizeNumber(it.quantity, 0),
                unitPrice: sanitizeNumber(it.unitPrice, 0),
                total: sanitizeNumber(it.quantity, 0) * sanitizeNumber(it.unitPrice, 0),
            }))
            .filter((it) => it.description.length > 0);

        if (cleanedItems.length === 0) {
            showToast("Please add at least 1 item with a description.", "error");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await updateStandaloneQuotation(editingId, {
                    clientName: formData.clientName.trim(),
                    clientEmail: formData.clientEmail.trim(),
                    clientAddress: formData.clientAddress.trim(),
                    clientPhone: formData.clientPhone.trim() || undefined,
                    items: cleanedItems.map((i) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    taxRate: sanitizeNumber(formData.taxRate, 0),
                    notes: formData.notes.trim() || undefined,
                    validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
                    status: formData.status,
                });

                showToast("Quotation updated successfully!", "success");
            } else {
                await createStandaloneQuotation(user.uid, {
                    clientName: formData.clientName.trim(),
                    clientEmail: formData.clientEmail.trim(),
                    clientAddress: formData.clientAddress.trim(),
                    clientPhone: formData.clientPhone.trim() || undefined,
                    items: cleanedItems.map((i) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    taxRate: sanitizeNumber(formData.taxRate, 0),
                    notes: formData.notes.trim() || undefined,
                    validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
                    status: formData.status,
                });

                showToast("Quotation created successfully!", "success");
            }

            await load(user.uid);
            resetForm();
            setShowForm(false);

            initialSnapshotRef.current = null;
            setDirty(false);
        } catch (err: any) {
            showToast(
                (editingId ? "Failed to update quotation: " : "Failed to create quotation: ") + (err?.message ?? "Unknown error"),
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (qid: string) => {
        if (!user) return;
        if (!window.confirm("Are you sure you want to delete this quotation?")) return;

        setSaving(true);
        try {
            await deleteStandaloneQuotation(qid);
            showToast("Quotation deleted successfully!", "success");
            await load(user.uid);

            if (editingId === qid) {
                resetForm();
                setShowForm(false);
            }
        } catch (err: any) {
            showToast("Failed to delete quotation: " + (err?.message ?? "Unknown error"), "error");
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
                    <p>Please log in to view quotations.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: "1200px" }}>
                <div className="profile-header">
                    <h1 className="profile-title">Standalone Quotations</h1>
                    <p className="profile-subtitle">
                        Create and manage quotations without linking to a project.
                    </p>
                </div>

                <div className="profile-section">
                    {!showForm ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (!confirmDiscard()) return;
                                resetForm();
                                setShowForm(true);
                                initialSnapshotRef.current = null;
                                setDirty(false);
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                        >
                            <Plus size={16} />
                            New Quotation
                        </button>
                    ) : (
                        <div className="quotation-form-container">
                            <div className="quotation-form-header" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <h3 style={{ margin: 0, fontSize: "var(--font-size-xl)" }}>
                                        {editingId ? "Update Quotation" : "Create New Quotation"}
                                    </h3>

                                    {dirty ? (
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                gap: 8,
                                                alignItems: "center",
                                                fontSize: 12,
                                                color: "var(--color-text-secondary)",
                                            }}
                                        >
                                            <AlertTriangle size={14} />
                                            Unsaved changes
                                        </div>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        if (!confirmDiscard()) return;
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    style={{
                                        fontSize: "var(--font-size-xs)",
                                        padding: "6px 12px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                    disabled={saving}
                                >
                                    <X size={16} />
                                    Close
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="quotation-form">
                                <div className="quotation-form-grid">
                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Client Information</h4>

                                        <div className="form-group">
                                            <label className="form-label">Client Name *</label>
                                            <input
                                                type="text"
                                                name="clientName"
                                                className="form-control"
                                                value={formData.clientName}
                                                onChange={handleInputChange}
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Email *</label>
                                            <input
                                                type="email"
                                                name="clientEmail"
                                                className="form-control"
                                                value={formData.clientEmail}
                                                onChange={handleInputChange}
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Address *</label>
                                            <textarea
                                                name="clientAddress"
                                                className="form-control"
                                                value={formData.clientAddress}
                                                onChange={handleInputChange}
                                                rows={3}
                                                required
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Phone</label>
                                            <input
                                                type="tel"
                                                name="clientPhone"
                                                className="form-control"
                                                value={formData.clientPhone}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>

                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Quotation Details</h4>

                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select
                                                name="status"
                                                className="form-control"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="sent">Sent</option>
                                                <option value="accepted">Accepted</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Tax Rate (%)</label>
                                            <input
                                                type="number"
                                                name="taxRate"
                                                className="form-control"
                                                value={formData.taxRate}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Valid Until</label>
                                            <input
                                                type="date"
                                                name="validUntil"
                                                className="form-control"
                                                value={formData.validUntil}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <textarea
                                                name="notes"
                                                className="form-control"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                rows={4}
                                                placeholder="Additional notes or terms..."
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ITEMS */}
                                <div className="quotation-items-section">
                                    <div
                                        className="quotation-items-header"
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 10,
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        <h4 className="quotation-section-title" style={{ margin: 0 }}>
                                            Items
                                        </h4>

                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                onClick={addBlankItem}
                                                disabled={saving}
                                                style={{
                                                    fontSize: "var(--font-size-xs)",
                                                    padding: "6px 12px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                                title="Add a blank row"
                                            >
                                                <Plus size={16} />
                                                Add row
                                            </button>
                                        </div>
                                    </div>

                                    <div className="quotation-items-table" style={{ marginTop: "var(--spacing-md)" }}>
                                        <div className="quotation-items-header-row">
                                            <div style={{ flex: "2" }}>Description</div>
                                            <div style={{ width: "80px" }}>Qty</div>
                                            <div style={{ width: "100px" }}>Unit Price</div>
                                            <div style={{ width: "100px" }}>Total</div>
                                            <div style={{ width: "48px" }}></div>
                                        </div>

                                        {formData.items.map((item, index) => (
                                            <div key={index} className="quotation-item-row">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                                    placeholder="Item description"
                                                    style={{ flex: "2", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                />

                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                    min="1"
                                                    style={{ width: "80px", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                />

                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                    style={{ width: "100px", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                />

                                                <div style={{ width: "100px", padding: "8px 12px", fontSize: "var(--font-size-sm)" }}>
                                                    {money(item.total)}
                                                </div>

                                                {formData.items.length > 1 ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => removeItem(index)}
                                                        style={{
                                                            width: "48px",
                                                            padding: "6px",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                        disabled={saving}
                                                        title="Remove line"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <div style={{ width: "48px" }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="quotation-totals">
                                        <div className="quotation-total-row">
                                            <span>Subtotal:</span>
                                            <span>{money(totals.subtotal)}</span>
                                        </div>
                                        <div className="quotation-total-row">
                                            <span>Tax ({sanitizeNumber(formData.taxRate, 0)}%):</span>
                                            <span>{money(totals.taxAmount)}</span>
                                        </div>
                                        <div className="quotation-total-row quotation-total-final">
                                            <span>Total:</span>
                                            <span>{money(totals.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            if (!confirmDiscard()) return;
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                        disabled={saving}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                    >
                                        <Save size={16} />
                                        {saving ? (editingId ? "Updating..." : "Creating...") : editingId ? "Update Quotation" : "Create Quotation"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* LIST TABLE (same table style as ProjectQuotations) */}
                    {quotations.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "var(--spacing-3xl) 0",
                                color: "var(--color-text-secondary)",
                                marginTop: "var(--spacing-2xl)",
                            }}
                        >
                            <p>No quotations yet. Create your first quotation!</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: "var(--spacing-2xl)" }}>
                            <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "var(--font-size-xl)" }}>
                                All Quotations
                            </h3>

                            <div
                                style={{
                                    border: "1px solid var(--color-border-light)",
                                    borderRadius: "var(--border-radius)",
                                    overflow: "hidden",
                                    background: "var(--color-surface)",
                                }}
                            >
                                <div style={{ overflowX: "auto" }}>
                                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Quotation #</th>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Client</th>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Status</th>
                                            <th style={{ textAlign: "right", padding: "12px 10px" }}>Total</th>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Created</th>
                                            <th style={{ textAlign: "right", padding: "12px 10px", width: 320 }}>Actions</th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {quotations.map((q) => (
                                            <tr key={q.id} style={{ borderTop: "1px solid var(--color-border-light)" }}>
                                                <td style={{ padding: "12px 10px", fontWeight: 800 }}>{q.quotationNumber}</td>

                                                <td style={{ padding: "12px 10px" }}>
                                                    <div style={{ fontWeight: 700 }}>{q.clientName}</div>
                                                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{q.clientEmail}</div>
                                                </td>

                                                <td style={{ padding: "12px 10px" }}>
                            <span className={`quotation-status quotation-status-${q.status}`}>
                              {String(q.status || "draft").charAt(0).toUpperCase() + String(q.status || "draft").slice(1)}
                            </span>
                                                </td>

                                                <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 800 }}>
                                                    {money((q as any).total ?? q.total)}
                                                </td>

                                                <td style={{ padding: "12px 10px", fontSize: 12, color: "var(--color-text-secondary)" }}>
                                                    {formatDate(q.createdAt)}
                                                </td>

                                                <td style={{ padding: "12px 10px", textAlign: "right" }}>
                                                    <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            onClick={() => startEdit(q)}
                                                            disabled={saving}
                                                            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                                            title="Edit quotation"
                                                        >
                                                            <Pencil size={16} />
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            onClick={() => q.id && handleDelete(q.id)}
                                                            disabled={saving}
                                                            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                                            title="Delete quotation"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>

                                    </table>
                                </div>
                            </div>

                            {/* Optional: navigation to projects to keep UX consistent */}
                            <div style={{ marginTop: 14, fontSize: 12, color: "var(--color-text-secondary)" }}>
                                Want project-based quotations?{" "}
                                <Link to="/projects" style={{ textDecoration: "underline" }}>
                                    View projects
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StandaloneQuotationsPage;
