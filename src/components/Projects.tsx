// src/components/Projects.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import { createProject, getUserProjects, type Project } from "../services/projectService";
import { useToast } from "../contexts/ToastContext";
import {
    Plus,
    MapPin,
    Briefcase,
    Loader2,
    AlertCircle,
    ChevronRight,
    Info,
    LayoutGrid
} from "lucide-react";

const normalizeName = (name: string) =>
    name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " "); // collapse multiple spaces

const Projects: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        status: "not_started" as "not_started" | "started",
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await loadProjects(currentUser.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const loadProjects = async (userId: string) => {
        try {
            setLoading(true);
            const userProjects = await getUserProjects(userId);
            setProjects(userProjects);
        } catch (error: any) {
            showToast("Failed to load projects: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const existingProjectNames = useMemo(() => {
        const set = new Set<string>();
        for (const p of projects) {
            if (p?.name) set.add(normalizeName(p.name));
        }
        return set;
    }, [projects]);

    const isDuplicateName = useMemo(() => {
        const name = normalizeName(formData.name);
        if (!name) return false;
        return existingProjectNames.has(name);
    }, [formData.name, existingProjectNames]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const normalized = normalizeName(formData.name);
        if (!normalized) {
            showToast("Project name is required.", "error");
            return;
        }

        if (existingProjectNames.has(normalized)) {
            showToast("A project with this name already exists.", "error");
            return;
        }

        setSaving(true);
        try {
            await createProject({
                name: formData.name.trim(),
                location: formData.location.trim(),
                status: formData.status,
                userId: user.uid,
            });

            showToast("Project created successfully!", "success");
            setFormData({ name: "", location: "", status: "not_started" });
            setShowForm(false);
            await loadProjects(user.uid);
        } catch (error: any) {
            showToast("Failed to create project: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
                    <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>Loading projects...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-content">
                <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Info size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <p>Please log in to view your projects.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container container-md">
                <div className="profile-header">
                    <h1 className="profile-title">Projects</h1>
                    <p className="profile-subtitle">Manage and track your construction developments</p>
                </div>

                <div className="profile-section">
                    {!showForm ? (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={18} /> New Project
                        </button>
                    ) : (
                        <div className="profile-form">
                            <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "var(--font-size-xl)", display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Briefcase size={22} color="var(--color-primary)" /> Create New Project
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name" className="form-label">Project Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Skyline Heights Phase 1"
                                        required
                                        disabled={saving}
                                    />
                                    {formData.name.trim().length > 0 && isDuplicateName && (
                                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#d93025", display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <AlertCircle size={14} /> This project name already exists.
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location" className="form-label">Location</label>
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        className="form-control"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Enter site address"
                                        required
                                        disabled={saving}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="status" className="form-label">Initial Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        className="form-control"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        required
                                        disabled={saving}
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="started">Started</option>
                                    </select>
                                </div>

                                <div className="profile-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setShowForm(false);
                                            setFormData({ name: "", location: "", status: "not_started" });
                                        }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving || isDuplicateName}
                                    >
                                        {saving ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Loader2 className="animate-spin" size={16} /> Creating...
                                            </span>
                                        ) : "Create Project"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {projects.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-secondary)", marginTop: "24px", border: '1px dashed var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                            <LayoutGrid size={48} color="var(--color-border)" style={{ marginBottom: 16 }} />
                            <p>No projects yet. Create your first project to get started!</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: "40px" }}>
                            <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>Your Active Projects</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        className="project-card"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "16px 20px",
                                            backgroundColor: "white",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "12px",
                                            textDecoration: "none",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, marginBottom: "4px", fontSize: "16px", color: "var(--color-text)", fontWeight: 600 }}>
                                                {project.name}
                                            </h4>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: "13px" }}>
                                                <MapPin size={14} /> {project.location}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{
                                                fontSize: "11px",
                                                padding: "4px 10px",
                                                backgroundColor: project.status === "started" ? "#E6F4EA" : "#F1F3F4",
                                                color: project.status === "started" ? "#137333" : "#5F6368",
                                                borderRadius: "20px",
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {project.status === "started" ? "Started" : "Pending"}
                                            </div>
                                            <ChevronRight size={18} color="var(--color-border)" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .project-card:hover {
                    border-color: var(--color-primary) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
                    transform: translateX(4px);
                }
                .project-card:hover svg:last-child {
                    color: var(--color-primary) !important;
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Projects;