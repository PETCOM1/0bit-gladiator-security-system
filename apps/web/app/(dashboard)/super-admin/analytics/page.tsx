"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Download, Users, Building2, CreditCard, ShieldAlert } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock tenant operations data for Super Admin
const INITIAL_TENANTS = [
  { id: "mock-tenant-id", name: "Gladiator Pro", tier: "PRO", billing: "MONTHLY", users: 18, status: "ACTIVE", created: "2026-01-10" },
  { id: "cmq4hebi10004q8v9wlwqvsy8", name: "Apex Security Group", tier: "BASIC", billing: "MONTHLY", users: 8, status: "ACTIVE", created: "2026-03-15" },
  { id: "tenant-3-pilot", name: "Alpha Guards Ltd", tier: "Pilot", billing: "MONTHLY", users: 4, status: "TRIAL", created: "2026-06-01" },
  { id: "tenant-4-ent", name: "Vanguard Systems Corp", tier: "ENTERPRISE", billing: "YEARLY", users: 145, status: "ACTIVE", created: "2025-08-20" },
  { id: "tenant-5-pro", name: "Sentinel Watch Co", tier: "PRO", billing: "YEARLY", users: 34, status: "ACTIVE", created: "2026-02-05" },
  { id: "tenant-6-basic", name: "Local Area Patrols", tier: "BASIC", billing: "MONTHLY", users: 12, status: "SUSPENDED", created: "2026-04-12" },
  { id: "tenant-7-pilot", name: "Red Alert Response", tier: "Pilot", billing: "MONTHLY", users: 2, status: "TRIAL", created: "2026-06-18" },
];

export default function SuperAdminAnalyticsPage() {
  const [tenants] = useState(INITIAL_TENANTS);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filter logic
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === "" || t.tier === tierFilter;
      const matchStatus = statusFilter === "" || t.status === statusFilter;
      return matchSearch && matchTier && matchStatus;
    });
  }, [tenants, search, tierFilter, statusFilter]);

  // KPI Calculations
  const totalTenants = filteredTenants.length;
  const activeCount = filteredTenants.filter(t => t.status === "ACTIVE").length;
  const trialCount = filteredTenants.filter(t => t.status === "TRIAL").length;
  const totalUsers = filteredTenants.reduce((acc, curr) => acc + curr.users, 0);

  // PDF Download Action
  const handleDownloadPDF = () => {
    const headers = ["Tenant Name", "Tier", "Billing", "Active Users", "Status", "Joined Date"];
    const rows = filteredTenants.map(t => [
      t.name,
      t.tier,
      t.billing,
      t.users.toString(),
      t.status,
      t.created
    ]);
    exportToPDF("Platform Tenants Audit & Analytics", headers, rows, "super_admin_tenants_analytics.pdf");
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
            <BarChart size={22} color="var(--color-accent)" /> Platform Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Overview of platform-wide tenant activities, system metrics, and tier compliance.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export PDF Report
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Total Tenants</span>
            <Building2 size={18} color="var(--color-accent)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{totalTenants}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Active Subscriptions</span>
            <CreditCard size={18} color="var(--color-success)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{activeCount}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Trial Periods</span>
            <Users size={18} color="var(--color-info)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{trialCount}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Total End Users</span>
            <ShieldAlert size={18} color="var(--color-warning)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{totalUsers.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter and Table container */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {/* Table Header / Filters */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "var(--color-bg-subtle)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Registered Tenants</h2>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search tenant name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: "200px" }}
            />
            
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">All Tiers</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
              <option value="Pilot">Pilot</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="TRIAL">TRIAL</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>

        {/* Table list */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Tenant Name</th>
                <th style={headerCellStyle}>Subscription Tier</th>
                <th style={headerCellStyle}>Billing Cycle</th>
                <th style={headerCellStyle}>Active Users</th>
                <th style={headerCellStyle}>Status</th>
                <th style={headerCellStyle}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No tenants found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t, idx) => (
                  <tr key={t.id} style={{ background: idx % 2 === 0 ? "transparent" : "var(--color-bg-subtle)" }}>
                    <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{t.name}</td>
                    <td style={bodyCellStyle}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "var(--color-accent-subtle)", color: "var(--color-accent)" }}>
                        {t.tier}
                      </span>
                    </td>
                    <td style={bodyCellStyle}>{t.billing}</td>
                    <td style={bodyCellStyle}>{t.users}</td>
                    <td style={bodyCellStyle}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: t.status === "ACTIVE" ? "var(--color-success-subtle)" : t.status === "TRIAL" ? "var(--color-info-subtle)" : "var(--color-danger-subtle)",
                        color: t.status === "ACTIVE" ? "var(--color-success)" : t.status === "TRIAL" ? "var(--color-info)" : "var(--color-danger)"
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ ...bodyCellStyle, borderBottom: idx === filteredTenants.length - 1 ? "none" : "1px solid var(--color-border)" }}>{t.created}</td>
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
