"use client";

import { useState, useEffect } from "react";
import { PlusCircle, ShieldAlert, LogIn, LogOut, Clock, X } from "lucide-react";
import { guardService } from "@/features/guard/services/guard.service";

export default function GuardDashboard() {
  const [shiftActive, setShiftActive] = useState<{ id: string } | null>(null);
  
  // Data State
  const [visitors, setVisitors] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isVisitorModalOpen, setVisitorModalOpen] = useState(false);
  const [isIncidentModalOpen, setIncidentModalOpen] = useState(false);

  // Form State
  const [visitorForm, setVisitorForm] = useState({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
  const [incidentForm, setIncidentForm] = useState({ title: "", description: "", severity: "LOW" });

  const loadData = async () => {
    try {
      const [visRes, incRes] = await Promise.all([
        guardService.getVisitors(),
        guardService.getIncidents(),
      ]);
      setVisitors(visRes.data?.data?.visitors || []);
      setIncidents(incRes.data?.data?.incidents || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartShift = async () => {
    try {
      const res = await guardService.startShift();
      setShiftActive({ id: res.data.data.shift.id });
    } catch (err) {
      console.error("Start shift failed", err);
    }
  };

  const handleEndShift = async () => {
    if (!shiftActive) return;
    try {
      await guardService.endShift(shiftActive.id);
      setShiftActive(null);
    } catch (err) {
      console.error("End shift failed", err);
    }
  };

  const submitVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.logVisitor(visitorForm);
      setVisitorModalOpen(false);
      setVisitorForm({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
      loadData();
    } catch (err) {
      console.error("Failed to log visitor", err);
    }
  };

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.reportIncident(incidentForm);
      setIncidentModalOpen(false);
      setIncidentForm({ title: "", description: "", severity: "LOW" });
      loadData();
    } catch (err) {
      console.error("Failed to report incident", err);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "14px",
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color var(--transition-fast)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading guard dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        background: "var(--color-card-bg)", 
        padding: "24px", 
        borderRadius: "var(--radius-xl)", 
        border: "1px solid var(--color-card-border)",
        boxShadow: "var(--color-card-shadow)"
      }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Guard Duty Operations
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span 
              style={{ width: "10px", height: "10px", borderRadius: "50%" }} 
              className={shiftActive ? "bg-green-500 animate-pulse" : "bg-red-500"} 
            />
            {shiftActive ? "Active Patrol Duty: Main Gate" : "Currently Off Duty"}
          </p>
        </div>
        <div>
          {shiftActive ? (
            <button 
              onClick={handleEndShift}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "var(--radius-md)",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#ef4444",
                cursor: "pointer",
                transition: "all var(--transition-fast)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
            >
              <LogOut size={16} /> End Shift
            </button>
          ) : (
            <button 
              onClick={handleStartShift}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "var(--color-success)",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                transition: "opacity var(--transition-fast)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <LogIn size={16} /> Start Shift
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }} className="guard-grid">
        
        {/* Actions (Left Column) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="action-buttons-grid">
            <button 
              disabled={!shiftActive}
              onClick={() => setVisitorModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "start",
                gap: "16px",
                background: "var(--color-card-bg)",
                padding: "24px",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--color-card-border)",
                boxShadow: "var(--color-card-shadow)",
                textAlign: "left",
                cursor: shiftActive ? "pointer" : "not-allowed",
                opacity: shiftActive ? 1 : 0.6,
                transition: "all var(--transition-base)",
              }}
              onMouseEnter={(e) => { 
                if (shiftActive) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                }
              }}
              onMouseLeave={(e) => { 
                if (shiftActive) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--color-card-border)";
                }
              }}
            >
              <div style={{ 
                padding: "12px", 
                borderRadius: "var(--radius-md)", 
                background: shiftActive ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)", 
                color: shiftActive ? "var(--color-accent)" : "var(--color-text-muted)", 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <PlusCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Log Visitor</h3>
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Register a new visitor check-in or check-out.</p>
              </div>
            </button>
            
            <button 
              disabled={!shiftActive}
              onClick={() => setIncidentModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "start",
                gap: "16px",
                background: "var(--color-card-bg)",
                padding: "24px",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--color-card-border)",
                boxShadow: "var(--color-card-shadow)",
                textAlign: "left",
                cursor: shiftActive ? "pointer" : "not-allowed",
                opacity: shiftActive ? 1 : 0.6,
                transition: "all var(--transition-base)",
              }}
              onMouseEnter={(e) => { 
                if (shiftActive) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#ef4444";
                }
              }}
              onMouseLeave={(e) => { 
                if (shiftActive) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--color-card-border)";
                }
              }}
            >
              <div style={{ 
                padding: "12px", 
                borderRadius: "var(--radius-md)", 
                background: shiftActive ? "rgba(239, 68, 68, 0.1)" : "var(--color-bg-subtle)", 
                color: shiftActive ? "#ef4444" : "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Report Incident</h3>
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Log a security incident in the occurrence book.</p>
              </div>
            </button>
          </section>

          {/* Active Visitors Table */}
          <section style={{
            background: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--color-card-shadow)",
            overflow: "hidden"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Active Visitors On-Site</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                    {["Name", "Vehicle Reg", "Time In"].map((h) => (
                      <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitors.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>
                        No active visitors.
                      </td>
                    </tr>
                  ) : (
                    visitors.map((v, i) => (
                      <tr 
                        key={v.id} 
                        style={{ borderBottom: i < visitors.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "14px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{v.name}</td>
                        <td style={{ padding: "14px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{v.vehicleReg || "—"}</td>
                        <td style={{ padding: "14px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{new Date(v.checkInTime).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Recent Incidents (Right Column) */}
        <div>
          <section style={{ 
            background: "var(--color-card-bg)", 
            padding: "24px", 
            borderRadius: "var(--radius-xl)", 
            border: "1px solid var(--color-card-border)",
            boxShadow: "var(--color-card-shadow)",
            height: "100%",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "var(--color-text-primary)" }}>
              <Clock size={18} style={{ color: "var(--color-accent)" }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Recent Incidents</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {incidents.length === 0 ? (
                <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)" }}>No recent incidents reported.</p>
              ) : (
                incidents.slice(0, 5).map((inc) => (
                  <div key={inc.id} style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                    <div style={{ 
                      width: "12px", 
                      height: "12px", 
                      borderRadius: "50%", 
                      border: "2px solid var(--color-border)",
                      background: inc.severity === "CRITICAL" ? "#ef4444" : "var(--color-accent)",
                      boxShadow: inc.severity === "CRITICAL" ? "0 0 8px #ef4444" : "0 0 8px var(--color-accent)",
                      marginTop: "4px", 
                      flexShrink: 0 
                    }} />
                    <div>
                      <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>{inc.title}</h4>
                      <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", marginTop: "2px", lineHeight: 1.4 }}>{inc.description}</p>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                        {new Date(inc.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Visitor Modal */}
      {isVisitorModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div 
            style={{ position: "absolute", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            onClick={() => setVisitorModalOpen(false)}
          />
          <div 
            className="glass-panel animate-fade-in"
            style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "440px", borderRadius: "var(--radius-xl)", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>Log Visitor</h2>
              <button 
                onClick={() => setVisitorModalOpen(false)} 
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "14px", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitVisitor} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input required value={visitorForm.name} onChange={(e) => setVisitorForm({...visitorForm, name: e.target.value})} style={inputStyle} placeholder="John Doe" />
              </div>
              <div>
                <label style={labelStyle}>ID Number</label>
                <input value={visitorForm.idNumber} onChange={(e) => setVisitorForm({...visitorForm, idNumber: e.target.value})} style={inputStyle} placeholder="Optional ID" />
              </div>
              <div>
                <label style={labelStyle}>Vehicle Registration</label>
                <input value={visitorForm.vehicleReg} onChange={(e) => setVisitorForm({...visitorForm, vehicleReg: e.target.value})} style={inputStyle} placeholder="ABC 123 GP" />
              </div>
              <div>
                <label style={labelStyle}>Purpose of Visit</label>
                <input value={visitorForm.purpose} onChange={(e) => setVisitorForm({...visitorForm, purpose: e.target.value})} style={inputStyle} placeholder="Site inspection" />
              </div>
              <button 
                type="submit" 
                style={{ 
                  width: "100%", 
                  background: "var(--color-accent)", 
                  color: "#0b0f19", 
                  fontWeight: 700, 
                  padding: "12px", 
                  borderRadius: "var(--radius-md)", 
                  border: "none",
                  cursor: "pointer",
                  marginTop: "10px",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)"
                }}
              >
                Log Visitor IN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {isIncidentModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div 
            style={{ position: "absolute", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            onClick={() => setIncidentModalOpen(false)}
          />
          <div 
            className="glass-panel animate-fade-in"
            style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "440px", borderRadius: "var(--radius-xl)", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>Report Incident</h2>
              <button 
                onClick={() => setIncidentModalOpen(false)} 
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "14px", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitIncident} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input required value={incidentForm.title} onChange={(e) => setIncidentForm({...incidentForm, title: e.target.value})} style={inputStyle} placeholder="Suspicious movement" />
              </div>
              <div>
                <label style={labelStyle}>Severity</label>
                <select 
                  value={incidentForm.severity} 
                  onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})} 
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="LOW" style={{ background: "var(--color-card-bg)" }}>Low - Routine</option>
                  <option value="MEDIUM" style={{ background: "var(--color-card-bg)" }}>Medium - Monitor</option>
                  <option value="HIGH" style={{ background: "var(--color-card-bg)" }}>High - Immediate Action</option>
                  <option value="CRITICAL" style={{ background: "var(--color-card-bg)" }}>Critical - Emergency</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea required value={incidentForm.description} onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})} style={{ ...inputStyle, height: "96px", resize: "none" }} placeholder="Provide detailed audit remarks..." />
              </div>
              <button 
                type="submit" 
                style={{ 
                  width: "100%", 
                  background: "#ef4444", 
                  color: "#fff", 
                  fontWeight: 700, 
                  padding: "12px", 
                  borderRadius: "var(--radius-md)", 
                  border: "none",
                  cursor: "pointer",
                  marginTop: "10px",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)"
                }}
              >
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
