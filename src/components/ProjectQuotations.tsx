// src/components/ProjectQuotations.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getUserClients, createClient, type Client } from "../services/clientService";
import {
    createQuotation,
    getProjectQuotations,
    deleteQuotation,
    updateQuotation,
    type Quotation,
    type QuotationItem,
} from "../services/quotationService";
import { getUserProjects } from "../services/projectService";
import { getUserProfile } from "../services/profileService";
import { useToast } from "../contexts/ToastContext";
import { generateQuotationPDF } from "../utils/pdfGenerator";

type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

const ProjectQuotations: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Clients
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [saveClient, setSaveClient] = useState(true);

    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<{
        firstName: string;
        lastName: string;
        companyName: string;
        email: string;
    } | null>(null);

    const [project, setProject] = useState<{ name: string; location: string } | null>(null);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Edit mode
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

    // -------------------- LOADERS --------------------
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (!currentUser) {
                setLoading(false);
                return;
            }

            if (!projectId) {
                setLoading(false);
                showToast("Missing project id", "error");
                navigate("/projects");
                return;
            }

            try {
                setLoading(true);
                await Promise.all([
                    loadProject(projectId, currentUser.uid),
                    loadQuotations(projectId),
                    loadUserProfile(currentUser.uid),
                    loadClients(currentUser.uid),
                ]);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const loadProject = async (pid: string, userId: string) => {
        try {
            const projects = await getUserProjects(userId);
            const foundProject = projects.find((p) => p.id === pid);

            if (foundProject) {
                setProject({ name: foundProject.name, location: foundProject.location });
                return;
            }

            showToast("Project not found", "error");
            navigate("/projects");
        } catch (error: any) {
            showToast("Failed to load project: " + (error?.message ?? "Unknown error"), "error");
            navigate("/projects");
        }
    };

    const loadClients = async (userId: string) => {
        try {
            const list = await getUserClients(userId);
            setClients(list);
        } catch (error: any) {
            console.error("Failed to load clients:", error);
        }
    };

    const loadUserProfile = async (userId: string) => {
        try {
            const profile = await getUserProfile(userId);
            if (!profile) return;

            setUserProfile({
                firstName: profile.firstName,
                lastName: profile.lastName,
                companyName: profile.companyName,
                email: profile.email,
            });
        } catch (error: any) {
            console.error("Failed to load user profile:", error);
        }
    };

    const loadQuotations = async (pid: string) => {
        try {
            const projectQuotations = await getProjectQuotations(pid);
            setQuotations(projectQuotations);
        } catch (error: any) {
            showToast("Failed to load quotations: " + (error?.message ?? "Unknown error"), "error");
        }
    };

    // -------------------- FORM HANDLERS --------------------
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            if (name === "taxRate") return { ...prev, taxRate: Number(value) || 0 };
            return { ...prev, [name]: value };
        });

        // If user starts typing manually, we "detach" from selected client (optional)
        if (name === "clientName" || name === "clientEmail" || name === "clientAddress" || name === "clientPhone") {
            setSelectedClientId("");
        }
    };

    const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
        setFormData((prev) => {
            const newItems = prev.items.map((it, i) => {
                if (i !== index) return it;

                const updated: QuotationItem = {
                    ...it,
                    [field]: field === "description" ? String(value) : Number(value),
                } as QuotationItem;

                const qty = Number(updated.quantity) || 0;
                const price = Number(updated.unitPrice) || 0;
                updated.total = qty * price;

                return updated;
            });

            return { ...prev, items: newItems };
        });
    };

    const addItem = () => {
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
        setSelectedClientId("");
        setSaveClient(true);
    };

    const totals = useMemo(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const taxRate = Number(formData.taxRate) || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }, [formData.items, formData.taxRate]);

    // -------------------- CLIENT SELECT --------------------
    const handleSelectClient = (clientId: string) => {
        setSelectedClientId(clientId);

        if (!clientId) return;

        const c = clients.find((x) => x.id === clientId);
        if (!c) return;

        setFormData((prev) => ({
            ...prev,
            clientName: c.name,
            clientEmail: c.email,
            clientAddress: c.address,
            clientPhone: c.phone || "",
        }));
    };

    // -------------------- EDIT MODE --------------------
    const startEdit = (q: Quotation) => {
        setEditingId(q.id || null);
        setShowForm(true);

        // When editing, we don't force select a saved client
        setSelectedClientId("");
        setSaveClient(false);

        setFormData({
            clientName: q.clientName || "",
            clientEmail: q.clientEmail || "",
            clientAddress: q.clientAddress || "",
            clientPhone: q.clientPhone || "",
            items:
                (q.items || []).length > 0
                    ? q.items.map((it) => ({
                        description: it.description || "",
                        quantity: Number(it.quantity) || 1,
                        unitPrice: Number(it.unitPrice) || 0,
                        total: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
                    }))
                    : [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: Number(q.taxRate) || 0,
            notes: q.notes || "",
            validUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : "",
            status: (q.status as QuotationStatus) || "draft",
        });
    };

    // -------------------- SUBMIT --------------------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !projectId) return;

        if (!formData.clientName.trim() || !formData.clientEmail.trim() || !formData.clientAddress.trim()) {
            showToast("Please complete required client fields.", "error");
            return;
        }

        const cleanedItems = formData.items
            .map((it) => ({
                description: (it.description || "").trim(),
                quantity: Number(it.quantity) || 0,
                unitPrice: Number(it.unitPrice) || 0,
                total: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
            }))
            .filter((it) => it.description.length > 0);

        if (cleanedItems.length === 0) {
            showToast("Please add at least 1 item with a description.", "error");
            return;
        }

        setSaving(true);
        try {
            // ✅ If creating and user wants to save client, auto-save if not already saved
            if (!editingId && saveClient) {
                const exists = clients.some(
                    (c) =>
                        (c.email || "").toLowerCase() === formData.clientEmail.trim().toLowerCase() &&
                        (c.name || "").toLowerCase() === formData.clientName.trim().toLowerCase()
                );

                if (!selectedClientId && !exists) {
                    await createClient(user.uid, {
                        name: formData.clientName.trim(),
                        email: formData.clientEmail.trim(),
                        address: formData.clientAddress.trim(),
                        phone: formData.clientPhone.trim() || undefined,
                    });

                    // Refresh saved clients list
                    await loadClients(user.uid);
                }
            }

            if (editingId) {
                await updateQuotation(projectId, editingId, {
                    clientName: formData.clientName.trim(),
                    clientEmail: formData.clientEmail.trim(),
                    clientAddress: formData.clientAddress.trim(),
                    clientPhone: formData.clientPhone.trim() || undefined,
                    items: cleanedItems.map((i) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    taxRate: Number(formData.taxRate) || 0,
                    notes: formData.notes.trim() || undefined,
                    validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
                    status: formData.status,
                });

                showToast("Quotation updated successfully!", "success");
            } else {
                await createQuotation(projectId, user.uid, {
                    clientName: formData.clientName.trim(),
                    clientEmail: formData.clientEmail.trim(),
                    clientAddress: formData.clientAddress.trim(),
                    clientPhone: formData.clientPhone.trim() || undefined,
                    items: cleanedItems.map((i) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    taxRate: Number(formData.taxRate) || 0,
                    notes: formData.notes.trim() || undefined,
                    validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
                    status: formData.status,
                });

                showToast("Quotation created successfully!", "success");
            }

            resetForm();
            setShowForm(false);
            await loadQuotations(projectId);
        } catch (error: any) {
            showToast(
                (editingId ? "Failed to update quotation: " : "Failed to create quotation: ") +
                (error?.message ?? "Unknown error"),
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    // -------------------- ACTIONS --------------------
    const handleDownloadPDF = (quotation: Quotation) => {
        if (!userProfile) {
            showToast("User profile not loaded", "error");
            return;
        }
        try {
            generateQuotationPDF(quotation, userProfile, project?.name);
            showToast("PDF generated successfully!", "success");
        } catch (error: any) {
            showToast("Failed to generate PDF: " + (error?.message ?? "Unknown error"), "error");
        }
    };

    const handleDelete = async (quotationId: string) => {
        if (!user || !projectId) return;
        if (!window.confirm("Are you sure you want to delete this quotation?")) return;

        try {
            await deleteQuotation(projectId, quotationId);
            showToast("Quotation deleted successfully!", "success");
            await loadQuotations(projectId);

            if (editingId === quotationId) {
                resetForm();
                setShowForm(false);
            }
        } catch (error: any) {
            showToast("Failed to delete quotation: " + (error?.message ?? "Unknown error"), "error");
        }
    };

    // -------------------- UI STATES --------------------
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

    if (!project) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Project not found.</p>
                    <Link to="/projects" className="btn btn-primary">
                        Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    // -------------------- RENDER --------------------
    return (
        <div className="page-content">
            <div className="container" style={{ maxWidth: "1200px" }}>
                <div style={{ marginBottom: "var(--spacing-lg)" }}>
                    <Link
                        to={`/projects/${projectId}`}
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
                        ← Back to {project.name}
                    </Link>
                </div>

                <div className="profile-header">
                    <h1 className="profile-title">Quotations</h1>
                    <p className="profile-subtitle">
                        Project: {project.name} - {project.location}
                    </p>
                </div>

                <div className="profile-section">
                    {!showForm ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            + New Quotation
                        </button>
                    ) : (
                        <div className="quotation-form-container">
                            <div className="quotation-form-header">
                                <h3 style={{ margin: 0, fontSize: "var(--font-size-xl)" }}>
                                    {editingId ? "Update Quotation" : "Create New Quotation"}
                                </h3>

                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="quotation-form">
                                <div className="quotation-form-grid">
                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Client Information</h4>

                                        {/* ✅ NEW: Select saved client */}
                                        <div className="form-group">
                                            <label className="form-label">Select Client</label>
                                            <select
                                                className="form-control"
                                                value={selectedClientId}
                                                onChange={(e) => handleSelectClient(e.target.value)}
                                                disabled={saving}
                                            >
                                                <option value="">-- Choose saved client --</option>
                                                {clients.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} ({c.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* ✅ NEW: Save client toggle (only really useful on create) */}
                                        {!editingId && (
                                            <div
                                                className="form-group"
                                                style={{ display: "flex", gap: "8px", alignItems: "center" }}
                                            >
                                                <input
                                                    id="saveClient"
                                                    type="checkbox"
                                                    checked={saveClient}
                                                    onChange={(e) => setSaveClient(e.target.checked)}
                                                    disabled={saving}
                                                />
                                                <label htmlFor="saveClient" className="form-label" style={{ margin: 0 }}>
                                                    Save client for next time
                                                </label>
                                            </div>
                                        )}

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

                                <div className="quotation-items-section">
                                    <div className="quotation-items-header">
                                        <h4 className="quotation-section-title">Items</h4>
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={addItem}
                                            style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                            disabled={saving}
                                        >
                                            + Add Item
                                        </button>
                                    </div>

                                    <div className="quotation-items-table">
                                        <div className="quotation-items-header-row">
                                            <div style={{ flex: "2" }}>Description</div>
                                            <div style={{ width: "80px" }}>Qty</div>
                                            <div style={{ width: "100px" }}>Unit Price</div>
                                            <div style={{ width: "100px" }}>Total</div>
                                            <div style={{ width: "40px" }}></div>
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
                                                    R{(Number(item.total) || 0).toFixed(2)}
                                                </div>

                                                {formData.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => removeItem(index)}
                                                        style={{ width: "40px", padding: "6px", fontSize: "var(--font-size-xs)" }}
                                                        disabled={saving}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="quotation-totals">
                                        <div className="quotation-total-row">
                                            <span>Subtotal:</span>
                                            <span>R{totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="quotation-total-row">
                                            <span>Tax ({Number(formData.taxRate) || 0}%):</span>
                                            <span>R{totals.taxAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="quotation-total-row quotation-total-final">
                                            <span>Total:</span>
                                            <span>R{totals.total.toFixed(2)}</span>
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
                                        {saving
                                            ? editingId
                                                ? "Updating..."
                                                : "Creating..."
                                            : editingId
                                                ? "Update Quotation"
                                                : "Create Quotation"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

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

                            <div className="quotation-list">
                                {quotations.map((quotation) => (
                                    <div key={quotation.id} className="quotation-card">
                                        <div className="quotation-card-header">
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: "var(--font-size-lg)", marginBottom: "var(--spacing-xs)" }}>
                                                    {quotation.quotationNumber}
                                                </h4>

                                                <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                                                    {quotation.clientName}
                                                </p>

                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "var(--font-size-xs)",
                                                        color: "var(--color-text-muted)",
                                                        marginTop: "var(--spacing-xs)",
                                                    }}
                                                >
                                                    {quotation.clientEmail}
                                                </p>
                                            </div>

                                            <div className="quotation-card-actions">
                        <span className={`quotation-status quotation-status-${quotation.status}`}>
                          {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                        </span>
                                            </div>
                                        </div>

                                        <div className="quotation-card-details">
                                            <div>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                          Total:
                        </span>
                                                <span
                                                    style={{
                                                        fontSize: "var(--font-size-lg)",
                                                        fontWeight: "var(--font-weight-semibold)",
                                                        marginLeft: "var(--spacing-sm)",
                                                    }}
                                                >
                          R{(Number(quotation.total) || 0).toFixed(2)}
                        </span>
                                            </div>

                                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                                                {quotation.createdAt?.toLocaleDateString?.()
                                                    ? quotation.createdAt.toLocaleDateString()
                                                    : new Date(quotation.createdAt as any).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "var(--spacing-xs)",
                                                marginTop: "var(--spacing-md)",
                                                paddingTop: "var(--spacing-md)",
                                                borderTop: "1px solid var(--color-border-light)",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => handleDownloadPDF(quotation)}
                                                style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                            >
                                                📄 Download PDF
                                            </button>

                                            <button
                                                className="btn btn-outline"
                                                onClick={() => startEdit(quotation)}
                                                style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                            >
                                                ✏️ Edit
                                            </button>

                                            <button
                                                className="btn btn-outline"
                                                onClick={() => handleDelete(quotation.id!)}
                                                style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectQuotations;
