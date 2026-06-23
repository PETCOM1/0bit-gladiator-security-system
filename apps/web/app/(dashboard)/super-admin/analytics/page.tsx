"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Download, Building2, Users, AlertTriangle, ShieldCheck, TrendingUp, Cpu, CreditCard, ChevronRight } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock Data
const COMPANY_ANALYTICS = [
  { name: "Gladiator Pro South", sites: 8, guards: 32, incidents: 4, score: 98 },
  { name: "Ares Security Services", sites: 6, guards: 22, incidents: 12, score: 85 },
  { name: "Vanguard Guard Group", sites: 14, guards: 85, incidents: 2, score: 99 },
  { name: "Apex Security Group", sites: 3, guards: 12, incidents: 8, score: 79 },
  { name: "Sentinel Watch Co", sites: 5, guards: 34, incidents: 1, score: 96 },
];

const DEVICE_USAGE = [
  { device: "NFC Mobile Handset (Android)", percentage: 74 },
  { device: "NFC Mobile Handset (iOS)", percentage: 18 },
  { device: "Desktop Dashboard (Web)", percentage: 8 },
];

const FEATURE_USAGE = [
  { feature: "NFC Checkpoint Patrols", rate: 88 },
  { feature: "Visitor Log Entries", rate: 64 },
  { feature: "Incident Photo Uploads", rate: 42 },
  { feature: "Support Helpdesk Tickets", rate: 12 },
];

export default function SuperAdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"companies" | "usage" | "incidents" | "revenue">("companies");
  const [search, setSearch] = useState("");

  const filteredCompanies = useMemo(() => {
    return COMPANY_ANALYTICS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  // Export current active view to PDF
  const handleDownloadPDF = () => {
    if (activeTab === "companies") {
      const headers = ["Security Company", "Total Sites", "Total Guards", "Incidents Logged", "Performance Score"];
      const rows = filteredCompanies.map(c => [c.name, c.sites.toString(), c.guards.toString(), c.incidents.toString(), `${c.score}%`]);
      exportToPDF("Platform Company Performance Analytics", headers, rows, "super_admin_company_analytics.pdf");
    } else if (activeTab === "usage") {
      const headers = ["Feature / Device Category", "Usage Rate / Share"];
      const rows = [
        ...FEATURE_USAGE.map(f => [f.feature, `${f.rate}%`]),
        ...DEVICE_USAGE.map(d => [d.device, `${d.percentage}%`])
      ];
      exportToPDF("Platform Usage & Feature Adoption Analytics", headers, rows, "super_admin_usage_analytics.pdf");
    } else if (activeTab === "incidents") {
      const headers = ["Incident Metric", "Value"];
      const rows = [
        ["Total Incidents Logged", "27"],
        ["Open Security Issues", "5"],
        ["Incident Resolution Rate", "81.4%"],
        ["Critical Breach Attempts", "3"],
        ["Patrol NFC Miss Rate", "4.2%"]
      ];
      exportToPDF("Platform System-wide Incident Analytics", headers, rows, "super_admin_incident_analytics.pdf");
    } else {
      const headers = ["Subscription Tier", "Subscribed Tenants", "MRR Impact", "Churn Rate"];
      const rows = [
        ["BASIC Plan (R99/mo)", "12", "R1,188", "2.1%"],
        ["PRO Plan (R299/mo)", "26", "R7,774", "0.8%"],
        ["ENTERPRISE Plan (R999/mo)", "3", "R2,997", "0.0%"],
        ["Pilot Trial Plan (R0/mo)", "18", "R0", "12.4%"],
      ];
      exportToPDF("SaaS Revenue & MRR Analytics", headers, rows, "super_admin_revenue_analytics.pdf");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart size={22} color="var(--color-accent)" /> Global SaaS Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Real-time platform metrics, daily active user trends, feature engagement, and MRR.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export {activeTab.toUpperCase()} PDF
        </button>
      </div>

      {/* 8 Global KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>SECURITY COMPANIES</span><Building2 size={16} color="var(--color-accent)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>9</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL SITES</span><Building2 size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>36</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL GUARDS</span><Users size={16} color="var(--color-info)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>187</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>ACTIVE USERS (DAU)</span><ShieldCheck size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>114</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL INCIDENTS</span><AlertTriangle size={16} color="var(--color-danger)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>27</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>OPEN INCIDENTS</span><AlertTriangle size={16} color="var(--color-warning)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>5</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>PLATFORM UPTIME</span><Cpu size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-success)" }}>99.98%</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>MONTHLY GROWTH</span><TrendingUp size={16} color="var(--color-accent)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>+12.4%</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "10px", padding: "6px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", alignSelf: "flex-start" }}>
        <button onClick={() => setActiveTab("companies")} style={tabButtonStyle("companies")}>Company Analytics</button>
        <button onClick={() => setActiveTab("usage")} style={tabButtonStyle("usage")}>Platform Usage</button>
        <button onClick={() => setActiveTab("incidents")} style={tabButtonStyle("incidents")}>Incident Trends</button>
        <button onClick={() => setActiveTab("revenue")} style={tabButtonStyle("revenue")}>Revenue & SaaS</button>
      </div>

      {/* Tab Contents */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        
        {activeTab === "companies" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "var(--color-bg-subtle)" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Security Companies Performance</h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>High incident rates or low compliance scores trigger active support logs.</p>
              </div>
              <input
                type="text"
                placeholder="Search company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "7px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none", width: "200px" }}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--color-bg-subtle)" }}>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Company Name</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Sites</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Guards</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Incidents</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Performance Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === filteredCompanies.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.name}</td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{c.sites}</td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{c.guards}</td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: c.incidents > 6 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{c.incidents}</td>
                      <td style={{ padding: "16px 24px", fontSize: "14px" }}>
                        <span style={{ fontWeight: 700, color: c.score > 90 ? "var(--color-success)" : c.score > 80 ? "var(--color-warning)" : "var(--color-danger)" }}>{c.score}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "usage" && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
              {/* Feature Usage Rate */}
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Feature Engagement Rates</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {FEATURE_USAGE.map((f, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                        <span>{f.feature}</span>
                        <span style={{ fontWeight: 600 }}>{f.rate}%</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--color-bg-subtle)", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ width: `${f.rate}%`, height: "100%", background: "var(--color-accent)", borderRadius: "99px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Device Usage */}
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Device Usage Share</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {DEVICE_USAGE.map((d, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                        <span>{d.device}</span>
                        <span style={{ fontWeight: 600 }}>{d.percentage}%</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--color-bg-subtle)", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ width: `${d.percentage}%`, height: "100%", background: "var(--color-info)", borderRadius: "99px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "incidents" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Incidents Distribution (Weekly Logs)</h4>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "150px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
              {[12, 18, 15, 8, 22, 14, 27].map((val, idx) => {
                const heightPct = (val / 30) * 100;
                const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                return (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>{val}</span>
                    <div style={{ width: "100%", height: `${heightPct}px`, background: idx === 6 ? "var(--color-danger)" : "var(--color-accent)", borderRadius: "4px 4px 0 0" }} />
                    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{days[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "revenue" && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Monthly Revenue Target</span>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-success)" }}>R11,959 <span style={{ fontSize: "14px", color: "var(--color-text-muted)", fontWeight: 500 }}>MRR</span></span>
                <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  <span style={{ color: "var(--color-success)", fontWeight: 600 }}>+8.4%</span> since last month
                </div>
              </div>
              <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "24px" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "12px" }}>Churn Rate Overview</h5>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  <span>Basic / Trial Churn</span>
                  <span style={{ fontWeight: 600, color: "var(--color-danger)" }}>12.4%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  <span>Pro / Enterprise Churn</span>
                  <span style={{ fontWeight: 600, color: "var(--color-success)" }}>0.4%</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
