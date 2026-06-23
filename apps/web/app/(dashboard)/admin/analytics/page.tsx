"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Download, DollarSign, Award, Layers, ShieldCheck } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock analytics database data for Admin
const PLAN_USAGE = [
  { id: "tier-basic", name: "BASIC Plan", activeTenants: 12, price: 99, maxUsers: 50, maxSites: 1, totalRevenue: 1188 },
  { id: "tier-pro", name: "PRO Plan", activeTenants: 26, price: 299, maxUsers: 500, maxSites: 5, totalRevenue: 7774 },
  { id: "tier-enterprise", name: "ENTERPRISE Plan", activeTenants: 3, price: 999, maxUsers: 9999, maxSites: 999, totalRevenue: 2997 },
  { id: "tier-pilot", name: "Pilot Trial Plan", activeTenants: 18, price: 0, maxUsers: 10, maxSites: 1, totalRevenue: 0 },
];

export default function AdminAnalyticsPage() {
  const [plans] = useState(PLAN_USAGE);
  const [search, setSearch] = useState("");

  const filteredPlans = useMemo(() => {
    return plans.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [plans, search]);

  // KPI calculations
  const totalSubscribers = filteredPlans.reduce((acc, curr) => acc + curr.activeTenants, 0);
  const totalRevenue = filteredPlans.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const averageSubRevenue = totalSubscribers > 0 ? Math.round(totalRevenue / totalSubscribers) : 0;

  // PDF report builder
  const handleDownloadPDF = () => {
    const headers = ["Plan Name", "Active Tenants", "Price", "Max Users", "Max Sites", "Monthly Income"];
    const rows = filteredPlans.map(p => [
      p.name,
      p.activeTenants.toString(),
      `R${p.price}`,
      p.maxUsers.toString(),
      p.maxSites.toString(),
      `R${p.totalRevenue}`
    ]);
    exportToPDF("System Plans License & Earnings Analytics", headers, rows, "admin_licensing_analytics.pdf");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart size={22} color="var(--color-accent)" /> Licensing & Revenue
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Monitor subscription tier usage distributions, platform revenue, and pricing analytics.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export Plan Metrics
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Active Subscriptions</span>
            <Layers size={18} color="var(--color-accent)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{totalSubscribers}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Monthly Revenue</span>
            <DollarSign size={18} color="var(--color-success)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>R{totalRevenue.toLocaleString()}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Average ARPU</span>
            <Award size={18} color="var(--color-info)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>R{averageSubRevenue}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Platform Compliance</span>
            <ShieldCheck size={18} color="var(--color-warning)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>100%</span>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "var(--color-bg-subtle)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Plan Performance Details</h2>
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "7px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none", width: "200px" }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Plan Name</th>
                <th style={headerCellStyle}>Active Subscriptions</th>
                <th style={headerCellStyle}>Monthly Pricing</th>
                <th style={headerCellStyle}>Max Users</th>
                <th style={headerCellStyle}>Max Sites</th>
                <th style={headerCellStyle}>Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No plans matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? "transparent" : "var(--color-bg-subtle)" }}>
                    <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{p.name}</td>
                    <td style={bodyCellStyle}>{p.activeTenants}</td>
                    <td style={bodyCellStyle}>R{p.price} /mo</td>
                    <td style={bodyCellStyle}>{p.maxUsers === 9999 ? "Unlimited" : p.maxUsers}</td>
                    <td style={bodyCellStyle}>{p.maxSites === 999 ? "Unlimited" : p.maxSites}</td>
                    <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-success)", borderBottom: idx === filteredPlans.length - 1 ? "none" : "1px solid var(--color-border)" }}>R{p.totalRevenue}</td>
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
