"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FolderKanban, Users, Calendar, Contact, ShieldAlert, CheckCircle2, 
  Search, Filter, Plus, X, Mail, User, Clock, Ban, MapPin, 
  AlertTriangle, FileText, Eye, Shield
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
  const activeTab = searchParams.get("tab") || "personnel";

  // Data sets state
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Personnel Form State
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "", firstName: "", lastName: "", role: "USER" as "SITE_MANAGER" | "USER", siteId: ""
  });

  // Filters & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  // Personnel Search
  const [personnelSearch, setPersonnelSearch] = useState("");

  // Shifts state
  const [shiftSearch, setShiftSearch] = useState("");
  const [shiftDuration, setShiftDuration] = useState("ALL");

  // Visitors state
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorDuration, setVisitorDuration] = useState("ALL");
  const [visitorPage, setVisitorPage] = useState(1);

  // Incidents state
  const [incidentSearch, setIncidentSearch] = useState("");
  const [incidentStatus, setIncidentStatus] = useState("ALL");

  // Occurrence Book state
  const [occurrenceSearch, setOccurrenceSearch] = useState("");
  const [occurrenceCategory, setOccurrenceCategory] = useState("ALL");
  const [occurrenceDuration, setOccurrenceDuration] = useState("ALL");
  const [occurrencePage, setOccurrencePage] = useState(1);
  
  // Modals state
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "personnel") {
        const [userRes, siteRes] = await Promise.all([
          managerService.getTenantUsers(),
          managerService.getSites()
        ]);
        setUsers(userRes.data?.data?.users || []);
        setSites(siteRes.data?.data?.sites || []);
      } else if (activeTab === "shifts") {
        const res = await managerService.getTenantShifts();
        setShifts(res.data?.data?.shifts || []);
      } else if (activeTab === "visitors") {
        const res = await managerService.getVisitors();
        setVisitors(res.data?.data?.visitors || []);
      } else if (activeTab === "incidents") {
        const res = await managerService.getIncidents();
        setIncidents(res.data?.data?.incidents || []);
      } else if (activeTab === "occurrence") {
        const res = await managerService.getOccurrences();
        setOccurrences(res.data?.data?.entries || []);
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
    router.push(`/manager/operations?tab=${tabName}`);
  };

  // Personnel Handlers
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await managerService.inviteUser(inviteForm);
      setIsInviting(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "USER", siteId: "" });
      loadData();
      alert("Invitation sent successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send invitation.");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await managerService.updateUserRole(userId, newRole);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update role.");
    }
  };

  const handleSiteChange = async (userId: string, newSiteId: string) => {
    try {
      await managerService.assignUserToSite(userId, newSiteId);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to reassign site.");
    }
  };

  const handleToggleStatus = async (user: any) => {
    const action = user.accountStatus === "ACTIVE" ? "suspend" : "activate";
    try {
      await managerService.disableUser(user.id);
      loadData();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} user.`);
    }
  };

  // Incident status change handler
  const handleIncidentStatusChange = async (id: string, newStatus: string) => {
    try {
      await managerService.updateIncidentStatus(id, { status: newStatus });
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(personnelSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(personnelSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(personnelSearch.toLowerCase())
  );

  const filteredShifts = shifts.filter(s => {
    const matchesSearch = 
      (s.user && `${s.user.firstName} ${s.user.lastName}`.toLowerCase().includes(shiftSearch.toLowerCase())) ||
      (s.site && s.site.name.toLowerCase().includes(shiftSearch.toLowerCase())) ||
      (s.post && s.post.name.toLowerCase().includes(shiftSearch.toLowerCase()));
    const matchesDuration = filterByDuration(s.startTime, shiftDuration);
    return matchesSearch && matchesDuration;
  });

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(visitorSearch.toLowerCase()) ||
      (v.idNumber && v.idNumber.toLowerCase().includes(visitorSearch.toLowerCase())) ||
      (v.vehicleReg && v.vehicleReg.toLowerCase().includes(visitorSearch.toLowerCase())) ||
      (v.purpose && v.purpose.toLowerCase().includes(visitorSearch.toLowerCase())) ||
      (v.site?.name && v.site.name.toLowerCase().includes(visitorSearch.toLowerCase()));
    const matchesDuration = filterVisitorByDuration(v.checkInTime, visitorDuration);
    return matchesSearch && matchesDuration;
  });

  const visitorTotalPages = Math.ceil(filteredVisitors.length / itemsPerPage) || 1;
  const paginatedVisitors = filteredVisitors.slice((visitorPage - 1) * itemsPerPage, visitorPage * itemsPerPage);

  useEffect(() => {
    setVisitorPage(1);
  }, [visitorSearch, visitorDuration]);

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      inc.title.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.description.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      (inc.site?.name && inc.site.name.toLowerCase().includes(incidentSearch.toLowerCase())) ||
      (inc.reportedBy && `${inc.reportedBy.firstName} ${inc.reportedBy.lastName}`.toLowerCase().includes(incidentSearch.toLowerCase()));
    const matchesStatus = incidentStatus === "ALL" || inc.status === incidentStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredOccurrences = occurrences.filter(entry => {
    const matchesSearch = 
      entry.entryText.toLowerCase().includes(occurrenceSearch.toLowerCase()) ||
      (entry.location && entry.location.toLowerCase().includes(occurrenceSearch.toLowerCase())) ||
      (entry.user && `${entry.user.firstName} ${entry.user.lastName}`.toLowerCase().includes(occurrenceSearch.toLowerCase())) ||
      (entry.site?.name && entry.site.name.toLowerCase().includes(occurrenceSearch.toLowerCase()));
    const matchesCategory = occurrenceCategory === "ALL" || entry.category === occurrenceCategory;
    const matchesDuration = filterByDuration(entry.createdAt, occurrenceDuration);
    return matchesSearch && matchesCategory && matchesDuration;
  });

  const occurrenceTotalPages = Math.ceil(filteredOccurrences.length / itemsPerPage) || 1;
  const paginatedOccurrences = filteredOccurrences.slice((occurrencePage - 1) * itemsPerPage, occurrencePage * itemsPerPage);

  useEffect(() => {
    setOccurrencePage(1);
  }, [occurrenceSearch, occurrenceCategory, occurrenceDuration]);

  // Style helpers
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

  const getShiftStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return { bg: "var(--color-success-subtle)", color: "var(--color-success)", icon: <CheckCircle2 size={12} /> };
      case "IN_PROGRESS": return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)", icon: <Clock size={12} /> };
      case "SCHEDULED": return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)", icon: <Calendar size={12} /> };
      default: return { bg: "var(--color-bg-subtle)", color: "var(--color-text-muted)", icon: <Ban size={12} /> };
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL": return { bg: "var(--color-danger-subtle)", color: "var(--color-danger)" };
      case "HIGH": return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)" };
      case "MEDIUM": return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)" };
      default: return { bg: "var(--color-success-subtle)", color: "var(--color-success)" };
    }
  };

  const getOccurrenceCategoryStyle = (cat: string) => {
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
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <FolderKanban size={24} color="var(--color-accent)" /> Operations Control Console
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Consolidated operations center for security officers, attendance shifts, detailed visitor checks, and incident reports.
        </p>
      </div>

      {/* Tab Navigation Menu */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", gap: "8px", overflowX: "auto" }}>
        <button onClick={() => handleTabChange("personnel")} style={tabButtonStyle(activeTab === "personnel")}>
          <Users size={16} /> Personnel
        </button>
        <button onClick={() => handleTabChange("shifts")} style={tabButtonStyle(activeTab === "shifts")}>
          <Calendar size={16} /> Shifts & Attendance
        </button>
        <button onClick={() => handleTabChange("visitors")} style={tabButtonStyle(activeTab === "visitors")}>
          <Contact size={16} /> Visitor Logs
        </button>
        <button onClick={() => handleTabChange("incidents")} style={tabButtonStyle(activeTab === "incidents")}>
          <ShieldAlert size={16} /> Incident Reports
        </button>
        <button onClick={() => handleTabChange("occurrence")} style={tabButtonStyle(activeTab === "occurrence")}>
          <CheckCircle2 size={16} /> Occurrence Book
        </button>
      </div>

      {/* Main Tabs Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* TAB 1: PERSONNEL MANAGEMENT */}
        {activeTab === "personnel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="Search personnel..." 
                  value={personnelSearch} 
                  onChange={e => setPersonnelSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: "32px", width: "240px", padding: "8px 12px 8px 32px" }} 
                />
              </div>
              <button
                onClick={() => setIsInviting(true)}
                style={{ 
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", 
                  background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", 
                  fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", 
                  transition: "opacity var(--transition-fast)" 
                }}
              >
                <Plus size={16} /> Invite Personnel
              </button>
            </div>

            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Personnel</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Assigned Site</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading personnel...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No personnel found.</td></tr>
                    ) : filteredUsers.map((user, i) => (
                      <tr 
                        key={user.id} 
                        style={{ borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>{user.firstName} {user.lastName}</div>
                          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{user.email}</div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <select 
                            value={user.role} 
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}
                          >
                            <option value="SITE_MANAGER">Site Manager</option>
                            <option value="USER">Security Officer</option>
                          </select>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <select 
                            value={user.site?.id || ""} 
                            onChange={(e) => handleSiteChange(user.id, e.target.value)}
                            style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)", cursor: "pointer" }}
                          >
                            <option value="" disabled>No Site</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ 
                            padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                            background: user.accountStatus === "ACTIVE" ? "var(--color-success-subtle)" : 
                                       user.accountStatus === "PENDING" ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)",
                            color: user.accountStatus === "ACTIVE" ? "var(--color-success)" : 
                                   user.accountStatus === "PENDING" ? "var(--color-warning)" : "var(--color-danger)"
                          }}>
                            {user.accountStatus}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            style={{ 
                              padding: "6px 12px", background: "transparent", 
                              border: `1px solid ${user.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)"}`, 
                              borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, 
                              color: user.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)", 
                              cursor: "pointer"
                            }}
                          >
                            {user.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invite Modal */}
            {isInviting && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", zIndex: 1000, padding: "24px",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{
                  background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column"
                }}>
                  <div style={{ padding: "24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Mail size={18} color="var(--color-accent)" /> Send Invitation
                    </h2>
                    <button type="button" onClick={() => setIsInviting(false)} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleInvite}>
                    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={labelStyle}>First Name</label>
                          <input required style={inputStyle} placeholder="First Name" value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} autoFocus />
                        </div>
                        <div>
                          <label style={labelStyle}>Last Name</label>
                          <input required style={inputStyle} placeholder="Last Name" value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Email Address</label>
                        <input required type="email" style={inputStyle} placeholder="Email Address" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={labelStyle}>Role</label>
                          <select required style={selectStyle} value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value as any})}>
                            <option value="USER">Security Officer (Guard)</option>
                            <option value="SITE_MANAGER">Site Manager</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Assign to Site</label>
                          <select required style={selectStyle} value={inviteForm.siteId} onChange={e => setInviteForm({...inviteForm, siteId: e.target.value})}>
                            <option value="" disabled>Assign to Site...</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                      <button type="button" onClick={() => setIsInviting(false)} style={{ padding: "10px 20px", background: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Cancel</button>
                      <button type="submit" style={{ padding: "10px 20px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Send Invite</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SHIFTS & ATTENDANCE */}
        {activeTab === "shifts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="Search shifts (name, site, post)..." 
                  value={shiftSearch} 
                  onChange={e => setShiftSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: "32px", width: "260px", padding: "8px 12px 8px 32px" }} 
                />
              </div>

              <select 
                value={shiftDuration} 
                onChange={e => setShiftDuration(e.target.value)} 
                style={{ ...selectStyle, width: "160px", padding: "8px 12px 8px 14px" }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
                <option value="YEAR">This Year</option>
              </select>
            </div>

            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Personnel</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Location</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Times</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading shifts...</td></tr>
                    ) : filteredShifts.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No shifts found.</td></tr>
                    ) : filteredShifts.map((s, i) => {
                      const style = getShiftStatusStyle(s.status);
                      return (
                        <tr 
                          key={s.id} 
                          style={{ borderBottom: i < filteredShifts.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
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

        {/* TAB 3: VISITOR LOGS */}
        {activeTab === "visitors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              
              {/* Filter Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Filter size={16} color="var(--color-accent)" />
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Filter Visitors</h3>
                </div>
                
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                    <input 
                      type="text" 
                      placeholder="Search visitor, ID, license..." 
                      value={visitorSearch} 
                      onChange={e => setVisitorSearch(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: "32px", width: "240px", padding: "8px 12px 8px 32px" }} 
                    />
                  </div>

                  <select 
                    value={visitorDuration} 
                    onChange={e => setVisitorDuration(e.target.value)} 
                    style={{ ...selectStyle, width: "160px", padding: "8px 12px 8px 14px" }}
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="7DAYS">Last 7 Days</option>
                    <option value="30DAYS">Last 30 Days</option>
                  </select>
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
                    ) : paginatedVisitors.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No visitors recorded.</td></tr>
                    ) : paginatedVisitors.map((v, i) => (
                      <tr 
                        key={v.id} 
                        style={{ borderBottom: i < paginatedVisitors.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>
                          {v.name}
                          {v.company && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>Co: {v.company}</div>}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                          {v.idNumber || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                          {v.vehicleReg || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px" }}>
                          <div style={{ color: "var(--color-text-primary)" }}>{v.purpose || "No reason given"}</div>
                          {v.personVisiting && <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>Visiting: {v.personVisiting}</div>}
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

              {/* Pagination */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Showing {filteredVisitors.length === 0 ? 0 : (visitorPage - 1) * itemsPerPage + 1} to {Math.min(visitorPage * itemsPerPage, filteredVisitors.length)} of {filteredVisitors.length} visitors
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    disabled={visitorPage === 1} 
                    onClick={() => setVisitorPage(prev => prev - 1)}
                    style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: visitorPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: visitorPage === 1 ? "not-allowed" : "pointer" }}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={visitorPage === visitorTotalPages} 
                    onClick={() => setVisitorPage(prev => prev + 1)}
                    style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: visitorPage === visitorTotalPages ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: visitorPage === visitorTotalPages ? "not-allowed" : "pointer" }}
                  >
                    Next
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: INCIDENT REPORTS (TICKETS) */}
        {activeTab === "incidents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="Search incident tickets..." 
                  value={incidentSearch} 
                  onChange={e => setIncidentSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: "32px", width: "250px", padding: "8px 12px 8px 32px" }} 
                />
              </div>

              <select 
                value={incidentStatus} 
                onChange={e => setIncidentStatus(e.target.value)} 
                style={{ ...selectStyle, width: "160px", padding: "8px 12px 8px 14px" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Details</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Location & Officer</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Severity</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading incident tickets...</td></tr>
                    ) : filteredIncidents.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No incident tickets reported.</td></tr>
                    ) : filteredIncidents.map((inc, i) => {
                      const sStyle = getSeverityStyle(inc.severity);
                      return (
                        <tr 
                          key={inc.id} 
                          style={{ borderBottom: i < filteredIncidents.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "15px", marginBottom: "4px" }}>{inc.title}</div>
                            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", maxWidth: "300px" }}>{inc.description}</div>
                            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={12} /> {new Date(inc.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                              <MapPin size={14} color="var(--color-accent)" /> {inc.site?.name || "Unknown Site"}
                            </div>
                            {inc.reportedBy && <div>Reported by: {inc.reportedBy.firstName} {inc.reportedBy.lastName}</div>}
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sStyle.bg, color: sStyle.color }}>
                              {inc.severity}
                            </span>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <select 
                              value={inc.status} 
                              onChange={(e) => handleIncidentStatusChange(inc.id, e.target.value)}
                              style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}
                            >
                              <option value="OPEN">Open</option>
                              <option value="INVESTIGATING">Investigating</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="CLOSED">Closed</option>
                            </select>
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

        {/* TAB 5: OCCURRENCE BOOK */}
        {activeTab === "occurrence" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              
              {/* Filters Header */}
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
                      placeholder="Search OB entries..." 
                      value={occurrenceSearch} 
                      onChange={e => setOccurrenceSearch(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: "32px", width: "220px", padding: "8px 12px 8px 32px" }} 
                    />
                  </div>

                  {/* Category Dropdown */}
                  <select 
                    value={occurrenceCategory} 
                    onChange={e => setOccurrenceCategory(e.target.value)} 
                    style={{ ...selectStyle, width: "160px", padding: "8px 12px 8px 14px" }}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ROUTINE">Routine Checks</option>
                    <option value="HANDOVER">Handovers</option>
                    <option value="INCIDENT">Incident Reports</option>
                    <option value="EMERGENCY">Emergencies</option>
                    <option value="OTHER">Other Logs</option>
                  </select>

                  {/* Duration Dropdown */}
                  <select 
                    value={occurrenceDuration} 
                    onChange={e => setOccurrenceDuration(e.target.value)} 
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

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "160px" }}>Time</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "160px" }}>Location & Guard</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "120px" }}>Category</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry Details</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "110px" }}>Severity</th>
                      <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "90px" }}>Photo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading occurrences...</td></tr>
                    ) : paginatedOccurrences.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No occurrence entries found.</td></tr>
                    ) : paginatedOccurrences.map((entry, i) => {
                      const isIncident = entry.category === "INCIDENT" || entry.category === "EMERGENCY";
                      const sevColor = getSeverityStyle(entry.severity);
                      const catColor = getOccurrenceCategoryStyle(entry.category);

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
                          <td style={{ padding: "16px 24px", fontSize: "13.5px" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{entry.user?.firstName} {entry.user?.lastName}</div>
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                              {entry.site?.name || "Unknown Site"}
                            </div>
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

              {/* Pagination */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Showing {filteredOccurrences.length === 0 ? 0 : (occurrencePage - 1) * itemsPerPage + 1} to {Math.min(occurrencePage * itemsPerPage, filteredOccurrences.length)} of {filteredOccurrences.length} entries
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    disabled={occurrencePage === 1} 
                    onClick={() => setOccurrencePage(prev => prev - 1)}
                    style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: occurrencePage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: occurrencePage === 1 ? "not-allowed" : "pointer" }}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={occurrencePage === occurrenceTotalPages} 
                    onClick={() => setOccurrencePage(prev => prev + 1)}
                    style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: occurrencePage === occurrenceTotalPages ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: occurrencePage === occurrenceTotalPages ? "not-allowed" : "pointer" }}
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
                {(selectedEntry.site?.name || selectedEntry.location) && (
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Location / Site</span>
                    <div style={{ fontSize: "13px", color: "var(--color-text-primary)", marginTop: "4px" }}>
                      {selectedEntry.site?.name || ""} {selectedEntry.location ? `(${selectedEntry.location})` : ""}
                    </div>
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

export default function ManagerOperationsConsole() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading operations dashboard...</span>
      </div>
    }>
      <OperationsContent />
    </Suspense>
  );
}
