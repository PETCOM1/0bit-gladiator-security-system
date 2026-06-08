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

  return <SiteDetailsView siteId={user.siteId} hideBackButton={true} />;
}
