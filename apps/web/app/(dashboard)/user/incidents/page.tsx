"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, MapPin, Plus, X } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SecurityIncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("LOW");

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await managerService.getIncidents();
      const myIncidents = (res.data.data.incidents || []).filter((inc: any) => inc.reportedById === user?.id);
      setIncidents(myIncidents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchIncidents(); 
  }, [user]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await managerService.createIncident({ title, description, severity });
      setShowForm(false);
      setTitle(""); setDescription(""); setSeverity("LOW");
      fetchIncidents();
    } catch (err) {
      console.error(err);
      alert("Failed to report incident");
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case "CRITICAL": return { bg: "var(--color-danger-subtle)", color: "var(--color-danger)" };
      case "HIGH": return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)" };
      case "MEDIUM": return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)" };
      default: return { bg: "var(--color-success-subtle)", color: "var(--color-success)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={28} color="var(--color-danger)" /> Incident Reports
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Report any security incidents, hazards, or breaches immediately.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cancel" : "Report Incident"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleReport} style={{ background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>New Incident Report</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Incident Title *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Unauthorized access at South Gate" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Description *</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide full details of the incident..." style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)", minHeight: "100px", resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "200px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Severity *</label>
            <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <button type="submit" style={{ padding: "12px 24px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", width: "fit-content", marginTop: "8px" }}>
            Submit Report
          </button>
        </form>
      )}

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Severity</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading incidents...</td></tr>
              ) : incidents.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No incidents reported. All clear!</td></tr>
              ) : incidents.map((inc, i) => {
                const sStyle = getSeverityStyle(inc.severity);
                return (
                  <tr key={inc.id} style={{ borderBottom: i < incidents.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "15px", marginBottom: "4px" }}>{inc.title}</div>
                      <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", maxWidth: "400px" }}>{inc.description}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} /> {new Date(inc.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sStyle.bg, color: sStyle.color }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, 
                        background: inc.status === "RESOLVED" || inc.status === "CLOSED" ? "rgba(16, 185, 129, 0.1)" : "var(--color-bg-subtle)", 
                        color: inc.status === "RESOLVED" || inc.status === "CLOSED" ? "rgb(16, 185, 129)" : "var(--color-text-secondary)" 
                      }}>
                        {inc.status}
                      </span>
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
