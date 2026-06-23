"use client";

import React, { useEffect, useState, Suspense } from "react";
import { CheckCircle2, Plus, X, ShieldAlert, Image as ImageIcon, Eye, Search, Filter, Calendar } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

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

const selectStyle = {
  ...inputStyle,
  appearance: "none" as const,
  cursor: "pointer"
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

const filterByDuration = (createdAtString: string, duration: string) => {
  if (duration === "ALL") return true;
  const date = new Date(createdAtString);
  const now = new Date();
  
  // Reset hours to start of day for comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (duration === "TODAY") {
    return date >= todayStart;
  }
  if (duration === "WEEK") {
    const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000);
    return date >= weekStart;
  }
  if (duration === "MONTH") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= monthStart;
  }
  if (duration === "YEAR") {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return date >= yearStart;
  }
  return true;
};

function SecurityComplianceContent() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [category, setCategory] = useState("ROUTINE");
  const [entryText, setEntryText] = useState("");
  const [allClear, setAllClear] = useState(true);
  const [severity, setSeverity] = useState("LOW");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterDuration, setFilterDuration] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Zoom Modal State
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await managerService.getOccurrences();
      const myEntries = (res.data.data.entries || []).filter((e: any) => e.userId === user?.id);
      setEntries(myEntries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchEntries(); 
  }, [user]);

  // Handle Routine category text prefill
  useEffect(() => {
    if ((category === "ROUTINE" || category === "HANDOVER") && allClear) {
      setEntryText("All Clear. No incidents reported.");
    } else if (entryText === "All Clear. No incidents reported.") {
      setEntryText("");
    }
  }, [category, allClear]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payloadText = (category === "ROUTINE" || category === "HANDOVER") && allClear
        ? "All Clear. No incidents reported."
        : entryText;

      await managerService.createOccurrence({
        entryText: payloadText,
        category,
        severity: (category === "INCIDENT" || category === "EMERGENCY") ? severity : "LOW",
        location: location || undefined,
        image: image || undefined
      });
      
      setShowForm(false);
      setCategory("ROUTINE");
      setEntryText("");
      setAllClear(true);
      setSeverity("LOW");
      setLocation("");
      setImage("");
      
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Failed to log occurrence book entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered and Paginated Entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.entryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.location && entry.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === "ALL" || entry.category === filterCategory;
    const matchesDuration = filterByDuration(entry.createdAt, filterDuration);
    return matchesSearch && matchesCategory && matchesDuration;
  });

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage) || 1;
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterDuration]);

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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={24} color="var(--color-accent)" /> Occurrence Book
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Log daily routine patrols, guard handovers, and detailed security incident reports.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            padding: "10px 18px", 
            background: showForm ? "var(--color-bg-subtle)" : "var(--color-accent)", 
            color: showForm ? "var(--color-text-primary)" : "var(--color-accent-text)", 
            border: showForm ? "1px solid var(--color-border)" : "none", 
            borderRadius: "var(--radius-md)", 
            fontSize: "13.5px",
            fontWeight: 600, 
            cursor: "pointer", 
            transition: "opacity var(--transition-fast)" 
          }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancel" : "New OB Entry"}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "var(--color-card-bg)", padding: "28px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>New Occurrence Entry</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Entry Type / Category *</label>
              <select value={category} onChange={e => { setCategory(e.target.value); setEntryText(""); }} style={inputStyle}>
                <option value="ROUTINE">Routine Check</option>
                <option value="HANDOVER">Handover</option>
                <option value="INCIDENT">Incident Report</option>
                <option value="EMERGENCY">Emergency Report</option>
                <option value="OTHER">Other Log</option>
              </select>
            </div>

            {(category === "INCIDENT" || category === "EMERGENCY") && (
              <div>
                <label style={labelStyle}>Severity level *</label>
                <select value={severity} onChange={e => setSeverity(e.target.value)} style={inputStyle}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            )}

            <div>
              <label style={labelStyle}>Location / Zone</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="E.g. Warehouse B, South Gate" style={inputStyle} />
            </div>
          </div>

          {(category === "ROUTINE" || category === "HANDOVER") && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-success-subtle)", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <input 
                id="all-clear-checkbox"
                type="checkbox" 
                checked={allClear} 
                onChange={e => setAllClear(e.target.checked)} 
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--color-success)" }} 
              />
              <label htmlFor="all-clear-checkbox" style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-success)", cursor: "pointer", userSelect: "none" }}>
                All Clear (No incidents or warnings to report)
              </label>
            </div>
          )}

          {(!allClear || (category !== "ROUTINE" && category !== "HANDOVER")) && (
            <div>
              <label style={labelStyle}>
                {(category === "INCIDENT" || category === "EMERGENCY") ? "Detailed Incident Report *" : "Entry Details *"}
              </label>
              <textarea 
                required 
                value={entryText} 
                onChange={e => setEntryText(e.target.value)} 
                placeholder={(category === "INCIDENT" || category === "EMERGENCY") ? "Describe what happened, what action was taken, and people involved..." : "Log the details here..."} 
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} 
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Attach Picture (Optional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} id="ob-image-picker" />
              <label 
                htmlFor="ob-image-picker" 
                style={{ 
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", 
                  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", 
                  fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer" 
                }}
              >
                <ImageIcon size={16} /> Select Photo
              </label>
              {image && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-success-subtle)", padding: "6px 12px", borderRadius: "var(--radius-pill)" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-success)", fontWeight: 600 }}>Photo attached</span>
                  <button type="button" onClick={() => setImage("")} style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: "12px 24px", 
              background: (category === "INCIDENT" || category === "EMERGENCY") ? "var(--color-danger)" : "var(--color-text-primary)", 
              color: (category === "INCIDENT" || category === "EMERGENCY") ? "#fff" : "var(--color-bg-secondary)", 
              border: "none", 
              borderRadius: "var(--radius-md)", 
              fontWeight: 600, 
              cursor: isSubmitting ? "not-allowed" : "pointer", 
              width: "fit-content", 
              marginTop: "8px", 
              transition: "opacity var(--transition-fast)" 
            }}
          >
            {isSubmitting ? "Saving..." : "Save Log Entry"}
          </button>
        </form>
      )}

      {/* Log Book Display */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        
        {/* Table Filters Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Filter size={18} color="var(--color-accent)" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Filter Log Entries</h2>
          </div>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search details..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "32px", width: "200px", padding: "8px 12px 8px 32px" }} 
              />
            </div>
            
            {/* Category Filter */}
            <div style={{ position: "relative" }}>
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)} 
                style={{ ...selectStyle, width: "160px", padding: "8px 12px 8px 14px" }}
              >
                <option value="ALL">All Categories</option>
                <option value="ROUTINE">Routine Checks</option>
                <option value="HANDOVER">Handovers</option>
                <option value="INCIDENT">Incident Reports</option>
                <option value="EMERGENCY">Emergencies</option>
                <option value="OTHER">Other Logs</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div style={{ position: "relative" }}>
              <select 
                value={filterDuration} 
                onChange={e => setFilterDuration(e.target.value)} 
                style={{ ...selectStyle, width: "150px", padding: "8px 12px 8px 14px" }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
                <option value="YEAR">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "180px" }}>Date & Time</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px" }}>Category</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry Details</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "110px" }}>Severity</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "100px" }}>Media</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading occurrences...</td></tr>
              ) : paginatedEntries.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No log entries match the filters.</td></tr>
              ) : paginatedEntries.map((entry, i) => {
                const isIncident = entry.category === "INCIDENT" || entry.category === "EMERGENCY";
                const sevColor = getSeverityColor(entry.severity);
                const catColor = getCategoryColor(entry.category);
                
                return (
                  <tr 
                    key={entry.id} 
                    style={{ borderBottom: i < paginatedEntries.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13px" }}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    
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

                    <td style={{ padding: "16px 24px" }}>
                      {entry.image ? (
                        <div 
                          onClick={() => setZoomImage(entry.image)}
                          style={{ position: "relative", width: "40px", height: "40px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-border)", cursor: "zoom-in" }}
                          title="Click to zoom image"
                        >
                          <img src={entry.image} alt="Log Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

        {/* Table Pagination */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Showing {filteredEntries.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of {filteredEntries.length} log entries
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

      {/* Zoom Modal */}
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

export default function SecurityCompliancePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading logs...</span>
      </div>
    }>
      <SecurityComplianceContent />
    </Suspense>
  );
}
