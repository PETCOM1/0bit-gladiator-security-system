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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <Contact size={28} color="var(--color-accent)" /> Visitor Management
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Register new visitors and record check-outs.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cancel" : "Register Visitor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} style={{ background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>New Visitor Registration</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Visitor Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>ID Number (Optional)</label>
              <input type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} placeholder="ID / Passport" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Company (Optional)</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Company Name" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Person Visiting</label>
              <input type="text" required value={formData.personVisiting} onChange={e => setFormData({...formData, personVisiting: e.target.value})} placeholder="Who are they visiting?" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Vehicle Reg (Optional)</label>
              <input type="text" value={formData.vehicleReg} onChange={e => setFormData({...formData, vehicleReg: e.target.value})} placeholder="License Plate" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Purpose</label>
              <input type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} placeholder="Meeting, Delivery, etc." style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }} />
            </div>
          </div>
          <button type="submit" style={{ padding: "10px 24px", background: "var(--color-text-primary)", color: "var(--color-bg-primary)", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", width: "fit-content", marginTop: "8px" }}>
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
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Visitor</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Visiting</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Time In</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading visitors...</td></tr>
              ) : filteredVisitors.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No visitors found today.</td></tr>
              ) : filteredVisitors.map((visitor, i) => (
                <tr key={visitor.id} style={{ borderBottom: i < filteredVisitors.length - 1 ? "1px solid var(--color-border)" : "none" }}>
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
                      background: visitor.status === "CHECKED_IN" ? "rgba(16, 185, 129, 0.1)" : "var(--color-bg-subtle)",
                      color: visitor.status === "CHECKED_IN" ? "rgb(16, 185, 129)" : "var(--color-text-secondary)"
                    }}>
                      {visitor.status === "CHECKED_IN" ? "ON SITE" : "DEPARTED"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    {visitor.status === "CHECKED_IN" && (
                      <button 
                        onClick={() => handleCheckOut(visitor.id)}
                        style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}
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
