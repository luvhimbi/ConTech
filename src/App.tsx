// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Projects from "./components/Projects";
import ProjectDetail from "./components/ProjectDetail";
import ProjectQuotations from "./components/ProjectQuotations";
import Invoices from "./components/Invoices";
import Clients from "./components/Clients";
import ClientDetails from "./components/ClientDetails";
import Pipeline from "./components/Pipeline";
import OfflineBanner from "./components/OfflineBanner";

import WebsiteHome from "./pages/website/Home";
import WebsiteFeatures from "./pages/website/Features";
import WebsitePricing from "./pages/website/Pricing";
import WebsiteContact from "./pages/website/Contact";
import WebsiteWhyUs from "./pages/website/WhyUs";
import QuoteRequest from "./pages/public/QuoteRequest.tsx";
import QuoteFormSettings from "./components/QuoteFormSettings.tsx";
import QuotePreview from "./pages/public/QuotePreview.tsx";
import FormAnalytics from "./components/FormAnalytics.tsx";
import QuoteRequests from "./components/QuoteRequests.tsx";
import QuoteRequestDetail from "./components/QuoteRequestDetail.tsx";
import AppLayout from "./components/AppLayout.tsx";
import WebsiteLayout from "./components/WebLayout.tsx";
import DocsLayout from "./components/DocsLayout.tsx";

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <Router>
                    <div className="page-container">


                        {/*  Banner should sit right under the navbar so it shows everywhere */}
                        <OfflineBanner />

                        <Routes>
                            {/* WEBSITE (Public) */}
                            <Route element={<WebsiteLayout />}>
                                <Route path="/" element={<WebsiteHome />} />
                                <Route path="/features" element={<WebsiteFeatures />} />
                                <Route path="/pricing" element={<WebsitePricing />} />
                                <Route path="/contact" element={<WebsiteContact />} />
                                <Route path="/why-us" element={<WebsiteWhyUs />} />

                                {/* AUTH ROUTES (Also typically share the Navbar) */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                            </Route>
                            {/* MAIN APP (Private) */}
                            <Route element={<AppLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/clients/:clientId" element={<ClientDetails />} />
                            <Route path="/pipeline" element={<Pipeline />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/:projectId" element={<ProjectDetail />} />
                            <Route path="/projects/:projectId/quotations" element={<ProjectQuotations />} />
                            <Route path="/projects/:projectId/invoices" element={<Invoices />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/q-preview" element={<QuotePreview />} />
                            <Route path="/settings/quote-form" element={<QuoteFormSettings />} />
                            <Route path="/q/:slug" element={<QuoteRequest />} />
                            <Route path="/form-analytics" element={<FormAnalytics />} />
                            <Route path="/quote-requests" element={<QuoteRequests />} />
                            <Route path="/quote-requests/:id" element={<QuoteRequestDetail />} />

                                <Route path="/docs" element={<DocsLayout />} />
                                {/* fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                            </Route>
                        </Routes>

                        <Footer />
                    </div>
                </Router>
            </ToastProvider>
        </ErrorBoundary>
    );
};

export default App;
