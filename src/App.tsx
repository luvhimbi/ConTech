// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import ProjectQuotations from './components/ProjectQuotations';
import Invoices from "./components/Invoices.tsx";
import Clients from "./components/Clients.tsx";
import ClientDetails from "./components/ClientDetails.tsx";
import Pipeline from "./components/Pipeline.tsx";

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <Router>
                    <div className="page-container">
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<Navigate to="/login" />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/clients/:clientId" element={<ClientDetails />} />
                            <Route path="/pipeline" element={<Pipeline />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/:projectId" element={<ProjectDetail />} />
                            <Route path="/projects/:projectId/quotations" element={<ProjectQuotations />} />
                            <Route path="/projects/:projectId/invoices" element={<Invoices />} />
                            <Route path="/profile" element={<Profile />} />
                        </Routes>
                        <Footer />
                    </div>
                </Router>
            </ToastProvider>
        </ErrorBoundary>
    );
};

export default App;