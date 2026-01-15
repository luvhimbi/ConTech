// src/components/ProjectDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getUserProjects, updateProject, deleteProject, type Project } from '../services/projectService';
import { useToast } from '../contexts/ToastContext';
import {
    ArrowLeft,
    MapPin,
    Trash2,
    FileText,
    CreditCard,
    BarChart3,
    Loader2,
    AlertCircle,
    ChevronRight,
    CircleDot
} from 'lucide-react';

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
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
        setIsUpdating(true);
        try {
            await updateProject(project.id!, { status: newStatus });
            showToast('Project status updated!', 'success');
            await loadProject(project.id!);
        } catch (error: any) {
            showToast('Failed to update project: ' + error.message, 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !project || !window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

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
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
                    <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>Loading project details...</p>
                </div>
            </div>
        );
    }

    if (!user || !project) {
        return (
            <div className="page-content">
                <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                    <AlertCircle size={48} color="var(--color-danger)" style={{ marginBottom: 16 }} />
                    <p>Project not found or you are not authorized to view it.</p>
                    <Link to="/projects" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Projects</Link>
                </div>
            </div>
        );
    }

    const cardStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        color: 'inherit',
        position: 'relative',
        overflow: 'hidden'
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
        const target = e.currentTarget;
        target.style.borderColor = 'var(--color-primary)';
        target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.08)';
        target.style.transform = 'translateY(-4px)';
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
                <div style={{ marginBottom: '24px' }}>
                    <Link
                        to="/projects"
                        style={{
                            fontSize: '14px',
                            color: 'var(--color-text-secondary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 500
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Projects
                    </Link>
                </div>

                <div className="profile-header" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <h1 className="profile-title" style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{project.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--color-text-secondary)' }}>
                                <MapPin size={16} />
                                <span>{project.location}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                {isUpdating && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', left: '-20px' }} />}
                                <select
                                    value={project.status}
                                    onChange={(e) => handleStatusChange(e.target.value as 'not_started' | 'started')}
                                    className="form-control"
                                    style={{
                                        width: 'auto',
                                        fontSize: '13px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        backgroundColor: project.status === 'started' ? '#f0fdf4' : '#f8fafc',
                                        borderColor: project.status === 'started' ? '#bbf7d0' : '#e2e8f0',
                                        color: project.status === 'started' ? '#166534' : '#475569',
                                    }}
                                >
                                    <option value="not_started">Not Started</option>
                                    <option value="started">Started</option>
                                </select>
                            </div>
                            <button
                                className="btn-delete-icon"
                                onClick={handleDelete}
                                title="Delete Project"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    border: '1px solid #fee2e2',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Quotations Card */}
                        <Link
                            to={`/projects/${projectId}/quotations`}
                            style={cardStyle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div style={iconCircleStyle('var(--color-primary)')}>
                                <FileText size={24} color="var(--color-primary)" />
                            </div>
                            <h3 style={cardTitleStyle}>Quotations</h3>
                            <p style={cardDescStyle}>Create and manage professional client quotations.</p>
                            <ChevronRight size={18} style={cardArrowStyle} />
                        </Link>

                        {/* Invoices Card */}
                        <Link
                            to={`/projects/${projectId}/invoices`}
                            style={cardStyle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div style={iconCircleStyle('#0ea5e9')}>
                                <CreditCard size={24} color="#0ea5e9" />
                            </div>
                            <h3 style={cardTitleStyle}>Invoices</h3>
                            <p style={cardDescStyle}>Generate, track and download project invoices.</p>
                            <ChevronRight size={18} style={cardArrowStyle} />
                        </Link>

                        {/* Reports Card */}
                        <div style={{ ...cardStyle, opacity: 0.6, cursor: 'default' }}>
                            <div style={iconCircleStyle('#64748b')}>
                                <BarChart3 size={24} color="#64748b" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={cardTitleStyle}>Reports</h3>
                                <span style={comingSoonBadgeStyle}>SOON</span>
                            </div>
                            <p style={cardDescStyle}>View analytics and detailed project tracking.</p>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .btn-delete-icon:hover {
                    background-color: #dc2626 !important;
                    color: white !important;
                    transform: scale(1.05);
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

/* ---------------- Internal Styles ---------------- */

const iconCircleStyle = (color: string): React.CSSProperties => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
});

const cardTitleStyle: React.CSSProperties = {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 700
};

const cardDescStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
    maxWidth: '90%'
};

const cardArrowStyle: React.CSSProperties = {
    position: 'absolute',
    right: '20px',
    top: '20px',
    color: 'var(--color-border)'
};

const comingSoonBadgeStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 6px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '4px'
};

export default ProjectDetail;