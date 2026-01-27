import React from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    FileText,
    Settings,
    User,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Plus,
    Receipt
} from "lucide-react";

type LinkStyleArgs = { isActive: boolean };

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
    const link = ({ isActive }: LinkStyleArgs): React.CSSProperties => ({
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

    const iconSize: React.CSSProperties = { width: 18, height: 18, minWidth: 18 };

    return (
        <aside
            style={{
                // FIXED POSITIONING: Stays constant
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 100,
                width: isCollapsed ? 70 : 260,
                borderRight: "1px solid var(--color-border)",
                background: "var(--color-background)",
                padding: "16px 10px",
                display: "flex",
                flexDirection: "column",
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                height: "100vh",
                overflowY: "auto",
                overflowX: "hidden",
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
                    zIndex: 110,
                }}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
                <Section title="Workspace" isCollapsed={isCollapsed}>
                    <NavLink to="/dashboard" style={link} title="Dashboard">
                        <LayoutDashboard style={iconSize} />
                        {!isCollapsed && <span>Dashboard</span>}
                    </NavLink>
                </Section>

                <Section title="Quick Create" isCollapsed={isCollapsed}>
                    <NavLink to="/quotes/new" style={link} title="New Quote">
                        <Plus style={iconSize} />
                        {!isCollapsed && <span>New Quote</span>}
                    </NavLink>
                    <NavLink to="/invoices/new" style={link} title="New Invoice">
                        <Receipt style={iconSize} />
                        {!isCollapsed && <span>New Invoice</span>}
                    </NavLink>
                </Section>



                <Section title="Sales" isCollapsed={isCollapsed}>

                    <NavLink to="/items" style={link} title="Items">
                        <FileText style={iconSize} />
                        {!isCollapsed && <span>Items</span>}
                    </NavLink>
                    <NavLink to="/quote-requests" style={link} title="Quote Requests">
                        <FileText style={iconSize} />
                        {!isCollapsed && <span>Quote Requests</span>}
                    </NavLink>
                </Section>

                <Section title="Customers" isCollapsed={isCollapsed}>
                    <NavLink to="/clients" style={link} title="Clients">
                        <Users style={iconSize} />
                        {!isCollapsed && <span>Clients</span>}
                    </NavLink>
                    <NavLink to="/projects" style={link} title="Jobs">
                        <FolderKanban style={iconSize} />
                        {!isCollapsed && <span>Jobs</span>}
                    </NavLink>
                </Section>

                <Section title="Settings" isCollapsed={isCollapsed}>
                    <NavLink to="/settings/quote-form" style={link} title="Quote Form Settings">
                        <Settings style={iconSize} />
                        {!isCollapsed && <span>Quote Form</span>}
                    </NavLink>
                    <NavLink to="/profile" style={link} title="Profile">
                        <User style={iconSize} />
                        {!isCollapsed && <span>Profile</span>}
                    </NavLink>
                </Section>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16, marginTop: "auto" }}>
                <Section title="Support" isCollapsed={isCollapsed}>
                    <NavLink to="/docs" style={link} title="Documentation">
                        <BookOpen style={iconSize} />
                        {!isCollapsed && <span>Documentation</span>}
                    </NavLink>
                </Section>
            </div>
        </aside>
    );
};

const Section: React.FC<{
    title: string;
    children: React.ReactNode;
    isCollapsed: boolean;
}> = ({ title, children, isCollapsed }) => (
    <div style={{ marginBottom: 6 }}>
        {!isCollapsed ? (
            <div style={{ padding: "0 14px 6px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                    {title}
                </div>
            </div>
        ) : (
            <div style={{ height: 1, background: "var(--color-border)", margin: "10px 10px" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
);

export default Sidebar;