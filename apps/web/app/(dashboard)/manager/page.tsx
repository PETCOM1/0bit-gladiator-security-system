"use client";

import { useEffect, useState } from "react";
import { Users, ShieldAlert, MapPin, Activity, Calendar, LayoutDashboard, Radio, ChevronRight, CheckCircle2, AlertOctagon, TrendingUp, ClipboardList, Shield } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";
import Link from "next/link";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    sites: 0, officers: 0, visitorsToday: 0, incidentsToday: 0, openIncidents: 0, activeShifts: 0, attendanceRate: "0%"
  });
  const [loading, setLoading] = useState(true);
  const [activeGuards, setActiveGuards] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [monitoredSites, setMonitoredSites] = useState<any[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const greeting = user?.firstName ? `${getGreeting()}, ${user.firstName}` : "Welcome Back";
  const companyName = user?.tenant?.name || "Gladiator Pro";

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load operational command stats
        const res = await managerService.getDashboardStats();
        setStats(res.data.data);

        // Fetch detailed sites to list
        const { default: apiClient } = await import("@/api/client");
        const [sitesRes, incidentsRes, guardsRes] = await Promise.all([
          apiClient.get("/sites"),
          apiClient.get("/incidents?limit=5"),
          apiClient.get("/users?role=USER&limit=5")
        ]);

        setMonitoredSites(sitesRes.data?.data?.sites || []);
        setRecentIncidents(incidentsRes.data?.data?.incidents || []);
        setActiveGuards(guardsRes.data?.data?.users || []);
      } catch (err) {
        console.error("Failed to load dashboard operational details", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const cardStyle = {
    background: "var(--color-card-bg)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-card-border)",
    boxShadow: "var(--color-card-shadow)",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)",
    cursor: "default"
  };

  const iconWrapperStyle = (bg: string, color: string) => ({
    background: bg,
    color: color,
    padding: "14px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  });

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading command console...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <LayoutDashboard size={22} color="var(--color-accent)" /> {greeting}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Operations Command Center for <strong style={{ color: "var(--color-text-primary)" }}>{companyName}</strong>.
          </p>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 14px",
          background: "var(--color-accent-subtle)",
          border: "1px solid var(--color-accent-border)",
          borderRadius: "999px",
          fontSize: "12px", fontWeight: 600, color: "var(--color-accent)",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <Radio size={12} className="animate-pulse" /> LIVE TELEMETRY
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        
        {/* Officers */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><Users size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Active Officers</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.officers}</h2>
          </div>
        </div>

        {/* Sites */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><MapPin size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Monitored Sites</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.sites}</h2>
          </div>
        </div>

        {/* Visitors */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-success)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}><Users size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Visitors Today</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.visitorsToday}</h2>
          </div>
        </div>

        {/* Incidents */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-danger)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-danger-subtle)", "var(--color-danger)")}><ShieldAlert size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Incidents Reported</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
              {stats.incidentsToday} <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-danger)" }}>({stats.openIncidents} Open)</span>
            </h2>
          </div>
        </div>

        {/* Shifts */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-warning)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-warning-subtle)", "var(--color-warning)")}><Calendar size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Active Shifts</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.activeShifts}</h2>
          </div>
        </div>

        {/* Attendance */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-info)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-info-subtle)", "var(--color-info)")}><Activity size={20} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Attendance Rate</p>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.attendanceRate}</h2>
          </div>
        </div>

      </div>

      {/* Main Double Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "28px" }}>
        
        {/* Sites Operational Summary */}
        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={16} color="var(--color-accent)" /> Operational Sites
            </h3>
            <Link href="/manager/sites" style={{ fontSize: "12.5px", color: "var(--color-accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
              Manage Sites <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {monitoredSites.map((site, i) => (
              <div key={site.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: i < monitoredSites.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{site.name}</h4>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>{site.address || "No address provided"}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600 }}>{site._count?.checkpoints || 0} checkpoints</span>
                  <span style={{ fontSize: "11px", background: "var(--color-success-subtle)", color: "var(--color-success)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>
            ))}
            {monitoredSites.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                No active sites registered.
              </div>
            )}
          </div>
        </div>

        {/* Recent Incidents Log */}
        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={16} color="var(--color-danger)" /> Recent Incidents (Last 5 Logs)
            </h3>
            <Link href="/manager/incidents" style={{ fontSize: "12.5px", color: "var(--color-accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recentIncidents.map((inc, i) => (
              <div key={inc.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: i < recentIncidents.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>{inc.title}</h4>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>Site: {inc.site?.name || "Unassigned"}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: inc.severity === "CRITICAL" ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)", color: inc.severity === "CRITICAL" ? "var(--color-danger)" : "var(--color-warning)" }}>
                    {inc.severity}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>{new Date(inc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {recentIncidents.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                No incidents reported recently.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Guard Deployment & Activity Standings */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardList size={16} color="var(--color-info)" /> Active Guarding Force & Deployment Status
          </h3>
          <Link href="/manager/users" style={{ fontSize: "12.5px", color: "var(--color-accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
            Manage Roster <ChevronRight size={14} />
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                {["Officer Name", "Contact Email", "Assigned Site", "Account Status"].map(h => (
                  <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeGuards.map((guard, idx) => (
                <tr key={guard.id || idx} style={{ borderBottom: idx < activeGuards.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{guard.firstName} {guard.lastName}</td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{guard.email}</td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{guard.assignedSite?.name || "General Roster / Floating"}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                      background: guard.accountStatus === "ACTIVE" ? "var(--color-success-subtle)" : "var(--color-warning-subtle)",
                      color: guard.accountStatus === "ACTIVE" ? "var(--color-success)" : "var(--color-warning)"
                    }}>
                      {guard.accountStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {activeGuards.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No security officers registered on roster.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
