"use client";

import React, { useEffect, useState } from "react";
import { Contact, Plus, Search, UserCheck, X, Filter } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

const filterVisitorByDuration = (checkInTimeString: string, duration: string) => {
  if (duration === "ALL") return true;
  const date = new Date(checkInTimeString);
  const now = new Date();
  
  if (duration === "TODAY") {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date >= todayStart;
  }
  if (duration === "7DAYS") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= sevenDaysAgo;
  }
  if (duration === "30DAYS") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return date >= thirtyDaysAgo;
  }
  return true;
};

export default function SecurityVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDuration, setFilterDuration] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (v.company && v.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.idNumber && v.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.vehicleReg && v.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.purpose && v.purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.personVisiting && v.personVisiting.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesDuration = filterVisitorByDuration(v.checkInTime, filterDuration);
    return matchesSearch && matchesDuration;
  });

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage) || 1;
  const paginatedVisitors = filteredVisitors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDuration]);

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
        
        {/* Table Filters Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Search size={18} color="var(--color-text-muted)" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Search & Filter</h2>
          </div>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <input 
              type="text" 
              placeholder="Search name, ID, vehicle..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, width: "240px", padding: "8px 12px 8px 12px" }}
            />
            
            <select 
              value={filterDuration} 
              onChange={e => setFilterDuration(e.target.value)} 
              style={{ ...inputStyle, width: "160px", padding: "8px 12px 8px 12px", cursor: "pointer" }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visitor Name</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "140px" }}>SA ID Number</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px" }}>Vehicle Reg</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Purpose / Visiting</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "160px" }}>Check In</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "160px" }}>Check Out</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "110px" }}>Status</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading visitors...</td></tr>
              ) : paginatedVisitors.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No visitors found.</td></tr>
              ) : paginatedVisitors.map((visitor, i) => (
                <tr 
                  key={visitor.id} 
                  style={{ borderBottom: i < paginatedVisitors.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>
                    {visitor.name}
                    {visitor.company && (
                      <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 500, marginTop: "4px" }}>
                        Co: {visitor.company}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                    {visitor.idNumber || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {visitor.vehicleReg || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13.5px" }}>
                    <div style={{ color: "var(--color-text-primary)" }}>{visitor.purpose || "No reason given"}</div>
                    {visitor.personVisiting && (
                      <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                        Visiting: {visitor.personVisiting}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    {new Date(visitor.checkInTime).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    {visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleString() : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
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
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Checked Out</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Showing {filteredVisitors.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredVisitors.length)} of {filteredVisitors.length} visitors
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
              style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
              style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
