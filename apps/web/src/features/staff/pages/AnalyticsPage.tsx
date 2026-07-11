"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building2, Users, MapPin, Ban } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";

interface Stats {
  totalTenants: number;
  activeCount: number;
  suspendedCount: number;
  totalUsersReached: number;
  totalSitesReached: number;
  planBreakdown: { plan: string; count: number }[];
  monthlyOnboarding: { month: string; count: number }[];
  recentTenants: {
    id: string; name: string; subscriptionStatus: string; plan: string;
    createdAt: string; userCount: number; siteCount: number;
  }[];
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div style={{
      background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
      borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", padding: "20px 24px",
      display: "flex", alignItems: "center", gap: "16px",
    }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "var(--radius-md)",
        background: "var(--color-accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "var(--color-accent)",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>{label}</div>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const router = useRouter();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getMyTenantStats()
      .then((res) => setStats(res.data?.data ?? null))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", color: "var(--color-text-muted)" }}>Loading analytics...</div>;
  }

  if (!stats) {
    return <div style={{ padding: "40px", color: "var(--color-danger)" }}>Failed to load analytics.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Analytics</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Your tenant onboarding activity and growth
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <StatCard icon={<Building2 size={18} />} label="Tenants Onboarded" value={stats.totalTenants} />
        <StatCard icon={<Building2 size={18} />} label="Active" value={stats.activeCount} />
        <StatCard icon={<Ban size={18} />} label="Suspended" value={stats.suspendedCount} />
        <StatCard icon={<Users size={18} />} label="Users Reached" value={stats.totalUsersReached} />
        <StatCard icon={<MapPin size={18} />} label="Sites Reached" value={stats.totalSitesReached} />
      </div>

      {/* Onboarding trend */}
      <div style={{
        background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "24px" }}>
          Tenants Onboarded (Last 6 Months)
        </h3>
        <div style={{ height: "220px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyOnboarding}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} dx={-10} />
              <Tooltip
                contentStyle={{ background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--color-card-shadow)" }}
                itemStyle={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="count" name="Tenants" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Plan breakdown */}
        <div style={{
          background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>By Plan</h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            {stats.planBreakdown.length === 0 ? (
              <p style={{ padding: "20px 24px", fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No tenants onboarded yet.</p>
            ) : stats.planBreakdown.map((p) => (
              <div key={p.plan} style={{ display: "flex", justifyContent: "space-between", padding: "10px 24px" }}>
                <span style={{ fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{p.plan}</span>
                <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tenants */}
        <div style={{
          background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Recently Onboarded</h3>
          </div>
          <div>
            {stats.recentTenants.length === 0 ? (
              <p style={{ padding: "20px 24px", fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No tenants onboarded yet.</p>
            ) : stats.recentTenants.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push(`/staff/tenants/${t.id}`)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 24px", borderTop: "1px solid var(--color-border)", cursor: "pointer",
                }}
              >
                <div>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{t.name}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
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
        </div>
      </div>
    </div>
  );
}
