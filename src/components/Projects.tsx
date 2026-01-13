// src/components/Projects.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, type User } from "firebase/auth";
import { createProject, getUserProjects, type Project } from "../services/projectService";
import { useToast } from "../contexts/ToastContext";

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // store normalized project names for fast lookup
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

        // ✅ Prevent duplicates (case-insensitive + ignores extra spaces)
        if (existingProjectNames.has(normalized)) {
            showToast("A project with this name already exists. Please choose a different name.", "error");
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
                    <p className="profile-subtitle">Manage your construction projects</p>
                </div>

                <div className="profile-section">
                    {!showForm ? (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            + New Project
                        </button>
                    ) : (
                        <div className="profile-form">
                            <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "var(--font-size-xl)" }}>
                                Create New Project
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name" className="form-label">
                                        Project Name
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter project name"
                                        required
                                        disabled={saving}
                                    />

                                    {/* ✅ Inline duplicate warning (same UI) */}
                                    {formData.name.trim().length > 0 && isDuplicateName && (
                                        <div
                                            style={{
                                                marginTop: "6px",
                                                fontSize: "var(--font-size-xs)",
                                                color: "var(--color-danger, #d93025)",
                                            }}
                                        >
                                            This project name already exists. Choose a different one.
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location" className="form-label">
                                        Location
                                    </label>
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        className="form-control"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Enter project location"
                                        required
                                        disabled={saving}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="status" className="form-label">
                                        Status
                                    </label>
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
                                        title={isDuplicateName ? "Duplicate project name" : undefined}
                                    >
                                        {saving ? "Creating..." : "Create Project"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {projects.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "var(--spacing-3xl) 0",
                                color: "var(--color-text-secondary)",
                                marginTop: "var(--spacing-2xl)",
                            }}
                        >
                            <p>No projects yet. Create your first project!</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: "var(--spacing-2xl)" }}>
                            <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "var(--font-size-xl)" }}>
                                Your Projects
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        style={{
                                            display: "block",
                                            padding: "var(--spacing-lg)",
                                            backgroundColor: "var(--color-background)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--border-radius)",
                                            textDecoration: "none",
                                            transition: "all var(--transition-base)",
                                            cursor: "pointer",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "var(--color-primary)";
                                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "var(--color-border)";
                                            e.currentTarget.style.boxShadow = "none";
                                            e.currentTarget.style.transform = "translateY(0)";
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ flex: 1 }}>
                                                <h4
                                                    style={{
                                                        margin: 0,
                                                        marginBottom: "var(--spacing-xs)",
                                                        fontSize: "var(--font-size-lg)",
                                                        color: "var(--color-text)",
                                                    }}
                                                >
                                                    {project.name}
                                                </h4>
                                                <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
                                                    📍 {project.location}
                                                </p>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "var(--font-size-xs)",
                                                    padding: "4px 8px",
                                                    backgroundColor: project.status === "started" ? "#E6F4EA" : "#F1F3F4",
                                                    color: project.status === "started" ? "#137333" : "#5F6368",
                                                    borderRadius: "var(--border-radius)",
                                                    fontWeight: "var(--font-weight-medium)",
                                                }}
                                            >
                                                {project.status === "started" ? "Started" : "Not Started"}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Projects;
