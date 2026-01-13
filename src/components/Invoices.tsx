// src/components/ProjectInvoices.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";

import { getUserClients, createClient, type Client } from "../services/clientService";

import {
    createInvoice,
    getProjectInvoices,
    deleteInvoice,
    updateInvoice,
    type Invoice,
    type InvoiceItem,
    type InvoiceStatus,
} from "../services/invoiceService";

import { getUserProjects } from "../services/projectService";
import { getUserProfile } from "../services/profileService";
import { useToast } from "../contexts/ToastContext";
import { generateInvoicePDF } from "../utils/invoicePdfGenerator";

type DepositRatePreset = 15 | 30 | 50 | "custom";

type MilestoneStatus = "pending" | "in_progress" | "completed";
type Milestone = {
    title: string;
    description: string;
    amount: number;
    dueDate: string; // yyyy-mm-dd
    status: MilestoneStatus;
};

type BillingDetails = {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;

    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    accountType: string;
    paymentReferenceNote: string;
};

const Invoices: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // ✅ Clients (same logic as quotations)
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
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // edit mode
    const [editingId, setEditingId] = useState<string | null>(null);

    // ✅ NEW: milestones state
    const [milestones, setMilestones] = useState<Milestone[]>([
        { title: "", description: "", amount: 0, dueDate: "", status: "pending" },
    ]);

    // ✅ NEW: deposit state
    const [depositEnabled, setDepositEnabled] = useState(false);
    const [depositPreset, setDepositPreset] = useState<DepositRatePreset>(15);
    const [depositCustomRate, setDepositCustomRate] = useState<number>(15);
    const [depositDueDate, setDepositDueDate] = useState<string>("");

    // ✅ NEW: billing details
    const [billing, setBilling] = useState<BillingDetails>({
        businessName: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",

        bankName: "",
        accountName: "",
        accountNumber: "",
        branchCode: "",
        accountType: "",
        paymentReferenceNote: "",
    });

    const [formData, setFormData] = useState<{
        clientName: string;
        clientEmail: string;
        clientAddress: string;
        clientPhone: string;
        items: InvoiceItem[];
        taxRate: number;
        dueDate: string;
        status: InvoiceStatus;
    }>({
        clientName: "",
        clientEmail: "",
        clientAddress: "",
        clientPhone: "",
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        taxRate: 0,
        dueDate: "",
        status: "pending",
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
                    loadInvoices(projectId),
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

            // ✅ Prefill billing details (safe defaults)
            setBilling((prev) => ({
                ...prev,
                businessName: prev.businessName || profile.companyName || "",
                email: prev.email || profile.email || "",
                contactName:
                    prev.contactName ||
                    `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
            }));
        } catch (error) {
            console.error("Failed to load user profile:", error);
        }
    };

    const loadInvoices = async (pid: string) => {
        try {
            const projectInvoices = await getProjectInvoices(pid);
            setInvoices(projectInvoices);
        } catch (error: any) {
            showToast("Failed to load invoices: " + (error?.message ?? "Unknown error"), "error");
        }
    };

    const loadClients = async (userId: string) => {
        try {
            const list = await getUserClients(userId);
            setClients(list);
        } catch (error) {
            console.error("Failed to load clients:", error);
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

        // detach from selected client if typing
        if (
            name === "clientName" ||
            name === "clientEmail" ||
            name === "clientAddress" ||
            name === "clientPhone"
        ) {
            setSelectedClientId("");
        }
    };

    const handleBillingChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setBilling((prev) => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        setFormData((prev) => {
            const newItems = prev.items.map((it, i) => {
                if (i !== index) return it;

                const updated: InvoiceItem = {
                    ...it,
                    [field]: field === "description" ? String(value) : Number(value),
                } as InvoiceItem;

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

    // ✅ Milestones UI handlers
    const addMilestone = () => {
        setMilestones((prev) => [
            ...prev,
            { title: "", description: "", amount: 0, dueDate: "", status: "pending" },
        ]);
    };

    const removeMilestone = (index: number) => {
        setMilestones((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.length
                ? updated
                : [{ title: "", description: "", amount: 0, dueDate: "", status: "pending" }];
        });
    };

    const handleMilestoneChange = (
        index: number,
        field: keyof Milestone,
        value: string | number
    ) => {
        setMilestones((prev) =>
            prev.map((m, i) =>
                i === index
                    ? {
                        ...m,
                        [field]:
                            field === "amount"
                                ? Number(value) || 0
                                : (value as any),
                    }
                    : m
            )
        );
    };

    const resetForm = () => {
        setFormData({
            clientName: "",
            clientEmail: "",
            clientAddress: "",
            clientPhone: "",
            items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: 0,
            dueDate: "",
            status: "pending",
        });

        setMilestones([{ title: "", description: "", amount: 0, dueDate: "", status: "pending" }]);

        setDepositEnabled(false);
        setDepositPreset(15);
        setDepositCustomRate(15);
        setDepositDueDate("");

        setEditingId(null);
        setSelectedClientId("");
        setSaveClient(true);
    };

    const totals = useMemo(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const rate = Number(formData.taxRate) || 0;
        const taxAmount = (subtotal * rate) / 100;
        const totalAmount = subtotal + taxAmount;
        return { subtotal, taxAmount, totalAmount };
    }, [formData.items, formData.taxRate]);

    const depositRate = useMemo(() => {
        return depositPreset === "custom" ? Number(depositCustomRate) || 0 : depositPreset;
    }, [depositPreset, depositCustomRate]);

    const depositAmount = useMemo(() => {
        if (!depositEnabled) return 0;
        const rate = Number(depositRate) || 0;
        return (totals.totalAmount * rate) / 100;
    }, [depositEnabled, depositRate, totals.totalAmount]);

    // Select client -> autofill fields
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
    const startEdit = (inv: any) => {
        setEditingId(inv.id || null);
        setShowForm(true);

        setSelectedClientId("");
        setSaveClient(false);

        setFormData({
            clientName: inv.clientName || "",
            clientEmail: inv.clientEmail || "",
            clientAddress: inv.clientAddress || "",
            clientPhone: inv.clientPhone || "",
            items:
                (inv.items || []).length > 0
                    ? inv.items.map((it: any) => ({
                        description: it.description || "",
                        quantity: Number(it.quantity) || 1,
                        unitPrice: Number(it.unitPrice) || 0,
                        total: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
                    }))
                    : [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: Number(inv.taxRate) || 0,
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : "",
            status: (inv.status as InvoiceStatus) || "pending",
        });

        // ✅ Load billing/milestones/deposit if present
        if (inv.billing) {
            setBilling((prev) => ({
                ...prev,
                ...inv.billing,
            }));
        }

        if (Array.isArray(inv.milestones) && inv.milestones.length) {
            setMilestones(
                inv.milestones.map((m: any) => ({
                    title: m.title || "",
                    description: m.description || "",
                    amount: Number(m.amount) || 0,
                    dueDate: m.dueDate ? new Date(m.dueDate).toISOString().slice(0, 10) : "",
                    status: (m.status as MilestoneStatus) || "pending",
                }))
            );
        }

        if (inv.deposit) {
            setDepositEnabled(Boolean(inv.deposit.enabled));
            setDepositDueDate(inv.deposit.dueDate ? new Date(inv.deposit.dueDate).toISOString().slice(0, 10) : "");

            const r = Number(inv.deposit.ratePercent) || 0;
            if (r === 15 || r === 30 || r === 50) {
                setDepositPreset(r);
                setDepositCustomRate(r);
            } else {
                setDepositPreset("custom");
                setDepositCustomRate(r);
            }
        }
    };

    // -------------------- SUBMIT --------------------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !projectId) return;

        if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
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

        const cleanedMilestones = milestones
            .map((m) => ({
                title: (m.title || "").trim(),
                description: (m.description || "").trim(),
                amount: Number(m.amount) || 0,
                dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
                status: m.status,
            }))
            .filter((m) => m.title.length > 0);

        setSaving(true);
        try {
            // save-client logic (only on create)
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
                    await loadClients(user.uid);
                }
            }

            const payloadExtra = {
                billing: {
                    businessName: billing.businessName.trim(),
                    contactName: billing.contactName.trim(),
                    email: billing.email.trim(),
                    phone: billing.phone.trim(),
                    address: billing.address.trim(),
                    bankName: billing.bankName.trim(),
                    accountName: billing.accountName.trim(),
                    accountNumber: billing.accountNumber.trim(),
                    branchCode: billing.branchCode.trim(),
                    accountType: billing.accountType.trim(),
                    paymentReferenceNote: billing.paymentReferenceNote.trim(),
                },
                milestones: cleanedMilestones.map((m) => ({
                    title: m.title,
                    description: m.description,
                    amount: m.amount,
                    dueDate: m.dueDate,
                    status: m.status,
                })),
                deposit: {
                    enabled: depositEnabled,
                    ratePercent: Number(depositRate) || 0,
                    amount: depositEnabled ? Number(depositAmount) || 0 : 0,
                    dueDate: depositDueDate ? new Date(depositDueDate) : undefined,
                },
            };

            if (editingId) {
                await updateInvoice(projectId, editingId, {
                    clientName: formData.clientName.trim(),
                    clientEmail: formData.clientEmail.trim(),
                    clientAddress: formData.clientAddress.trim() || undefined,
                    clientPhone: formData.clientPhone.trim() || undefined,
                    items: cleanedItems.map((i) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    taxRate: Number(formData.taxRate) || 0,
                    dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
                    status: formData.status,
                    ...(payloadExtra as any),
                });

                showToast("Invoice updated successfully!", "success");
            } else {
                await createInvoice(projectId, user.uid, {
                    clientName: formData.clientName.trim(),
                    clientEmail: formData.clientEmail.trim(),
                    clientAddress: formData.clientAddress.trim() || undefined,
                    clientPhone: formData.clientPhone.trim() || undefined,
                    items: cleanedItems.map((i) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    taxRate: Number(formData.taxRate) || 0,
                    dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
                    status: formData.status,
                    ...(payloadExtra as any),
                });

                showToast("Invoice created successfully!", "success");
            }

            resetForm();
            setShowForm(false);
            await loadInvoices(projectId);
        } catch (error: any) {
            showToast(
                (editingId ? "Failed to update invoice: " : "Failed to create invoice: ") +
                (error?.message ?? "Unknown error"),
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = (invoice: Invoice) => {
        if (!userProfile) {
            showToast("User profile not loaded", "error");
            return;
        }
        try {
            generateInvoicePDF(invoice as any, userProfile, project?.name);
            showToast("PDF generated successfully!", "success");
        } catch (error: any) {
            showToast("Failed to generate PDF: " + (error?.message ?? "Unknown error"), "error");
        }
    };

    const handleDelete = async (invoiceId: string) => {
        if (!user || !projectId) return;
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;

        try {
            await deleteInvoice(projectId, invoiceId);
            showToast("Invoice deleted successfully!", "success");
            await loadInvoices(projectId);

            if (editingId === invoiceId) {
                resetForm();
                setShowForm(false);
            }
        } catch (error: any) {
            showToast("Failed to delete invoice: " + (error?.message ?? "Unknown error"), "error");
        }
    };

    // -------------------- RENDER --------------------
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
                    <p>Please log in to view invoices.</p>
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
                    <h1 className="profile-title">Invoices</h1>
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
                            + New Invoice
                        </button>
                    ) : (
                        <div className="quotation-form-container">
                            <div className="quotation-form-header">
                                <h3 style={{ margin: 0, fontSize: "var(--font-size-xl)" }}>
                                    {editingId ? "Update Invoice" : "Create New Invoice"}
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
                                {/* CLIENT + INVOICE DETAILS */}
                                <div className="quotation-form-grid">
                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Client Information</h4>

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

                                        {!editingId && (
                                            <div
                                                className="form-group"
                                                style={{ display: "flex", gap: "8px", alignItems: "center" }}
                                            >
                                                <input
                                                    id="saveClientInvoice"
                                                    type="checkbox"
                                                    checked={saveClient}
                                                    onChange={(e) => setSaveClient(e.target.checked)}
                                                    disabled={saving}
                                                />
                                                <label htmlFor="saveClientInvoice" className="form-label" style={{ margin: 0 }}>
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
                                            <label className="form-label">Client Address</label>
                                            <textarea
                                                name="clientAddress"
                                                className="form-control"
                                                value={formData.clientAddress}
                                                onChange={handleInputChange}
                                                rows={3}
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
                                        <h4 className="quotation-section-title">Invoice Details</h4>

                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select
                                                name="status"
                                                className="form-control"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid</option>
                                                <option value="cancelled">Cancelled</option>
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
                                            <label className="form-label">Due Date</label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                className="form-control"
                                                value={formData.dueDate}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            />
                                        </div>

                                        {/* ✅ Deposit UI */}
                                        <div className="form-group" style={{ marginTop: "var(--spacing-lg)" }}>
                                            <h4 className="quotation-section-title" style={{ marginBottom: "var(--spacing-sm)" }}>
                                                Deposit
                                            </h4>

                                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                                                <input
                                                    id="depositEnabled"
                                                    type="checkbox"
                                                    checked={depositEnabled}
                                                    onChange={(e) => setDepositEnabled(e.target.checked)}
                                                    disabled={saving}
                                                />
                                                <label htmlFor="depositEnabled" className="form-label" style={{ margin: 0 }}>
                                                    Enable deposit
                                                </label>
                                            </div>

                                            {depositEnabled && (
                                                <>
                                                    <div className="form-group">
                                                        <label className="form-label">Deposit Rate</label>
                                                        <select
                                                            className="form-control"
                                                            value={depositPreset}
                                                            onChange={(e) => setDepositPreset(e.target.value as any)}
                                                            disabled={saving}
                                                        >
                                                            <option value={15}>15%</option>
                                                            <option value={30}>30%</option>
                                                            <option value={50}>50%</option>
                                                            <option value="custom">Custom</option>
                                                        </select>
                                                    </div>

                                                    {depositPreset === "custom" && (
                                                        <div className="form-group">
                                                            <label className="form-label">Custom Rate (%)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={depositCustomRate}
                                                                onChange={(e) => setDepositCustomRate(Number(e.target.value) || 0)}
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                disabled={saving}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="form-group">
                                                        <label className="form-label">Deposit Due Date</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={depositDueDate}
                                                            onChange={(e) => setDepositDueDate(e.target.value)}
                                                            disabled={saving}
                                                        />
                                                    </div>

                                                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                                                        Deposit Amount: <strong>R{depositAmount.toFixed(2)}</strong>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ITEMS */}
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
                                            <span>R{totals.totalAmount.toFixed(2)}</span>
                                        </div>

                                        {depositEnabled && (
                                            <div className="quotation-total-row">
                                                <span>Deposit ({depositRate}%):</span>
                                                <span>R{depositAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ✅ Milestones / Phases */}
                                <div className="quotation-items-section">
                                    <div className="quotation-items-header">
                                        <h4 className="quotation-section-title">Milestones / Phases</h4>
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={addMilestone}
                                            style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                            disabled={saving}
                                        >
                                            + Add Phase
                                        </button>
                                    </div>

                                    <div className="quotation-items-table">
                                        <div className="quotation-items-header-row">
                                            <div style={{ width: "160px" }}>Title</div>
                                            <div style={{ flex: "2" }}>Description</div>
                                            <div style={{ width: "110px" }}>Amount</div>
                                            <div style={{ width: "140px" }}>Due Date</div>
                                            <div style={{ width: "120px" }}>Status</div>
                                            <div style={{ width: "40px" }}></div>
                                        </div>

                                        {milestones.map((m, index) => (
                                            <div key={index} className="quotation-item-row" style={{ alignItems: "flex-start" }}>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={m.title}
                                                    onChange={(e) => handleMilestoneChange(index, "title", e.target.value)}
                                                    placeholder="Phase title"
                                                    style={{ width: "160px", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                />

                                                <textarea
                                                    className="form-control"
                                                    value={m.description}
                                                    onChange={(e) => handleMilestoneChange(index, "description", e.target.value)}
                                                    placeholder="Short description"
                                                    rows={2}
                                                    style={{ flex: "2", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                />

                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={m.amount}
                                                    onChange={(e) => handleMilestoneChange(index, "amount", e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                    style={{ width: "110px", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                />

                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={m.dueDate}
                                                    onChange={(e) => handleMilestoneChange(index, "dueDate", e.target.value)}
                                                    style={{ width: "140px", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                />

                                                <select
                                                    className="form-control"
                                                    value={m.status}
                                                    onChange={(e) => handleMilestoneChange(index, "status", e.target.value)}
                                                    style={{ width: "120px", marginRight: "var(--spacing-sm)" }}
                                                    disabled={saving}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                </select>

                                                {milestones.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => removeMilestone(index)}
                                                        style={{ width: "40px", padding: "6px", fontSize: "var(--font-size-xs)" }}
                                                        disabled={saving}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ✅ Billing Details */}
                                <div className="quotation-items-section">
                                    <h4 className="quotation-section-title">Billing Details (Your Business)</h4>

                                    <div className="quotation-form-grid">
                                        <div className="quotation-form-section">
                                            <div className="form-group">
                                                <label className="form-label">Business Name</label>
                                                <input
                                                    name="businessName"
                                                    className="form-control"
                                                    value={billing.businessName}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Contact Name</label>
                                                <input
                                                    name="contactName"
                                                    className="form-control"
                                                    value={billing.contactName}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Email</label>
                                                <input
                                                    name="email"
                                                    type="email"
                                                    className="form-control"
                                                    value={billing.email}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    name="phone"
                                                    className="form-control"
                                                    value={billing.phone}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Address</label>
                                                <textarea
                                                    name="address"
                                                    className="form-control"
                                                    value={billing.address}
                                                    onChange={handleBillingChange}
                                                    rows={3}
                                                    disabled={saving}
                                                />
                                            </div>
                                        </div>

                                        <div className="quotation-form-section">
                                            <h4 className="quotation-section-title">Payment Details</h4>

                                            <div className="form-group">
                                                <label className="form-label">Bank Name</label>
                                                <input
                                                    name="bankName"
                                                    className="form-control"
                                                    value={billing.bankName}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Account Name</label>
                                                <input
                                                    name="accountName"
                                                    className="form-control"
                                                    value={billing.accountName}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Account Number</label>
                                                <input
                                                    name="accountNumber"
                                                    className="form-control"
                                                    value={billing.accountNumber}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Branch Code</label>
                                                <input
                                                    name="branchCode"
                                                    className="form-control"
                                                    value={billing.branchCode}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Account Type</label>
                                                <input
                                                    name="accountType"
                                                    className="form-control"
                                                    value={billing.accountType}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Payment Reference Note</label>
                                                <input
                                                    name="paymentReferenceNote"
                                                    className="form-control"
                                                    value={billing.paymentReferenceNote}
                                                    onChange={handleBillingChange}
                                                    disabled={saving}
                                                    placeholder="e.g. Use invoice number as reference"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ACTIONS */}
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
                                                ? "Update Invoice"
                                                : "Create Invoice"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {invoices.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "var(--spacing-3xl) 0",
                                color: "var(--color-text-secondary)",
                                marginTop: "var(--spacing-2xl)",
                            }}
                        >
                            <p>No invoices yet. Create your first invoice!</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: "var(--spacing-2xl)" }}>
                            <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "var(--font-size-xl)" }}>
                                All Invoices
                            </h3>

                            <div className="quotation-list">
                                {invoices.map((inv) => (
                                    <div key={inv.id} className="quotation-card">
                                        <div className="quotation-card-header">
                                            <div>
                                                <h4
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "var(--font-size-lg)",
                                                        marginBottom: "var(--spacing-xs)",
                                                    }}
                                                >
                                                    {inv.invoiceNumber}
                                                </h4>

                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "var(--font-size-sm)",
                                                        color: "var(--color-text-secondary)",
                                                    }}
                                                >
                                                    {inv.clientName}
                                                </p>

                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "var(--font-size-xs)",
                                                        color: "var(--color-text-muted)",
                                                        marginTop: "var(--spacing-xs)",
                                                    }}
                                                >
                                                    {inv.clientEmail}
                                                </p>
                                            </div>

                                            <div className="quotation-card-actions">
                        <span className={`quotation-status quotation-status-${inv.status}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
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
                          R{(Number((inv as any).totalAmount) || 0).toFixed(2)}
                        </span>
                                            </div>

                                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                                                {(inv.createdAt as any)?.toLocaleDateString?.()
                                                    ? (inv.createdAt as any).toLocaleDateString()
                                                    : new Date(inv.createdAt as any).toLocaleDateString()}
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
                                                onClick={() => handleDownloadPDF(inv)}
                                                style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                            >
                                                📄 Download PDF
                                            </button>

                                            <button
                                                className="btn btn-outline"
                                                onClick={() => startEdit(inv as any)}
                                                style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
                                            >
                                                ✏️ Edit
                                            </button>

                                            <button
                                                className="btn btn-outline"
                                                onClick={() => handleDelete(inv.id!)}
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

export default Invoices;
