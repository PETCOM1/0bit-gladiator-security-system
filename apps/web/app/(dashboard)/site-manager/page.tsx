"use client";

import { useAuth } from "@/shared/context/AuthContext";
import SiteDetailsView from "@/features/manager/components/SiteDetailsView";

export default function SiteManagerDashboard() {
  const { user } = useAuth();

  if (!user?.siteId) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
        You have not been assigned to a site yet. Please contact your administrator.
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const greeting = user?.firstName ? `${getGreeting()}, ${user.firstName}` : "Welcome Back";
  const companyName = user?.tenant?.name || "Gladiator Pro";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
          {greeting}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px", margin: 0 }}>
          Site Supervisor at <strong style={{ color: "var(--color-text-primary)" }}>{companyName}</strong>
        </p>
      </div>
      <SiteDetailsView siteId={user.siteId} hideBackButton={true} />
    </div>
  );
}
