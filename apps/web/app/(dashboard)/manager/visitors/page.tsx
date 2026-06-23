"use client";

import React, { useEffect, useState } from "react";
import { Contact, Clock, MapPin, User, LogOut } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function VisitorsManagerPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await managerService.getVisitors();
      setVisitors(res.data.data.visitors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVisitors(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <Contact size={24} color="var(--color-accent)" /> Visitor Logs
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          View the check-in and check-out ledger for all physical locations.
        </p>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visitor</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Purpose / Details</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Location & Guard</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Time Log</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading visitors...</td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No visitors recorded yet.</td></tr>
              ) : visitors.map((v, i) => (
                <tr 
                  key={v.id} 
                  style={{ borderBottom: i < visitors.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <User size={14} /> {v.name}
                    </div>
                    {v.idNumber && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>ID: {v.idNumber}</div>}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>{v.purpose || "No reason given"}</div>
                    {v.vehicleReg && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>Vehicle: {v.vehicleReg}</div>}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      <MapPin size={14} color="var(--color-accent)" /> {v.site?.name || "Unknown Site"}
                    </div>
                    <div>Logged by: {v.loggedBy?.firstName} {v.loggedBy?.lastName}</div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                        <span style={{ color: "var(--color-success)" }}>IN:</span> {new Date(v.checkInTime).toLocaleString()}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: v.checkOutTime ? "var(--color-text-primary)" : "var(--color-text-muted)", fontWeight: 500 }}>
                        <span style={{ color: "var(--color-danger)" }}>OUT:</span> {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "Still on site"}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
