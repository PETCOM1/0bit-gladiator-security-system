"use client";

import React, { useEffect, useState, Suspense } from "react";
import type { SearchParams } from "next/dist/server/request/search-params";
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
    { id: "t1", name: "Day Shift",       startTime: "07:00", endTime: "19:00", color: "#f59e0b" },
    { id: "t2", name: "Night Shift",     startTime: "19:00", endTime: "07:00", color: "#6366f1" },
    { id: "t3", name: "Patrol Shift",    startTime: "08:00", endTime: "16:00", color: "#10b981" },
    { id: "t4", name: "Relief Shift",    startTime: "12:00", endTime: "20:00", color: "#3b82f6" },
  ];
  const [templates, setTemplates] = useState<ShiftTemplate[]>(defaultTemplates);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateStart, setNewTemplateStart] = useState("07:00");
  const [newTemplateEnd, setNewTemplateEnd] = useState("15:00");
  const [newTemplateColor, setNewTemplateColor] = useState("#3b82f6");
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);

  // New Roster Workspace Filter & Modal States
  const [filterPost, setFilterPost] = useState("");
  const [filterGuard, setFilterGuard] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeShiftForAssign, setActiveShiftForAssign] = useState<any>(null);
  const [assignSearchTerm, setAssignSearchTerm] = useState("");

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

        {/* TAB 2: SHIFT MANAGEMENT — Post-Centric Workspace */}
        {activeTab === "shifts" && (() => {
          // ── Helper: build date from week start + day offset
          const getRosterDate = (dayIndex: number) => {
            const base = new Date(rosterWeekStart + "T00:00:00");
            base.setDate(base.getDate() + dayIndex);
            return base;
          };

          const weekRange = (() => {
            const start = new Date(rosterWeekStart + "T00:00:00");
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
          })();

          // Filter shifts for the active week
          const weekShifts = shifts.filter(s => {
            const shiftDate = new Date(s.startTime);
            return shiftDate >= weekRange.start && shiftDate <= weekRange.end;
          });

          // Calculations for Coverage stats
          const totalShifts = weekShifts.length;
          const filledShifts = weekShifts.filter(s => s.userId).length;
          const vacantShiftsCount = totalShifts - filledShifts;
          const coveragePercentage = totalShifts > 0 ? Math.round((filledShifts / totalShifts) * 100) : 100;
          const uniqueGuardsScheduled = new Set(weekShifts.filter(s => s.userId).map(s => s.userId)).size;
          const guardsOnLeave = users.filter(u => u.role === "GUARD" && u.onLeave).length;

          // Double Booking Warning
          const getDoubleBookingWarning = (s: any) => {
            if (!s.userId || !s.endTime) return null;
            const sStart = new Date(s.startTime).getTime();
            const sEnd = new Date(s.endTime).getTime();
            const overlap = weekShifts.find(other => {
              if (other.id === s.id || other.userId !== s.userId || !other.endTime) return false;
              const oStart = new Date(other.startTime).getTime();
              const oEnd = new Date(other.endTime).getTime();
              return sStart < oEnd && sEnd > oStart;
            });
            if (overlap) {
              return `⚠️ Double booked on ${overlap.post?.name || "another post"}`;
            }
            return null;
          };

          // Consecutive Rest violation
          const getConsecutiveRestWarning = (s: any) => {
            if (!s.userId || !s.endTime) return null;
            const sStart = new Date(s.startTime).getTime();
            const restThreshold = 8 * 60 * 60 * 1000;
            const violation = weekShifts.find(other => {
              if (other.id === s.id || other.userId !== s.userId || !other.endTime) return false;
              const oEnd = new Date(other.endTime).getTime();
              const timeDiff = sStart - oEnd;
              return timeDiff > 0 && timeDiff < restThreshold;
            });
            if (violation) {
              return `⚠️ Consecutive shifts violation (<8h rest)`;
            }
            return null;
          };

          // Weekly Hours
          const getGuardWeeklyHours = (userId: string) => {
            if (!userId) return 0;
            const guardShifts = weekShifts.filter(s => s.userId === userId && s.endTime);
            let totalMs = 0;
            guardShifts.forEach(s => {
              const diff = new Date(s.endTime!).getTime() - new Date(s.startTime).getTime();
              if (diff > 0) totalMs += diff;
            });
            return totalMs / (1000 * 60 * 60);
          };

          const getOvertimeWarning = (userId: string) => {
            const hours = getGuardWeeklyHours(userId);
            if (hours > 40) {
              return `⚠️ Overtime limit exceeded (${hours.toFixed(1)} hrs)`;
            }
            return null;
          };

          const getLeaveWarning = (userId: string) => {
            const guard = users.find(u => u.id === userId);
            if (guard?.onLeave) {
              return `⚠️ Guard is currently on leave`;
            }
            return null;
          };

          const getShiftWarnings = (s: any): string[] => {
            const warnings: string[] = [];
            const db = getDoubleBookingWarning(s);
            if (db) warnings.push(db);
            const cr = getConsecutiveRestWarning(s);
            if (cr) warnings.push(cr);
            if (s.userId) {
              const ot = getOvertimeWarning(s.userId as string);
              if (ot) warnings.push(ot);
              const lv = getLeaveWarning(s.userId as string);
              if (lv) warnings.push(lv);
            }
            return warnings;
          };

          const overtimeAssignments = users.filter(u => u.role === "GUARD" && getGuardWeeklyHours(u.id) > 40).length;

          const coverageData = DAYS.map((day, dayIndex) => {
            const rosterDayDate = getRosterDate(dayIndex);
            const dayShifts = weekShifts.filter(s => {
              const shiftDate = new Date(s.startTime);
              return shiftDate.toDateString() === rosterDayDate.toDateString();
            });
            const templateCoverage = templates.map(tmpl => {
              const assigned = dayShifts.filter(s => {
                if (!s.userId) return false;
                const sDate = new Date(s.startTime);
                const startHour = sDate.getHours().toString().padStart(2, "0");
                const startMin = sDate.getMinutes().toString().padStart(2, "0");
                return `${startHour}:${startMin}` === tmpl.startTime;
              }).length;
              return { template: tmpl, assigned };
            });
            const rosterCount = dayShifts.filter(s => s.userId).length;
            const hasGap = dayShifts.some(s => !s.userId) || dayShifts.length === 0;
            const offDutyCount = users.filter(u => u.role === "GUARD" && !dayShifts.some(s => s.userId === u.id)).length;
            const vacantCount = dayShifts.filter(s => !s.userId).length;
            return { day, dayIndex, rosterCount, hasGap, templateCoverage, offDutyCount, vacantCount };
          });

          // Date Navigator
          const handlePrevWeek = () => {
            const d = new Date(rosterWeekStart + "T00:00:00");
            d.setDate(d.getDate() - 7);
            setRosterWeekStart(d.toISOString().split("T")[0]);
          };
          const handleNextWeek = () => {
            const d = new Date(rosterWeekStart + "T00:00:00");
            d.setDate(d.getDate() + 7);
            setRosterWeekStart(d.toISOString().split("T")[0]);
          };
          const handleTodayWeek = () => {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const mon = new Date(d.setDate(diff));
            setRosterWeekStart(mon.toISOString().split("T")[0]);
          };

          // Template actions
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

          // Shift crud actions
          const handleCreateDraftShift = async (postId: string, dayIndex: number, templateId: string) => {
            const targetDate = getRosterDate(dayIndex);
            const dateStr = targetDate.toISOString().split("T")[0];
            const tmpl = templates.find(t => t.id === templateId);
            if (!tmpl) return;

            const startIso = `${dateStr}T${tmpl.startTime}:00`;
            const isOvernight = tmpl.endTime < tmpl.startTime;
            const endDateStr = isOvernight 
              ? new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] 
              : dateStr;
            const endIso = `${endDateStr}T${tmpl.endTime}:00`;

            try {
              await managerService.createShift({
                postId,
                startTime: startIso,
                endTime: endIso,
                userId: null,
                status: "DRAFT"
              });
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to add shift requirement");
            }
          };

          const handleUnassignShift = async (shiftId: string) => {
            try {
              await managerService.updateShift(shiftId, { userId: null });
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to unassign guard");
            }
          };

          const handleDeleteShift = async (shiftId: string) => {
            if (!confirm("Are you sure you want to delete this shift requirement?")) return;
            try {
              await managerService.deleteShift(shiftId);
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to delete shift requirement");
            }
          };

          const handlePublishRoster = async () => {
            try {
              const { start, end } = weekRange;
              const res = await managerService.publishShifts({
                startDate: start.toISOString(),
                endDate: end.toISOString()
              });
              alert(`✅ Published ${res.data?.data?.count || 0} shifts! Guards have been notified.`);
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to publish roster");
            }
          };

          // Automation actions
          const handleCopyMondaySchedule = async () => {
            const mondayDateStr = getRosterDate(0).toDateString();
            const mondayShifts = weekShifts.filter(s => new Date(s.startTime).toDateString() === mondayDateStr);
            
            if (mondayShifts.length === 0) {
              alert("No shifts scheduled on Monday to copy.");
              return;
            }
            if (!confirm(`This will copy Monday's ${mondayShifts.length} shift requirements to Tuesday–Sunday of this week as drafts. Continue?`)) return;

            try {
              const promises: any[] = [];
              for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
                const targetDate = getRosterDate(dayOffset);
                const dateStr = targetDate.toISOString().split("T")[0];

                mondayShifts.forEach(s => {
                  const sDate = new Date(s.startTime);
                  const eDate = s.endTime ? new Date(s.endTime) : null;
                  const startHourMin = `${sDate.getHours().toString().padStart(2, '0')}:${sDate.getMinutes().toString().padStart(2, '0')}`;
                  const startIso = `${dateStr}T${startHourMin}:00`;
                  
                  let endIso = null;
                  if (eDate) {
                    const endHourMin = `${eDate.getHours().toString().padStart(2, '0')}:${eDate.getMinutes().toString().padStart(2, '0')}`;
                    const isOvernight = endHourMin < startHourMin;
                    const endDateStr = isOvernight 
                      ? new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] 
                      : dateStr;
                    endIso = `${endDateStr}T${endHourMin}:00`;
                  }

                  promises.push(managerService.createShift({
                    postId: s.postId,
                    userId: s.userId,
                    startTime: startIso,
                    endTime: endIso,
                    status: "DRAFT"
                  }));
                });
              }
              await Promise.all(promises);
              alert(`✅ Copied Monday's schedule to other days!`);
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to copy Monday's schedule");
            }
          };

          const handleDuplicatePreviousWeek = async () => {
            const prevMon = new Date(rosterWeekStart + "T00:00:00");
            prevMon.setDate(prevMon.getDate() - 7);
            const prevSun = new Date(prevMon);
            prevSun.setDate(prevSun.getDate() + 6);
            prevSun.setHours(23, 59, 59, 999);

            const prevWeekShifts = shifts.filter(s => {
              const shiftDate = new Date(s.startTime);
              return shiftDate >= prevMon && shiftDate <= prevSun;
            });

            if (prevWeekShifts.length === 0) {
              alert("No shifts found in the previous week to duplicate.");
              return;
            }
            if (!confirm(`Duplicate ${prevWeekShifts.length} shifts from last week into this week as drafts?`)) return;

            try {
              const promises = prevWeekShifts.map(s => {
                const sDate = new Date(s.startTime);
                const eDate = s.endTime ? new Date(s.endTime) : null;
                const newStart = new Date(sDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                const newEnd = eDate ? new Date(eDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

                return managerService.createShift({
                  postId: s.postId,
                  userId: s.userId,
                  startTime: newStart,
                  endTime: newEnd,
                  status: "DRAFT"
                });
              });
              await Promise.all(promises);
              alert("✅ Duplicated previous week's roster successfully!");
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to duplicate previous week's roster");
            }
          };

          const handleBulkClear = async () => {
            if (weekShifts.length === 0) return;
            const action = confirm("Click OK to DELETE all shift requirements this week, or CANCEL to just UNASSIGN guards from them.");
            try {
              if (action) {
                await Promise.all(weekShifts.map(s => managerService.deleteShift(s.id)));
                alert("✅ Deleted all shift requirements this week.");
              } else {
                await Promise.all(weekShifts.filter(s => s.userId).map(s => managerService.updateShift(s.id, { userId: null })));
                alert("✅ Unassigned all guards from shifts this week.");
              }
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to bulk clear shifts");
            }
          };

          const handleAutoFillRoster = async () => {
            const vacantShifts = weekShifts.filter(s => !s.userId);
            if (vacantShifts.length === 0) {
              alert("No vacant shifts this week to auto-fill.");
              return;
            }
            const availableGuards = users.filter(u => u.role === "GUARD" && u.accountStatus === "ACTIVE" && !u.onLeave);
            if (availableGuards.length === 0) {
              alert("No active guards available for auto-fill.");
              return;
            }

            if (!confirm(`Auto-fill ${vacantShifts.length} vacant shifts using available guards?`)) return;

            try {
              const promises: any[] = [];
              vacantShifts.forEach(s => {
                const suitableGuard = availableGuards.find(g => {
                  const sStart = new Date(s.startTime).getTime();
                  const sEnd = s.endTime ? new Date(s.endTime).getTime() : sStart + 12 * 60 * 60 * 1000;
                  const hasOverlap = weekShifts.some(other => {
                    if (other.userId !== g.id || !other.endTime) return false;
                    const oStart = new Date(other.startTime).getTime();
                    const oEnd = new Date(other.endTime).getTime();
                    return sStart < oEnd && sEnd > oStart;
                  });
                  if (hasOverlap) return false;

                  const consecutiveRestViolation = weekShifts.some(other => {
                    if (other.userId !== g.id || !other.endTime) return false;
                    const oEnd = new Date(other.endTime).getTime();
                    const diff = sStart - oEnd;
                    return diff > 0 && diff < 8 * 60 * 60 * 1000;
                  });
                  if (consecutiveRestViolation) return false;

                  const hours = getGuardWeeklyHours(g.id);
                  const shiftDuration = s.endTime ? (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60) : 12;
                  return (hours + shiftDuration) <= 40;
                });

                if (suitableGuard) {
                  promises.push(managerService.updateShift(s.id, { userId: suitableGuard.id }));
                }
              });

              if (promises.length === 0) {
                alert("Could not automatically fill shifts without violating rest hours, overtime limits, or double bookings.");
                return;
              }

              await Promise.all(promises);
              alert(`✅ Successfully filled ${promises.length} shifts!`);
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to auto-fill shifts");
            }
          };

          const handleOpenAssignModal = (shift: any) => {
            setActiveShiftForAssign(shift);
            setAssignSearchTerm("");
            setShowAssignModal(true);
          };

          const handleSelectGuardForShift = async (guardId: string | null) => {
            if (!activeShiftForAssign) return;
            try {
              await managerService.updateShift(activeShiftForAssign.id, { userId: guardId });
              setShowAssignModal(false);
              setActiveShiftForAssign(null);
              loadData();
            } catch (err) {
              console.error(err);
              alert("Failed to assign guard");
            }
          };

          // Coverage insights warnings generator
          const coverageInsights: string[] = [];
          weekShifts.filter(s => !s.userId).forEach(s => {
            const dateObj = new Date(s.startTime);
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
            const postName = posts.find(p => p.id === s.postId)?.name || "Post";
            const tmplName = templates.find(t => {
              const startHourMin = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
              return t.startTime === startHourMin;
            })?.name || "Shift";
            coverageInsights.push(`⚠️ ${postName} has no ${tmplName} on ${dayName}.`);
          });

          const uniqueScheduledGuardIds = Array.from(new Set(weekShifts.filter(s => s.userId).map(s => s.userId)));
          uniqueScheduledGuardIds.forEach(gid => {
            const guard = users.find(u => u.id === gid);
            if (!guard) return;
            const hours = getGuardWeeklyHours(gid);
            if (hours > 40) {
              coverageInsights.push(`⚠️ ${guard.firstName} ${guard.lastName} exceeds weekly overtime limits (${hours.toFixed(1)} hours).`);
            }
          });

          weekShifts.forEach(s => {
            if (!s.userId) return;
            const consecWarning = getConsecutiveRestWarning(s);
            if (consecWarning) {
              const guard = users.find(u => u.id === s.userId);
              const dateObj = new Date(s.startTime);
              const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
              coverageInsights.push(`⚠️ ${guard?.firstName} ${guard?.lastName} is scheduled on consecutive shifts without rest on ${dayName}.`);
            }
          });

          const draftShiftsCount = weekShifts.filter(s => s.status === "DRAFT").length;
          if (draftShiftsCount > 0) {
            coverageInsights.push(`⚠️ ${draftShiftsCount} shifts remain unassigned or in draft mode.`);
          }

          if (coverageInsights.length === 0) {
            coverageInsights.push("✓ All critical posts are covered.");
          }

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
                        <input type="text" placeholder="e.g. Day Shift" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} style={inputStyle} />
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

              {/* ─── SUB-TAB 2: WEEKLY ROSTER WORKSPACE ─── */}
              {shiftSubTab === "roster" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Draft Alert Banner */}
                  {draftShiftsCount > 0 && (
                    <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-xl)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--color-card-shadow)", animation: "fadeIn 0.3s ease" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <AlertTriangle size={18} color="var(--color-accent)" />
                        <div>
                          <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "14px" }}>Unpublished Draft Changes</span>
                          <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                            You have <strong>{draftShiftsCount}</strong> draft assignments this week. Security officers will not receive schedule alerts or see these slots until published.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handlePublishRoster} 
                        style={{ padding: "8px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                      >
                        Publish Roster
                      </button>
                    </div>
                  )}

                  {/* Coverage stats row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
                    {[
                      { label: "Total Posts", val: posts.length, color: "var(--color-accent)" },
                      { label: "Total Shifts", val: totalShifts, color: "var(--color-text-secondary)" },
                      { label: "Filled Shifts", val: filledShifts, color: "var(--color-success)" },
                      { label: "Vacant Shifts", val: vacantShiftsCount, color: vacantShiftsCount > 0 ? "var(--color-danger)" : "var(--color-text-muted)" },
                      { label: "Coverage %", val: `${coveragePercentage}%`, color: coveragePercentage === 100 ? "var(--color-success)" : "#f59e0b" },
                      { label: "Guards Active", val: uniqueGuardsScheduled, color: "var(--color-accent)" },
                      { label: "Guards on Leave", val: guardsOnLeave, color: guardsOnLeave > 0 ? "var(--color-warning)" : "var(--color-text-muted)" },
                      { label: "Overtime Guards", val: overtimeAssignments, color: overtimeAssignments > 0 ? "#f59e0b" : "var(--color-text-muted)" },
                    ].map((stat, idx) => (
                      <div key={idx} style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--color-card-shadow)" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{stat.label}</span>
                        <span style={{ fontSize: "20px", fontWeight: 800, color: stat.color }}>{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Date selection & Filter row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    
                    {/* Week Navigation */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button onClick={handlePrevWeek} style={{ padding: "8px 14px", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                        ← Prev Week
                      </button>
                      <button onClick={handleTodayWeek} style={{ padding: "8px 14px", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                        Today
                      </button>
                      <button onClick={handleNextWeek} style={{ padding: "8px 14px", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                        Next Week →
                      </button>
                      <div style={{ position: "relative" }}>
                        <input type="date" value={rosterWeekStart} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRosterWeekStart(e.target.value)} style={{ ...inputStyle, width: "160px", padding: "8px 12px" }} />
                      </div>
                    </div>

                    {/* Roster Filters */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ position: "relative" }}>
                        <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                        <input 
                          type="text" 
                          placeholder="Search guard..." 
                          value={filterGuard}
                          onChange={e => setFilterGuard(e.target.value)}
                          style={{ ...inputStyle, paddingLeft: "30px", width: "160px", padding: "6px 10px 6px 30px" }}
                        />
                      </div>
                      
                      <select 
                        value={filterPost} 
                        onChange={e => setFilterPost(e.target.value)}
                        style={{ ...selectStyle, width: "140px", padding: "6px 10px" }}
                      >
                        <option value="">All Posts</option>
                        {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>

                      <select 
                        value={filterTemplate} 
                        onChange={e => setFilterTemplate(e.target.value)}
                        style={{ ...selectStyle, width: "140px", padding: "6px 10px" }}
                      >
                        <option value="">All Shifts</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                  </div>

                  {/* Daily Heatmap Card Strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", marginBottom: "10px" }}>
                    {DAYS.map((day, di) => {
                      const dateObj = getRosterDate(di);
                      const dateStr = dateObj.toDateString();
                      const dayShifts = weekShifts.filter(s => new Date(s.startTime).toDateString() === dateStr);
                      const dayFilled = dayShifts.filter(s => s.userId).length;
                      const dayTotal = dayShifts.length;
                      const dayCoverage = dayTotal > 0 ? Math.round((dayFilled / dayTotal) * 100) : 0;
                      
                      let color = "var(--color-text-muted)";
                      let bg = "var(--color-bg-subtle)";
                      let statusText = "No shifts required";
                      if (dayTotal > 0) {
                        if (dayFilled === dayTotal) {
                          color = "var(--color-success)";
                          bg = "var(--color-success-subtle)";
                          statusText = "🟢 Fully Covered";
                        } else if (dayFilled / dayTotal >= 0.8) {
                          color = "#f59e0b";
                          bg = "rgba(245, 158, 11, 0.1)";
                          statusText = "🟡 Nearly Full";
                        } else if (dayFilled / dayTotal >= 0.5) {
                          color = "#ef6c00";
                          bg = "rgba(239, 108, 0, 0.1)";
                          statusText = "🟠 Understaffed";
                        } else {
                          color = "var(--color-danger)";
                          bg = "var(--color-danger-subtle)";
                          statusText = "🔴 Critical Coverage";
                        }
                      }

                      return (
                        <div key={day} style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-lg)", border: `1px solid var(--color-border)`, borderTop: `4px solid ${dayTotal > 0 ? color : "var(--color-border)"}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "var(--color-card-shadow)" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>{day}</div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)" }}>{dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                          {dayTotal > 0 ? (
                            <>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: color }}>{dayFilled} / {dayTotal} Filled ({dayCoverage}%)</div>
                              <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{statusText}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>No shifts scheduled</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Smart Automation Toolbar */}
                  <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", padding: "14px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", boxShadow: "var(--color-card-shadow)" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}><Wand2 size={16} color="var(--color-accent)" /> Automation Tools</span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={handleDuplicatePreviousWeek} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>
                        <Copy size={13} /> Duplicate Previous Week
                      </button>
                      <button onClick={handleCopyMondaySchedule} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>
                        <Copy size={13} /> Copy Monday's Schedule
                      </button>
                      <button onClick={handleAutoFillRoster} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", borderRadius: "var(--radius-md)", color: "var(--color-accent)", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
                        <Wand2 size={13} /> Auto-Fill Roster
                      </button>
                      <button onClick={handleBulkClear} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid var(--color-border)", background: "transparent", borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
                        <RefreshCw size={13} /> Bulk Clear / Reset
                      </button>
                    </div>
                  </div>

                  {/* Roster Grid */}
                  <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: "1200px", width: "100%" }}>
                      <thead>
                        <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "2px solid var(--color-border)" }}>
                          <th style={{ width: "16%", padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Post</th>
                          {DAYS.map((day, di) => {
                            const d = getRosterDate(di);
                            const isToday = d.toDateString() === new Date().toDateString();
                            return (
                              <th key={day} style={{ width: "12%", padding: "16px 10px", textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: isToday ? "var(--color-accent)" : "var(--color-text-muted)", background: isToday ? "var(--color-accent-subtle)" : "transparent", borderBottom: isToday ? "3px solid var(--color-accent)" : "2px solid transparent" }}>
                                <div style={{ fontWeight: isToday ? 800 : 700 }}>{day}</div>
                                <div style={{ fontSize: "12px", fontWeight: isToday ? 700 : 500, marginTop: "3px" }}>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {posts.filter(p => !filterPost || p.id === filterPost).map((post, pi) => (
                          <tr key={post.id} style={{ borderBottom: pi < posts.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                            {/* Post Info Column */}
                            <td style={{ padding: "20px 20px", verticalAlign: "top", background: "var(--color-bg-subtle)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{post.name}</div>
                                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <MapPin size={11} /> Configured post
                                </div>
                              </div>
                            </td>
                            {/* Day Cells */}
                            {DAYS.map((_, dayIndex) => {
                              const dateStr = getRosterDate(dayIndex).toDateString();
                              let cellShifts = weekShifts.filter(s => s.postId === post.id && new Date(s.startTime).toDateString() === dateStr);
                              
                              if (filterGuard) {
                                cellShifts = cellShifts.filter(s => s.userId && `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(filterGuard.toLowerCase()));
                              }
                              if (filterTemplate) {
                                cellShifts = cellShifts.filter(s => {
                                  const dateObj = new Date(s.startTime);
                                  const startHourMin = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
                                  const tmpl = templates.find(t => t.startTime === startHourMin);
                                  return tmpl?.id === filterTemplate;
                                });
                              }

                              return (
                                <td key={dayIndex} style={{ padding: "8px", verticalAlign: "top", borderLeft: "1px solid var(--color-border)" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "100px" }}>
                                    {cellShifts.map(s => {
                                      const sDate = new Date(s.startTime);
                                      const startHourMin = `${sDate.getHours().toString().padStart(2, '0')}:${sDate.getMinutes().toString().padStart(2, '0')}`;
                                      const matchedTmpl = templates.find(t => t.startTime === startHourMin);
                                      const tmplColor = matchedTmpl ? matchedTmpl.color : "#6366f1";
                                      const tmplName = matchedTmpl ? matchedTmpl.name : "Shift";
                                      const formattedTime = s.endTime 
                                        ? `${sDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                        : sDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                      
                                      const warnings = getShiftWarnings(s);
                                      const isDraft = s.status === "DRAFT";

                                      return (
                                        <div key={s.id} style={{ 
                                          background: "var(--color-card-bg)", 
                                          border: `1px solid var(--color-border)`, 
                                          borderLeft: `4px solid ${tmplColor}`, 
                                          borderRadius: "var(--radius-md)", 
                                          padding: "8px 10px", 
                                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                          position: "relative",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "6px"
                                        }}>
                                          <button 
                                            onClick={() => handleDeleteShift(s.id)}
                                            style={{ position: "absolute", top: "6px", right: "6px", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px", display: "flex", padding: "2px" }}
                                            onMouseEnter={e => e.currentTarget.style.color = "var(--color-danger)"}
                                            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-muted)"}
                                          >
                                            <X size={12} />
                                          </button>

                                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 800, color: tmplColor }}>{tmplName}</span>
                                            {isDraft && (
                                              <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(245, 158, 11, 0.15)", color: "var(--color-accent)", padding: "1px 5px", borderRadius: "3px" }}>DRAFT</span>
                                            )}
                                          </div>
                                          
                                          <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Clock size={11} /> {formattedTime}
                                          </div>

                                          {/* Guard assignment */}
                                          {s.userId ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                                                <span 
                                                  onClick={() => handleOpenAssignModal(s)}
                                                  style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", textDecoration: "underline" }}
                                                >
                                                  👤 {s.user?.firstName} {s.user?.lastName}
                                                </span>
                                                <button 
                                                  onClick={() => handleUnassignShift(s.id)}
                                                  style={{ padding: "2px 4px", fontSize: "9px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "4px", color: "var(--color-text-secondary)", cursor: "pointer" }}
                                                >
                                                  Unassign
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button 
                                              onClick={() => handleOpenAssignModal(s)}
                                              style={{ marginTop: "4px", padding: "6px 8px", width: "100%", border: "1px dashed var(--color-accent)", background: "var(--color-accent-subtle)", color: "var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                                            >
                                              <Plus size={12} /> Assign Guard
                                            </button>
                                          )}

                                          {/* Warnings */}
                                          {warnings.map((w, idx) => (
                                            <div key={idx} style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--color-danger)", background: "var(--color-danger-subtle)", padding: "3px 6px", borderRadius: "4px", marginTop: "2px" }}>
                                              {w}
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })}
                                    
                                    {/* Add Shift Requirement Dropdown Cell */}
                                    <div style={{ marginTop: "auto", position: "relative" }}>
                                      <select 
                                        value="" 
                                        onChange={e => {
                                          if (e.target.value) {
                                            handleCreateDraftShift(post.id, dayIndex, e.target.value);
                                            e.target.value = "";
                                          }
                                        }}
                                        style={{ width: "100%", padding: "5px 8px", fontSize: "11px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--color-text-muted)", cursor: "pointer", fontWeight: 600 }}
                                      >
                                        <option value="">➕ Add Shift...</option>
                                        {templates.map(t => (
                                          <option key={t.id} value={t.id}>{t.name} ({t.startTime}–{t.endTime})</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Coverage Audit Insights Section */}
                  <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", padding: "20px 24px", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}><ShieldAlert size={16} color="var(--color-accent)" /> Roster Coverage Audit</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {coverageInsights.map((insight, idx) => (
                        <div key={idx} style={{ fontSize: "13px", color: insight.startsWith("✓") ? "var(--color-success)" : "var(--color-text-secondary)", fontWeight: insight.startsWith("✓") ? 600 : 500 }}>
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ─── SUB-TAB 3: SHIFT COVERAGE ─── */}
              {shiftSubTab === "coverage" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Shift Coverage Dashboard</h3>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Monitor staffing levels across all shifts and days. Quickly spot gaps and conflicts.</p>
                      </div>
                    </div>

                    {/* Coverage summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      {coverageData.map(({ day, dayIndex, rosterCount, hasGap, templateCoverage, offDutyCount, vacantCount }) => {
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
                              {templateCoverage.map(({ template, assigned }) => {
                                return (
                                  <div key={template.id}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                                        <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: template.color, flexShrink: 0 }} />
                                        {template.name}
                                      </div>
                                      <span style={{ fontSize: "12px", fontWeight: 700, color: assigned === 0 ? "var(--color-text-muted)" : template.color }}>{assigned} guards</span>
                                    </div>
                                    <div style={{ height: "6px", background: "var(--color-bg-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${Math.min(100, (assigned / Math.max(1, users.length)) * 100)}%`, background: template.color, borderRadius: "4px", transition: "width 0.5s ease" }} />
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Off duty count */}
                              <div style={{ paddingTop: "8px", borderTop: "1px solid var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", display: "flex", justifyContent: "space-between" }}>
                                <span>Off Duty / Unassigned</span>
                                <span style={{ fontWeight: 600 }}>{offDutyCount}</span>
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "flex", justifyContent: "space-between" }}>
                                <span>Vacant Slots</span>
                                <span style={{ fontWeight: 600 }}>{vacantCount}</span>
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

export default function SupervisorOperationsConsole({}: { params?: Promise<Record<string, string>>; searchParams?: Promise<SearchParams> }) {
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
