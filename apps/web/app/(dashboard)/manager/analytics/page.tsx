"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Download, MapPin, Users, Calendar, AlertTriangle, ShieldCheck, TrendingUp, ChevronRight, Eye } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock Data
const SITES_OVERVIEW = [
  { name: "Main Office Complex", guards: 6, incidents: 2, patrolRate: 98, risk: "LOW" },
  { name: "Warehouse Depot A", guards: 12, incidents: 5, patrolRate: 85, risk: "HIGH" },
  { name: "Corporate Tower B", guards: 4, incidents: 1, patrolRate: 94, risk: "MEDIUM" },
  { name: "Gate House West", guards: 2, incidents: 4, patrolRate: 90, risk: "MEDIUM" },
];

const GUARD_PERFORMANCE = [
  { name: "Guard S. Khoza", completedPatrols: 48, missedPatrols: 1, attendance: 98, rating: "EXCELLENT" },
  { name: "Guard M. Naidoo", completedPatrols: 36, missedPatrols: 4, attendance: 92, rating: "GOOD" },
  { name: "Guard J. Ndlovu", completedPatrols: 42, missedPatrols: 0, attendance: 100, rating: "EXCELLENT" },
  { name: "Guard A. Smith", completedPatrols: 24, missedPatrols: 6, attendance: 85, rating: "AVERAGE" },
];

const DRILLDOWN_DATA = {
  company: "Gladiator Pro Group",
  sites: [
    {
      name: "Main Office Complex",
      guards: [
        {
          name: "Guard S. Khoza",
          incidents: [
            { id: "inc-101", title: "Unauthorised Entry Attempt", severity: "HIGH", status: "OPEN" },
            { id: "inc-103", title: "System Power Fault", severity: "LOW", status: "RESOLVED" }
          ]
        }
      ]
    },
    {
      name: "Warehouse Depot A",
      guards: [
        {
          name: "Guard M. Naidoo",
          incidents: [
            { id: "inc-102", title: "Fenced Perimeter Breach", severity: "CRITICAL", status: "INVESTIGATING" },
            { id: "inc-105", title: "Visitor Badge Misplaced", severity: "MEDIUM", status: "RESOLVED" }
          ]
        }
      ]
    }
  ]
};

export default function ManagerAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"sites" | "incidents" | "guards" | "patrols" | "drilldown">("sites");
  const [search, setSearch] = useState("");

  // Drilldown interactive state
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number | null>(null);
  const [selectedGuardIndex, setSelectedGuardIndex] = useState<number | null>(null);

  // Filter
  const filteredSites = useMemo(() => {
    return SITES_OVERVIEW.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  // PDF report builder
  const handleDownloadPDF = () => {
    if (activeTab === "sites") {
      const headers = ["Site", "Guards Allocated", "Incidents Today", "Patrol Completion Rate", "Risk Level"];
      const rows = filteredSites.map(s => [s.name, s.guards.toString(), s.incidents.toString(), `${s.patrolRate}%`, s.risk]);
      exportToPDF("Corporate Sites Operational Risk Analytics", headers, rows, "manager_sites_analytics.pdf");
    } else if (activeTab === "incidents") {
      const headers = ["Incident Metric", "Details / Counts"];
      const rows = [
        ["Total Incidents Logged Today", "12"],
        ["Open Security Incidents", "3"],
        ["Resolved Incidents", "9"],
        ["Breach Attempts", "2"],
        ["NFC Scan Failure Rate", "3.6%"]
      ];
      exportToPDF("Organization Incident Analytics & Logs", headers, rows, "manager_incidents_report.pdf");
    } else if (activeTab === "guards") {
      const headers = ["Security Officer", "Completed Patrols", "Missed Patrols", "Attendance Rate", "Performance Rating"];
      const rows = GUARD_PERFORMANCE.map(g => [g.name, g.completedPatrols.toString(), g.missedPatrols.toString(), `${g.attendance}%`, g.rating]);
      exportToPDF("Guard Performance & Patrol Completion Audits", headers, rows, "manager_guard_performance.pdf");
    } else if (activeTab === "patrols") {
      const headers = ["Patrol Metric", "Value"];
      const rows = [
        ["Completed Patrols", "150"],
        ["Missed Patrols", "11"],
        ["Late Patrols (15+ min)", "4"],
        ["NFC Patrol Success Rate", "93.1%"]
      ];
      exportToPDF("System-wide Patrol Analytics", headers, rows, "manager_patrol_analytics.pdf");
    } else {
      const headers = ["Hierarchy", "Security Summary"];
      const rows = [
        ["Company", DRILLDOWN_DATA.company],
        ["Total Operational Sites", DRILLDOWN_DATA.sites.length.toString()],
      ];
      exportToPDF("Interactive Operations Hierarchy Summary", headers, rows, "manager_hierarchy_drilldown.pdf");
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
            <BarChart size={22} color="var(--color-accent)" /> Company Operations Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Comprehensive view of company sites, guard patrols, visitor check-ins, and security logs.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export PDF Report
        </button>
      </div>

      {/* 8 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL SITES</span><MapPin size={16} color="var(--color-accent)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>4</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>GUARDS ON DUTY</span><Users size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>24</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>ACTIVE GUARDS</span><Users size={16} color="var(--color-info)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>18</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>INCIDENTS TODAY</span><AlertTriangle size={16} color="var(--color-danger)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>12</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>OPEN INCIDENTS</span><AlertTriangle size={16} color="var(--color-warning)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>3</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>PATROL SUCCESS RATE</span><ShieldCheck size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-success)" }}>93.1%</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>VISITOR COUNT</span><TrendingUp size={16} color="var(--color-info)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>82</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>AVG RESPONSE TIME</span><Calendar size={16} color="var(--color-warning)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>6.4 min</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: "flex", gap: "10px", padding: "6px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", alignSelf: "flex-start", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("sites")} style={tabButtonStyle("sites")}>Sites Overview</button>
        <button onClick={() => setActiveTab("incidents")} style={tabButtonStyle("incidents")}>Incident Trends</button>
        <button onClick={() => setActiveTab("guards")} style={tabButtonStyle("guards")}>Guard Metrics</button>
        <button onClick={() => setActiveTab("patrols")} style={tabButtonStyle("patrols")}>Patrol Analytics</button>
        <button onClick={() => setActiveTab("drilldown")} style={tabButtonStyle("drilldown")}>Drill Down View</button>
      </div>

      {/* Card container */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        
        {activeTab === "sites" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "var(--color-bg-subtle)" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Operational Risk Levels by Site</h3>
              </div>
              <input
                type="text"
                placeholder="Search site name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "7px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none", width: "200px" }}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Site Location</th>
                    <th style={headerCellStyle}>Guards Assigned</th>
                    <th style={headerCellStyle}>Incidents Today</th>
                    <th style={headerCellStyle}>Patrol Completion</th>
                    <th style={headerCellStyle}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSites.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === filteredSites.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{s.name}</td>
                      <td style={bodyCellStyle}>{s.guards}</td>
                      <td style={{ ...bodyCellStyle, color: s.incidents > 3 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{s.incidents}</td>
                      <td style={bodyCellStyle}>
                        <span style={{ fontWeight: 600, color: s.patrolRate > 90 ? "var(--color-success)" : "var(--color-warning)" }}>{s.patrolRate}%</span>
                      </td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: s.risk === "HIGH" ? "var(--color-danger-subtle)" : s.risk === "MEDIUM" ? "var(--color-warning-subtle)" : "var(--color-success-subtle)",
                          color: s.risk === "HIGH" ? "var(--color-danger)" : s.risk === "MEDIUM" ? "var(--color-warning)" : "var(--color-success)"
                        }}>{s.risk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "incidents" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Incident Trends & Categorization</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
              <div>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "12px" }}>Incidents by Type</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { label: "Unauthorized Attempts", val: 14, color: "var(--color-danger)" },
                    { label: "Perimeter Alert Failures", val: 8, color: "var(--color-warning)" },
                    { label: "Routine Handover Faults", val: 5, color: "var(--color-info)" }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>{item.val}</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "var(--color-bg-subtle)", borderRadius: "99px" }}>
                        <div style={{ width: `${(item.val / 27) * 100}%`, height: "100%", background: item.color, borderRadius: "99px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "24px" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "12px" }}>Incident Resolution Status</h5>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  <span>Resolved Issues</span>
                  <span style={{ fontWeight: 600, color: "var(--color-success)" }}>81.4%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  <span>Open Investigations</span>
                  <span style={{ fontWeight: 600, color: "var(--color-danger)" }}>18.6%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "guards" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Security Personnel Performance Ledgers</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Security Officer</th>
                    <th style={headerCellStyle}>Completed Patrols</th>
                    <th style={headerCellStyle}>Missed Checkpoints</th>
                    <th style={headerCellStyle}>Attendance Rate</th>
                    <th style={headerCellStyle}>Performance Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {GUARD_PERFORMANCE.map((g, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === GUARD_PERFORMANCE.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{g.name}</td>
                      <td style={bodyCellStyle}>{g.completedPatrols}</td>
                      <td style={{ ...bodyCellStyle, color: g.missedPatrols > 3 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{g.missedPatrols}</td>
                      <td style={bodyCellStyle}>{g.attendance}%</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: g.rating === "EXCELLENT" ? "var(--color-success-subtle)" : g.rating === "GOOD" ? "var(--color-info-subtle)" : "var(--color-warning-subtle)",
                          color: g.rating === "EXCELLENT" ? "var(--color-success)" : g.rating === "GOOD" ? "var(--color-info)" : "var(--color-warning)"
                        }}>{g.rating}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "patrols" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Patrol Success & Compliance Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Late Patrols</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-danger)", margin: "4px 0 0 0" }}>4</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Missed Patrols</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-warning)", margin: "4px 0 0 0" }}>11</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Patrol Schedule Compliance</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-success)", margin: "4px 0 0 0" }}>94.2%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "drilldown" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Operational Hierarchy Drill-down Picker</h4>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {/* Site selector */}
              <div style={{ flex: 1, minWidth: "200px", padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                <h5 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>1. Select Site</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {DRILLDOWN_DATA.sites.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedSiteIndex(idx); setSelectedGuardIndex(null); }}
                      style={{
                        padding: "10px", width: "100%", textAlign: "left", fontSize: "13px", fontWeight: 600,
                        borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                        background: selectedSiteIndex === idx ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
                        color: selectedSiteIndex === idx ? "var(--color-accent)" : "var(--color-text-primary)",
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guard selector */}
              <div style={{ flex: 1, minWidth: "200px", padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                <h5 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>2. Select Guard</h5>
                {selectedSiteIndex !== null ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {DRILLDOWN_DATA.sites[selectedSiteIndex].guards.map((g, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedGuardIndex(idx)}
                        style={{
                          padding: "10px", width: "100%", textAlign: "left", fontSize: "13px", fontWeight: 600,
                          borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                          background: selectedGuardIndex === idx ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
                          color: selectedGuardIndex === idx ? "var(--color-accent)" : "var(--color-text-primary)",
                        }}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Select a site first.</span>
                )}
              </div>

              {/* Incident log summary */}
              <div style={{ flex: 2, minWidth: "300px", padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                <h5 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>3. Logged Incidents</h5>
                {selectedSiteIndex !== null && selectedGuardIndex !== null ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {DRILLDOWN_DATA.sites[selectedSiteIndex].guards[selectedGuardIndex].incidents.map((inc, idx) => (
                      <div key={idx} style={{ padding: "12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{inc.title}</span>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                            background: inc.severity === "HIGH" ? "var(--color-danger-subtle)" : "var(--color-bg-subtle)",
                            color: inc.severity === "HIGH" ? "var(--color-danger)" : "var(--color-text-secondary)"
                          }}>{inc.severity}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--color-text-muted)" }}>
                          <span>ID: {inc.id}</span>
                          <span>Status: {inc.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Select a site and guard to drill down incident logs.</span>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
