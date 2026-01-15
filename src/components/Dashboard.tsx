// src/components/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { getUserProfile, type UserProfile } from "../services/authService";
import {
  Users,
  Briefcase,
  GitBranch,
  User as UserIcon,
  ArrowRight,
  Plus,
  DollarSign,
  FileText,
  TrendingUp,
  Layers,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.firstName?.trim() || "User";
  const companyName = profile?.companyName?.trim() || "";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserProfile(user.uid);
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="page-content" style={{ padding: "var(--spacing-xl) 0" }}>
      <div className="container" style={{ maxWidth: 1200 }}>
        {/* Header Section */}
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.05em",
                }}
              >
                {greeting}, {firstName}
              </span>
              <h1
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "32px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                {loading ? "..." : companyName || "Dashboard"}
              </h1>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                to="/projects"
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <Plus size={18} /> New Project
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Navigation Hub */}
        <div
          style={{
            background: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "var(--spacing-xl)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Layers size={22} color="var(--color-primary)" />
              Operations Management
            </h3>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "14px",
                color: "var(--color-text-secondary)",
              }}
            >
              Access and manage your core business modules.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "var(--spacing-lg)",
            }}
          >
            <QuickLink
              to="/projects"
              title="Projects & Jobs"
              desc="View active sites, schedules, and project documentation."
              icon={<Briefcase size={22} />}
            />
            <QuickLink
              to="/clients"
              title="Client Directory"
              desc="Comprehensive database of leads and recurring customers."
              icon={<Users size={22} />}
            />
            <QuickLink
              to="/profile"
              title="Business Settings"
              desc="Configure tax rates, billing info, and company details."
              icon={<UserIcon size={22} />}
            />
          </div>
        </div>

        {/* Footer Insight */}
        <div
          style={{
            marginTop: "var(--spacing-xl)",
            textAlign: "center",
            padding: "20px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            System Status: Operational • All data synced with Cloud Firestore
          </p>
        </div>
      </div>
    </div>
  );
};

/* --- Refined Sub-Components --- */

const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div
    style={{
      background: "var(--color-background)",
      border: "1px solid var(--color-border)",
      padding: "20px",
      borderRadius: "14px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "8px",
        color: "var(--color-text-muted)",
      }}
    >
      {icon}
      <span
        style={{
          fontSize: "13px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}
    >
      {value}
    </div>
  </div>
);

const QuickLink = ({
  to,
  title,
  desc,
  icon,
}: {
  to: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) => (
  <Link
    to={to}
    style={{
      textDecoration: "none",
      padding: "24px",
      borderRadius: "14px",
      border: "1px solid var(--color-border)",
      background: "var(--color-surface)",
      display: "flex",
      gap: "20px",
      transition: "all 0.2s ease",
      alignItems: "center",
    }}
  >
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        background: "var(--color-primary-light)",
        color: "var(--color-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontWeight: 700,
          color: "var(--color-text)",
          fontSize: "16px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--color-text-muted)",
          marginTop: "4px",
          lineHeight: 1.4,
        }}
      >
        {desc}
      </div>
    </div>
    <ArrowRight size={18} color="var(--color-text-muted)" />
  </Link>
);

export default Dashboard;
