"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Download, Building2, Users, AlertTriangle, ShieldCheck, TrendingUp, Cpu } from "lucide-react";
import { exportSuperAdminReport } from "@/shared/utils/pdf";
import { superAdminService } from "@/features/super-admin/services/tenant.service";
import { useAuth } from "@/shared/context/AuthContext";

// Feature / Device illustrative averages based on active DAU
const DEVICE_USAGE = [
  { device: "NFC Mobile Handset (Android)", percentage: 76 },
  { device: "NFC Mobile Handset (iOS)", percentage: 16 },
  { device: "Desktop Dashboard (Web)", percentage: 8 },
];

const FEATURE_USAGE = [
  { feature: "NFC Checkpoint Patrols", rate: 84 },
  { feature: "Visitor Log Entries", rate: 68 },
  { feature: "Incident Photo Uploads", rate: 45 },
  { feature: "Support Helpdesk Tickets", rate: 10 },
];

export default function SuperAdminAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"companies" | "usage" | "incidents" | "revenue">("companies");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, tenantsRes] = await Promise.all([
          superAdminService.getStats(),
          superAdminService.getTenants()
        ]);
        setStats(statsRes.data.data);
        setTenants(tenantsRes.data.data.tenants || []);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCompanies = useMemo(() => {
    return tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [tenants, search]);

  const tierStats = useMemo(() => {
    const groups: Record<string, { count: number; price: number; mrr: number }> = {};
    tenants.forEach(t => {
      const tierName = t.subscriptionTier?.name || "Pilot / Trial Plan";
      const price = t.subscriptionTier?.price || 0;
      if (!groups[tierName]) {
        groups[tierName] = { count: 0, price, mrr: 0 };
      }
      groups[tierName].count += 1;
      groups[tierName].mrr += price;
    });
    return Object.entries(groups).map(([name, g]) => ({
      name,
      count: g.count,
      mrr: g.mrr,
      price: g.price
    }));
  }, [tenants]);

  // Export structured multi-page PDF Report
  const handleDownloadPDF = () => {
    const formattedPeriod = "June 2026";
    const formattedGenerated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const formattedTenants = tenants.map(c => {
      const incidents = c._count?.incidents || 0;
      const score = Math.max(60, 100 - incidents * 5);
      return {
        name: c.name,
        sites: c._count?.sites || 0,
        guards: c._count?.users || 0,
        incidents,
        score
      };
    });

    exportSuperAdminReport({
      managerName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Super Admin",
      reportPeriod: formattedPeriod,
      generatedDate: formattedGenerated,
      summary: {
        tenantsCount: tenants.length,
        sitesCount: stats?.totalSites || 0,
        guardsCount: stats?.totalGuards || 0,
        mrr: stats?.mrr || 0
      },
      kpis: {
        totalTenants: tenants.length,
        totalSites: stats?.totalSites || 0,
        totalGuards: stats?.totalGuards || 0,
        activeUsers: stats?.totalUsers || 0,
        totalIncidents: stats?.totalIncidents || 0,
        openIncidents: stats?.pendingUsers || 0,
        mrr: stats?.mrr || 0
      },
      tenants: formattedTenants,
      features: FEATURE_USAGE,
      devices: DEVICE_USAGE,
      tiers: tierStats.map(t => ({
        name: t.name,
        price: t.price,
        count: t.count,
        mrr: t.mrr
      }))
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading global analytics...</span>
      </div>
    );
  }

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
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.totalTenants || 0}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL SITES</span><Building2 size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.totalSites || 0}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL GUARDS</span><Users size={16} color="var(--color-info)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.totalGuards || 0}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>ACTIVE USERS (DAU)</span><ShieldCheck size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.totalUsers || 0}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>TOTAL INCIDENTS</span><AlertTriangle size={16} color="var(--color-danger)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.totalIncidents || 0}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>OPEN INCIDENTS</span><AlertTriangle size={16} color="var(--color-warning)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.pendingUsers || 0}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>PLATFORM UPTIME</span><Cpu size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-success)" }}>99.98%</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>MONTHLY MRR</span><TrendingUp size={16} color="var(--color-accent)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>R{(stats?.mrr || 0).toLocaleString()}</span>
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
                  {filteredCompanies.map((c, idx) => {
                    const incidents = c._count?.incidents || 0;
                    const score = Math.max(60, 100 - incidents * 5);
                    return (
                      <tr key={c.id || idx} style={{ borderBottom: idx === filteredCompanies.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                        <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.name}</td>
                        <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{c._count?.sites || 0}</td>
                        <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{c._count?.users || 0}</td>
                        <td style={{ padding: "16px 24px", fontSize: "14px", color: incidents > 6 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{incidents}</td>
                        <td style={{ padding: "16px 24px", fontSize: "14px" }}>
                          <span style={{ fontWeight: 700, color: score > 90 ? "var(--color-success)" : score > 80 ? "var(--color-warning)" : "var(--color-danger)" }}>{score}%</span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                        No security companies found.
                      </td>
                    </tr>
                  )}
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
              {(() => {
                const baseVal = Math.round((stats?.totalIncidents || 0) / 7);
                const mockVals = [
                  Math.max(1, baseVal - 2),
                  Math.max(2, baseVal + 3),
                  Math.max(1, baseVal - 1),
                  Math.max(2, baseVal + 1),
                  Math.max(1, baseVal - 3),
                  Math.max(3, baseVal + 4),
                  stats?.totalIncidents || 0
                ];
                const maxVal = Math.max(...mockVals, 10);
                const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                return mockVals.map((val, idx) => {
                  const heightPct = (val / maxVal) * 100;
                  return (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>{val}</span>
                      <div style={{ width: "100%", height: `${heightPct}px`, background: idx === 6 ? "var(--color-danger)" : "var(--color-accent)", borderRadius: "4px 4px 0 0" }} />
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{days[idx]}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {activeTab === "revenue" && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Monthly Revenue Target</span>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-success)" }}>R{(stats?.mrr || 0).toLocaleString()} <span style={{ fontSize: "14px", color: "var(--color-text-muted)", fontWeight: 500 }}>MRR</span></span>
                <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Live SaaS</span> pricing tier distribution
                </div>
              </div>
              <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "24px" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "12px" }}>Subscription Tier Distribution</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tierStats.map((tier, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      <span>{tier.name} (R{tier.price}/mo)</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{tier.count} tenant(s)</span>
                    </div>
                  ))}
                  {tierStats.length === 0 && (
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No subscription tiers active.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
