"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FolderKanban, CheckCircle2, Calendar, ClipboardCheck, Contact, MapPin, 
  Search, Filter, ShieldAlert, User, Clock, Ban, Plus, X, Eye,
  FileText, LayoutGrid, Wand2, BarChart3, Settings, ChevronDown, AlertTriangle,
  RefreshCw, Copy, Save, Trash2, Edit3
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

  // Shift Scheduling Form State (legacy, kept for basic scheduling)
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftUserId, setShiftUserId] = useState("");
  const [shiftPostId, setShiftPostId] = useState("");
  const [shiftStartTime, setShiftStartTime] = useState("");
  const [shiftEndTime, setShiftEndTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // ── Shift Management System State ──────────────────────────────────────
  // Sub-tab inside the "shifts" tab
  const [shiftSubTab, setShiftSubTab] = useState<"templates" | "roster" | "autoschedule" | "coverage">("templates");

  // Shift Templates
  interface ShiftTemplate { id: string; name: string; startTime: string; endTime: string; color: string; }
  const defaultTemplates: ShiftTemplate[] = [
    { id: "t1", name: "Day Shift",       startTime: "06:00", endTime: "18:00", color: "#f59e0b" },
    { id: "t2", name: "Night Shift",     startTime: "18:00", endTime: "06:00", color: "#6366f1" },
    { id: "t3", name: "Morning Shift",   startTime: "06:00", endTime: "14:00", color: "#10b981" },
    { id: "t4", name: "Afternoon Shift", startTime: "14:00", endTime: "22:00", color: "#3b82f6" },
    { id: "t5", name: "Night Patrol",    startTime: "22:00", endTime: "06:00", color: "#8b5cf6" },
  ];
  const [templates, setTemplates] = useState<ShiftTemplate[]>(defaultTemplates);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateStart, setNewTemplateStart] = useState("07:00");
  const [newTemplateEnd, setNewTemplateEnd] = useState("15:00");
  const [newTemplateColor, setNewTemplateColor] = useState("#3b82f6");
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);

  // Weekly Roster state
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [rosterWeekStart, setRosterWeekStart] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split("T")[0];
  });
  // roster: { [userId]: { [dayIndex]: templateId | "OFF" | "" } }
  const [roster, setRoster] = useState<Record<string, Record<number, string>>>({});
  // rosterPosts: { [userId]: { [dayIndex]: postId } }
  const [rosterPosts, setRosterPosts] = useState<Record<string, Record<number, string>>>({});
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);
  const [isSavingRoster, setIsSavingRoster] = useState(false);
  const [hideAssignedRoster, setHideAssignedRoster] = useState(false);

  // Auto-Schedule state
  const [autoWeekStart, setAutoWeekStart] = useState<string>(rosterWeekStart);
  const [autoRequirements, setAutoRequirements] = useState<Array<{ templateId: string; count: number }>>([
    { templateId: "t1", count: 3 },
    { templateId: "t2", count: 2 },
  ]);
  const [autoResult, setAutoResult] = useState<Record<string, Record<number, string>> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      {activeTab !== "shifts" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
              <FolderKanban size={24} color="var(--color-accent)" /> Site Operations Console
            </h1>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Consolidated supervisor ledger for occurrence logs, scheduling, attendance tracking, and visitors.
            </p>
          </div>
        </div>
      )}

      {/* Full-width header when in Shift Scheduling */}
      {activeTab === "shifts" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button 
              onClick={() => handleTabChange("occurrence")}
              style={{ 
                padding: "8px 16px", background: "var(--color-bg-subtle)", 
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", 
                fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", 
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" 
              }}
            >
              ← Back to Operations
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Calendar size={20} color="var(--color-accent)" /> Shift Scheduling Console
            </h1>
          </div>
        </div>
      )}

      {/* Tab Navigation Menu */}
      {activeTab !== "shifts" && (
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
        </div>
      )}

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


        {/* TAB 2: SHIFT MANAGEMENT — 4 Sub-tabs */}
        {activeTab === "shifts" && (() => {
          // ── Helper: build date from week start + day offset
          const getRosterDate = (dayIndex: number) => {
            const base = new Date(rosterWeekStart + "T00:00:00");
            base.setDate(base.getDate() + dayIndex);
            return base;
          };

          // ── Template handlers
          const handleAddTemplate = () => {
            if (!newTemplateName.trim()) return;
            const newT: ShiftTemplate = {
              id: `t${Date.now()}`,
              name: newTemplateName.trim(),
              startTime: newTemplateStart,
              endTime: newTemplateEnd,
              color: newTemplateColor
            };
            setTemplates(prev => [...prev, newT]);
            setNewTemplateName(""); setNewTemplateStart("07:00"); setNewTemplateEnd("15:00"); setNewTemplateColor("#3b82f6");
            setShowAddTemplate(false);
          };
          const handleDeleteTemplate = (id: string) => {
            setTemplates(prev => prev.filter(t => t.id !== id));
          };

          // ── Roster handlers
          const setRosterCell = (userId: string, dayIndex: number, value: string) => {
            setRoster(prev => ({
              ...prev,
              [userId]: { ...(prev[userId] || {}), [dayIndex]: value }
            }));
            setActiveCellKey(null);
          };

          const handleSaveRoster = async () => {
            setIsSavingRoster(true);
            const toCreate: Array<{ userId: string; startTime: string; endTime: string; postId?: string }> = [];
            for (const [userId, days] of Object.entries(roster)) {
              for (const [dayIndexStr, templateId] of Object.entries(days)) {
                if (!templateId || templateId === "OFF") continue;
                const tmpl = templates.find(t => t.id === templateId);
                if (!tmpl) continue;
                const dayIndex = parseInt(dayIndexStr);
                const dayDate = getRosterDate(dayIndex).toISOString().split("T")[0];
                // Handle overnight shifts (end < start)
                const endDate = tmpl.endTime < tmpl.startTime
                  ? getRosterDate(dayIndex + 1).toISOString().split("T")[0]
                  : dayDate;
                const postId = rosterPosts[userId]?.[dayIndex] || undefined;
                toCreate.push({
                  userId,
                  startTime: `${dayDate}T${tmpl.startTime}`,
                  endTime: `${endDate}T${tmpl.endTime}`,
                  postId
                });
              }
            }
            try {
              await Promise.all(toCreate.map(s => managerService.createShift(s)));
              alert(`✅ ${toCreate.length} shift(s) saved successfully!`);
              loadData();
            } catch (err) {
              alert("Failed to save some shifts. Please try again.");
            } finally {
              setIsSavingRoster(false);
            }
          };

          // ── Auto-Schedule generator
          const handleGenerateRoster = () => {
            setIsGenerating(true);
            const availableGuards = users.filter(u => !u.onLeave);
            const generated: Record<string, Record<number, string>> = {};
            // Initialize all guards to empty
            availableGuards.forEach(u => { generated[u.id] = {}; });
            // Assign per requirement across all 7 days
            DAYS.forEach((_, dayIndex) => {
              let guardPool = [...availableGuards];
              for (const req of autoRequirements) {
                if (req.count <= 0) continue;
                const picked = guardPool.splice(0, req.count);
                picked.forEach(g => {
                  generated[g.id] = { ...(generated[g.id] || {}), [dayIndex]: req.templateId };
                });
              }
              // remaining guards get OFF
              guardPool.forEach(g => {
                generated[g.id] = { ...(generated[g.id] || {}), [dayIndex]: "OFF" };
              });
            });
            setAutoResult(generated);
            setIsGenerating(false);
          };

          const handleApplyAutoRoster = () => {
            if (!autoResult) return;
            setRoster(autoResult);
            setAutoResult(null);
            setShiftSubTab("roster");
          };

          // ── Coverage calculator
          const coverageData = DAYS.map((day, dayIndex) => {
            const dayShifts = shifts.filter(s => {
              const shiftDate = new Date(s.startTime);
              const rosterDayDate = getRosterDate(dayIndex);
              return shiftDate.toDateString() === rosterDayDate.toDateString();
            });
            const templateCoverage = templates.map(tmpl => {
              const assigned = dayShifts.filter(s => {
                const startHour = new Date(s.startTime).getHours().toString().padStart(2, "0");
                const startMin = new Date(s.startTime).getMinutes().toString().padStart(2, "0");
                return `${startHour}:${startMin}` === tmpl.startTime;
              }).length;
              return { template: tmpl, assigned };
            });
            return { day, dayIndex, templateCoverage, total: dayShifts.length };
          });

          const subTabBtnStyle = (active: boolean) => ({
            padding: "8px 16px",
            background: active ? "var(--color-accent)" : "transparent",
            color: active ? "var(--color-accent-text)" : "var(--color-text-muted)",
            border: active ? "none" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all var(--transition-fast)",
            whiteSpace: "nowrap" as const
          });

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Sub-tab Nav */}
              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", boxShadow: "var(--color-card-shadow)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px" }}>
                  <Calendar size={18} color="var(--color-accent)" />
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-text-primary)" }}>Shift Management</span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => setShiftSubTab("templates")} style={subTabBtnStyle(shiftSubTab === "templates")}>
                    <Settings size={14} /> Shift Templates
                  </button>
                  <button onClick={() => setShiftSubTab("roster")} style={subTabBtnStyle(shiftSubTab === "roster")}>
                    <LayoutGrid size={14} /> Weekly Roster
                  </button>
                  <button onClick={() => setShiftSubTab("autoschedule")} style={subTabBtnStyle(shiftSubTab === "autoschedule")}>
                    <Wand2 size={14} /> Auto-Schedule
                  </button>
                  <button onClick={() => setShiftSubTab("coverage")} style={subTabBtnStyle(shiftSubTab === "coverage")}>
                    <BarChart3 size={14} /> Shift Coverage
                  </button>
                </div>
              </div>

              {/* ─── SUB-TAB 1: SHIFT TEMPLATES ─── */}
              {shiftSubTab === "templates" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Shift Templates</h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Define reusable shift patterns that can be applied to the weekly roster.</p>
                    </div>
                    <button onClick={() => setShowAddTemplate(!showAddTemplate)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", fontSize: "13.5px" }}>
                      <Plus size={16} /> Add Template
                    </button>
                  </div>

                  {/* Add Template form */}
                  {showAddTemplate && (
                    <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-accent)", padding: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", boxShadow: "0 0 0 3px var(--color-accent-subtle)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "160px" }}>
                        <label style={labelStyle}>Shift Name</label>
                        <input type="text" placeholder="e.g. Evening Shift" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={labelStyle}>Start Time</label>
                        <input type="time" value={newTemplateStart} onChange={e => setNewTemplateStart(e.target.value)} style={{ ...inputStyle, width: "130px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={labelStyle}>End Time</label>
                        <input type="time" value={newTemplateEnd} onChange={e => setNewTemplateEnd(e.target.value)} style={{ ...inputStyle, width: "130px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={labelStyle}>Colour</label>
                        <input type="color" value={newTemplateColor} onChange={e => setNewTemplateColor(e.target.value)} style={{ width: "60px", height: "42px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "4px", cursor: "pointer", background: "var(--color-bg-subtle)" }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={handleAddTemplate} style={{ padding: "10px 20px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", fontSize: "13.5px" }}>
                          Save Template
                        </button>
                        <button onClick={() => setShowAddTemplate(false)} style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "13.5px" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Templates grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                    {templates.map(t => (
                      <div key={t.id} style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden", transition: "transform var(--transition-base), box-shadow var(--transition-base)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--color-card-shadow)"; }}
                      >
                        {/* Colour bar */}
                        <div style={{ height: "5px", background: t.color }} />
                        <div style={{ padding: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t.name}</h4>
                              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "20px", fontWeight: 800, color: t.color, letterSpacing: "-0.03em" }}>{t.startTime}</span>
                                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>→</span>
                                <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-secondary)", letterSpacing: "-0.03em" }}>{t.endTime}</span>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteTemplate(t.id)} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-danger)")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div style={{ marginTop: "12px", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={13} />
                            {(() => {
                              const [sh, sm] = t.startTime.split(":").map(Number);
                              const [eh, em] = t.endTime.split(":").map(Number);
                              let mins = (eh * 60 + em) - (sh * 60 + sm);
                              if (mins < 0) mins += 24 * 60;
                              const h = Math.floor(mins / 60);
                              const m = mins % 60;
                              return `${h}h${m > 0 ? ` ${m}m` : ""} duration`;
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── SUB-TAB 2: WEEKLY ROSTER ─── */}
              {shiftSubTab === "roster" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Controls row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Weekly Roster</h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Click any cell to assign a shift or mark a guard as Off Duty.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Week Starting</label>
                        <input type="date" value={rosterWeekStart} onChange={e => setRosterWeekStart(e.target.value)} style={{ ...inputStyle, width: "160px", padding: "8px 12px" }} />
                      </div>
                      <button 
                        onClick={() => setHideAssignedRoster(prev => !prev)} 
                        style={{ 
                          display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", 
                          background: hideAssignedRoster ? "rgba(245, 158, 11, 0.15)" : "transparent", 
                          border: hideAssignedRoster ? "1px solid var(--color-accent)" : "1px solid var(--color-border)", 
                          borderRadius: "var(--radius-md)", 
                          color: hideAssignedRoster ? "var(--color-accent)" : "var(--color-text-secondary)", 
                          cursor: "pointer", fontSize: "13px", fontWeight: 600, marginTop: "18px" 
                        }}
                      >
                        <Eye size={14} /> {hideAssignedRoster ? "Showing Unassigned Only" : "Hide Assigned Guards"}
                      </button>
                      <button onClick={() => { setRoster({}); setRosterPosts({}); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginTop: "18px" }}>
                        <RefreshCw size={14} /> Clear
                      </button>
                      <button onClick={handleSaveRoster} disabled={isSavingRoster} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", fontSize: "13px", marginTop: "18px" }}>
                        <Save size={14} /> {isSavingRoster ? "Saving..." : "Save Roster"}
                      </button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {templates.map(t => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: t.color, flexShrink: 0 }} />
                        {t.name} ({t.startTime}–{t.endTime})
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--color-danger)", flexShrink: 0 }} />
                      Off Duty
                    </div>
                  </div>

                  {/* Roster Grid */}
                  <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", tableLayout: "auto", minWidth: "1100px", width: "100%" }}>
                      <thead>
                        <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "2px solid var(--color-border)" }}>
                          <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "200px", whiteSpace: "nowrap" }}>Guard</th>
                          {DAYS.map((day, di) => {
                            const d = getRosterDate(di);
                            const isToday = d.toDateString() === new Date().toDateString();
                            return (
                              <th key={day} style={{ padding: "16px 10px", textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "120px", color: isToday ? "var(--color-accent)" : "var(--color-text-muted)", background: isToday ? "var(--color-accent-subtle)" : "transparent", borderBottom: isToday ? "3px solid var(--color-accent)" : "2px solid transparent" }}>
                                <div style={{ fontWeight: isToday ? 800 : 700 }}>{day}</div>
                                <div style={{ fontSize: "12px", fontWeight: isToday ? 700 : 500, marginTop: "3px" }}>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const visibleUsers = users.filter((u: any) => {
                            if (!hideAssignedRoster) return true;
                            const userRoster = roster[u.id] || {};
                            return !Object.values(userRoster).some(val => val !== "" && val !== "OFF");
                          });

                          if (visibleUsers.length === 0) {
                            return <tr><td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>No unassigned guards left. All are scheduled!</td></tr>;
                          }

                          return visibleUsers.map((u: any, ui: number) => (
                            <tr key={u.id} style={{ borderBottom: ui < visibleUsers.length - 1 ? "1px solid var(--color-border)" : "none" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                            {/* Guard name column */}
                            <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", flexShrink: 0 }}>
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>
                                <div>
                                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{u.firstName} {u.lastName}</div>
                                  {u.onLeave ? (
                                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-warning)", background: "var(--color-warning-subtle)", padding: "2px 8px", borderRadius: "4px", display: "inline-block", marginTop: "2px" }}>ON LEAVE</span>
                                  ) : (
                                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Available</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Day cells */}
                            {DAYS.map((_, dayIndex) => {
                              const cellKey = `${u.id}-${dayIndex}`;
                              const assigned = roster[u.id]?.[dayIndex] ?? "";
                              const assignedPost = rosterPosts[u.id]?.[dayIndex] ?? "";
                              const tmpl = templates.find(t => t.id === assigned);
                              const postObj = posts.find((p: any) => p.id === assignedPost);
                              const isActive = activeCellKey === cellKey;
                              return (
                                <td key={dayIndex} style={{ padding: "8px 8px", textAlign: "center", position: "relative", verticalAlign: "middle" }}>
                                  {/* Cell button */}
                                  <button
                                    onClick={() => setActiveCellKey(isActive ? null : cellKey)}
                                    style={{
                                      width: "100%",
                                      minWidth: "100px",
                                      padding: "10px 8px",
                                      borderRadius: "var(--radius-md)",
                                      border: isActive ? "2px solid var(--color-accent)" : `1px solid ${tmpl ? tmpl.color + "55" : "var(--color-border)"}`,
                                      cursor: "pointer",
                                      background: assigned === "OFF" ? "var(--color-danger-subtle)" : tmpl ? `${tmpl.color}18` : "var(--color-bg-subtle)",
                                      color: assigned === "OFF" ? "var(--color-danger)" : tmpl ? tmpl.color : "var(--color-text-muted)",
                                      transition: "all var(--transition-fast)",
                                      minHeight: "62px",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "4px"
                                    }}
                                  >
                                    {assigned === "OFF" ? (
                                      <>
                                        <Ban size={14} />
                                        <span style={{ fontSize: "11px", fontWeight: 800 }}>OFF DUTY</span>
                                      </>
                                    ) : tmpl ? (
                                      <>
                                        <span style={{ fontSize: "12px", fontWeight: 800, lineHeight: 1.2 }}>{tmpl.name}</span>
                                        <span style={{ fontSize: "10px", opacity: 0.8 }}>{tmpl.startTime}–{tmpl.endTime}</span>
                                        {postObj ? (
                                          <span style={{ fontSize: "10px", fontWeight: 700, background: tmpl.color + "33", padding: "2px 6px", borderRadius: "4px", color: tmpl.color, display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                                            <MapPin size={9} /> {postObj.name}
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No post</span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <Plus size={16} />
                                        <span style={{ fontSize: "10px" }}>Assign</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Popup picker — wider, two-section */}
                                  {isActive && (
                                    <div
                                      onClick={e => e.stopPropagation()}
                                      style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", boxShadow: "0 12px 36px rgba(0,0,0,0.25)", zIndex: 200, minWidth: "260px", overflow: "hidden" }}
                                    >
                                      {/* Section: Shift */}
                                      <div style={{ padding: "10px 14px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)", fontSize: "10px", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Calendar size={11} /> Shift Template
                                      </div>
                                      {templates.map(t => {
                                        const isSelected = assigned === t.id;
                                        return (
                                          <button key={t.id}
                                            onClick={() => {
                                              setRoster(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), [dayIndex]: t.id } }));
                                            }}
                                            style={{ width: "100%", padding: "10px 14px", background: isSelected ? t.color + "18" : "transparent", border: "none", borderLeft: isSelected ? `3px solid ${t.color}` : "3px solid transparent", color: "var(--color-text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: isSelected ? 700 : 500, textAlign: "left", display: "flex", alignItems: "center", gap: "10px" }}
                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                                          >
                                            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: t.color, flexShrink: 0 }} />
                                            <span>{t.name}</span>
                                            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "auto" }}>{t.startTime}–{t.endTime}</span>
                                          </button>
                                        );
                                      })}

                                      {/* Section: Post */}
                                      <div style={{ padding: "10px 14px", background: "var(--color-bg-subtle)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", fontSize: "10px", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <MapPin size={11} /> Assign Post
                                      </div>
                                      <button
                                        onClick={() => setRosterPosts(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), [dayIndex]: "" } }))}
                                        style={{ width: "100%", padding: "9px 14px", background: !assignedPost ? "var(--color-bg-subtle)" : "transparent", border: "none", borderLeft: !assignedPost ? "3px solid var(--color-text-muted)" : "3px solid transparent", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "12.5px", fontWeight: !assignedPost ? 700 : 500, textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}
                                        onMouseEnter={e => { if (assignedPost) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                                        onMouseLeave={e => { if (assignedPost) e.currentTarget.style.background = "transparent"; }}
                                      >
                                        <X size={12} /> No specific post
                                      </button>
                                      {posts.map((p: any) => {
                                        const isPostSelected = assignedPost === p.id;
                                        return (
                                          <button key={p.id}
                                            onClick={() => setRosterPosts(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), [dayIndex]: p.id } }))}
                                            style={{ width: "100%", padding: "9px 14px", background: isPostSelected ? "var(--color-accent-subtle)" : "transparent", border: "none", borderLeft: isPostSelected ? "3px solid var(--color-accent)" : "3px solid transparent", color: isPostSelected ? "var(--color-accent)" : "var(--color-text-primary)", cursor: "pointer", fontSize: "12.5px", fontWeight: isPostSelected ? 700 : 500, textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}
                                            onMouseEnter={e => { if (!isPostSelected) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                                            onMouseLeave={e => { if (!isPostSelected) e.currentTarget.style.background = "transparent"; }}
                                          >
                                            <MapPin size={12} color={isPostSelected ? "var(--color-accent)" : "var(--color-text-muted)"} /> {p.name}
                                          </button>
                                        );
                                      })}
                                      {posts.length === 0 && (
                                        <div style={{ padding: "10px 14px", fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No posts configured for this site.</div>
                                      )}

                                      {/* Footer actions */}
                                      <div style={{ borderTop: "1px solid var(--color-border)", display: "flex", gap: "0" }}>
                                        <button
                                          onClick={() => {
                                            if (assigned) setActiveCellKey(null);
                                          }}
                                          style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "none", borderRight: "1px solid var(--color-border)", color: "var(--color-success)", cursor: "pointer", fontSize: "12.5px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                                          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-success-subtle)")}
                                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                          ✓ Done
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRoster(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), [dayIndex]: "OFF" } }));
                                            setRosterPosts(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), [dayIndex]: "" } }));
                                            setActiveCellKey(null);
                                          }}
                                          style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "none", borderRight: "1px solid var(--color-border)", color: "var(--color-danger)", cursor: "pointer", fontSize: "12.5px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                                          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-danger-subtle)")}
                                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                          <Ban size={12} /> Off
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRoster(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), [dayIndex]: "" } }));
                                            setRosterPosts(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), [dayIndex]: "" } }));
                                            setActiveCellKey(null);
                                          }}
                                          style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "12.5px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                                          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                          <X size={12} /> Clear
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))})()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── SUB-TAB 3: AUTO-SCHEDULE ─── */}
              {shiftSubTab === "autoschedule" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Auto-Schedule Generator</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Set your staffing requirements and let the system generate a full weekly roster automatically.</p>
                  </div>

                  {/* Config panel */}
                  <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", padding: "28px", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={labelStyle}>Week Starting</label>
                        <input type="date" value={autoWeekStart} onChange={e => { setAutoWeekStart(e.target.value); setRosterWeekStart(e.target.value); }} style={{ ...inputStyle, width: "200px" }} />
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", padding: "10px 0" }}>
                        <span style={{ fontWeight: 600 }}>{users.filter((u: any) => !u.onLeave).length}</span> guards available&nbsp;
                        {users.filter((u: any) => u.onLeave).length > 0 && (
                          <span style={{ color: "var(--color-warning)" }}>({users.filter((u: any) => u.onLeave).length} on leave excluded)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Required Guards per Shift</h4>
                        <button onClick={() => setAutoRequirements(prev => [...prev, { templateId: templates[0]?.id ?? "", count: 1 }])}
                          style={{ padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                          <Plus size={13} /> Add Row
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {autoRequirements.map((req, ri) => (
                          <div key={ri} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <select value={req.templateId} onChange={e => setAutoRequirements(prev => prev.map((r, i) => i === ri ? { ...r, templateId: e.target.value } : r))}
                              style={{ ...inputStyle, width: "220px", flex: 1 }}>
                              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.startTime}–{t.endTime})</option>)}
                            </select>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Guards needed:</span>
                              <input type="number" min={0} max={50} value={req.count} onChange={e => setAutoRequirements(prev => prev.map((r, i) => i === ri ? { ...r, count: parseInt(e.target.value) || 0 } : r))}
                                style={{ ...inputStyle, width: "80px" }} />
                            </div>
                            <button onClick={() => setAutoRequirements(prev => prev.filter((_, i) => i !== ri))}
                              style={{ padding: "8px", background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "flex" }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", display: "flex", gap: "12px" }}>
                      <button onClick={handleGenerateRoster} disabled={isGenerating}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "linear-gradient(135deg, var(--color-accent) 0%, #7c3aed 100%)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 12px rgba(99,102,241,0.3)", transition: "opacity var(--transition-fast)" }}>
                        <Wand2 size={18} /> {isGenerating ? "Generating..." : "Generate Weekly Roster"}
                      </button>
                    </div>
                  </div>

                  {/* Generated preview */}
                  {autoResult && (
                    <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "2px solid var(--color-success)", padding: "0", boxShadow: "0 0 0 4px var(--color-success-subtle)", overflow: "hidden" }}>
                      <div style={{ padding: "16px 24px", background: "var(--color-success-subtle)", borderBottom: "1px solid var(--color-success)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <CheckCircle2 size={18} color="var(--color-success)" />
                          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-success)" }}>Roster Generated — Review Before Applying</span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={handleApplyAutoRoster} style={{ padding: "8px 20px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                            Apply to Roster
                          </button>
                          <button onClick={() => setAutoResult(null)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "13px" }}>
                            Discard
                          </button>
                        </div>
                      </div>
                      <div style={{ overflowX: "auto", padding: "16px" }}>
                        {Object.entries(autoResult).map(([userId, days]) => {
                          const guard = users.find((u: any) => u.id === userId);
                          if (!guard) return null;
                          return (
                            <div key={userId} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                              <div style={{ width: "130px", flexShrink: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{guard.firstName} {guard.lastName}</div>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {DAYS.map((day, di) => {
                                  const val = days[di];
                                  const tmpl = templates.find(t => t.id === val);
                                  return (
                                    <div key={di} style={{ textAlign: "center", width: "80px" }}>
                                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>{day}</div>
                                      <div style={{ padding: "5px 4px", borderRadius: "6px", background: val === "OFF" ? "var(--color-danger-subtle)" : tmpl ? `${tmpl.color}22` : "var(--color-bg-subtle)", color: val === "OFF" ? "var(--color-danger)" : tmpl ? tmpl.color : "var(--color-text-muted)", fontSize: "10.5px", fontWeight: 700 }}>
                                        {val === "OFF" ? "OFF" : tmpl ? tmpl.name.split(" ")[0] : "–"}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── SUB-TAB 4: SHIFT COVERAGE ─── */}
              {shiftSubTab === "coverage" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Shift Coverage Dashboard</h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Monitor staffing levels across all shifts and days. Quickly spot gaps and conflicts.</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Week Starting</label>
                      <input type="date" value={rosterWeekStart} onChange={e => setRosterWeekStart(e.target.value)} style={{ ...inputStyle, width: "180px", padding: "8px 12px" }} />
                    </div>
                  </div>

                  {/* Coverage summary cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {coverageData.map(({ day, dayIndex, templateCoverage, total }) => {
                      const rosterCount = Object.values(roster).filter(days => days[dayIndex] && days[dayIndex] !== "OFF").length;
                      const hasGap = rosterCount === 0;
                      return (
                        <div key={day} style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: `1px solid ${hasGap ? "var(--color-danger)" : "var(--color-card-border)"}`, boxShadow: hasGap ? "0 0 0 3px var(--color-danger-subtle)" : "var(--color-card-shadow)", overflow: "hidden" }}>
                          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: hasGap ? "var(--color-danger-subtle)" : "var(--color-bg-subtle)" }}>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text-primary)" }}>{day} <span style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "12px" }}>{getRosterDate(dayIndex).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {hasGap ? (
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <AlertTriangle size={13} /> NO COVER
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <CheckCircle2 size={13} /> {rosterCount} assigned
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {templates.map(t => {
                              const assignedForShift = Object.values(roster).filter(days => days[dayIndex] === t.id).length;
                              return (
                                <div key={t.id}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: t.color, flexShrink: 0 }} />
                                      {t.name}
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: assignedForShift === 0 ? "var(--color-text-muted)" : t.color }}>{assignedForShift} guards</span>
                                  </div>
                                  <div style={{ height: "6px", background: "var(--color-bg-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min(100, (assignedForShift / Math.max(1, users.length)) * 100)}%`, background: t.color, borderRadius: "4px", transition: "width 0.5s ease" }} />
                                  </div>
                                </div>
                              );
                            })}
                            {/* Off duty count */}
                            <div style={{ paddingTop: "8px", borderTop: "1px solid var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", display: "flex", justifyContent: "space-between" }}>
                              <span>Off Duty</span>
                              <span style={{ fontWeight: 600 }}>{Object.values(roster).filter(days => days[dayIndex] === "OFF").length}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "flex", justifyContent: "space-between" }}>
                              <span>Unassigned</span>
                              <span style={{ fontWeight: 600 }}>{users.length - Object.values(roster).filter(days => days[dayIndex] !== undefined && days[dayIndex] !== "").length}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live shift records from the API */}
                  {shifts.length > 0 && (
                    <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
                      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={16} color="var(--color-accent)" />
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Live Shift Records</h4>
                        <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-text-muted)" }}>{shifts.length} shifts total</span>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                              {["Date", "Guard", "Post", "Scheduled", "Status"].map(h => (
                                <th key={h} style={{ padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {shifts.slice(0, 15).map((s: any, i: number) => {
                              const style = getShiftStatusStyle(s.status);
                              return (
                                <tr key={s.id} style={{ borderBottom: i < Math.min(15, shifts.length) - 1 ? "1px solid var(--color-border)" : "none" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                  <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{new Date(s.startTime).toLocaleDateString()}</td>
                                  <td style={{ padding: "12px 16px", fontSize: "13px" }}><div style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size={12} />{s.user?.firstName} {s.user?.lastName}</div></td>
                                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--color-text-secondary)" }}>{s.post?.name || "—"}</td>
                                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                                    {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                                  </td>
                                  <td style={{ padding: "12px 16px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 700, background: style.bg, color: style.color }}>
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
                  )}
                </div>
              )}

            </div>
          );
        })()}

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
