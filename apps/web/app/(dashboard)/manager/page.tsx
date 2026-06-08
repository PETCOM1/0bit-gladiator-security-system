"use client";

import { useEffect, useState } from "react";
import { Users, ShieldAlert, MapPin, Activity, Contact, Calendar, LayoutDashboard } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    sites: 0, officers: 0, visitorsToday: 0, incidentsToday: 0, openIncidents: 0, activeShifts: 0, attendanceRate: "0%"
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await managerService.getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
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
    gap: "16px",
    transition: "transform var(--transition-base), box-shadow var(--transition-base)",
    cursor: "default"
  };

  const iconWrapperStyle = (bg: string, color: string) => ({
    background: bg,
    color: color,
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <LayoutDashboard size={28} color="var(--color-accent)" /> Tenant Command Center
        </h1>
        <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
          Overview of security operations across all your sites.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        
        {/* Officers */}
        <div style={cardStyle} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><Users size={28} /></div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Active Personnel</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.officers}</h2>
          </div>
        </div>

        {/* Sites */}
        <div style={cardStyle} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><MapPin size={28} /></div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Active Sites</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.sites}</h2>
          </div>
        </div>

        {/* Visitors */}
        <div style={cardStyle} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}><Contact size={28} /></div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Visitors Today</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.visitorsToday}</h2>
          </div>
        </div>

        {/* Incidents */}
        <div style={cardStyle} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={iconWrapperStyle("var(--color-danger-subtle)", "var(--color-danger)")}><ShieldAlert size={28} /></div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Incidents Today</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
              {stats.incidentsToday} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-muted)" }}>({stats.openIncidents} Open)</span>
            </h2>
          </div>
        </div>

        {/* Shifts */}
        <div style={cardStyle} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={iconWrapperStyle("var(--color-warning-subtle)", "var(--color-warning)")}><Calendar size={28} /></div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Active Shifts</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.activeShifts}</h2>
          </div>
        </div>

        {/* Attendance */}
        <div style={cardStyle} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
          <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}><Activity size={28} /></div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Attendance Rate</p>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats.attendanceRate}</h2>
          </div>
        </div>

      </div>
    </div>
  );
}
