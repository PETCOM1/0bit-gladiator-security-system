"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function IncidentsManagerPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await managerService.getIncidents();
      setIncidents(res.data.data.incidents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await managerService.updateIncidentStatus(id, { status: newStatus });
      fetchIncidents();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return { bg: "var(--color-danger-subtle)", color: "var(--color-danger)" };
      case "HIGH": return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)" };
      case "MEDIUM": return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)" };
      default: return { bg: "var(--color-success-subtle)", color: "var(--color-success)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert size={24} color="var(--color-danger)" /> Incident Reports
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Monitor and update incidents reported by security officers across all sites.
        </p>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Details</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Location & Officer</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Severity</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading incidents...</td></tr>
              ) : incidents.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No incidents reported. All clear!</td></tr>
              ) : incidents.map((inc, i) => {
                const sStyle = getSeverityStyle(inc.severity);
                return (
                  <tr 
                    key={inc.id} 
                    style={{ borderBottom: i < incidents.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "15px", marginBottom: "4px" }}>{inc.title}</div>
                      <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", maxWidth: "300px" }}>{inc.description}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} /> {new Date(inc.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        <MapPin size={14} color="var(--color-accent)" /> {inc.site?.name || "Unknown Site"}
                      </div>
                      <div>Reported by: {inc.reportedBy?.firstName} {inc.reportedBy?.lastName}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sStyle.bg, color: sStyle.color }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <select 
                        value={inc.status} 
                        onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                        style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}
                      >
                        <option value="OPEN">Open</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
