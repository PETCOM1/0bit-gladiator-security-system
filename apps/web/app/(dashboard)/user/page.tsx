"use client";

import { useAuth } from "@/shared/context/AuthContext";
import Link from "next/link";
import { User, Settings, FolderClosed, ChevronRight } from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();

  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Officer";

  const firstName = displayName.split(" ")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Welcome, {firstName}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Access your shift telemetry and profile settings.
        </p>
      </div>

      {/* Project Card empty state */}
      <div style={{ 
        background: "var(--color-card-bg)", 
        border: "1px solid var(--color-card-border)", 
        borderRadius: "var(--radius-xl)", 
        boxShadow: "var(--color-card-shadow)",
        overflow: "hidden" 
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>Active Duties</h3>
        </div>
        <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ 
            width: "56px", 
            height: "56px", 
            borderRadius: "50%", 
            background: "var(--color-accent-subtle)", 
            color: "var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px"
          }}>
            <FolderClosed size={24} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
            No Active Projects Assigned
          </p>
          <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", margin: "0 0 24px", lineHeight: 1.5, maxWidth: "380px" }}>
            Your security site and active patrol projects will appear here once your manager adds you to a roster.
          </p>
          <Link href="/profile" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            background: "var(--color-accent)",
            borderRadius: "var(--radius-md)",
            fontSize: "13.5px", 
            fontWeight: 700,
            color: "var(--color-accent-text)",
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
            transition: "opacity var(--transition-fast)"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Complete your profile <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        {[
          { href: "/profile",  label: "Profile Settings",  icon: User, color: "var(--color-accent)", bg: "var(--color-accent-subtle)", desc: "Update your contact info and credentials." },
          { href: "/settings", label: "Preferences", icon: Settings, color: "var(--color-info)", bg: "var(--color-info-subtle)", desc: "Manage notifications and authentication settings." },
        ].map(({ href, label, icon: Icon, color, bg, desc }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div style={{
              padding: "24px",
              background: "var(--color-card-bg)",
              border: "1px solid var(--color-card-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--color-card-shadow)",
              transition: "transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              height: "100%",
              boxSizing: "border-box"
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = color; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
            >
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "var(--radius-md)", 
                background: bg, 
                color: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Icon size={20} />
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{label}</p>
                <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
