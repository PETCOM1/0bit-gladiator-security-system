"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Download, MapPin, Users, Calendar, AlertTriangle } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock incident operational logs for Manager
const INCIDENT_LOGS = [
  { id: "inc-101", title: "Unauthorised Entry Attempt", site: "Main Office Complex", severity: "HIGH", reportedBy: "Guard S. Khoza", status: "OPEN", date: "2026-06-22" },
  { id: "inc-102", title: "Fenced Perimeter Breach", site: "Warehouse Depot A", severity: "CRITICAL", reportedBy: "Guard M. Naidoo", status: "INVESTIGATING", date: "2026-06-23" },
  { id: "inc-103", title: "System Power Fault", site: "Main Office Complex", severity: "LOW", reportedBy: "Site Mgr P. Dev", status: "RESOLVED", date: "2026-06-20" },
  { id: "inc-104", title: "Water Leakage on Level 2", site: "Corporate Tower B", severity: "LOW", reportedBy: "Guard J. Ndlovu", status: "CLOSED", date: "2026-06-18" },
  { id: "inc-105", title: "Visitor Badge Misplaced", site: "Warehouse Depot A", severity: "MEDIUM", reportedBy: "Guard M. Naidoo", status: "RESOLVED", date: "2026-06-19" },
  { id: "inc-106", title: "Gate 3 Lock Broken", site: "Gate House West", severity: "MEDIUM", reportedBy: "Guard A. Smith", status: "OPEN", date: "2026-06-23" },
];

export default function ManagerAnalyticsPage() {
  const [incidents] = useState(INCIDENT_LOGS);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.site.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severityFilter === "" || i.severity === severityFilter;
      const matchStatus = statusFilter === "" || i.status === statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [incidents, search, severityFilter, statusFilter]);

  // Operational metrics
  const totalIncidents = filteredIncidents.length;
  const criticalCount = filteredIncidents.filter(i => i.severity === "CRITICAL" || i.severity === "HIGH").length;
  const openCount = filteredIncidents.filter(i => i.status === "OPEN" || i.status === "INVESTIGATING").length;

  const handleDownloadPDF = () => {
    const headers = ["ID", "Title", "Site Location", "Severity", "Reported By", "Status", "Date"];
    const rows = filteredIncidents.map(i => [
      i.id,
      i.title,
      i.site,
      i.severity,
      i.reportedBy,
      i.status,
      i.date
    ]);
    exportToPDF("Organization Incident Operations Report", headers, rows, "manager_operational_analytics.pdf");
  };

  const cardStyle = {
    background: "var(--color-card-bg)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-card-border)",
    boxShadow: "var(--color-card-shadow)",
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  };

  const headerCellStyle = {
    padding: "12px 24px",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--color-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    background: "var(--color-bg-subtle)",
    borderBottom: "1px solid var(--color-border)",
  };

  const bodyCellStyle = {
    padding: "16px 24px",
    fontSize: "13.5px",
    color: "var(--color-text-secondary)",
    borderBottom: "1px solid var(--color-border)",
  };

  const inputStyle = {
    padding: "7px 12px",
    background: "var(--color-card-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "13.5px",
    color: "var(--color-text-primary)",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart size={22} color="var(--color-accent)" /> Operations Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Real-time operations summary, site active shifts, guard status, and safety logs.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export Incident Report
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Total Sites</span>
            <MapPin size={18} color="var(--color-accent)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>4</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Active Officers</span>
            <Users size={18} color="var(--color-success)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>24</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Logged Incidents</span>
            <AlertTriangle size={18} color="var(--color-danger)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{totalIncidents}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Active Issues</span>
            <Calendar size={18} color="var(--color-info)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{openCount} (Critical: {criticalCount})</span>
        </div>
      </div>

      {/* Incidents Table Container */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "var(--color-bg-subtle)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Incident & Security Ledger</h2>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search title/site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: "180px" }}
            />
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>ID</th>
                <th style={headerCellStyle}>Incident Title</th>
                <th style={headerCellStyle}>Site Location</th>
                <th style={headerCellStyle}>Severity</th>
                <th style={headerCellStyle}>Reported By</th>
                <th style={headerCellStyle}>Status</th>
                <th style={headerCellStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No security incidents matched your filters.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((i, idx) => (
                  <tr key={i.id} style={{ background: idx % 2 === 0 ? "transparent" : "var(--color-bg-subtle)" }}>
                    <td style={{ ...bodyCellStyle, fontWeight: 600 }}>{i.id}</td>
                    <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{i.title}</td>
                    <td style={bodyCellStyle}>{i.site}</td>
                    <td style={bodyCellStyle}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: i.severity === "CRITICAL" ? "rgba(239,68,68,0.15)" : i.severity === "HIGH" ? "rgba(245,158,11,0.15)" : i.severity === "MEDIUM" ? "rgba(59,130,246,0.15)" : "var(--color-bg-subtle)",
                        color: i.severity === "CRITICAL" ? "var(--color-danger)" : i.severity === "HIGH" ? "var(--color-warning)" : i.severity === "MEDIUM" ? "var(--color-info)" : "var(--color-text-secondary)"
                      }}>
                        {i.severity}
                      </span>
                    </td>
                    <td style={bodyCellStyle}>{i.reportedBy}</td>
                    <td style={bodyCellStyle}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: i.status === "RESOLVED" || i.status === "CLOSED" ? "var(--color-success-subtle)" : "rgba(239,68,68,0.1)",
                        color: i.status === "RESOLVED" || i.status === "CLOSED" ? "var(--color-success)" : "var(--color-danger)"
                      }}>
                        {i.status}
                      </span>
                    </td>
                    <td style={{ ...bodyCellStyle, borderBottom: idx === filteredIncidents.length - 1 ? "none" : "1px solid var(--color-border)" }}>{i.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
