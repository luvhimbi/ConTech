// src/layouts/WebsiteLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const WebsiteLayout: React.FC = () => {
    return (
        <div className="website-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                {/* This is where the specific page content will render */}
                <Outlet />
            </main>
            {/* You can also add a Footer here if you have one */}
        </div>
    );
};

export default WebsiteLayout;