import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    FileText,
    BarChart3,
    Settings,
    User,
    GitBranch,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    HelpCircle
} from "lucide-react";

const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const link = ({ isActive }: { isActive: boolean }) => ({
        display: "flex",
        alignItems: "center",
        gap: isCollapsed ? 0 : 10,
        padding: "10px 14px",
        borderRadius: 10,
        textDecoration: "none",
        fontSize: 14,
        color: "var(--color-text)",
        background: isActive ? "var(--color-border-light)" : "transparent",
        transition: "all 0.2s ease",
        justifyContent: isCollapsed ? "center" : "flex-start",
    });

    const iconSize = { width: 18, height: 18, minWidth: 18 };

    return (
        <aside
            style={{
                width: isCollapsed ? 70 : 260,
                borderRight: "1px solid var(--color-border)",
                background: "var(--color-background)",
                padding: "16px 10px",
                display: "flex",
                flexDirection: "column",
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                height: "100vh",
                overflowX: "hidden"
            }}
        >
            {/* Collapse Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    position: "absolute",
                    right: 8,
                    top: 12,
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10
                }}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Scrollable Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Workspace */}
                <Section title="Workspace" isCollapsed={isCollapsed}>
                    <NavLink to="/dashboard" style={link} title="Dashboard">
                        <LayoutDashboard style={iconSize} />
                        {!isCollapsed && <span>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/pipeline" style={link} title="Pipeline">
                        <GitBranch style={iconSize} />
                        {!isCollapsed && <span>Pipeline</span>}
                    </NavLink>
                </Section>

                {/* Operations */}
                <Section title="Operations" isCollapsed={isCollapsed}>
                    <NavLink to="/clients" style={link} title="Clients">
                        <Users style={iconSize} />
                        {!isCollapsed && <span>Clients</span>}
                    </NavLink>
                    <NavLink to="/projects" style={link} title="Projects">
                        <FolderKanban style={iconSize} />
                        {!isCollapsed && <span>Projects</span>}
                    </NavLink>
                </Section>

                {/* Forms & Sales */}
                <Section title="Forms & Sales" isCollapsed={isCollapsed}>
                    <NavLink to="/quote-requests" style={link} title="Quote Requests">
                        <FileText style={iconSize} />
                        {!isCollapsed && <span>Quote Requests</span>}
                    </NavLink>
                    <NavLink to="/form-analytics" style={link} title="Form Analytics">
                        <BarChart3 style={iconSize} />
                        {!isCollapsed && <span>Form Analytics</span>}
                    </NavLink>
                    <NavLink to="/settings/quote-form" style={link} title="Quote Form Settings">
                        <Settings style={iconSize} />
                        {!isCollapsed && <span>Quote Form</span>}
                    </NavLink>
                </Section>

                {/* Account */}
                <Section title="Account" isCollapsed={isCollapsed}>
                    <NavLink to="/profile" style={link} title="Profile">
                        <User style={iconSize} />
                        {!isCollapsed && <span>Profile</span>}
                    </NavLink>
                </Section>
            </div>

            {/* Bottom Support/Docs Section */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16, marginTop: "auto" }}>
                <Section title="Support" isCollapsed={isCollapsed}>
                    <NavLink to="/docs" style={link} title="Documentation">
                        <BookOpen style={iconSize} />
                        {!isCollapsed && <span>Documentation</span>}
                    </NavLink>
                    {!isCollapsed && (
                        <div style={{
                            marginTop: 8,
                            padding: "12px",
                            background: "var(--color-surface-alt, #f4f4f5)",
                            borderRadius: 10,
                            fontSize: 12,
                            color: "var(--color-text-secondary)"
                        }}>
                            Need help? <br />
                            <a href="mailto:support@contech.com" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>Contact Support</a>
                        </div>
                    )}
                </Section>
            </div>
        </aside>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode; isCollapsed: boolean }> = ({
                                                                                                   title,
                                                                                                   children,
                                                                                                   isCollapsed
                                                                                               }) => (
    <div style={{ marginBottom: 10 }}>
        {!isCollapsed ? (
            <div
                style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-muted)",
                    padding: "6px 14px",
                    marginBottom: 4,
                    whiteSpace: "nowrap"
                }}
            >
                {title}
            </div>
        ) : (
            <div style={{ height: 1, background: "var(--color-border)", margin: "10px 10px" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {children}
        </div>
    </div>
);

export default Sidebar;