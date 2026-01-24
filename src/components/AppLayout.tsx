import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const AppLayout: React.FC = () => {
    // Synchronized state for the entire layout
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Layout Dimensions
    const sidebarWidth = isCollapsed ? 70 : 260;
    const topbarHeight = 64;

    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            background: "var(--color-background-muted, #f9fafb)",
            width: "100%",
            // Keep the main body from horizontal scrolling during sidebar transitions
            overflowX: "hidden"
        }}>
            {/* 1. SIDEBAR (Fixed Position)
                Inside Sidebar.tsx, ensure the root element has:
                position: fixed, width: sidebarWidth, zIndex: 100
            */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            {/* 2. MAIN WRAPPER
                marginLeft ensures this container starts where the sidebar ends.
            */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    marginLeft: sidebarWidth,
                    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    width: `calc(100% - ${sidebarWidth}px)`,
                    minWidth: 0,
                }}
            >
                {/* 3. TOPBAR (Fixed Position)
                    Crucial Fix: Inside Topbar.tsx, the header style must include:
                    position: fixed, top: 0, left: sidebarWidth, right: 0, zIndex: 90
                */}
                <Topbar isSidebarCollapsed={isCollapsed} />

                {/* 4. MAIN CONTENT AREA */}
                <main
                    style={{
                        flex: 1,
                        // marginTop prevents content from sitting under the fixed Topbar
                        marginTop: topbarHeight,
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start", // Left-aligned
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    {/* Inner wrapper ensures Outlet content fills the width left-to-right */}
                    <div style={{
                        width: "100%",
                        textAlign: "left"
                    }}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;