// src/components/ProjectQuotations.tsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
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

import { createCatalogItem, getUserCatalogItems, type CatalogItem, type ItemType } from "../services/itemService";

import {
    Plus,
    X,
    Trash2,
    Pencil,
    FileDown,
    Save,
    ChevronLeft,
    Search,
    Package,
    Wrench,
    AlertTriangle,
    Filter,
    Rows3,
} from "lucide-react";

type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

type QuickAddForm = {
    name: string;
    description: string;
    unitPrice: string;
    unit: string;
    type: ItemType;
    isActive: boolean;
};

const money = (n: any) => `R${(Number(n) || 0).toFixed(2)}`;

function deepClone<T>(x: T): T {
    return JSON.parse(JSON.stringify(x));
}

function sanitizeNumber(value: any, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function isSameJson(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
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

// Small hook to debounce a value (fixes “search search” feeling + makes search reliable)
function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(t);
    }, [value, delayMs]);

    return debounced;
}

const ProjectQuotations: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Clients
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [saveClient, setSaveClient] = useState(true);

    // Auth & profile
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

    // Form UI
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

    // Catalog items
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);

    // Search controls
    const [catalogSearch, setCatalogSearch] = useState("");
    const [catalogTypeFilter, setCatalogTypeFilter] = useState<"all" | ItemType>("all");

    // Only show results after user initiates search at least once
    const [catalogQueryCommitted, setCatalogQueryCommitted] = useState(false);

    // We commit the query string separately so the user can type without immediately changing results
    const [catalogCommittedQuery, setCatalogCommittedQuery] = useState("");
    const debouncedSearch = useDebouncedValue(catalogSearch, 250);

    // Catalog pagination
    const [catalogPage, setCatalogPage] = useState(1);
    const CATALOG_PAGE_SIZE = 8;

    // Quick add modal
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemSaving, setItemSaving] = useState(false);
    const [quickItem, setQuickItem] = useState<QuickAddForm>({
        name: "",
        description: "",
        unitPrice: "0",
        unit: "",
        type: "service",
        isActive: true,
    });

    // Unsaved changes guard
    const initialSnapshotRef = useRef<any>(null);
    const [dirty, setDirty] = useState(false);

    const makeSnapshot = useCallback(() => {
        return {
            editingId,
            showForm,
            selectedClientId,
            saveClient,
            formData,
        };
    }, [editingId, showForm, selectedClientId, saveClient, formData]);

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

    const safeNavigate = useCallback(
        (to: string) => {
            if (!confirmDiscard()) return;
            navigate(to);
        },
        [navigate, confirmDiscard]
    );

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
                    loadCatalogItems(currentUser.uid),
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

    const loadCatalogItems = async (uid: string) => {
        try {
            setCatalogLoading(true);
            const list = await getUserCatalogItems(uid, false);
            const active = (list || []).filter((x) => Boolean(x.isActive));
            setCatalogItems(active);
        } catch (e: any) {
            console.error("Failed to load catalog items", e);
        } finally {
            setCatalogLoading(false);
        }
    };

    // -------------------- FORM HANDLERS --------------------
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            if (name === "taxRate") return { ...prev, taxRate: Number(value) || 0 };
            return { ...prev, [name]: value };
        });

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
        setSelectedClientId("");
        setSaveClient(true);

        // Reset catalog search state
        setCatalogSearch("");
        setCatalogTypeFilter("all");
        setCatalogQueryCommitted(false);
        setCatalogCommittedQuery("");
        setCatalogPage(1);

        initialSnapshotRef.current = null;
        setDirty(false);
    };

    const totals = useMemo(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + sanitizeNumber(item.total, 0), 0);
        const taxRate = sanitizeNumber(formData.taxRate, 0);
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

    // -------------------- CATALOG SEARCH (FIXED) --------------------
    const onCatalogSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const q = catalogSearch.trim();
        if (q.length < 2) {
            setCatalogQueryCommitted(false);
            setCatalogCommittedQuery("");
            setCatalogPage(1);
            showToast("Type at least 2 characters to search items.", "error");
            return;
        }

        setCatalogQueryCommitted(true);
        setCatalogCommittedQuery(q);
        setCatalogPage(1);
    };

    useEffect(() => {
        if (!catalogQueryCommitted) return;

        const q = debouncedSearch.trim();
        if (q.length < 2) {
            setCatalogCommittedQuery("");
            setCatalogPage(1);
            return;
        }

        setCatalogCommittedQuery(q);
        setCatalogPage(1);
    }, [debouncedSearch, catalogQueryCommitted]);

    const catalogFilteredAll = useMemo(() => {
        if (!catalogQueryCommitted) return [];

        const q = (catalogCommittedQuery || "").trim().toLowerCase();
        if (q.length < 2) return [];

        const base = (catalogItems || []).filter((it) => {
            if (catalogTypeFilter !== "all" && it.type !== catalogTypeFilter) return false;

            const a = (it.name || "").toLowerCase();
            const b = (it.description || "").toLowerCase();
            const c = (it.unit || "").toLowerCase();

            return a.includes(q) || b.includes(q) || c.includes(q);
        });

        base.sort((x, y) => (x.name || "").localeCompare(y.name || ""));
        return base;
    }, [catalogItems, catalogCommittedQuery, catalogTypeFilter, catalogQueryCommitted]);

    const catalogTotalPages = useMemo(() => {
        const total = catalogFilteredAll.length;
        return Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
    }, [catalogFilteredAll.length]);

    const catalogPageItems = useMemo(() => {
        if (!catalogQueryCommitted) return [];
        const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
        return catalogFilteredAll.slice(start, start + CATALOG_PAGE_SIZE);
    }, [catalogFilteredAll, catalogPage, catalogQueryCommitted]);

    useEffect(() => {
        if (!catalogQueryCommitted) return;
        if (catalogPage > catalogTotalPages) setCatalogPage(catalogTotalPages);
    }, [catalogPage, catalogTotalPages, catalogQueryCommitted]);

    const addCatalogItemToQuote = (it: CatalogItem) => {
        const description = (it.name || "").trim();
        const unitPrice = sanitizeNumber(it.unitPrice, 0);

        setFormData((prev) => {
            const newItem: QuotationItem = {
                description,
                quantity: 1,
                unitPrice,
                total: 1 * unitPrice,
            };

            return { ...prev, items: [...prev.items, newItem] };
        });
    };

    // -------------------- QUICK ADD ITEM MODAL --------------------
    const resetQuickItem = () => {
        setQuickItem({
            name: "",
            description: "",
            unitPrice: "0",
            unit: "",
            type: "service",
            isActive: true,
        });
    };

    const openQuickItemModal = () => {
        resetQuickItem();
        setShowItemModal(true);
    };

    const saveQuickItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const name = quickItem.name.trim();
        if (!name) {
            showToast("Item name is required.", "error");
            return;
        }

        const price = Number(quickItem.unitPrice);
        if (Number.isNaN(price) || price < 0) {
            showToast("Unit price must be a valid number.", "error");
            return;
        }

        try {
            setItemSaving(true);

            await createCatalogItem(user.uid, {
                name,
                description: quickItem.description.trim() || undefined,
                unitPrice: price,
                unit: quickItem.unit.trim() || undefined,
                type: quickItem.type,
                isActive: quickItem.isActive,
            });

            await loadCatalogItems(user.uid);

            // Add to current quotation too
            addCatalogItemToQuote({
                id: "tmp",
                name,
                description: quickItem.description.trim() || undefined,
                unitPrice: price,
                unit: quickItem.unit.trim() || undefined,
                type: quickItem.type,
                isActive: quickItem.isActive,
            } as any);

            setShowItemModal(false);
            showToast("Item created and added to quotation.", "success");
        } catch (err: any) {
            showToast("Failed to create item: " + (err?.message ?? "Unknown error"), "error");
        } finally {
            setItemSaving(false);
        }
    };

    // -------------------- EDIT MODE --------------------
    const startEdit = (q: Quotation) => {
        setEditingId(q.id || null);
        setShowForm(true);

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
                        quantity: sanitizeNumber(it.quantity, 1),
                        unitPrice: sanitizeNumber(it.unitPrice, 0),
                        total: sanitizeNumber(it.quantity, 0) * sanitizeNumber(it.unitPrice, 0),
                    }))
                    : [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
            taxRate: sanitizeNumber(q.taxRate, 0),
            notes: q.notes || "",
            validUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : "",
            status: ((q.status as QuotationStatus) || "draft") as QuotationStatus,
        });

        initialSnapshotRef.current = null;
        setDirty(false);

        // reset catalog state (optional, but keeps things clean on edit)
        setCatalogSearch("");
        setCatalogCommittedQuery("");
        setCatalogQueryCommitted(false);
        setCatalogPage(1);
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
                    taxRate: sanitizeNumber(formData.taxRate, 0),
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
                    taxRate: sanitizeNumber(formData.taxRate, 0),
                    notes: formData.notes.trim() || undefined,
                    validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
                    status: formData.status,
                });

                showToast("Quotation created successfully!", "success");
            }

            resetForm();
            setShowForm(false);
            await loadQuotations(projectId);

            initialSnapshotRef.current = null;
            setDirty(false);
        } catch (error: any) {
            showToast(
                (editingId ? "Failed to update quotation: " : "Failed to create quotation: ") + (error?.message ?? "Unknown error"),
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
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => safeNavigate(`/projects/${projectId}`)}
                        style={{
                            fontSize: "var(--font-size-sm)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: "var(--spacing-md)",
                        }}
                    >
                        <ChevronLeft size={16} />
                        Back to {project.name}
                    </button>
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
                                    <h3 style={{ margin: 0, fontSize: "var(--font-size-xl)" }}>{editingId ? "Update Quotation" : "Create New Quotation"}</h3>
                                    {dirty ? (
                                        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 12, color: "var(--color-text-secondary)" }}>
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
                                            <label className="form-label">Select Client</label>
                                            <select className="form-control" value={selectedClientId} onChange={(e) => handleSelectClient(e.target.value)} disabled={saving}>
                                                <option value="">Choose saved client</option>
                                                {clients.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} ({c.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {!editingId && (
                                            <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <input id="saveClient" type="checkbox" checked={saveClient} onChange={(e) => setSaveClient(e.target.checked)} disabled={saving} />
                                                <label htmlFor="saveClient" className="form-label" style={{ margin: 0 }}>
                                                    Save client for next time
                                                </label>
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label className="form-label">Client Name *</label>
                                            <input type="text" name="clientName" className="form-control" value={formData.clientName} onChange={handleInputChange} required disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Email *</label>
                                            <input type="email" name="clientEmail" className="form-control" value={formData.clientEmail} onChange={handleInputChange} required disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Address *</label>
                                            <textarea name="clientAddress" className="form-control" value={formData.clientAddress} onChange={handleInputChange} rows={3} required disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Client Phone</label>
                                            <input type="tel" name="clientPhone" className="form-control" value={formData.clientPhone} onChange={handleInputChange} disabled={saving} />
                                        </div>
                                    </div>

                                    <div className="quotation-form-section">
                                        <h4 className="quotation-section-title">Quotation Details</h4>

                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select name="status" className="form-control" value={formData.status} onChange={handleInputChange} disabled={saving}>
                                                <option value="draft">Draft</option>
                                                <option value="sent">Sent</option>
                                                <option value="accepted">Accepted</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Tax Rate (%)</label>
                                            <input type="number" name="taxRate" className="form-control" value={formData.taxRate} onChange={handleInputChange} min="0" max="100" step="0.01" disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Valid Until</label>
                                            <input type="date" name="validUntil" className="form-control" value={formData.validUntil} onChange={handleInputChange} disabled={saving} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <textarea name="notes" className="form-control" value={formData.notes} onChange={handleInputChange} rows={4} placeholder="Additional notes or terms..." disabled={saving} />
                                        </div>
                                    </div>
                                </div>

                                {/* ITEMS + CATALOG TABLE */}
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
                                                onClick={openQuickItemModal}
                                                disabled={saving || !user}
                                                style={{
                                                    fontSize: "var(--font-size-xs)",
                                                    padding: "6px 12px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                                title="Create a new item and add it"
                                            >
                                                <Plus size={16} />
                                                New item
                                            </button>

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

                                    {/* SEARCH-FIRST CATALOG TABLE */}
                                    <div
                                        style={{
                                            marginTop: "var(--spacing-md)",
                                            padding: 12,
                                            border: "1px solid var(--color-border-light)",
                                            borderRadius: "var(--border-radius)",
                                            background: "var(--color-surface)",
                                        }}
                                    >
                                        <form onSubmit={onCatalogSearchSubmit} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                                <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}>
                                                    <Search
                                                        size={16}
                                                        style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.6 }}
                                                    />

                                                    <input
                                                        className="form-control"
                                                        placeholder="Search saved items (min 2 characters)..."
                                                        value={catalogSearch}
                                                        onChange={(e) => {
                                                            setCatalogSearch(e.target.value);
                                                            setCatalogPage(1);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault(); // ✅ stops reload
                                                                onCatalogSearchSubmit();
                                                            }
                                                        }}
                                                        disabled={saving}
                                                        style={{ paddingLeft: 34 }}
                                                    />
                                                </div>

                                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                                        <Filter size={16} />
                                                        <select
                                                            className="form-control"
                                                            value={catalogTypeFilter}
                                                            onChange={(e) => {
                                                                setCatalogTypeFilter(e.target.value as any);
                                                                setCatalogPage(1);
                                                            }}
                                                            disabled={saving}
                                                            style={{ width: 170 }}
                                                            title="Filter by item type"
                                                        >
                                                            <option value="all">All types</option>
                                                            <option value="service">Services</option>
                                                            <option value="product">Products</option>
                                                        </select>
                                                    </div>

                                                    <button
                                                        type="button" // ✅ IMPORTANT: prevents submit behavior
                                                        className="btn btn-outline"
                                                        onClick={() => onCatalogSearchSubmit()}
                                                        disabled={saving || catalogLoading}
                                                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                                        title="Show results"
                                                    >
                                                        <Search size={16} />
                                                        Search
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => user && loadCatalogItems(user.uid)}
                                                        disabled={saving || catalogLoading}
                                                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                                        title="Refresh from database"
                                                    >
                                                        <Save size={16} />
                                                        Refresh
                                                    </button>

                                                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                                        {catalogLoading ? "Loading..." : `${catalogItems.length} active item(s) saved`}
                                                    </div>
                                                </div>
                                            </div>
                                        </form>

                                        {!catalogQueryCommitted ? (
                                            <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                                                <Rows3 size={16} />
                                                Search to display results. This avoids showing a long list when you have many items.
                                            </div>
                                        ) : (
                                            <div style={{ marginTop: 12 }}>
                                                {catalogFilteredAll.length === 0 ? (
                                                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                                        {catalogCommittedQuery.trim().length < 2 ? "Type at least 2 characters to see results." : "No results found. Try a different search, or create a new item."}
                                                    </div>
                                                ) : (
                                                    <div style={{ overflowX: "auto" }}>
                                                        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                                            <thead>
                                                            <tr>
                                                                <th style={{ textAlign: "left", padding: "10px 8px" }}>Name</th>
                                                                <th style={{ textAlign: "left", padding: "10px 8px" }}>Type</th>
                                                                <th style={{ textAlign: "left", padding: "10px 8px" }}>Unit</th>
                                                                <th style={{ textAlign: "right", padding: "10px 8px" }}>Unit Price</th>
                                                                <th style={{ width: 140, padding: "10px 8px" }}></th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {catalogPageItems.map((it) => (
                                                                <tr key={it.id} style={{ borderTop: "1px solid var(--color-border-light)" }}>
                                                                    <td style={{ padding: "10px 8px" }}>
                                                                        <div style={{ fontWeight: 700 }}>{it.name}</div>
                                                                        {it.description ? <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{it.description}</div> : null}
                                                                    </td>
                                                                    <td style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)" }}>
                                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                        {it.type === "product" ? <Package size={16} /> : <Wrench size={16} />}
                                          {it.type === "product" ? "Product" : "Service"}
                                      </span>
                                                                    </td>
                                                                    <td style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)" }}>{it.unit || "-"}</td>
                                                                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700 }}>{money(it.unitPrice)}</td>
                                                                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                                                                        <button type="button" className="btn btn-primary" onClick={() => addCatalogItemToQuote(it)} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                                                            <Plus size={16} />
                                                                            Add
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>

                                                        {/* Pagination */}
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 10, flexWrap: "wrap" }}>
                                                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                                                Showing {(catalogPage - 1) * CATALOG_PAGE_SIZE + 1}-{Math.min(catalogPage * CATALOG_PAGE_SIZE, catalogFilteredAll.length)} of {catalogFilteredAll.length}
                                                            </div>

                                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                                <button type="button" className="btn btn-outline" onClick={() => setCatalogPage((p) => Math.max(1, p - 1))} disabled={catalogPage <= 1}>
                                                                    Previous
                                                                </button>

                                                                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                                                    Page {catalogPage} of {catalogTotalPages}
                                                                </div>

                                                                <button type="button" className="btn btn-outline" onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))} disabled={catalogPage >= catalogTotalPages}>
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quote items editor */}
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

                                                <div style={{ width: "100px", padding: "8px 12px", fontSize: "var(--font-size-sm)" }}>{money(item.total)}</div>

                                                {formData.items.length > 1 ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => removeItem(index)}
                                                        style={{ width: "48px", padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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

                                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                        <Save size={16} />
                                        {saving ? (editingId ? "Updating..." : "Creating...") : editingId ? "Update Quotation" : "Create Quotation"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ✅ Quotations list converted to a TABLE (instead of cards) */}
                    {quotations.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "var(--spacing-3xl) 0", color: "var(--color-text-secondary)", marginTop: "var(--spacing-2xl)" }}>
                            <p>No quotations yet. Create your first quotation!</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: "var(--spacing-2xl)" }}>
                            <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "var(--font-size-xl)" }}>All Quotations</h3>

                            <div style={{ border: "1px solid var(--color-border-light)", borderRadius: "var(--border-radius)", overflow: "hidden", background: "var(--color-surface)" }}>
                                <div style={{ overflowX: "auto" }}>
                                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Quotation #</th>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Client</th>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Status</th>
                                            <th style={{ textAlign: "right", padding: "12px 10px" }}>Total</th>
                                            <th style={{ textAlign: "left", padding: "12px 10px" }}>Created</th>
                                            <th style={{ textAlign: "right", padding: "12px 10px", width: 340 }}>Actions</th>
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

                                                <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 800 }}>{money((q as any).total ?? q.total)}</td>

                                                <td style={{ padding: "12px 10px", fontSize: 12, color: "var(--color-text-secondary)" }}>{formatDate(q.createdAt)}</td>

                                                {/* ✅ FINISHED ACTIONS CELL */}
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
                                                            onClick={() => handleDownloadPDF(q)}
                                                            disabled={saving}
                                                            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                                            title="Download PDF"
                                                        >
                                                            <FileDown size={16} />
                                                            PDF
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
                        </div>
                    )}
                </div>

                {/* ✅ QUICK ADD ITEM MODAL */}
                {showItemModal ? (
                    <div
                        role="dialog"
                        aria-modal="true"
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.45)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 16,
                            zIndex: 1000,
                        }}
                        onMouseDown={(e) => {
                            // close when clicking backdrop
                            if (e.target === e.currentTarget) setShowItemModal(false);
                        }}
                    >
                        <div
                            style={{
                                width: "min(700px, 100%)",
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border-light)",
                                borderRadius: "var(--border-radius)",
                                boxShadow: "var(--shadow-md)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    padding: 14,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    borderBottom: "1px solid var(--color-border-light)",
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <div style={{ fontWeight: 900, fontSize: 16 }}>Create Item</div>
                                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Save an item to your catalog and add it to the quotation.</div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowItemModal(false)}
                                    disabled={itemSaving}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px" }}
                                >
                                    <X size={16} />
                                    Close
                                </button>
                            </div>

                            <form onSubmit={saveQuickItem} style={{ padding: 14, display: "grid", gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Item name *</label>
                                    <input
                                        className="form-control"
                                        value={quickItem.name}
                                        onChange={(e) => setQuickItem((p) => ({ ...p, name: e.target.value }))}
                                        disabled={itemSaving}
                                        placeholder="e.g. Website design"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={quickItem.description}
                                        onChange={(e) => setQuickItem((p) => ({ ...p, description: e.target.value }))}
                                        disabled={itemSaving}
                                        placeholder="Optional description..."
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-control"
                                            value={quickItem.type}
                                            onChange={(e) => setQuickItem((p) => ({ ...p, type: e.target.value as ItemType }))}
                                            disabled={itemSaving}
                                        >
                                            <option value="service">Service</option>
                                            <option value="product">Product</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Unit</label>
                                        <input
                                            className="form-control"
                                            value={quickItem.unit}
                                            onChange={(e) => setQuickItem((p) => ({ ...p, unit: e.target.value }))}
                                            disabled={itemSaving}
                                            placeholder="e.g. hour, item, day"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Unit price</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={quickItem.unitPrice}
                                            onChange={(e) => setQuickItem((p) => ({ ...p, unitPrice: e.target.value }))}
                                            disabled={itemSaving}
                                        />
                                    </div>

                                    <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 28 }}>
                                        <input
                                            id="isActive"
                                            type="checkbox"
                                            checked={quickItem.isActive}
                                            onChange={(e) => setQuickItem((p) => ({ ...p, isActive: e.target.checked }))}
                                            disabled={itemSaving}
                                        />
                                        <label htmlFor="isActive" className="form-label" style={{ margin: 0 }}>
                                            Active (available in search)
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowItemModal(false)} disabled={itemSaving}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={itemSaving} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                        <Save size={16} />
                                        {itemSaving ? "Saving..." : "Save item"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ProjectQuotations;
