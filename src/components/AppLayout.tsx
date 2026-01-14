import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const AppLayout: React.FC = () => {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Topbar />

                <main
                    style={{
                        flex: 1,
                        padding: "24px",
                        background: "var(--color-background-muted)",
                    }}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
