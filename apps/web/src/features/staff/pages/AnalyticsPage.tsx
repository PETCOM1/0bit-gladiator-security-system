"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, MapPin, Ban, CheckCircle2, LifeBuoy, TrendingUp, FileBarChart } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";
import { useAuth } from "@/shared/context/AuthContext";
import { exportAccountManagerReport } from "@/shared/utils/pdf";
import {
  cardStyle, KpiCard, SectionAnchor, MiniTrendChart, EmptyList,
  AnalyticsHeader, LoadingSpinner, ErrorState,
} from "@/shared/components/analytics/AnalyticsKit";

interface Stats {
  totalTenants: number;
  activeCount: number;
  suspendedCount: number;
  totalUsersReached: number;
  totalSitesReached: number;
  ticketsSolved: number;
  ticketsOpen: number;
  planBreakdown: { plan: string; count: number }[];
  monthlyOnboarding: { month: string; count: number }[];
  recentTenants: {
    id: string; name: string; subscriptionStatus: string; plan: string;
    createdAt: string; userCount: number; siteCount: number;
  }[];
}

const TABS = [{ id: "overview" as const, label: "Overview" }];

export function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    superAdminService.getMyTenantStats()
      .then((res) => setStats(res.data?.data ?? null))
      .catch((err) => { console.error(err); setError("Failed to load analytics."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDownloadPDF = () => {
    if (!stats) return;
    const formattedPeriod = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const formattedGenerated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    exportAccountManagerReport({
      managerName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Account Manager",
      reportPeriod: formattedPeriod,
      generatedDate: formattedGenerated,
      kpis: {
        totalTenants: stats.totalTenants,
        activeCount: stats.activeCount,
        suspendedCount: stats.suspendedCount,
        totalUsersReached: stats.totalUsersReached,
        totalSitesReached: stats.totalSitesReached,
        ticketsSolved: stats.ticketsSolved,
        ticketsOpen: stats.ticketsOpen,
      },
      planBreakdown: stats.planBreakdown,
      monthlyOnboarding: stats.monthlyOnboarding,
      recentTenants: stats.recentTenants.map((t) => ({
        name: t.name, plan: t.plan, subscriptionStatus: t.subscriptionStatus,
        createdAt: t.createdAt, userCount: t.userCount, siteCount: t.siteCount,
      })),
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error || !stats) return <ErrorState message={error || "No data available."} onRetry={loadData} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <AnalyticsHeader
        icon={<FileBarChart size={20} />}
        title="Analytics"
        subtitle="Your tenant onboarding activity and growth"
        tabs={TABS}
        activeTab="overview"
        onTabChange={() => {}}
        onRefresh={loadData}
        onDownload={handleDownloadPDF}
      />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <KpiCard icon={<Building2 size={18} />} label="Tenants Onboarded" value={stats.totalTenants} />
        <KpiCard icon={<Building2 size={18} />} label="Active" value={stats.activeCount} />
        <KpiCard icon={<Ban size={18} />} label="Suspended" value={stats.suspendedCount} />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Tickets Solved" value={stats.ticketsSolved} />
        <KpiCard icon={<LifeBuoy size={18} />} label="Tickets Open" value={stats.ticketsOpen} />
        <KpiCard icon={<Users size={18} />} label="Users Reached" value={stats.totalUsersReached} />
        <KpiCard icon={<MapPin size={18} />} label="Sites Reached" value={stats.totalSitesReached} />
      </div>

      {/* Onboarding trend */}
      <div style={cardStyle}>
        <SectionAnchor icon={<TrendingUp size={16} color="var(--color-accent)" />} title="Tenants Onboarded" subtitle="Monthly onboarding volume over the last 6 months" />
        <MiniTrendChart data={stats.monthlyOnboarding} dataKey="count" xKey="month" color="var(--color-accent)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Plan breakdown */}
        <div style={cardStyle}>
          <SectionAnchor icon={<Building2 size={16} color="var(--color-accent)" />} title="By Plan" subtitle="Tenants grouped by subscription plan" />
          {stats.planBreakdown.length === 0 ? <EmptyList text="No tenants onboarded yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {stats.planBreakdown.map((p) => (
                <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>{p.plan}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent tenants */}
        <div style={cardStyle}>
          <SectionAnchor icon={<Users size={16} color="var(--color-accent)" />} title="Recently Onboarded" subtitle="Latest tenants added to your portfolio" />
          {stats.recentTenants.length === 0 ? <EmptyList text="No tenants onboarded yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {stats.recentTenants.map((t) => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/staff/tenants/${t.id}`)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)", cursor: "pointer",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: "11.5px", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                      {new Date(t.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {t.plan}
                    </p>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700,
                    background: t.subscriptionStatus === "SUSPENDED" ? "var(--color-danger-subtle)" : "var(--color-success-subtle)",
                    color: t.subscriptionStatus === "SUSPENDED" ? "var(--color-danger)" : "var(--color-success)",
                    textTransform: "uppercase",
                  }}>
                    {t.subscriptionStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
