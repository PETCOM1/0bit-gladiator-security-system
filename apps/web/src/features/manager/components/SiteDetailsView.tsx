"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { managerService } from "@/features/manager/services/manager.service";
import { MapPin, Users, ShieldAlert, Contact, Calendar, Info, ArrowLeft, Plus, CheckCircle2 } from "lucide-react";

interface Props {
  siteId: string;
  hideBackButton?: boolean;
}

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

export default function SiteDetailsView({ siteId, hideBackButton }: Props) {
  const router = useRouter();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "incidents" | "visitors" | "personnel" | "shifts" | "posts">("overview");
  const [newPostName, setNewPostName] = useState("");
  const [isAddingPost, setIsAddingPost] = useState(false);

  // Assignment Modal States
  const [assignPostId, setAssignPostId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignStartTime, setAssignStartTime] = useState("");
  const [assignEndTime, setAssignEndTime] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [shiftPreset, setShiftPreset] = useState("morning");

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

  const tabs = [
    { id: "overview", label: "Overview", icon: <Info size={15} /> },
    { id: "incidents", label: "Occurrence Book", icon: <ShieldAlert size={15} /> },
    { id: "visitors", label: "Visitor Book", icon: <Contact size={15} /> },
    { id: "personnel", label: "Personnel", icon: <Users size={15} /> },
    { id: "shifts", label: "Shifts", icon: <Calendar size={15} /> },
    { id: "posts", label: "Posts", icon: <MapPin size={15} /> }
  ] as const;

  const getLocalDatetimeString = (date: Date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  };

  const openAssignModal = (postId: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    setAssignPostId(postId);
    setAssignUserId("");
    setSelectedDate(todayStr);
    setShiftPreset("morning");
    
    const start = new Date();
    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
    setAssignStartTime(getLocalDatetimeString(start));
    setAssignEndTime(getLocalDatetimeString(end));
  };

  const handleAssignGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPostId || !assignUserId) return;
    
    const selectedGuard = site.users?.find((u: any) => u.id === assignUserId);
    if (selectedGuard?.onLeave) {
      if (!confirm(`Warning: ${selectedGuard.firstName} ${selectedGuard.lastName} is flagged as On Leave. Do you still want to assign them to this shift?`)) {
        return;
      }
    }
    
    let finalStart = assignStartTime;
    let finalEnd = assignEndTime;

    if (shiftPreset !== "custom" && selectedDate) {
      if (shiftPreset === "morning") {
        finalStart = `${selectedDate}T06:00`;
        finalEnd = `${selectedDate}T14:00`;
      } else if (shiftPreset === "afternoon") {
        finalStart = `${selectedDate}T14:00`;
        finalEnd = `${selectedDate}T22:00`;
      } else if (shiftPreset === "night") {
        finalStart = `${selectedDate}T22:00`;
        const nextDay = new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000);
        const nextDayStr = nextDay.toISOString().split("T")[0];
        finalEnd = `${nextDayStr}T06:00`;
      }
    }
    
    setIsAssigning(true);
    try {
      await managerService.createShift({
        userId: assignUserId,
        postId: assignPostId,
        startTime: finalStart,
        endTime: finalEnd,
        siteId: site.id
      });
      setAssignPostId(null);
      // Refresh site data
      const res = await managerService.getSiteById(siteId);
      setSite(res.data.data.site);
    } catch (err) {
      console.error(err);
      alert("Failed to assign personnel to this post.");
    } finally {
      setIsAssigning(false);
    }
  };

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
        {activeTab === "overview" && (
          <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Overview Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
              <div 
                style={statCardStyle}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
              >
                <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}><Users size={20} /></div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px 0" }}>Total Personnel</p>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{site.users?.length || 0}</h2>
                </div>
              </div>
              <div 
                style={statCardStyle}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-danger)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
              >
                <div style={iconWrapperStyle("var(--color-danger-subtle)", "var(--color-danger)")}><ShieldAlert size={20} /></div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px 0" }}>Total Incidents</p>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{site.incidents?.length || 0}</h2>
                </div>
              </div>
              <div 
                style={statCardStyle}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-success)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
              >
                <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}><Contact size={20} /></div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px 0" }}>Total Visitors</p>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{site.visitors?.length || 0}</h2>
                </div>
              </div>
            </div>

            {/* Coverage Grid */}
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Live Site Coverage</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {site.posts?.length === 0 ? (
                  <div style={{ padding: "32px", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-muted)", textAlign: "center", gridColumn: "1 / -1", fontSize: "13.5px" }}>No posts configured.</div>
                ) : site.posts?.map((post: any) => {
                  const activeShift = site.shifts?.find((s: any) => s.status === "IN_PROGRESS" && s.postId === post.id);
                  return (
                    <div 
                      key={post.id} 
                      style={{ 
                        padding: "18px 20px", 
                        borderRadius: "var(--radius-lg)", 
                        border: "1px solid var(--color-border)", 
                        background: activeShift ? "var(--color-success-subtle)" : "var(--color-danger-subtle)", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        transition: "transform var(--transition-base)",
                        cursor: "default"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{post.name}</h4>
                        <p style={{ margin: 0, fontSize: "12.5px", color: activeShift ? "var(--color-success)" : "var(--color-danger)", fontWeight: 600, marginTop: "4px" }}>
                          {activeShift ? `Covered: ${activeShift.user?.firstName}` : "Unmanned"}
                        </p>
                      </div>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: activeShift ? "var(--color-success)" : "var(--color-danger)", boxShadow: activeShift ? "0 0 8px var(--color-success)" : "0 0 8px var(--color-danger)" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
          <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {site.users.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", gridColumn: "1 / -1", fontSize: "13.5px" }}>No personnel assigned to this site.</div>
            ) : site.users.map((u: any) => (
              <div 
                key={u.id} 
                style={{ 
                  padding: "20px", 
                  border: "1px solid var(--color-border)", 
                  borderRadius: "var(--radius-xl)", 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "16px", 
                  background: "var(--color-card-bg)",
                  transition: "transform var(--transition-base)",
                  cursor: "default"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    background: "var(--color-accent-subtle)", 
                    color: "var(--color-accent)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontWeight: 700, 
                    fontSize: "12px",
                    border: "1px solid var(--color-accent-border)"
                  }}>
                    {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{u.firstName} {u.lastName}</h4>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)", marginTop: "2px" }}>{u.role}</p>
                  </div>
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
                </div>
                
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
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
                    {u.onLeave ? "Mark as Active" : "Flag on Leave"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: SHIFTS */}
        {activeTab === "shifts" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                <tr>
                  {["Personnel", "Start Time", "End Time", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {site.shifts.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>No shifts scheduled.</td></tr>
                ) : site.shifts.map((s: any, i: number) => (
                  <tr 
                    key={s.id} 
                    style={{ borderBottom: i < site.shifts.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{s.user?.firstName || "-"} {s.user?.lastName || ""}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{new Date(s.startTime).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: s.endTime ? "var(--color-text-secondary)" : "var(--color-accent)", fontWeight: s.endTime ? 400 : 500 }}>
                      {s.endTime ? new Date(s.endTime).toLocaleString() : "Active"}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        padding: "3px 8px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700, 
                        background: s.status === "COMPLETED" ? "var(--color-success-subtle)" : "var(--color-bg-subtle)", 
                        color: s.status === "COMPLETED" ? "var(--color-success)" : "var(--color-text-secondary)" 
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: POSTS */}
        {activeTab === "posts" && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Site Guard Posts</h3>
              <button 
                onClick={() => setIsAddingPost(!isAddingPost)}
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
            </div>

            {/* Add Post Form */}
            {isAddingPost && (
              <form onSubmit={handleAddPost} className="glass-panel" style={{ display: "flex", gap: "12px", marginBottom: "24px", padding: "20px", borderRadius: "var(--radius-xl)" }}>
                <input
                  type="text"
                  placeholder="Post Name (e.g. Main Gate)"
                  value={newPostName}
                  onChange={e => setNewPostName(e.target.value)}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13.5px",
                    outline: "none"
                  }}
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!newPostName.trim()}
                  style={{
                    padding: "10px 20px", background: newPostName.trim() ? "var(--color-accent)" : "var(--color-bg-subtle)",
                    color: newPostName.trim() ? "var(--color-accent-text)" : "var(--color-text-muted)", border: "none", borderRadius: "var(--radius-md)",
                    fontSize: "13.5px", fontWeight: 600, cursor: newPostName.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  Save
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsAddingPost(false); setNewPostName(""); }}
                  style={{
                    padding: "10px 20px", background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", 
                    borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Posts Table */}
            <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                      {["Post Name", "Status", "Assigned Officer", "Shift Time", "Created Date", ""].map(h => (
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
                      const activeShift = site.shifts?.find((s: any) => s.status === "IN_PROGRESS" && s.postId === post.id);
                      const scheduledShift = site.shifts?.find((s: any) => s.status === "SCHEDULED" && s.postId === post.id && new Date(s.endTime) > new Date());
                      
                      const hasAssignment = activeShift || scheduledShift;
                      const assignedUser = activeShift?.user || scheduledShift?.user;
                      const assignmentStatus = activeShift ? "MANNED" : (scheduledShift ? "ASSIGNED" : "UNMANNED");

                      return (
                        <tr key={post.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background var(--transition-fast)" }}>
                          <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{post.name}</td>
                          <td style={{ padding: "16px 24px" }}>
                            <span style={{ 
                              padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700, 
                              background: assignmentStatus === "MANNED" ? "var(--color-success-subtle)" : (assignmentStatus === "ASSIGNED" ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)"), 
                              color: assignmentStatus === "MANNED" ? "var(--color-success)" : (assignmentStatus === "ASSIGNED" ? "var(--color-warning)" : "var(--color-danger)") 
                            }}>
                              {assignmentStatus}
                            </span>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            {hasAssignment && assignedUser ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-accent-subtle)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "10px", border: "1px solid var(--color-accent-border)" }}>
                                  {(assignedUser.firstName?.[0] || "") + (assignedUser.lastName?.[0] || "")}
                                </div>
                                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{assignedUser.firstName} {assignedUser.lastName}</span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)", fontSize: "13.5px" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                            {scheduledShift ? (
                              `${new Date(scheduledShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(scheduledShift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            ) : activeShift ? (
                              "On Duty (Continuous)"
                            ) : (
                              <span style={{ color: "var(--color-text-muted)" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-muted)" }}>{new Date(post.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: "16px 24px", textAlign: "right" }}>
                            {!activeShift && (
                              <button
                                onClick={() => openAssignModal(post.id)}
                                style={{
                                  padding: "6px 12px",
                                  background: "var(--color-bg-subtle)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--radius-md)",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "var(--color-text-primary)",
                                  cursor: "pointer",
                                  transition: "all var(--transition-fast)"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                              >
                                {scheduledShift ? "Reassign Guard" : "Assign Guard"}
                              </button>
                            )}
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

      </div>
      {/* Assign Guard Modal */}
      {assignPostId && (
        <div 
          onClick={() => setAssignPostId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px" }}
        >
          <form 
            onSubmit={handleAssignGuard}
            className="glass-panel animate-fade-in" 
            style={{ borderRadius: "var(--radius-xl)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", overflow: "hidden", padding: "24px", gap: "16px" }} 
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Assign Guard to Post</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Select Personnel *</label>
              <select 
                required 
                value={assignUserId} 
                onChange={e => setAssignUserId(e.target.value)} 
                style={inputStyle}
              >
                <option value="">Choose a guard...</option>
                {site.users?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role}){u.onLeave ? " - [ON LEAVE]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Day / Date *</label>
              <input 
                type="date" 
                required 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                style={inputStyle} 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={labelStyle}>Shift Type *</label>
              <select 
                required 
                value={shiftPreset} 
                onChange={e => setShiftPreset(e.target.value)} 
                style={inputStyle}
              >
                <option value="morning">Morning Shift (06:00 - 14:00)</option>
                <option value="afternoon">Afternoon Shift (14:00 - 22:00)</option>
                <option value="night">Night Shift (22:00 - 06:00 next day)</option>
                <option value="custom">Custom Times</option>
              </select>
            </div>

            {shiftPreset === "custom" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Start Time *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={assignStartTime} 
                    onChange={e => setAssignStartTime(e.target.value)} 
                    style={inputStyle} 
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>End Time *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={assignEndTime} 
                    onChange={e => setAssignEndTime(e.target.value)} 
                    style={inputStyle} 
                  />
                </div>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button 
                type="button" 
                onClick={() => setAssignPostId(null)} 
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "13.5px" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isAssigning}
                style={{ padding: "8px 16px", background: "var(--color-accent)", border: "none", color: "var(--color-accent-text)", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: isAssigning ? "not-allowed" : "pointer", fontSize: "13.5px" }}
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
