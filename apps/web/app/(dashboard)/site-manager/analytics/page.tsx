"use client";

import React, { useState } from "react";
import { BarChart, Download, Users, AlertTriangle, ShieldCheck, MapPin, Layers } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock Data
const GUARD_MONITORING = [
  { name: "Officer S. Khoza", status: "ON_DUTY", checkin: "22:15", completed: 8 },
  { name: "Officer J. Ndlovu", status: "ON_DUTY", checkin: "23:05", completed: 6 },
  { name: "Officer A. Smith", status: "BREAK", checkin: "22:00", completed: 4 },
  { name: "Officer M. Naidoo", status: "OFF_DUTY", checkin: "18:00", completed: 10 },
];

const ZONE_ANALYTICS = [
  { zone: "Warehouse", incidents: 4, patrols: 28, risk: "HIGH" },
  { zone: "Parking Lots", incidents: 2, patrols: 18, risk: "MEDIUM" },
  { zone: "Reception Lobby", incidents: 1, patrols: 34, risk: "LOW" },
  { zone: "Office Block", incidents: 0, patrols: 40, risk: "LOW" },
  { zone: "Perimeter Fence", incidents: 5, patrols: 22, risk: "HIGH" },
];

export default function SiteManagerAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"monitoring" | "patrols" | "incidents" | "access" | "zones">("monitoring");

  const handleDownloadPDF = () => {
    if (activeTab === "monitoring") {
      const headers = ["Officer Name", "Duty Status", "Last Check-in", "Patrols Completed"];
      const rows = GUARD_MONITORING.map(g => [g.name, g.status, g.checkin, g.completed.toString()]);
      exportToPDF("Site Guard Active Duty Audit Log", headers, rows, "site_guard_monitoring.pdf");
    } else if (activeTab === "patrols") {
      const headers = ["Patrol Metric", "Value"];
      const rows = [
        ["Schedule Compliance", "94.2%"],
        ["Missed Checkpoints", "2"],
        ["Hourly Patrols Completed", "14"],
        ["Fence Patrol Runs", "6"]
      ];
      exportToPDF("Site Patrol Schedule Compliance Logs", headers, rows, "site_patrol_compliance.pdf");
    } else if (activeTab === "incidents") {
      const headers = ["Shift/Area Detail", "Incidents Reported", "Avg Response Time"];
      const rows = [
        ["Night Shift (18:00-06:00)", "4", "4.8 min"],
        ["Day Shift (06:00-18:00)", "2", "6.2 min"],
        ["External Fence Area", "3", "3.5 min"],
        ["Warehouse Backdoor", "2", "5.0 min"],
      ];
      exportToPDF("Site Incidents by Shift & Area Logs", headers, rows, "site_incident_shifts.pdf");
    } else if (activeTab === "access") {
      const headers = ["Access Category", "Daily Access Logs", "Denied / Alerts"];
      const rows = [
        ["Visitor Entries", "42", "0"],
        ["Contractor Logs", "14", "1"],
        ["Unauthorized Attempts", "3", "3"],
        ["Denied Access Attempts", "2", "2"],
      ];
      exportToPDF("Access Control & Check-in Ledger", headers, rows, "site_access_control_audit.pdf");
    } else {
      const headers = ["Site Zone", "Incidents Logged", "Patrol Scans Completed", "Risk Level"];
      const rows = ZONE_ANALYTICS.map(z => [z.zone, z.incidents.toString(), z.patrols.toString(), z.risk]);
      exportToPDF("Site Zone Risk & Patrol Activity Audit", headers, rows, "site_zones_analytics.pdf");
    }
  };

  const cardStyle = {
    background: "var(--color-card-bg)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-card-border)",
    boxShadow: "var(--color-card-shadow)",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  };

  const tabButtonStyle = (tab: typeof activeTab) => ({
    padding: "10px 20px",
    fontSize: "13.5px",
    fontWeight: 600,
    borderRadius: "var(--radius-md)",
    border: "none",
    cursor: "pointer",
    background: activeTab === tab ? "var(--color-accent)" : "transparent",
    color: activeTab === tab ? "var(--color-accent-text)" : "var(--color-text-secondary)",
    transition: "all var(--transition-fast)",
  });

  const headerCellStyle = {
    padding: "12px 24px",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--color-text-muted)",
    textTransform: "uppercase" as const,
    background: "var(--color-bg-subtle)",
    borderBottom: "1px solid var(--color-border)",
  };

  const bodyCellStyle = {
    padding: "16px 24px",
    fontSize: "13.5px",
    color: "var(--color-text-secondary)",
    borderBottom: "1px solid var(--color-border)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart size={22} color="var(--color-accent)" /> Site Operational Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Monitor active security officers on duty, zone patrol compliance, access control logs, and alert logs.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export PDF Report
        </button>
      </div>

      {/* 6 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>GUARDS ON DUTY</span><Users size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>3</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>GUARDS ABSENT</span><Users size={16} color="var(--color-danger)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>0</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>INCIDENTS TODAY</span><AlertTriangle size={16} color="var(--color-danger)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>6</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>OPEN INCIDENTS</span><AlertTriangle size={16} color="var(--color-warning)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>2</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>PATROL COMPLETION %</span><ShieldCheck size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-success)" }}>94.2%</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>VISITORS TODAY</span><Users size={16} color="var(--color-info)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>42</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", padding: "6px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", alignSelf: "flex-start", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("monitoring")} style={tabButtonStyle("monitoring")}>Guard Monitoring</button>
        <button onClick={() => setActiveTab("patrols")} style={tabButtonStyle("patrols")}>Patrol Analytics</button>
        <button onClick={() => setActiveTab("incidents")} style={tabButtonStyle("incidents")}>Incident Analysis</button>
        <button onClick={() => setActiveTab("access")} style={tabButtonStyle("access")}>Access Control</button>
        <button onClick={() => setActiveTab("zones")} style={tabButtonStyle("zones")}>Zone Analytics</button>
      </div>

      {/* Main card */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {activeTab === "monitoring" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Guard Active Status Monitoring</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Guard Name</th>
                    <th style={headerCellStyle}>Duty Status</th>
                    <th style={headerCellStyle}>Last Check-in</th>
                    <th style={headerCellStyle}>Patrols Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {GUARD_MONITORING.map((g, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === GUARD_MONITORING.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{g.name}</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          background: g.status === "ON_DUTY" ? "var(--color-success-subtle)" : g.status === "BREAK" ? "var(--color-warning-subtle)" : "var(--color-bg-subtle)",
                          color: g.status === "ON_DUTY" ? "var(--color-success)" : g.status === "BREAK" ? "var(--color-warning)" : "var(--color-text-secondary)"
                        }}>{g.status}</span>
                      </td>
                      <td style={bodyCellStyle}>{g.checkin}</td>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{g.completed} patrol(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "patrols" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Patrol Compliance & Missed Checkpoints</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Patrol Schedule Compliance</span>
                <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-success)", margin: "4px 0 0 0" }}>94.2%</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Missed Checkpoints Today</span>
                <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-danger)", margin: "4px 0 0 0" }}>2</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "incidents" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Incidents Analysis & Response Times</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "12px" }}>Incidents by Area</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { area: "Perimeter Fence North", val: 3 },
                    { area: "Warehouse Gate house", val: 2 },
                    { area: "Office Lobby Main", val: 1 }
                  ].map((i, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      <span>{i.area}</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{i.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "24px" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "12px" }}>Response Times by Shift</h5>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  <span>Night Shift</span>
                  <span style={{ fontWeight: 600, color: "var(--color-success)" }}>4.8 min</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  <span>Day Shift</span>
                  <span style={{ fontWeight: 600, color: "var(--color-warning)" }}>6.2 min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "access" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Visitor & Check-in Analytics</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Visitor Entries</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0 0" }}>42</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Contractor Entries</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0 0" }}>14</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Unauthorized Attempts</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-danger)", margin: "4px 0 0 0" }}>3</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Denied Access Attempts</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-danger)", margin: "4px 0 0 0" }}>2</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "zones" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Site Zone Patrol & Incident Risk Mapping</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Zone Location</th>
                    <th style={headerCellStyle}>Incidents Logged</th>
                    <th style={headerCellStyle}>NFC Patrols Completed</th>
                    <th style={headerCellStyle}>Zone Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {ZONE_ANALYTICS.map((z, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === ZONE_ANALYTICS.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Layers size={14} color="var(--color-accent)" /> {z.zone}
                        </div>
                      </td>
                      <td style={{ ...bodyCellStyle, color: z.incidents > 2 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{z.incidents}</td>
                      <td style={bodyCellStyle}>{z.patrols}</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: z.risk === "HIGH" ? "var(--color-danger-subtle)" : z.risk === "MEDIUM" ? "var(--color-warning-subtle)" : "var(--color-success-subtle)",
                          color: z.risk === "HIGH" ? "var(--color-danger)" : z.risk === "MEDIUM" ? "var(--color-warning)" : "var(--color-success)"
                        }}>{z.risk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
