"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Download, Building2, UserCheck, ShieldAlert, Award, FileText, CheckCircle } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock Data
const TENANT_COMPANIES = [
  { id: "comp-1", name: "Apex Security Services", status: "ACTIVE", sites: 8, guards: 32, supportTickets: 2, appAdoption: 85, patrolRate: 94 },
  { id: "comp-2", name: "Sentinel Watch Group", status: "ACTIVE", sites: 14, guards: 54, supportTickets: 0, appAdoption: 96, patrolRate: 98 },
  { id: "comp-3", name: "Gladiator Guard Group", status: "ACTIVE", sites: 4, guards: 18, supportTickets: 4, appAdoption: 70, patrolRate: 88 },
  { id: "comp-4", name: "Alpha Response Response", status: "PENDING", sites: 1, guards: 2, supportTickets: 1, appAdoption: 0, patrolRate: 0 },
  { id: "comp-5", name: "Falcon Patrol Co", status: "ACTIVE", sites: 5, guards: 24, supportTickets: 0, appAdoption: 90, patrolRate: 91 },
];

const SUPPORT_TICKETS = [
  { id: "tick-201", tenant: "Gladiator Guard Group", subject: "Prisma DB error on page logs", severity: "HIGH", status: "OPEN", assigned: "Admin K. Govender", created: "2026-06-23" },
  { id: "tick-202", tenant: "Apex Security Services", subject: "Cannot upload incident images", severity: "MEDIUM", status: "OPEN", assigned: "Admin K. Govender", created: "2026-06-24" },
  { id: "tick-203", tenant: "Sentinel Watch Group", subject: "Password reset link link expired", severity: "LOW", status: "RESOLVED", assigned: "Admin K. Govender", created: "2026-06-21" },
];

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"tenants" | "adoption" | "support">("tenants");
  const [search, setSearch] = useState("");

  const filteredCompanies = useMemo(() => {
    return TENANT_COMPANIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  // PDF builder
  const handleDownloadPDF = () => {
    if (activeTab === "tenants") {
      const headers = ["Company Name", "Status", "Sites Registered", "Guards Onboarded", "Pending Tickets"];
      const rows = filteredCompanies.map(c => [c.name, c.status, c.sites.toString(), c.guards.toString(), c.supportTickets.toString()]);
      exportToPDF("Onboarded Security Tenants Audit Log", headers, rows, "platform_admin_tenants_audit.pdf");
    } else if (activeTab === "adoption") {
      const headers = ["Security Company", "Mobile App Login Adoption", "Patrol Route Completion"];
      const rows = TENANT_COMPANIES.map(c => [c.name, `${c.appAdoption}%`, `${c.patrolRate}%`]);
      exportToPDF("Security Officer Application Adoption Reports", headers, rows, "platform_admin_adoption_metrics.pdf");
    } else {
      const headers = ["Ticket ID", "Tenant Company", "Issue Subject", "Severity", "Status", "Date Opened"];
      const rows = SUPPORT_TICKETS.map(t => [t.id, t.tenant, t.subject, t.severity, t.status, t.created]);
      exportToPDF("Customer Support & Tickets Dashboard", headers, rows, "platform_admin_support_analytics.pdf");
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
            <BarChart size={22} color="var(--color-accent)" /> Platform Admin Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Onboard security companies, monitor active organizations, support tickers, and mobile adoption levels.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export PDF Audit
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>COMPANIES ONBOARDED</span><Building2 size={16} color="var(--color-accent)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>5</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>PENDING APPROVALS</span><UserCheck size={16} color="var(--color-warning)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>1</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>ACTIVE COMPANIES</span><Building2 size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>4</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL SITES</span><Building2 size={16} color="var(--color-info)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>32</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL GUARDS</span><Award size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>130</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", padding: "6px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", alignSelf: "flex-start" }}>
        <button onClick={() => setActiveTab("tenants")} style={tabButtonStyle("tenants")}>Tenant Analytics</button>
        <button onClick={() => setActiveTab("adoption")} style={tabButtonStyle("adoption")}>Adoption Metrics</button>
        <button onClick={() => setActiveTab("support")} style={tabButtonStyle("support")}>Support Tickets</button>
      </div>

      {/* Contents */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {activeTab === "tenants" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "var(--color-bg-subtle)" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Onboarded Tenant Companies</h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>New signups must pass security screening prior to system onboarding activation.</p>
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
                  <tr>
                    <th style={headerCellStyle}>Company Name</th>
                    <th style={headerCellStyle}>Account Status</th>
                    <th style={headerCellStyle}>Sites</th>
                    <th style={headerCellStyle}>Guards</th>
                    <th style={headerCellStyle}>Needs Support</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c, idx) => (
                    <tr key={c.id} style={{ borderBottom: idx === filteredCompanies.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{c.name}</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          background: c.status === "ACTIVE" ? "var(--color-success-subtle)" : "var(--color-warning-subtle)",
                          color: c.status === "ACTIVE" ? "var(--color-success)" : "var(--color-warning)"
                        }}>{c.status}</span>
                      </td>
                      <td style={bodyCellStyle}>{c.sites}</td>
                      <td style={bodyCellStyle}>{c.guards}</td>
                      <td style={bodyCellStyle}>
                        {c.supportTickets > 0 ? (
                          <span style={{ color: "var(--color-danger)", fontWeight: 600 }}>{c.supportTickets} Open Ticket(s)</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "adoption" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "20px" }}>Guards & Patrol App Adoption Rates</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {TENANT_COMPANIES.filter(c => c.status === "ACTIVE").map((c, idx) => (
                <div key={idx} style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                  <h5 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>{c.name}</h5>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                        <span>Mobile App Usage</span>
                        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{c.appAdoption}%</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "var(--color-card-bg)", borderRadius: "99px" }}>
                        <div style={{ width: `${c.appAdoption}%`, height: "100%", background: "var(--color-accent)", borderRadius: "99px" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                        <span>Patrol Route Completion</span>
                        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{c.patrolRate}%</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "var(--color-card-bg)", borderRadius: "99px" }}>
                        <div style={{ width: `${c.patrolRate}%`, height: "100%", background: "var(--color-success)", borderRadius: "99px" }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Onboarding Helpdesk Ticket Queue</h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>Average Ticket Resolution Time: <span style={{ fontWeight: 600, color: "var(--color-success)" }}>14.8 minutes</span></p>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Ticket ID</th>
                    <th style={headerCellStyle}>Company</th>
                    <th style={headerCellStyle}>Subject</th>
                    <th style={headerCellStyle}>Severity</th>
                    <th style={headerCellStyle}>Status</th>
                    <th style={headerCellStyle}>Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {SUPPORT_TICKETS.map((t, idx) => (
                    <tr key={t.id} style={{ borderBottom: idx === SUPPORT_TICKETS.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600 }}>{t.id}</td>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{t.tenant}</td>
                      <td style={bodyCellStyle}>{t.subject}</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: t.severity === "HIGH" ? "rgba(239,68,68,0.15)" : "var(--color-bg-subtle)",
                          color: t.severity === "HIGH" ? "var(--color-danger)" : "var(--color-text-secondary)"
                        }}>{t.severity}</span>
                      </td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: t.status === "OPEN" ? "var(--color-danger)" : "var(--color-success)"
                        }}>
                          {t.status === "OPEN" ? <ShieldAlert size={14} /> : <CheckCircle size={14} />} {t.status}
                        </span>
                      </td>
                      <td style={bodyCellStyle}>{t.created}</td>
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
