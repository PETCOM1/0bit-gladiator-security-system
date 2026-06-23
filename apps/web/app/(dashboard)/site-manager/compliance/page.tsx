"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, Clock, MapPin, X, Eye } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function SupervisorCompliancePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Zoom Modal State
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await managerService.getOccurrences();
      setEntries(res.data.data.entries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchEntries(); 
  }, []);

  const getSeverityColor = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL": return { bg: "var(--color-danger-subtle)", text: "var(--color-danger)" };
      case "HIGH": return { bg: "var(--color-warning-subtle)", text: "var(--color-warning)" };
      case "MEDIUM": return { bg: "var(--color-accent-subtle)", text: "var(--color-accent)" };
      default: return { bg: "var(--color-success-subtle)", text: "var(--color-success)" };
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "EMERGENCY": return { bg: "var(--color-danger)", text: "#fff" };
      case "INCIDENT": return { bg: "var(--color-warning)", text: "#000" };
      case "HANDOVER": return { bg: "var(--color-info-subtle)", text: "var(--color-info)" };
      default: return { bg: "var(--color-bg-subtle)", text: "var(--color-text-secondary)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={24} color="var(--color-accent)" /> Occurrence Book
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Monitor and audit all daily logs, handovers, and reported incidents reported by on-site guards.
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "160px" }}>Time</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "150px" }}>Personnel</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px" }}>Category</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry details</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "110px" }}>Severity</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "90px" }}>Photo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading occurrence entries...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No occurrence book entries recorded.</td></tr>
              ) : entries.map((entry, i) => {
                const isIncident = entry.category === "INCIDENT" || entry.category === "EMERGENCY";
                const sevColor = getSeverityColor(entry.severity);
                const catColor = getCategoryColor(entry.category);

                return (
                  <tr 
                    key={entry.id} 
                    style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13px" }}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    
                    {/* Personnel / Guard Name */}
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500 }}>
                      {entry.user?.firstName} {entry.user?.lastName}
                    </td>
                    
                    {/* Category Badge */}
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        padding: "3px 8px", 
                        borderRadius: "8px", 
                        fontSize: "10.5px", 
                        fontWeight: 700, 
                        background: catColor.bg, 
                        color: catColor.text,
                        textTransform: "uppercase"
                      }}>
                        {entry.category === "ROUTINE" ? "ROUTINE" : entry.category}
                      </span>
                    </td>
                    
                    {/* Entry description & location */}
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        {isIncident && <ShieldAlert size={16} color="var(--color-danger)" style={{ marginTop: "2px", flexShrink: 0 }} />}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.4 }}>{entry.entryText}</span>
                          {entry.location && (
                            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, marginTop: "4px" }}>
                              📍 Location: {entry.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Severity (Incident Only) */}
                    <td style={{ padding: "16px 24px" }}>
                      {isIncident ? (
                        <span style={{ 
                          display: "inline-flex", 
                          padding: "3px 8px", 
                          borderRadius: "12px", 
                          fontSize: "10.5px", 
                          fontWeight: 700, 
                          background: sevColor.bg, 
                          color: sevColor.text 
                        }}>
                          {entry.severity?.toUpperCase()}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>—</span>
                      )}
                    </td>

                    {/* Photo attachment preview */}
                    <td style={{ padding: "16px 24px" }}>
                      {entry.image ? (
                        <div 
                          onClick={() => setZoomImage(entry.image)}
                          style={{ position: "relative", width: "40px", height: "40px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-border)", cursor: "zoom-in" }}
                          title="Click to zoom photo"
                        >
                          <img src={entry.image} alt="OB Log Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity var(--transition-fast)" }} onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "0"; }}>
                            <Eye size={12} color="#fff" />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>None</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "24px" }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <img src={zoomImage} alt="Enlarged view" style={{ maxWidth: "100%", maxHeight: "80vh", display: "block" }} />
            <button 
              onClick={() => setZoomImage(null)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
