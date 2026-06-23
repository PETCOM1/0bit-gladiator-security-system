"use client";

import { useEffect, useState } from "react";
import { Users, ShieldAlert, MapPin, Activity, Calendar, LayoutDashboard, Radio } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    sites: 0, officers: 0, visitorsToday: 0, incidentsToday: 0, openIncidents: 0, activeShifts: 0, attendanceRate: "0%"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await managerService.getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
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
    padding: "24px",
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
        <span style={{ fontSize: "14px" }}>Loading manager console...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <LayoutDashboard size={24} color="var(--color-accent)" /> Operations Command Center
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Overview of security metrics and telemetry across active client portfolios.
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        
        {/* Officers */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><Users size={24} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Active Officers</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.officers}</h2>
          </div>
        </div>

        {/* Sites */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><MapPin size={24} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Monitored Sites</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.sites}</h2>
          </div>
        </div>

        {/* Visitors */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-success)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}><Users size={24} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Visitors Today</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.visitorsToday}</h2>
          </div>
        </div>

        {/* Incidents */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-danger)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-danger-subtle)", "var(--color-danger)")}><ShieldAlert size={24} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Incidents Reported</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
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
          <div style={iconWrapperStyle("var(--color-warning-subtle)", "var(--color-warning)")}><Calendar size={24} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Active Shifts</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.activeShifts}</h2>
          </div>
        </div>

        {/* Attendance */}
        <div 
          style={cardStyle} 
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-info)"; }} 
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-info-subtle)", "var(--color-info)")}><Activity size={24} /></div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Attendance Rate</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.attendanceRate}</h2>
          </div>
        </div>

      </div>
    </div>
  );
}
