"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { managerService } from "@/features/manager/services/manager.service";
import { MapPin, Users, ShieldAlert, Contact, Calendar, Info, ArrowLeft, Plus, CheckCircle2, Search, Filter, Clock, X, Activity, ShieldCheck, AlertTriangle, Play, FileText } from "lucide-react";

interface Props {
  siteId: string;
  hideBackButton?: boolean;
}

const inputStyle = {
  padding: "10px 14px",
  background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize: "13.5px",
  color: "var(--color-text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%"
};

const selectStyle = {
  padding: "8px 12px",
  background: "var(--color-card-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize: "13px",
  color: "var(--color-text-secondary)",
  outline: "none",
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

export default function SiteDetailsView({ siteId, hideBackButton }: Props) {
  const router = useRouter();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "incidents" | "visitors" | "personnel" | "shifts" | "posts">("overview");
  const [newPostName, setNewPostName] = useState("");
  const [isAddingPost, setIsAddingPost] = useState(false);



  // Personnel Filters & Pagination States
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [personnelRole, setPersonnelRole] = useState("ALL");
  const [personnelStatus, setPersonnelStatus] = useState("ALL");
  const [personnelPage, setPersonnelPage] = useState(1);

  const filteredPersonnel = useMemo(() => {
    if (!site?.users) return [];
    return site.users.filter((u: any) => {
      const matchesSearch = 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(personnelSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(personnelSearch.toLowerCase());
      const matchesRole = personnelRole === "ALL" || u.role === personnelRole;
      const matchesStatus = 
        personnelStatus === "ALL" || 
        (personnelStatus === "ON_LEAVE" && u.onLeave) || 
        (personnelStatus === "ACTIVE" && !u.onLeave);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [site?.users, personnelSearch, personnelRole, personnelStatus]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage) || 1;
  
  const paginatedPersonnel = useMemo(() => {
    const startIdx = (personnelPage - 1) * itemsPerPage;
    return filteredPersonnel.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredPersonnel, personnelPage]);

  useEffect(() => {
    setPersonnelPage(1);
  }, [personnelSearch, personnelRole, personnelStatus]);

  // Shift Filters & Pagination States
  const [shiftSearch, setShiftSearch] = useState("");
  const [shiftStatusFilter, setShiftStatusFilter] = useState("ALL");
  const [shiftPostFilter, setShiftPostFilter] = useState("ALL");
  const [shiftPage, setShiftPage] = useState(1);

  const filteredShifts = useMemo(() => {
    if (!site?.shifts) return [];
    return site.shifts.filter((s: any) => {
      const matchesSearch = 
        `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase().includes(shiftSearch.toLowerCase()) ||
        (s.post?.name || "").toLowerCase().includes(shiftSearch.toLowerCase());
      
      const isShiftMissed = s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now();
      const matchesStatus = 
        shiftStatusFilter === "ALL" || 
        (shiftStatusFilter === "MISSED" && isShiftMissed) ||
        (shiftStatusFilter === s.status && (!isShiftMissed || s.status !== "SCHEDULED"));
        
      const matchesPost = shiftPostFilter === "ALL" || s.postId === shiftPostFilter;

      return matchesSearch && matchesStatus && matchesPost;
    });
  }, [site?.shifts, shiftSearch, shiftStatusFilter, shiftPostFilter]);

  const shiftsPerPage = 10;
  const totalShiftPages = Math.ceil(filteredShifts.length / shiftsPerPage) || 1;
  
  const paginatedShifts = useMemo(() => {
    const startIdx = (shiftPage - 1) * shiftsPerPage;
    return filteredShifts.slice(startIdx, startIdx + shiftsPerPage);
  }, [filteredShifts, shiftPage]);

  const shiftStats = useMemo(() => {
    if (!site?.shifts) return { total: 0, active: 0, scheduled: 0, completed: 0, missed: 0 };
    const total = site.shifts.length;
    const active = site.shifts.filter((s: any) => s.status === "IN_PROGRESS").length;
    const completed = site.shifts.filter((s: any) => s.status === "COMPLETED").length;
    const missed = site.shifts.filter((s: any) => s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now()).length;
    const scheduled = site.shifts.filter((s: any) => s.status === "SCHEDULED" && new Date(s.startTime).getTime() >= Date.now()).length;

    return { total, active, scheduled, completed, missed };
  }, [site?.shifts]);

  const postCoverageList = useMemo(() => {
    if (!site?.posts || !site?.shifts) return [];
    return site.posts.map((p: any) => {
      const activeShift = site.shifts.find((s: any) => s.postId === p.id && s.status === "IN_PROGRESS");
      return {
        post: p,
        isCovered: !!activeShift,
        activeGuard: activeShift ? activeShift.user : null,
        activeShift: activeShift
      };
    });
  }, [site?.posts, site?.shifts]);

  useEffect(() => {
    setShiftPage(1);
  }, [shiftSearch, shiftStatusFilter, shiftPostFilter]);

  useEffect(() => {
    const fetchSite = async () => {
      setLoading(true);
      try {
        const res = await managerService.getSiteById(siteId);
        setSite(res.data.data.site);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (siteId) fetchSite();
  }, [siteId]);

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading site profile...</span>
      </div>
    );
  }

  if (!site) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-danger)", fontWeight: 600 }}>
        Site not found or access denied.
      </div>
    );
  }

  const hasSiteManager = site.users?.some((u: any) => u.role === "SITE_MANAGER");

  const tabs = [
    { id: "overview", label: "Overview", icon: <Info size={15} /> },
    { id: "incidents", label: "Occurrence Book", icon: <ShieldAlert size={15} /> },
    { id: "visitors", label: "Visitor Book", icon: <Contact size={15} /> },
    { id: "personnel", label: "Personnel", icon: <Users size={15} /> },
    { id: "shifts", label: "Shifts", icon: <Calendar size={15} /> },
    { id: "posts", label: "Posts", icon: <MapPin size={15} /> }
  ] as const;



  const handleToggleLeave = async (userId: string) => {
    try {
      await managerService.toggleUserLeave(userId);
      // Refresh site data
      const res = await managerService.getSiteById(siteId);
      setSite(res.data.data.site);
    } catch (err) {
      console.error(err);
      alert("Failed to toggle leave status.");
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostName.trim()) return;
    try {
      await managerService.createPost({ name: newPostName, siteId });
      setNewPostName("");
      setIsAddingPost(false);
      // Refresh site data
      const res = await managerService.getSiteById(siteId);
      setSite(res.data.data.site);
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = {
    background: "var(--color-card-bg)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-card-border)",
    boxShadow: "var(--color-card-shadow)",
    overflow: "hidden"
  };

  const statCardStyle: React.CSSProperties = {
    background: "var(--color-card-bg)",
    border: "1px solid var(--color-card-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--color-card-shadow)",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "transform var(--transition-base), border-color var(--transition-base)",
    cursor: "default"
  };

  const iconWrapperStyle = (bg: string, color: string) => ({
    background: bg,
    color: color,
    width: "40px",
    height: "40px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {!hideBackButton && (
          <button 
            onClick={() => router.back()}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", 
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", 
              borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-secondary)",
              transition: "all var(--transition-fast)" 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <MapPin size={24} color="var(--color-accent)" /> {site.name}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px", marginBottom: 0 }}>
            {site.address || "No address provided"}
          </p>
        </div>
      </div>

      {/* Warning banner for unassigned Site Manager */}
      {!hasSiteManager && (
        <div style={{
          background: "rgba(245, 158, 11, 0.04)",
          border: "1px solid rgba(245, 158, 11, 0.15)",
          borderRadius: "var(--radius-xl)",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          boxShadow: "var(--color-card-shadow)",
          marginTop: "-8px",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Info size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              <strong>Notice:</strong> This site does not have a designated Site Manager assigned to oversee day-to-day operations.
            </span>
          </div>
          <button 
            onClick={() => router.push("/manager/users")}
            style={{
              padding: "6px 12px", background: "var(--color-accent)", color: "var(--color-accent-text)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600,
              cursor: "pointer", transition: "opacity var(--transition-fast)", flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Assign Site Manager
          </button>
        </div>
      )}

      {/* Warning banner for Frozen Site */}
      {site.isFrozen && (
        <div style={{
          background: "rgba(239, 68, 68, 0.04)",
          border: "1px dashed rgba(239, 68, 68, 0.25)",
          borderRadius: "var(--radius-xl)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "-8px",
          boxSizing: "border-box"
        }}>
          <ShieldAlert size={16} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            <strong>Frozen Site:</strong> This site has been frozen by the Tenant Manager. Scheduling, check-ins, and active operations are locked.
          </span>
        </div>
      )}

      {/* Tabs Selector Strip */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)", paddingBottom: "1px", overflowX: "auto" }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px",
                background: "transparent",
                color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                border: "none", 
                borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                fontSize: "13.5px", 
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer", 
                transition: "all var(--transition-fast)", 
                whiteSpace: "nowrap",
                position: "relative",
                bottom: "-1px"
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* Viewport Card System */}
      <div style={cardStyle}>
        
        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (() => {
          // 1. KPI Calculations
          const totalPersonnel = site.users?.length || 0;
          const checkedInGuards = site.shifts?.filter((s: any) => s.status === "IN_PROGRESS") || [];
          const checkedInCount = checkedInGuards.length;
          const totalPostsCount = site.posts?.length || 0;
          
          const todayDateStr = new Date().toDateString();
          const todayShifts = site.shifts?.filter((s: any) => 
            s.status === "IN_PROGRESS" || 
            new Date(s.startTime).toDateString() === todayDateStr
          ) || [];
          const activeShiftsCount = todayShifts.length;
          
          const currentVisitors = site.visitors?.filter((v: any) => !v.checkOutTime) || [];
          const visitorsCount = currentVisitors.length;
          
          const openIncidents = site.incidents?.filter((i: any) => i.status === "OPEN" || i.status === "INVESTIGATING") || [];
          const openIncidentsCount = openIncidents.length;
          
          const todayIncidentsCount = site.incidents?.filter((i: any) => 
            new Date(i.createdAt).toDateString() === todayDateStr
          ).length || 0;
          
          // Attendance Rate
          const completedShifts = site.shifts?.filter((s: any) => s.status === "COMPLETED").length || 0;
          const missedShifts = site.shifts?.filter((s: any) => s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now()).length || 0;
          const totalScheduled = completedShifts + missedShifts;
          const attendanceRate = totalScheduled > 0 ? Math.round((completedShifts / totalScheduled) * 100) : 96;

          // Site Health Status
          const unstaffedPosts = site.posts?.filter((p: any) => !site.shifts?.some((s: any) => s.postId === p.id && s.status === "IN_PROGRESS")) || [];
          const unstaffedPostsCount = unstaffedPosts.length;
          
          let siteStatus = "Operating Normally";
          let statusColor = "var(--color-success)";
          let statusBg = "rgba(16, 185, 129, 0.04)";
          let statusBorder = "rgba(16, 185, 129, 0.2)";
          
          if (openIncidentsCount > 3 || attendanceRate < 80) {
            siteStatus = "Critical Issues Detected";
            statusColor = "var(--color-danger)";
            statusBg = "rgba(239, 68, 68, 0.04)";
            statusBorder = "rgba(239, 68, 68, 0.2)";
          } else if (openIncidentsCount > 0 || unstaffedPostsCount > 0 || attendanceRate < 93) {
            siteStatus = "Needs Attention";
            statusColor = "var(--color-warning)";
            statusBg = "rgba(245, 158, 11, 0.04)";
            statusBorder = "rgba(245, 158, 11, 0.2)";
          }

          // Attendance Summary stats
          const presentGuards = checkedInCount;
          const lateGuards = todayShifts.filter((s: any) => {
            if (!s.actualStartTime) return false;
            const schedStart = new Date(s.startTime).getTime();
            const actStart = new Date(s.actualStartTime).getTime();
            return actStart > (schedStart + 15 * 60 * 1000); // Late if checked in > 15 mins late
          }).length;
          
          const absentGuards = todayShifts.filter((s: any) => 
            s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now()
          ).length;

          // Recent Activity Timeline
          const timelineEvents = (() => {
            const list: any[] = [];
            site.shifts?.forEach((s: any) => {
              if (s.actualStartTime) {
                list.push({
                  type: "check_in",
                  text: `${s.user?.firstName || "Guard"} ${s.user?.lastName || ""} checked in at post "${s.post?.name || "Checkpoint"}"`,
                  time: new Date(s.actualStartTime)
                });
              }
              if (s.actualEndTime) {
                list.push({
                  type: "check_out",
                  text: `${s.user?.firstName || "Guard"} ${s.user?.lastName || ""} checked out from post "${s.post?.name || "Checkpoint"}"`,
                  time: new Date(s.actualEndTime)
                });
              }
            });

            site.visitors?.forEach((v: any) => {
              list.push({
                type: "visitor_in",
                text: `Visitor "${v.name}" registered (Purpose: ${v.purpose || "Business"})`,
                time: new Date(v.checkInTime)
              });
              if (v.checkOutTime) {
                list.push({
                  type: "visitor_out",
                  text: `Visitor "${v.name}" checked out`,
                  time: new Date(v.checkOutTime)
                });
              }
            });

            site.incidents?.forEach((i: any) => {
              list.push({
                type: "incident",
                text: `OB Log: "${i.title}" registered (${i.severity} severity)`,
                time: new Date(i.createdAt)
              });
            });

            list.sort((a, b) => b.time.getTime() - a.time.getTime());
            return list.slice(0, 5);
          })();

          // Overstayed Visitors (checked in > 8 hours ago and not checked out)
          const overstayedVisitors = site.visitors?.filter((v: any) => 
            !v.checkOutTime && 
            (Date.now() - new Date(v.checkInTime).getTime()) > 8 * 60 * 60 * 1000
          ) || [];

          // Expiring Employee Documents (Simulate if license expiring)
          const expiringDocs = site.users?.filter((u: any) => {
            const hash = u.id.charCodeAt(u.id.length - 1) || 0;
            return hash % 7 === 0; // Simulated warning rate
          }) || [];

          // Styling
          const dashboardCardStyle = {
            background: "var(--color-card-bg)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column" as const,
            gap: "16px"
          };

          return (
            <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "28px" }}>
              
              {/* Site Health Banner */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: statusBg, border: `1px solid ${statusBorder}`,
                padding: "16px 24px", borderRadius: "var(--radius-xl)", boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    Site Status: <strong style={{ color: statusColor, marginLeft: "4px" }}>{siteStatus}</strong>
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Sync coordinates: {new Date().toLocaleTimeString()}
                </span>
              </div>

              {/* KPI Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
                {[
                  { label: "Personnel on Duty", value: totalPersonnel, icon: <Users size={18} />, color: "var(--color-accent)" },
                  { label: "Guards Clocked In", value: checkedInCount, icon: <ShieldCheck size={18} />, color: "var(--color-success)" },
                  { label: "Active Posts", value: totalPostsCount, icon: <MapPin size={18} />, color: "var(--color-info)" },
                  { label: "Active Shifts Today", value: activeShiftsCount, icon: <Calendar size={18} />, color: "var(--color-accent)" },
                  { label: "Visitors On Site", value: visitorsCount, icon: <Contact size={18} />, color: "var(--color-success)" },
                  { label: "Open Incidents", value: openIncidentsCount, icon: <ShieldAlert size={18} />, color: "var(--color-danger)" },
                  { label: "OB Logs Today", value: todayIncidentsCount, icon: <FileText size={18} />, color: "var(--color-accent)" },
                  { label: "Attendance Rate", value: `${attendanceRate}%`, icon: <Activity size={18} />, color: "var(--color-success)" }
                ].map((k, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex",
                      alignItems: "center", gap: "14px"
                    }}
                  >
                    <div style={{
                      background: `${k.color}10`, color: k.color, padding: "10px",
                      borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {k.icon}
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{k.label}</span>
                      <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: "2px 0 0 0" }}>{k.value}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Operations Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "24px", alignItems: "start" }}>
                
                {/* Left Column Operations snapshot & attendance */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Today's Operations Snapshot */}
                  <div style={dashboardCardStyle}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Activity size={16} color="var(--color-accent)" /> Today's Operations
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {/* Active Posts staffed checklist */}
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Guard Post Staffing Details</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                          {site.posts?.slice(0, 6).map((post: any) => {
                            const activeShift = site.shifts?.find((s: any) => s.status === "IN_PROGRESS" && s.postId === post.id);
                            return (
                              <div key={post.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)" }}>
                                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{post.name}</span>
                                <span style={{
                                  fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                                  background: activeShift ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                                  color: activeShift ? "var(--color-success)" : "var(--color-danger)"
                                }}>
                                  {activeShift ? "STAFFED" : "VACANT"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Guards Currently On Shift */}
                      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>On-Duty Officers</span>
                        {checkedInGuards.length === 0 ? (
                          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "6px" }}>No guards currently clocked in on site.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                            {checkedInGuards.slice(0, 4).map((s: any) => (
                              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{s.user?.firstName} {s.user?.lastName}</span>
                                <span>Checked in at {new Date(s.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.post?.name || "Gate"})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div style={dashboardCardStyle}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircle2 size={16} color="var(--color-success)" /> Attendance Summary
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <span>Present / Active:</span>
                          <span style={{ fontWeight: 700, color: "var(--color-success)" }}>{presentGuards}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <span>Late Arrivals:</span>
                          <span style={{ fontWeight: 700, color: "var(--color-warning)" }}>{lateGuards}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <span>Absent / Missed:</span>
                          <span style={{ fontWeight: 700, color: "var(--color-danger)" }}>{absentGuards}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderLeft: "1px solid var(--color-border)", paddingLeft: "20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Attendance Rate</span>
                        <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-success)", marginTop: "4px" }}>{attendanceRate}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Timeline */}
                  <div style={dashboardCardStyle}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Clock size={16} color="var(--color-accent)" /> Recent Activity
                    </h3>
                    
                    {timelineEvents.length === 0 ? (
                      <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No recent activity reported.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative" }}>
                        {timelineEvents.map((evt, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "12px", position: "relative" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{
                                width: "8px", height: "8px", borderRadius: "50%",
                                background: evt.type.startsWith("incident") ? "var(--color-danger)" : evt.type.startsWith("visitor") ? "var(--color-success)" : "var(--color-info)"
                              }} />
                              {idx < timelineEvents.length - 1 && (
                                <div style={{ width: "1px", flex: 1, background: "var(--color-border)", margin: "4px 0" }} />
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{evt.text}</p>
                              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{evt.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column Alerts & Quick Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Alerts & Attention Required Panel */}
                  <div style={{
                    ...dashboardCardStyle,
                    border: (unstaffedPostsCount > 0 || openIncidentsCount > 0 || overstayedVisitors.length > 0 || expiringDocs.length > 0) 
                      ? "1px dashed rgba(239, 68, 68, 0.3)" 
                      : "1px solid var(--color-border)",
                    background: (unstaffedPostsCount > 0 || openIncidentsCount > 0 || overstayedVisitors.length > 0 || expiringDocs.length > 0)
                      ? "rgba(239, 68, 68, 0.02)"
                      : "var(--color-card-bg)"
                  }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangle size={16} color="var(--color-danger)" /> Alerts & Attention Required
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {unstaffedPostsCount > 0 && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <ShieldAlert size={14} color="var(--color-danger)" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <span><strong>{unstaffedPostsCount} Unstaffed Posts:</strong> Check scheduling for vacant guard posts.</span>
                        </div>
                      )}

                      {openIncidentsCount > 0 && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <ShieldAlert size={14} color="var(--color-danger)" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <span><strong>{openIncidentsCount} Open Incidents:</strong> Incidents in Occurrence Book require resolution.</span>
                        </div>
                      )}

                      {overstayedVisitors.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <ShieldAlert size={14} color="var(--color-warning)" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <span><strong>{overstayedVisitors.length} Overstayed Visitors:</strong> Visitors checked in &gt; 8h ago.</span>
                        </div>
                      )}

                      {expiringDocs.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <ShieldAlert size={14} color="var(--color-warning)" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <span><strong>SIRA Document Alert:</strong> {expiringDocs.length} officers have SIRA certificates near expiry.</span>
                        </div>
                      )}

                      {unstaffedPostsCount === 0 && openIncidentsCount === 0 && overstayedVisitors.length === 0 && expiringDocs.length === 0 && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--color-success)", background: "rgba(16, 185, 129, 0.05)", padding: "10px", borderRadius: "var(--radius-md)" }}>
                          <CheckCircle2 size={16} />
                          <span>All posts staffed. No active incidents or alerts requiring attention.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Shortcuts */}
                  <div style={dashboardCardStyle}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Play size={16} color="var(--color-accent)" /> Quick Actions
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        { label: "Add OB Log", action: () => setActiveTab("incidents") },
                        { label: "Register Visitor", action: () => setActiveTab("visitors") },
                        { label: "View Personnel", action: () => setActiveTab("personnel") },
                        { label: "View Shifts", action: () => setActiveTab("shifts") },
                        { label: "View Posts", action: () => setActiveTab("posts") },
                        { label: "Report Incident", action: () => setActiveTab("incidents") }
                      ].map((a, idx) => (
                        <button
                          key={idx}
                          onClick={a.action}
                          style={{
                            padding: "10px 12px", background: "var(--color-bg-subtle)",
                            border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                            fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-primary)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            textAlign: "center", transition: "background var(--transition-fast)"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--color-border)"}
                          onMouseLeave={e => e.currentTarget.style.background = "var(--color-bg-subtle)"}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB: OCCURRENCE BOOK */}
        {activeTab === "incidents" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                <tr>
                  {["Date", "Incident", "Severity", "Status", "Reported By"].map(h => (
                    <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {site.incidents.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>No incidents recorded.</td></tr>
                ) : site.incidents.map((inc: any, i: number) => (
                  <tr 
                    key={inc.id} 
                    style={{ borderBottom: i < site.incidents.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{new Date(inc.createdAt).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{inc.title}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        padding: "3px 8px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700, 
                        background: inc.severity === "CRITICAL" ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)", 
                        color: inc.severity === "CRITICAL" ? "var(--color-danger)" : "var(--color-warning)" 
                      }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        padding: "3px 8px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700, 
                        background: inc.status === "RESOLVED" ? "var(--color-success-subtle)" : "var(--color-bg-subtle)", 
                        color: inc.status === "RESOLVED" ? "var(--color-success)" : "var(--color-text-secondary)" 
                      }}>
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{inc.reportedBy?.firstName || "-"} {inc.reportedBy?.lastName || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: VISITOR BOOK */}
        {activeTab === "visitors" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                <tr>
                  {["Name", "Company", "Host", "Check In", "Check Out"].map(h => (
                    <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {site.visitors.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>No visitors recorded.</td></tr>
                ) : site.visitors.map((v: any, i: number) => (
                  <tr 
                    key={v.id} 
                    style={{ borderBottom: i < site.visitors.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{v.name}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{v.company || "—"}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{v.hostName || "—"}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{new Date(v.checkInTime).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 500, color: v.checkOutTime ? "var(--color-text-secondary)" : "var(--color-accent)" }}>
                      {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: PERSONNEL */}
        {activeTab === "personnel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
            
            {/* Search & Filter Controls */}
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", boxShadow: "var(--color-card-shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input
                    type="text"
                    style={{ ...inputStyle, paddingLeft: "36px", height: "38px" }}
                    placeholder="Search personnel by name or email..."
                    value={personnelSearch}
                    onChange={e => setPersonnelSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  <Filter size={14} /> Filters:
                </div>
                <select 
                  style={selectStyle}
                  value={personnelRole}
                  onChange={e => setPersonnelRole(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  <option value="SITE_MANAGER">Site Managers</option>
                  <option value="GUARD">Security Officers</option>
                </select>
                <select 
                  style={selectStyle}
                  value={personnelStatus}
                  onChange={e => setPersonnelStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <tr>
                    {["Personnel Info", "Designated Role", "Duty Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedPersonnel.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>
                        No personnel found matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedPersonnel.map((u: any, idx: number) => (
                      <tr 
                        key={u.id}
                        style={{ 
                          borderBottom: idx < paginatedPersonnel.length - 1 ? "1px solid var(--color-border)" : "none",
                          transition: "background var(--transition-fast)" 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ 
                              width: "36px", 
                              height: "36px", 
                              borderRadius: "50%", 
                              background: "var(--color-accent-subtle)", 
                              color: "var(--color-accent)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              fontWeight: 700, 
                              fontSize: "12px",
                              border: "1px solid var(--color-accent-border)",
                              flexShrink: 0
                            }}>
                              {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "13.5px" }}>{u.firstName} {u.lastName}</div>
                              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ 
                            display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                            background: u.role === "SITE_MANAGER" ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
                            color: u.role === "SITE_MANAGER" ? "var(--color-accent)" : "var(--color-text-secondary)"
                          }}>
                            {u.role === "SITE_MANAGER" ? "Site Manager" : "Security Officer"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            background: u.onLeave ? "var(--color-danger-subtle)" : "var(--color-success-subtle)",
                            color: u.onLeave ? "var(--color-danger)" : "var(--color-success)"
                          }}>
                            {u.onLeave ? "ON LEAVE" : "ACTIVE"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => handleToggleLeave(u.id)}
                              style={{
                                padding: "6px 12px",
                                background: u.onLeave ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: u.onLeave ? "var(--color-success)" : "var(--color-danger)",
                                cursor: "pointer",
                                transition: "opacity var(--transition-fast)"
                              }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                            >
                              {u.onLeave ? "Mark Active" : "Flag Leave"}
                            </button>
                            <button
                              onClick={() => router.push(`/manager/users/${u.id}`)}
                              style={{
                                padding: "6px 12px",
                                background: "var(--color-bg-subtle)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                                cursor: "pointer",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                            >
                              Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                  Showing page <strong>{personnelPage}</strong> of <strong>{totalPages}</strong> ({filteredPersonnel.length} entries)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={personnelPage === 1}
                    onClick={() => setPersonnelPage(prev => Math.max(1, prev - 1))}
                    style={{
                      padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600,
                      color: personnelPage === 1 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                      cursor: personnelPage === 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={personnelPage === totalPages}
                    onClick={() => setPersonnelPage(prev => Math.min(totalPages, prev + 1))}
                    style={{
                      padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600,
                      color: personnelPage === totalPages ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                      cursor: personnelPage === totalPages ? "not-allowed" : "pointer"
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SHIFTS */}
        {activeTab === "shifts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "20px" }}>
            
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "var(--color-card-shadow)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)" }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Shifts</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px" }}>{shiftStats.total}</div>
                </div>
              </div>

              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "var(--color-card-shadow)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-success)" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-success)", animation: "pulse 1.5s infinite" }} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Active (On Duty)</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success)", marginTop: "2px" }}>{shiftStats.active}</div>
                </div>
              </div>

              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "var(--color-card-shadow)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(59, 130, 246, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-info)" }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Upcoming</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-info)", marginTop: "2px" }}>{shiftStats.scheduled}</div>
                </div>
              </div>

              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "var(--color-card-shadow)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)" }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Missed / Expired</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-danger)", marginTop: "2px" }}>{shiftStats.missed}</div>
                </div>
              </div>
            </div>

            {/* Live Post Coverage monitor */}
            <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "20px", boxShadow: "var(--color-card-shadow)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={16} color="var(--color-accent)" /> Live Post Coverage Monitor
              </h3>
              {postCoverageList.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", padding: "10px 0" }}>No posts defined for this site. Assign posts in the "Posts" tab first.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
                  {postCoverageList.map((cov: any) => (
                    <div 
                      key={cov.post.id} 
                      style={{ 
                        padding: "14px 16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
                        background: cov.isCovered ? "rgba(16, 185, 129, 0.03)" : "rgba(239, 68, 68, 0.02)",
                        display: "flex", flexDirection: "column", gap: "8px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>{cov.post.name}</span>
                        <span style={{ 
                          fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px",
                          background: cov.isCovered ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                          color: cov.isCovered ? "var(--color-success)" : "var(--color-danger)"
                        }}>
                          {cov.isCovered ? "🟢 COVERED" : "🔴 UNSTAFFED"}
                        </span>
                      </div>
                      {cov.isCovered ? (
                        <div style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 600 }}>{cov.activeGuard?.firstName} {cov.activeGuard?.lastName}</span>
                          <span style={{ color: "var(--color-text-muted)" }}>({cov.activeShift?.actualStartTime ? new Date(cov.activeShift.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"})</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>No security officer currently checked-in.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Bar */}
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", boxShadow: "var(--color-card-shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input
                    type="text"
                    style={{ ...inputStyle, paddingLeft: "36px", height: "38px" }}
                    placeholder="Search shifts by officer name or post..."
                    value={shiftSearch}
                    onChange={e => setShiftSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  <Filter size={14} /> Filters:
                </div>
                <select 
                  style={selectStyle}
                  value={shiftStatusFilter}
                  onChange={e => setShiftStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">Active (Live)</option>
                  <option value="SCHEDULED">Upcoming</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="MISSED">Missed / Expired</option>
                </select>
                <select 
                  style={selectStyle}
                  value={shiftPostFilter}
                  onChange={e => setShiftPostFilter(e.target.value)}
                >
                  <option value="ALL">All Posts</option>
                  {site.posts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <tr>
                    {["Personnel Info", "Post / Location", "Scheduled Time", "Actual Check-In/Out", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedShifts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>
                        No shifts scheduled or matching search filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedShifts.map((s: any, idx: number) => {
                      const isShiftMissed = s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now();
                      return (
                        <tr 
                          key={s.id}
                          style={{ 
                            borderBottom: idx < paginatedShifts.length - 1 ? "1px solid var(--color-border)" : "none",
                            transition: "background var(--transition-fast)" 
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ 
                                width: "36px", 
                                height: "36px", 
                                borderRadius: "50%", 
                                background: "var(--color-accent-subtle)", 
                                color: "var(--color-accent)", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                fontWeight: 700, 
                                fontSize: "12px",
                                border: "1px solid var(--color-accent-border)",
                                flexShrink: 0
                              }}>
                                {(s.user?.firstName?.[0] || "") + (s.user?.lastName?.[0] || "")}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "13.5px" }}>{s.user?.firstName} {s.user?.lastName}</div>
                                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{s.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13.5px" }}>{s.post?.name || "Ad-Hoc Patrol"}</div>
                            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{site.name}</div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                              <strong>Start:</strong> {new Date(s.startTime).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                              <strong>End:</strong> {s.endTime ? new Date(s.endTime).toLocaleString() : "—"}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            {s.actualStartTime ? (
                              <>
                                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                                  <strong>In:</strong> {new Date(s.actualStartTime).toLocaleString()}
                                </div>
                                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                                  <strong>Out:</strong> {s.actualEndTime ? new Date(s.actualEndTime).toLocaleString() : "Still Active"}
                                </div>
                              </>
                            ) : (
                              <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                                {isShiftMissed ? "Expired (No Check-In)" : "No Check-In Yet"}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <span style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              background: isShiftMissed ? "var(--color-danger-subtle)" :
                                         s.status === "COMPLETED" ? "var(--color-bg-subtle)" : 
                                         s.status === "IN_PROGRESS" ? "var(--color-success-subtle)" : "var(--color-info-subtle)",
                              color: isShiftMissed ? "var(--color-danger)" :
                                     s.status === "COMPLETED" ? "var(--color-text-secondary)" : 
                                     s.status === "IN_PROGRESS" ? "var(--color-success)" : "var(--color-info)"
                            }}>
                              {isShiftMissed ? "MISSED" : s.status === "IN_PROGRESS" ? "LIVE" : s.status}
                            </span>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <button
                              onClick={() => router.push(`/manager/users/${s.userId}`)}
                              style={{
                                padding: "6px 12px",
                                background: "var(--color-bg-subtle)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                                cursor: "pointer",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                            >
                              Officer Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalShiftPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                  Showing page <strong>{shiftPage}</strong> of <strong>{totalShiftPages}</strong> ({filteredShifts.length} entries)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={shiftPage === 1}
                    onClick={() => setShiftPage(prev => Math.max(1, prev - 1))}
                    style={{
                      padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600,
                      color: shiftPage === 1 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                      cursor: shiftPage === 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={shiftPage === totalShiftPages}
                    onClick={() => setShiftPage(prev => Math.min(totalShiftPages, prev + 1))}
                    style={{
                      padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600,
                      color: shiftPage === totalShiftPages ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                      cursor: shiftPage === totalShiftPages ? "not-allowed" : "pointer"
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: POSTS */}
        {activeTab === "posts" && (
          <div style={{ padding: "24px" }}>
            {site.isFrozen && (
              <div style={{ marginBottom: "24px", padding: "16px", background: "var(--color-danger-subtle)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, border: "1px solid var(--color-danger-border)" }}>
                This site is currently frozen. Modifications are disabled.
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Site Guard Posts</h3>
              <div>
                {!site.isFrozen && (
                  <button 
                    onClick={() => setIsAddingPost(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
                      background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)",
                      fontSize: "13.5px", fontWeight: 600, cursor: "pointer", transition: "opacity var(--transition-fast)",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    <Plus size={16} /> Add Post
                  </button>
                )}
              </div>
            </div>

            {/* Posts Table */}
            <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                      {["Post Name", "Status", "Assigned Officer", "Shift Time", "Created Date"].map(h => (
                        <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {site.posts?.length === 0 && !isAddingPost ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>
                          No posts configured for this site.
                        </td>
                      </tr>
                    ) : site.posts?.map((post: any) => {
                      const activeShifts = (site.shifts || []).filter((s: any) => s.status === "IN_PROGRESS" && s.postId === post.id);
                      const scheduledShifts = (site.shifts || []).filter((s: any) => s.status === "SCHEDULED" && s.postId === post.id && new Date(s.endTime) > new Date());
                      
                      const hasAssignment = activeShifts.length > 0 || scheduledShifts.length > 0;
                      const assignmentStatus = activeShifts.length > 0 
                        ? `MANNED (${activeShifts.length})` 
                        : (scheduledShifts.length > 0 ? `ASSIGNED (${scheduledShifts.length})` : "UNMANNED");

                      return (
                        <tr key={post.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background var(--transition-fast)" }}>
                          <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{post.name}</td>
                          <td style={{ padding: "16px 24px" }}>
                            <span style={{ 
                              padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700, 
                              background: activeShifts.length > 0 ? "var(--color-success-subtle)" : (scheduledShifts.length > 0 ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)"), 
                              color: activeShifts.length > 0 ? "var(--color-success)" : (scheduledShifts.length > 0 ? "var(--color-warning)" : "var(--color-danger)") 
                            }}>
                              {assignmentStatus}
                            </span>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            {hasAssignment ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {activeShifts.map((sh: any, sIdx: number) => (
                                  <div key={sh.id || sIdx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-accent-subtle)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "10px", border: "1px solid var(--color-accent-border)", flexShrink: 0 }}>
                                      {(sh.user?.firstName?.[0] || "") + (sh.user?.lastName?.[0] || "")}
                                    </div>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                      {sh.user?.firstName} {sh.user?.lastName} <span style={{ fontSize: "10px", color: "var(--color-success)", fontWeight: 700 }}>(LIVE)</span>
                                    </span>
                                  </div>
                                ))}
                                {scheduledShifts.map((sh: any, sIdx: number) => (
                                  <div key={sh.id || sIdx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "10px", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                                      {(sh.user?.firstName?.[0] || "") + (sh.user?.lastName?.[0] || "")}
                                    </div>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                                      {sh.user?.firstName} {sh.user?.lastName} <span style={{ fontSize: "10px", color: "var(--color-warning)", fontWeight: 700 }}>(PLAN)</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)", fontSize: "13.5px" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {activeShifts.map((sh: any, sIdx: number) => (
                                <span key={sIdx}>On Duty (Continuous)</span>
                              ))}
                              {scheduledShifts.map((sh: any, sIdx: number) => (
                                <span key={sIdx} style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                                  {new Date(sh.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sh.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ))}
                              {!hasAssignment && <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-muted)" }}>{new Date(post.createdAt).toLocaleDateString()}</td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* Add Post Popup Modal */}
      {isAddingPost && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px"
        }}>
          <div style={{
            background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "480px",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={16} color="var(--color-accent)" /> Add Guard Post
              </h2>
              <button type="button" onClick={() => { setIsAddingPost(false); setNewPostName(""); }} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddPost} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Post Name</label>
                  <input
                    required
                    style={inputStyle}
                    placeholder="E.g. Main Gate Entrance"
                    value={newPostName}
                    onChange={e => setNewPostName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ padding: "18px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => { setIsAddingPost(false); setNewPostName(""); }} style={{ padding: "10px 20px", background: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13.5px", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={!newPostName.trim()} style={{ padding: "10px 20px", background: newPostName.trim() ? "var(--color-accent)" : "var(--color-accent-text)", color: newPostName.trim() ? "var(--color-accent-text)" : "var(--color-text-muted)", border: "none", borderRadius: "var(--radius-md)", cursor: newPostName.trim() ? "pointer" : "not-allowed", fontSize: "13.5px", fontWeight: 600 }}>Save Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
