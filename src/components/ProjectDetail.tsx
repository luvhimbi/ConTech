// src/components/ProjectDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getUserProjects, updateProject, deleteProject, type Project } from '../services/projectService';
import { useToast } from '../contexts/ToastContext';

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser && projectId) {
                await loadProject(projectId);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [projectId]);

    const loadProject = async (pId: string) => {
        try {
            setLoading(true);
            const projects = await getUserProjects(auth.currentUser!.uid);
            const foundProject = projects.find(p => p.id === pId);
            if (foundProject) {
                setProject(foundProject);
            } else {
                showToast('Project not found', 'error');
                navigate('/projects');
            }
        } catch (error: any) {
            showToast('Failed to load project: ' + error.message, 'error');
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: 'not_started' | 'started') => {
        if (!user || !project) return;

        try {
            await updateProject(project.id!, { status: newStatus });
            showToast('Project status updated!', 'success');
            await loadProject(project.id!);
        } catch (error: any) {
            showToast('Failed to update project: ' + error.message, 'error');
        }
    };

    const handleDelete = async () => {
        if (!user || !project || !window.confirm('Are you sure you want to delete this project?')) return;

        try {
            await deleteProject(project.id!);
            showToast('Project deleted successfully!', 'success');
            navigate('/projects');
        } catch (error: any) {
            showToast('Failed to delete project: ' + error.message, 'error');
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Loading project details...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Please log in to view project details.</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Project not found.</p>
                    <Link to="/projects" className="btn btn-primary">Back to Projects</Link>
                </div>
            </div>
        );
    }

    // Shared style for the feature cards
    const cardStyle: React.CSSProperties = {
        display: 'block',
        padding: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--border-radius)',
        textDecoration: 'none',
        transition: 'all var(--transition-base)',
        cursor: 'pointer',
        color: 'inherit'
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
        const target = e.currentTarget;
        target.style.borderColor = 'var(--color-primary)';
        target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        target.style.transform = 'translateY(-2px)';
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
        const target = e.currentTarget;
        target.style.borderColor = 'var(--color-border)';
        target.style.boxShadow = 'none';
        target.style.transform = 'translateY(0)';
    };

    return (
        <div className="page-content">
            <div className="container container-md">
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <Link
                        to="/projects"
                        style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-secondary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            marginBottom: 'var(--spacing-md)'
                        }}
                    >
                        ← Back to Projects
                    </Link>
                </div>

                <div className="profile-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="profile-title" style={{ margin: 0 }}>{project.name}</h1>
                            <p className="profile-subtitle" style={{ marginTop: 'var(--spacing-xs)' }}>
                                📍 {project.location}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                            <select
                                value={project.status}
                                onChange={(e) => handleStatusChange(e.target.value as 'not_started' | 'started')}
                                className="form-control"
                                style={{
                                    width: 'auto',
                                    fontSize: 'var(--font-size-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)'
                                }}
                            >
                                <option value="not_started">Not Started</option>
                                <option value="started">Started</option>
                            </select>
                            <button
                                className="btn btn-outline"
                                onClick={handleDelete}
                                style={{
                                    fontSize: 'var(--font-size-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    borderColor: '#ff4d4f',
                                    color: '#ff4d4f'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                <div className="profile-section" style={{ marginTop: 'var(--spacing-xl)' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 'var(--spacing-lg)'
                    }}>
                        {/* Quotations Card */}
                        <Link
                            to={`/projects/${projectId}/quotations`}
                            style={cardStyle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-sm)' }}>
                                📋
                            </div>
                            <h3 style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-md)' }}>
                                Quotations
                            </h3>
                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                Create and manage client quotations
                            </p>
                        </Link>

                        {/* Invoices Card */}
                        <Link
                            to={`/projects/${projectId}/invoices`}
                            style={cardStyle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-sm)' }}>
                                💰
                            </div>
                            <h3 style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-md)' }}>
                                Invoices
                            </h3>
                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                Generate and download professional invoices
                            </p>
                        </Link>

                        {/* Reports Placeholder */}
                        <div style={{ ...cardStyle, opacity: 0.6, cursor: 'default' }}>
                            <div style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-sm)' }}>
                                📊
                            </div>
                            <h3 style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-md)' }}>
                                Reports
                            </h3>
                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                Analytics and project tracking (Coming soon)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;