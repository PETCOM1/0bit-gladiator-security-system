"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Download, Compass, ShieldAlert, Award, ClipboardCheck } from "lucide-react";
import { exportToPDF } from "@/shared/utils/pdf";

// Mock site manager patrol stats
const PATROL_CHECKPOINTS = [
  { id: "chk-001", name: "Gate West Entry Point", route: "Hourly Perimeter Route", officer: "Officer S. Khoza", status: "COMPLETED", nfc: "NFC_88201", time: "22:15" },
  { id: "chk-002", name: "Warehouse Back Door", route: "Hourly Perimeter Route", officer: "Officer S. Khoza", status: "COMPLETED", nfc: "NFC_88202", time: "22:30" },
  { id: "chk-003", name: "Office Level 1 Hallway", route: "Hourly Perimeter Route", officer: "Officer S. Khoza", status: "COMPLETED", nfc: "NFC_88203", time: "22:45" },
  { id: "chk-004", name: "Server Room Entryway", route: "Hourly Perimeter Route", officer: "Officer S. Khoza", status: "MISSED", nfc: "NFC_88204", time: "N/A" },
  { id: "chk-005", name: "Fence Post 12 North", route: "External Boundary Run", officer: "Officer J. Ndlovu", status: "COMPLETED", nfc: "NFC_99011", time: "23:05" },
  { id: "chk-006", name: "Fence Post 18 East", route: "External Boundary Run", officer: "Officer J. Ndlovu", status: "MISSED", nfc: "NFC_99012", time: "N/A" },
  { id: "chk-007", name: "Admin Office Back Alley", route: "External Boundary Run", officer: "Officer J. Ndlovu", status: "IN_PROGRESS", nfc: "NFC_99013", time: "Pending" },
];

export default function SiteManagerAnalyticsPage() {
  const [checkpoints] = useState(PATROL_CHECKPOINTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredCheckpoints = useMemo(() => {
    return checkpoints.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.route.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [checkpoints, search, statusFilter]);

  // Operational KPI calculations
  const totalScans = filteredCheckpoints.length;
  const completedScans = filteredCheckpoints.filter(c => c.status === "COMPLETED").length;
  const missedScans = filteredCheckpoints.filter(c => c.status === "MISSED").length;
  const inProgressScans = filteredCheckpoints.filter(c => c.status === "IN_PROGRESS").length;

  const handleDownloadPDF = () => {
    const headers = ["ID", "Checkpoint Name", "Patrol Route", "Security Officer", "Status", "NFC Tag", "Time Checked"];
    const rows = filteredCheckpoints.map(c => [
      c.id,
      c.name,
      c.route,
      c.officer,
      c.status,
      c.nfc,
      c.time
    ]);
    exportToPDF("Site Patrol Checkpoint Analytics", headers, rows, "site_manager_patrol_analytics.pdf");
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
            <BarChart size={22} color="var(--color-accent)" /> Site Patrol Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Monitor officer NFC checkpoint scans, route completion percentages, and shift compliance.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export Patrol Logs
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Active Patrol Routes</span>
            <Compass size={18} color="var(--color-accent)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>2</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Completed Scans</span>
            <ClipboardCheck size={18} color="var(--color-success)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{completedScans} / {totalScans}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>Missed Checkpoints</span>
            <ShieldAlert size={18} color="var(--color-danger)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{missedScans}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>In Progress</span>
            <Award size={18} color="var(--color-info)" />
          </div>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>{inProgressScans}</span>
        </div>
      </div>

      {/* Patrol list container */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "var(--color-bg-subtle)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>NFC Patrol Scans Ledger</h2>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search checkpoint/route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "7px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none", width: "200px" }}
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "7px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none" }}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="MISSED">MISSED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>ID</th>
                <th style={headerCellStyle}>Checkpoint Name</th>
                <th style={headerCellStyle}>Patrol Route</th>
                <th style={headerCellStyle}>Security Officer</th>
                <th style={headerCellStyle}>Status</th>
                <th style={headerCellStyle}>NFC Tag ID</th>
                <th style={headerCellStyle}>Time Checked</th>
              </tr>
            </thead>
            <tbody>
              {filteredCheckpoints.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No checkpoints matched your filters.
                  </td>
                </tr>
              ) : (
                filteredCheckpoints.map((c, idx) => (
                  <tr key={c.id} style={{ background: idx % 2 === 0 ? "transparent" : "var(--color-bg-subtle)" }}>
                    <td style={{ ...bodyCellStyle, fontWeight: 600 }}>{c.id}</td>
                    <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{c.name}</td>
                    <td style={bodyCellStyle}>{c.route}</td>
                    <td style={bodyCellStyle}>{c.officer}</td>
                    <td style={bodyCellStyle}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: c.status === "COMPLETED" ? "var(--color-success-subtle)" : c.status === "MISSED" ? "var(--color-danger-subtle)" : "var(--color-info-subtle)",
                        color: c.status === "COMPLETED" ? "var(--color-success)" : c.status === "MISSED" ? "var(--color-danger)" : "var(--color-info)"
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={bodyCellStyle}><code>{c.nfc}</code></td>
                    <td style={{ ...bodyCellStyle, borderBottom: idx === filteredCheckpoints.length - 1 ? "none" : "1px solid var(--color-border)" }}>{c.time}</td>
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
