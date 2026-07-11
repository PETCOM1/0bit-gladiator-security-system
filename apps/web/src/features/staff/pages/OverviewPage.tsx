"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, MapPin, Ban, CheckCircle2, LifeBuoy,
  Radio, ChevronRight,
} from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";
import { useAuth } from "@/shared/context/AuthContext";

interface Stats {
  totalTenants: number;
  activeCount: number;
  suspendedCount: number;
  totalUsersReached: number;
  totalSitesReached: number;
  ticketsSolved: number;
  ticketsOpen: number;
  recentTenants: {
    id: string; name: string; subscriptionStatus: string; plan: string;
    createdAt: string; userCount: number; siteCount: number;
  }[];
}

export function OverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getMyTenantStats()
      .then((res) => setStats(res.data?.data ?? null))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };
  const greeting = user?.firstName ? `${getGreeting()}, ${user.firstName}` : "Welcome Back";

  const cardStyle = {
    background: "var(--color-card-bg)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-card-border)",
    boxShadow: "var(--color-card-shadow)",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "transform var(--transition-base), border-color var(--transition-base)",
  };

  const iconWrapperStyle = (bg: string, color: string) => ({
    background: bg, color, padding: "14px", borderRadius: "var(--radius-md)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading dashboard...</span>
      </div>
    );
  }

  if (!stats) {
    return <div style={{ padding: "40px", color: "var(--color-danger)" }}>Failed to load dashboard.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <LayoutDashboard size={22} color="var(--color-accent)" /> {greeting}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Your tenant onboarding and support activity at a glance.
          </p>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 14px", background: "var(--color-accent-subtle)",
          border: "1px solid var(--color-accent-border)", borderRadius: "999px",
          fontSize: "12px", fontWeight: 600, color: "var(--color-accent)",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <Radio size={12} /> LIVE
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><Building2 size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Tenants Onboarded</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.totalTenants}</h2>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}><Building2 size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Active</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.activeCount}</h2>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle("var(--color-danger-subtle)", "var(--color-danger)")}><Ban size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Suspended</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.suspendedCount}</h2>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}><CheckCircle2 size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Tickets Solved</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.ticketsSolved}</h2>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle("var(--color-warning-subtle)", "var(--color-warning)")}><LifeBuoy size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Tickets Open</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.ticketsOpen}</h2>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle("var(--color-info-subtle)", "var(--color-info)")}><Users size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Users Reached</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.totalUsersReached}</h2>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle("var(--color-info-subtle)", "var(--color-info)")}><MapPin size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Sites Reached</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.totalSitesReached}</h2>
          </div>
        </div>
      </div>

      {/* Recently Onboarded + Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "28px" }}>
        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 size={16} color="var(--color-accent)" /> Recently Onboarded
            </h3>
            <Link href="/staff/tenants" style={{ fontSize: "12.5px", color: "var(--color-accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {stats.recentTenants.slice(0, 5).map((t, i) => (
              <div
                key={t.id}
                onClick={() => router.push(`/staff/tenants/${t.id}`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", cursor: "pointer", borderBottom: i < Math.min(stats.recentTenants.length, 5) - 1 ? "1px solid var(--color-border)" : "none" }}
              >
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{t.name}</h4>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>{t.plan} · {new Date(t.createdAt).toLocaleDateString()}</p>
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
            {stats.recentTenants.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                You haven't onboarded any tenants yet.
              </div>
            )}
          </div>
        </div>

        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <LifeBuoy size={16} color="var(--color-info)" /> Quick Links
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { href: "/staff/tenants",   label: "All Tenants",  desc: "View every tenant onboarded on the platform" },
              { href: "/staff/analytics", label: "Analytics",    desc: "Your onboarding performance and export a PDF report" },
              { href: "/staff/plans",     label: "Plans",        desc: "Subscription tiers available to tenants" },
              { href: "/staff/support",   label: "Helpdesk",     desc: "View and attend to open support tickets" },
            ].map((link, i, arr) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", textDecoration: "none", borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none" }}
              >
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{link.label}</h4>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>{link.desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
