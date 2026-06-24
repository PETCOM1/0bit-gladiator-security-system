"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FolderKanban, CheckCircle2, Calendar, ClipboardCheck, Contact, MapPin, 
  Search, Filter, ShieldAlert, User, Clock, Ban, Plus, X, Eye, Image as ImageIcon,
  FileText
} from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { exportIncidentReport } from "@/shared/utils/pdf";

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

function OperationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "occurrence";

  // Data state
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Occurrence Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterDuration, setFilterDuration] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Shift Scheduling Form State
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftUserId, setShiftUserId] = useState("");
  const [shiftPostId, setShiftPostId] = useState("");
  const [shiftStartTime, setShiftStartTime] = useState("");
  const [shiftEndTime, setShiftEndTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Zoom & Detailed Modal State
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  // Visitor Filters & Pagination State
  const [visitorSearchTerm, setVisitorSearchTerm] = useState("");
  const [visitorFilterDuration, setVisitorFilterDuration] = useState("ALL");
  const [visitorCurrentPage, setVisitorCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "occurrence") {
        const res = await managerService.getOccurrences();
        setOccurrences(res.data?.data?.entries || []);
      } else if (activeTab === "shifts") {
        const [shiftsRes, usersRes, postsRes] = await Promise.all([
          managerService.getTenantShifts(),
          managerService.getTenantUsers(),
          managerService.getTenantPosts()
        ]);
        setShifts(shiftsRes.data?.data?.shifts || []);
        setUsers(usersRes.data?.data?.users || []);
        setPosts(postsRes.data?.data?.posts || []);
      } else if (activeTab === "attendance") {
        const res = await managerService.getTenantShifts();
        setShifts(res.data?.data?.shifts || []);
      } else if (activeTab === "visitors") {
        const res = await managerService.getVisitors();
        setVisitors(res.data?.data?.visitors || []);
      }
    } catch (err) {
      console.error("Failed to load operations data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleTabChange = (tabName: string) => {
    router.push(`/site-manager/operations?tab=${tabName}`);
  };

  const handleScheduleShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    try {
      await managerService.createShift({
        userId: shiftUserId,
        postId: shiftPostId || undefined,
        startTime: shiftStartTime,
        endTime: shiftEndTime
      });
      setShowShiftForm(false);
      setShiftUserId("");
      setShiftPostId("");
      setShiftStartTime("");
      setShiftEndTime("");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to schedule shift");
    } finally {
      setIsScheduling(false);
    }
  };

  // Filtered & Paginated Occurrences
  const filteredOccurrences = occurrences.filter(entry => {
    const matchesSearch = 
      entry.entryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.location && entry.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.user && `${entry.user.firstName} ${entry.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === "ALL" || entry.category === filterCategory;
    const matchesDuration = filterByDuration(entry.createdAt, filterDuration);
    return matchesSearch && matchesCategory && matchesDuration;
  });

  const totalPages = Math.ceil(filteredOccurrences.length / itemsPerPage) || 1;
  const paginatedOccurrences = filteredOccurrences.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterDuration]);

  // Filtered & Paginated Visitors
  const filteredVisitorsList = visitors.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(visitorSearchTerm.toLowerCase()) ||
      (v.idNumber && v.idNumber.toLowerCase().includes(visitorSearchTerm.toLowerCase())) ||
      (v.vehicleReg && v.vehicleReg.toLowerCase().includes(visitorSearchTerm.toLowerCase())) ||
      (v.purpose && v.purpose.toLowerCase().includes(visitorSearchTerm.toLowerCase())) ||
      (v.loggedBy && `${v.loggedBy.firstName} ${v.loggedBy.lastName}`.toLowerCase().includes(visitorSearchTerm.toLowerCase())) ||
      (v.site?.name && v.site.name.toLowerCase().includes(visitorSearchTerm.toLowerCase()));
      
    const matchesDuration = filterVisitorByDuration(v.checkInTime, visitorFilterDuration);
    return matchesSearch && matchesDuration;
  });

  const visitorTotalPages = Math.ceil(filteredVisitorsList.length / itemsPerPage) || 1;
  const paginatedVisitorsList = filteredVisitorsList.slice((visitorCurrentPage - 1) * itemsPerPage, visitorCurrentPage * itemsPerPage);

  useEffect(() => {
    setVisitorCurrentPage(1);
  }, [visitorSearchTerm, visitorFilterDuration]);

  // Status Style Evaluators
  const getSeverityStyle = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL": return { bg: "var(--color-danger-subtle)", color: "var(--color-danger)" };
      case "HIGH": return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)" };
      case "MEDIUM": return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)" };
      default: return { bg: "var(--color-success-subtle)", color: "var(--color-success)" };
    }
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "EMERGENCY": return { bg: "var(--color-danger)", text: "#fff" };
      case "INCIDENT": return { bg: "var(--color-warning)", text: "#000" };
      case "HANDOVER": return { bg: "var(--color-info-subtle)", text: "var(--color-info)" };
      default: return { bg: "var(--color-bg-subtle)", text: "var(--color-text-secondary)" };
    }
  };

  const getShiftStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return { bg: "var(--color-success-subtle)", color: "var(--color-success)", icon: <CheckCircle2 size={12} /> };
      case "IN_PROGRESS": return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)", icon: <Clock size={12} /> };
      case "SCHEDULED": return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)", icon: <Calendar size={12} /> };
      default: return { bg: "var(--color-bg-subtle)", color: "var(--color-text-muted)", icon: <Ban size={12} /> };
    }
  };

  const getAttendanceStatus = (shift: any) => {
    if (shift.status === "SCHEDULED" && new Date(shift.startTime) < new Date()) {
      return { label: "MISSED", color: "var(--color-danger)", bg: "var(--color-danger-subtle)" };
    }
    if (!shift.actualStartTime) return { label: "PENDING", color: "var(--color-text-muted)", bg: "var(--color-bg-subtle)" };
    
    const scheduledStart = new Date(shift.startTime).getTime();
    const actualStart = new Date(shift.actualStartTime).getTime();
    if (actualStart - scheduledStart > 15 * 60000) {
      return { label: "LATE", color: "var(--color-warning)", bg: "var(--color-warning-subtle)" };
    }
    return { label: "ON TIME", color: "var(--color-success)", bg: "var(--color-success-subtle)" };
  };

  // Tab Styles
  const tabButtonStyle = (isActive: boolean) => ({
    padding: "12px 20px",
    background: "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
    color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
    fontWeight: isActive ? 700 : 500,
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all var(--transition-fast)"
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderKanban size={24} color="var(--color-accent)" /> Site Operations Console
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Consolidated supervisor ledger for occurrence logs, scheduling, attendance tracking, visitors, and patrols.
          </p>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", gap: "8px", overflowX: "auto" }}>
        <button onClick={() => handleTabChange("occurrence")} style={tabButtonStyle(activeTab === "occurrence")}>
          <CheckCircle2 size={16} /> Occurrence Book
        </button>
        <button onClick={() => handleTabChange("shifts")} style={tabButtonStyle(activeTab === "shifts")}>
          <Calendar size={16} /> Shift Scheduling
        </button>
        <button onClick={() => handleTabChange("attendance")} style={tabButtonStyle(activeTab === "attendance")}>
          <ClipboardCheck size={16} /> Attendance Tracking
        </button>
        <button onClick={() => handleTabChange("visitors")} style={tabButtonStyle(activeTab === "visitors")}>
          <Contact size={16} /> Visitor Logs
        </button>
        <button onClick={() => handleTabChange("patrols")} style={tabButtonStyle(activeTab === "patrols")}>
          <MapPin size={16} /> Patrol Management
        </button>
      </div>

      {/* View Content Block */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* TAB 1: OCCURRENCE BOOK */}
        {activeTab === "occurrence" && (
          <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
            
            {/* Filter Section */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Filter size={16} color="var(--color-accent)" />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Filter Entries</h3>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input 
                    type="text" 
                    placeholder="Search logs/guards..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: "32px", width: "220px", padding: "8px 12px 8px 32px" }} 
                  />
                </div>
                
                {/* Category dropdown */}
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

                {/* Duration dropdown */}
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

            {/* Logs Table */}
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
                  ) : paginatedOccurrences.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No occurrence book entries match the filters.</td></tr>
                  ) : paginatedOccurrences.map((entry, i) => {
                    const isIncident = entry.category === "INCIDENT" || entry.category === "EMERGENCY";
                    const sevColor = getSeverityStyle(entry.severity);
                    const catColor = getCategoryStyle(entry.category);

                    return (
                      <tr 
                        key={entry.id} 
                        onClick={() => setSelectedEntry(entry)}
                        style={{ cursor: "pointer", borderBottom: i < paginatedOccurrences.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13px" }}>
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500 }}>
                          {entry.user?.firstName} {entry.user?.lastName}
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
                              color: sevColor.color 
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
                              onClick={(e) => { e.stopPropagation(); setZoomImage(entry.image); }}
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

            {/* Pagination Controls */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                Showing {filteredOccurrences.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOccurrences.length)} of {filteredOccurrences.length} entries
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
        )}

        {/* TAB 2: SHIFT SCHEDULING */}
        {activeTab === "shifts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header / Schedule shift button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowShiftForm(!showShiftForm)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", transition: "opacity var(--transition-fast)" }}
              >
                <Plus size={18} /> Schedule Shift
              </button>
            </div>

            {/* Schedule form */}
            {showShiftForm && (
              <form onSubmit={handleScheduleShift} style={{ background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap", boxShadow: "var(--color-card-shadow)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "200px" }}>
                  <label style={labelStyle}>Guard</label>
                  <select required value={shiftUserId} onChange={e => setShiftUserId(e.target.value)} style={inputStyle}>
                    <option value="">Select a guard...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "150px" }}>
                  <label style={labelStyle}>Post (Optional)</label>
                  <select value={shiftPostId} onChange={e => setShiftPostId(e.target.value)} style={inputStyle}>
                    <option value="">No specific post</option>
                    {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "180px" }}>
                  <label style={labelStyle}>Start Time</label>
                  <input type="datetime-local" required value={shiftStartTime} onChange={e => setShiftStartTime(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "180px" }}>
                  <label style={labelStyle}>End Time</label>
                  <input type="datetime-local" required value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" disabled={isScheduling} style={{ padding: "10px 24px", background: "var(--color-text-primary)", color: "var(--color-bg-secondary)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", height: "42px", transition: "opacity var(--transition-fast)" }}>
                  {isScheduling ? "Saving..." : "Save"}
                </button>
              </form>
            )}

            {/* Shifts table */}
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Personnel</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Post</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Scheduled</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading shifts...</td></tr>
                    ) : shifts.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No shifts scheduled.</td></tr>
                    ) : shifts.map((s, i) => {
                      const style = getShiftStatusStyle(s.status);
                      return (
                        <tr 
                          key={s.id} 
                          style={{ borderBottom: i < shifts.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>
                             {new Date(s.startTime).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <User size={14} /> {s.user?.firstName} {s.user?.lastName}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                              <MapPin size={14} color="var(--color-accent)" /> {s.post?.name || s.site?.name || "Unassigned"}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                            <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Start: {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div style={{ color: "var(--color-text-muted)", marginTop: "4px" }}>End: {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: style.bg, color: style.color }}>
                              {style.icon} {s.status.replace("_", " ")}
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
        )}

        {/* TAB 3: ATTENDANCE TRACKING */}
        {activeTab === "attendance" && (
          <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Guard</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Scheduled Time</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Actual Clock In</th>
                    <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading attendance records...</td></tr>
                  ) : shifts.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No shifts to display.</td></tr>
                  ) : shifts.map((s, i) => {
                    const status = getAttendanceStatus(s);
                    return (
                      <tr 
                        key={s.id} 
                        style={{ borderBottom: i < shifts.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>
                          {new Date(s.startTime).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <User size={14} /> {s.user?.firstName} {s.user?.lastName}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                          {s.actualStartTime ? new Date(s.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: VISITOR LOGS */}
        {activeTab === "visitors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              
              {/* Filter Section */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Filter size={16} color="var(--color-accent)" />
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Filter Visitors</h3>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                    <input 
                      type="text" 
                      placeholder="Search visitor details..." 
                      value={visitorSearchTerm} 
                      onChange={e => setVisitorSearchTerm(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: "32px", width: "240px", padding: "8px 12px 8px 32px" }} 
                    />
                  </div>

                  {/* Duration dropdown */}
                  <div style={{ position: "relative" }}>
                    <select 
                      value={visitorFilterDuration} 
                      onChange={e => setVisitorFilterDuration(e.target.value)} 
                      style={{ ...selectStyle, width: "160px", padding: "8px 12px 8px 14px" }}
                    >
                      <option value="ALL">All Time</option>
                      <option value="TODAY">Today</option>
                      <option value="7DAYS">Last 7 Days</option>
                      <option value="30DAYS">Last 30 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visitor Name</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "140px" }}>SA ID Number</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px" }}>Vehicle Reg</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Purpose / Visiting</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Location & Guard</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "160px" }}>Check In</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "160px" }}>Check Out</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "110px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading visitors...</td></tr>
                    ) : paginatedVisitorsList.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No visitors recorded yet.</td></tr>
                    ) : paginatedVisitorsList.map((v, i) => (
                      <tr 
                        key={v.id} 
                        style={{ borderBottom: i < paginatedVisitorsList.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>
                          {v.name}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                          {v.idNumber || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                          {v.vehicleReg || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px" }}>
                          <div style={{ color: "var(--color-text-primary)" }}>{v.purpose || "No reason given"}</div>
                          {v.personVisiting && (
                            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                              Visiting: {v.personVisiting}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                            <MapPin size={13} color="var(--color-accent)" /> {v.site?.name || "Unknown Site"}
                          </div>
                          {v.loggedBy && (
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                              Guard: {v.loggedBy.firstName} {v.loggedBy.lastName}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          {new Date(v.checkInTime).toLocaleString()}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            padding: "3px 8px", 
                            borderRadius: "12px", 
                            fontSize: "10.5px", 
                            fontWeight: 700, 
                            background: v.status === "CHECKED_IN" ? "var(--color-success-subtle)" : "var(--color-bg-subtle)", 
                            color: v.status === "CHECKED_IN" ? "var(--color-success)" : "var(--color-text-secondary)"
                          }}>
                            {v.status === "CHECKED_IN" ? "ON SITE" : "DEPARTED"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Showing {filteredVisitorsList.length === 0 ? 0 : (visitorCurrentPage - 1) * itemsPerPage + 1} to {Math.min(visitorCurrentPage * itemsPerPage, filteredVisitorsList.length)} of {filteredVisitorsList.length} visitors
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    disabled={visitorCurrentPage === 1} 
                    onClick={() => setVisitorCurrentPage(prev => prev - 1)}
                    style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: visitorCurrentPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: visitorCurrentPage === 1 ? "not-allowed" : "pointer" }}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={visitorCurrentPage === visitorTotalPages} 
                    onClick={() => setVisitorCurrentPage(prev => prev + 1)}
                    style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: visitorCurrentPage === visitorTotalPages ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: visitorCurrentPage === visitorTotalPages ? "not-allowed" : "pointer" }}
                  >
                    Next
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: PATROL MANAGEMENT */}
        {activeTab === "patrols" && (
          <div style={{ background: "var(--color-card-bg)", padding: "40px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", textAlign: "center" }}>
            <MapPin size={48} color="var(--color-text-muted)" />
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>Patrol Route Monitoring</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "450px", lineHeight: 1.5 }}>
              Track checkpoints, NFC scans, and guard patrol compliance logs in real-time. This automated auditing system is currently being set up.
            </p>
          </div>
        )}

      </div>

      {/* Details & PDF Export Modal */}
      {selectedEntry && (
        <div 
          onClick={() => setSelectedEntry(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px" }}
        >
          <div 
            className="glass-panel animate-fade-in" 
            style={{ borderRadius: "var(--radius-xl)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={18} color="var(--color-accent)" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>OB Entry Details</h3>
              </div>
              <button onClick={() => setSelectedEntry(null)} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex" }}><X size={18} /></button>
            </div>
            
            {/* Body */}
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Metadata grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--color-bg-subtle)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Category</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>{selectedEntry.category}</div>
                </div>
                {selectedEntry.severity && (
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Severity</span>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>{selectedEntry.severity}</div>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Logged By</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                    {selectedEntry.user ? `${selectedEntry.user.firstName} ${selectedEntry.user.lastName}` : "System Log"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Logged At</span>
                  <div style={{ fontSize: "13px", color: "var(--color-text-primary)", marginTop: "4px" }}>{new Date(selectedEntry.createdAt).toLocaleString()}</div>
                </div>
                {selectedEntry.location && (
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Location</span>
                    <div style={{ fontSize: "13px", color: "var(--color-text-primary)", marginTop: "4px" }}>{selectedEntry.location}</div>
                  </div>
                )}
              </div>

              {/* Statement details */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Statement / Description</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.5, background: "var(--color-card-bg)", border: "1px solid var(--color-border)", padding: "16px", borderRadius: "var(--radius-md)", whiteSpace: "pre-wrap" }}>
                  {selectedEntry.entryText}
                </p>
              </div>

              {/* Attached Photo */}
              {selectedEntry.image && (
                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attached Photo Evidence</h4>
                  <img src={selectedEntry.image} alt="Evidence" style={{ width: "100%", maxHeight: "250px", objectFit: "contain", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setSelectedEntry(null)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "13.5px" }}>Close</button>
              <button 
                onClick={() => {
                  exportIncidentReport(selectedEntry, `Incident_Report_${selectedEntry.id}.pdf`);
                }}
                style={{ padding: "8px 16px", background: "var(--color-accent)", border: "none", color: "var(--color-accent-text)", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", fontSize: "13.5px" }}
              >
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}

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

export default function SupervisorOperationsConsole() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading operations board...</span>
      </div>
    }>
      <OperationsContent />
    </Suspense>
  );
}
