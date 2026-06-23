"use client";

import React, { useEffect, useState } from "react";
import { Contact, Plus, Search, UserCheck, X } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function SecurityVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "", idNumber: "", company: "", personVisiting: "", vehicleReg: "", purpose: ""
  });

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await managerService.checkInVisitor(formData);
      setShowForm(false);
      setFormData({ name: "", idNumber: "", company: "", personVisiting: "", vehicleReg: "", purpose: "" });
      fetchVisitors();
    } catch (err) {
      console.error(err);
      alert("Failed to register visitor");
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await managerService.checkOutVisitor(id);
      fetchVisitors();
    } catch (err) {
      console.error(err);
      alert("Failed to check out visitor");
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.company && v.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inputStyle = {
    padding: "10px 14px",
    background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "14px",
    color: "var(--color-text-primary)",
    outline: "none",
    transition: "border var(--transition-fast)",
    width: "100%",
    boxSizing: "border-box" as const
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    marginBottom: "6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <Contact size={24} color="var(--color-accent)" /> Visitor Management
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Register new visitors and record check-outs.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", transition: "opacity var(--transition-fast)" }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cancel" : "Register Visitor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} style={{ background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>New Visitor Registration</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Visitor Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>ID Number (Optional)</label>
              <input type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} placeholder="ID / Passport" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Company (Optional)</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Company Name" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Person Visiting</label>
              <input type="text" required value={formData.personVisiting} onChange={e => setFormData({...formData, personVisiting: e.target.value})} placeholder="Who are they visiting?" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Vehicle Reg (Optional)</label>
              <input type="text" value={formData.vehicleReg} onChange={e => setFormData({...formData, vehicleReg: e.target.value})} placeholder="License Plate" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Purpose</label>
              <input type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} placeholder="Meeting, Delivery, etc." style={inputStyle} />
            </div>
          </div>
          <button type="submit" style={{ padding: "10px 24px", background: "var(--color-text-primary)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", width: "fit-content", marginTop: "8px", transition: "opacity var(--transition-fast)" }} onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
            Record Check-In
          </button>
        </form>
      )}

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "12px", alignItems: "center" }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" 
            placeholder="Search today's visitors by name or company..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", color: "var(--color-text-primary)", width: "100%", fontSize: "14px" }}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visitor</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visiting</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Time In</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading visitors...</td></tr>
              ) : filteredVisitors.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No visitors found today.</td></tr>
              ) : filteredVisitors.map((visitor, i) => (
                <tr 
                  key={visitor.id} 
                  style={{ borderBottom: i < filteredVisitors.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>{visitor.name}</div>
                    {(visitor.company || visitor.vehicleReg) && (
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {visitor.company} {visitor.company && visitor.vehicleReg && "•"} {visitor.vehicleReg}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-primary)" }}>
                    {visitor.personVisiting || "N/A"}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    {new Date(visitor.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                      background: visitor.status === "CHECKED_IN" ? "var(--color-success-subtle)" : "var(--color-bg-subtle)",
                      color: visitor.status === "CHECKED_IN" ? "var(--color-success)" : "var(--color-text-secondary)"
                    }}>
                      {visitor.status === "CHECKED_IN" ? "ON SITE" : "DEPARTED"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    {visitor.status === "CHECKED_IN" && (
                      <button 
                        onClick={() => handleCheckOut(visitor.id)}
                        style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer", transition: "background var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        Check Out
                      </button>
                    )}
                    {visitor.status === "CHECKED_OUT" && (
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        Out: {visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Unknown"}
                      </span>
                    )}
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
