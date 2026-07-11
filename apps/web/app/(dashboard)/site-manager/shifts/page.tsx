"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, Settings, LayoutGrid, Wand2, BarChart3, 
  Plus, Trash2, Save, RefreshCw, Eye, AlertTriangle, ShieldCheck, MapPin 
} from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

interface ShiftTemplate { 
  id: string; 
  name: string; 
  startTime: string; 
  endTime: string; 
  color: string; 
}

export default function SiteManagerShiftsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // Data states
  const [shifts, setShifts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-tabs inside shifts cockpit
  const [shiftSubTab, setShiftSubTab] = useState<"roster" | "templates" | "autoschedule" | "coverage">("roster");

  // Roster parameters
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [rosterWeekStart, setRosterWeekStart] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon.toISOString().split("T")[0];
  });

  // Shift templates
  const defaultTemplates: ShiftTemplate[] = [
    { id: "t1", name: "Day Shift",       startTime: "06:00", endTime: "18:00", color: "#f59e0b" },
    { id: "t2", name: "Night Shift",     startTime: "18:00", endTime: "06:00", color: "#6366f1" },
    { id: "t3", name: "Morning Shift",   startTime: "06:00", endTime: "14:00", color: "#10b981" },
    { id: "t4", name: "Afternoon Shift", startTime: "14:00", endTime: "22:00", color: "#3b82f6" },
  ];
  const [templates, setTemplates] = useState<ShiftTemplate[]>(defaultTemplates);
  
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateStart, setNewTemplateStart] = useState("07:00");
  const [newTemplateEnd, setNewTemplateEnd] = useState("15:00");
  const [newTemplateColor, setNewTemplateColor] = useState("#3b82f6");

  // Roster grid cells
  // roster: { [userId]: { [dayIndex]: templateId } }
  const [roster, setRoster] = useState<Record<string, Record<number, string>>>({});
  // rosterPosts: { [userId]: { [dayIndex]: postId } }
  const [rosterPosts, setRosterPosts] = useState<Record<string, Record<number, string>>>({});
  
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);
  const [isSavingRoster, setIsSavingRoster] = useState(false);
  const [hideAssignedRoster, setHideAssignedRoster] = useState(false);

  // Auto-Schedule requirements
  const [autoRequirements, setAutoRequirements] = useState<Array<{ templateId: string; count: number }>>([
    { templateId: "t1", count: 2 },
    { templateId: "t2", count: 1 },
  ]);
  const [autoResult, setAutoResult] = useState<Record<string, Record<number, string>> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    if (!currentUser?.siteId) return;
    setLoading(true);
    try {
      const [shiftsRes, usersRes, siteRes] = await Promise.all([
        managerService.getTenantShifts(),
        managerService.getTenantUsers(),
        managerService.getSiteById(currentUser.siteId)
      ]);
      
      const siteShifts = (shiftsRes.data?.data?.shifts || []).filter(
        (s: any) => s.user?.siteId === currentUser.siteId
      );
      setShifts(siteShifts);
      
      // Filter list to only show guards assigned to this supervisor's site
      const allUsers = usersRes.data?.data?.users || [];
      const siteGuards = allUsers.filter(
        (u: any) => u.siteId === currentUser.siteId && u.role === "GUARD"
      );
      setUsers(siteGuards);
      
      // Load posts for this site
      setPosts(siteRes.data?.data?.site?.posts || []);

      // Preset roster values from existing database shifts for this week start date
      const fetchedRoster: Record<string, Record<number, string>> = {};
      const fetchedRosterPosts: Record<string, Record<number, string>> = {};

      siteGuards.forEach((g: any) => {
        fetchedRoster[g.id] = {};
        fetchedRosterPosts[g.id] = {};
      });

      const currentWeekStart = new Date(rosterWeekStart + "T00:00:00");
      const currentWeekEnd = new Date(currentWeekStart.getTime());
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);

      siteShifts.forEach((s: any) => {
        const start = new Date(s.startTime);
        if (start >= currentWeekStart && start < currentWeekEnd && s.userId) {
          const diffTime = Math.abs(start.getTime() - currentWeekStart.getTime());
          const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (dayIndex >= 0 && dayIndex < 7) {
            // Match with templates
            const startHour = start.getHours().toString().padStart(2, "0");
            const startMin = start.getMinutes().toString().padStart(2, "0");
            const timeStr = `${startHour}:${startMin}`;
            
            const matchedTmpl = templates.find(t => t.startTime === timeStr) || templates[0];
            if (matchedTmpl && fetchedRoster[s.userId]) {
              fetchedRoster[s.userId][dayIndex] = matchedTmpl.id;
            }
            if (s.postId && fetchedRosterPosts[s.userId]) {
              fetchedRosterPosts[s.userId][dayIndex] = s.postId;
            }
          }
        }
      });

      setRoster(fetchedRoster);
      setRosterPosts(fetchedRosterPosts);
    } catch (err) {
      console.error("Failed to load shift manager dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, rosterWeekStart]);

  const getRosterDate = (dayIndex: number) => {
    const base = new Date(rosterWeekStart + "T00:00:00");
    base.setDate(base.getDate() + dayIndex);
    return base;
  };

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newT: ShiftTemplate = {
      id: `t_${Date.now()}`,
      name: newTemplateName.trim(),
      startTime: newTemplateStart,
      endTime: newTemplateEnd,
      color: newTemplateColor
    };
    setTemplates(prev => [...prev, newT]);
    setNewTemplateName("");
    setNewTemplateStart("07:00");
    setNewTemplateEnd("15:00");
    setNewTemplateColor("#3b82f6");
    setShowAddTemplate(false);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const setRosterCell = (userId: string, dayIndex: number, value: string) => {
    setRoster(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [dayIndex]: value }
    }));
    setActiveCellKey(null);
  };

  const setRosterPost = (userId: string, dayIndex: number, postId: string) => {
    setRosterPosts(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [dayIndex]: postId }
    }));
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
        
        const endDate = tmpl.endTime < tmpl.startTime
          ? getRosterDate(dayIndex + 1).toISOString().split("T")[0]
          : dayDate;
          
        const postId = rosterPosts[userId]?.[dayIndex] || undefined;
        
        toCreate.push({
          userId,
          startTime: `${dayDate}T${tmpl.startTime}:00`,
          endTime: `${endDate}T${tmpl.endTime}:00`,
          postId
        });
      }
    }

    try {
      await Promise.all(toCreate.map(s => managerService.createShift(s)));
      alert(`✅ Shift roster with ${toCreate.length} schedules saved successfully!`);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save some shifts. Please check your data and try again.");
    } finally {
      setIsSavingRoster(false);
    }
  };

  const handleGenerateRoster = () => {
    setIsGenerating(true);
    const availableGuards = users.filter(u => !u.onLeave);
    const generated: Record<string, Record<number, string>> = {};
    
    availableGuards.forEach(u => { generated[u.id] = {}; });
    
    DAYS.forEach((_, dayIndex) => {
      const guardPool = [...availableGuards];
      for (const req of autoRequirements) {
        if (req.count <= 0) continue;
        const picked = guardPool.splice(0, req.count);
        picked.forEach(g => {
          generated[g.id] = { ...(generated[g.id] || {}), [dayIndex]: req.templateId };
        });
      }
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

  // Roster Coverage Math
  const coverageData = useMemo(() => {
    return DAYS.map((day, dayIndex) => {
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
  }, [shifts, templates, rosterWeekStart]);

  // Styles
  const subTabBtnStyle = (active: boolean) => ({
    padding: "10px 18px",
    background: active ? "var(--color-accent)" : "transparent",
    color: active ? "var(--color-accent-text)" : "var(--color-text-secondary)",
    border: active ? "none" : "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontWeight: 600,
    fontSize: "13.5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all var(--transition-fast)"
  });

  const inputStyle = {
    padding: "10px 14px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "14px", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" as const
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: 700, 
    color: "var(--color-text-muted)", textTransform: "uppercase" as const, 
    marginBottom: "6px", letterSpacing: "0.05em"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%", paddingBottom: "40px" }}>
      
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <Calendar size={22} color="var(--color-accent)" /> Roster & Shift Scheduling
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px", margin: 0 }}>
          Manage guard shift templates, configure weekly scheduling templates, and execute auto-scheduling.
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ 
        background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", 
        border: "1px solid var(--color-border)", padding: "16px 20px", 
        display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", 
        boxShadow: "var(--color-card-shadow)" 
      }}>
        <button onClick={() => setShiftSubTab("roster")} style={subTabBtnStyle(shiftSubTab === "roster")}>
          <LayoutGrid size={15} /> Weekly Roster Grid
        </button>
        <button onClick={() => setShiftSubTab("templates")} style={subTabBtnStyle(shiftSubTab === "templates")}>
          <Settings size={15} /> Shift Templates
        </button>
        <button onClick={() => setShiftSubTab("autoschedule")} style={subTabBtnStyle(shiftSubTab === "autoschedule")}>
          <Wand2 size={15} /> Auto-Schedule
        </button>
        <button onClick={() => setShiftSubTab("coverage")} style={subTabBtnStyle(shiftSubTab === "coverage")}>
          <BarChart3 size={15} /> Shift Coverage Analytics
        </button>
      </div>

      {/* Roster / Tab Content Loading State */}
      {loading ? (
        <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", border: "3px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "14px" }}>Loading scheduler telemetry...</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* SUBTAB 1: WEEKLY ROSTER GRID */}
          {shiftSubTab === "roster" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Weekly Guard Assignments</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Select any cell to designate shift patterns and assign post coverage locations.</p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={labelStyle}>Week Starting</span>
                    <input type="date" value={rosterWeekStart} onChange={e => setRosterWeekStart(e.target.value)} style={{ ...inputStyle, padding: "8px 12px", width: "160px" }} />
                  </div>
                  
                  <button 
                    onClick={() => setHideAssignedRoster(prev => !prev)} 
                    style={{ 
                      padding: "10px 14px", background: hideAssignedRoster ? "rgba(245,158,11,0.15)" : "transparent",
                      border: hideAssignedRoster ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                      color: hideAssignedRoster ? "var(--color-accent)" : "var(--color-text-secondary)",
                      borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginTop: "18px"
                    }}
                  >
                    <Eye size={14} /> {hideAssignedRoster ? "Showing Unscheduled" : "Hide Scheduled"}
                  </button>

                  <button onClick={() => { setRoster({}); setRosterPosts({}); }} style={{ padding: "10px 14px", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginTop: "18px" }}>
                    <RefreshCw size={14} /> Clear Board
                  </button>

                  <button onClick={handleSaveRoster} disabled={isSavingRoster} style={{ padding: "10px 18px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 700, marginTop: "18px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Save size={14} /> {isSavingRoster ? "Saving..." : "Save Roster"}
                  </button>
                </div>
              </div>

              {/* Roster Legend */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", background: "var(--color-bg-subtle)", padding: "12px 18px", borderRadius: "var(--radius-lg)" }}>
                {templates.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: t.color }} />
                    <strong>{t.name}</strong> ({t.startTime}–{t.endTime})
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-danger)" }} />
                  <strong>Off Duty</strong>
                </div>
              </div>

              {/* Weekly Matrix Board */}
              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "var(--color-card-shadow)", overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "1100px" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                      <th style={{ padding: "16px 24px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "220px" }}>Security Guard</th>
                      {DAYS.map((day, di) => {
                        const d = getRosterDate(di);
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                          <th key={day} style={{ padding: "16px 12px", textAlign: "center", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                            <div>{day}</div>
                            <div style={{ fontSize: "12px", fontWeight: 500, marginTop: "2px" }}>{d.toLocaleDateString("en-US", { day: "numeric", month: "short" })}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => {
                      if (!hideAssignedRoster) return true;
                      return !Object.values(roster[u.id] || {}).some(v => v && v !== "OFF");
                    }).map((u, ui) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{u.firstName} {u.lastName}</div>
                              <span style={{ fontSize: "11px", color: u.onLeave ? "var(--color-warning)" : "var(--color-text-muted)" }}>
                                {u.onLeave ? "On Leave" : "Available"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {DAYS.map((_, dayIndex) => {
                          const cellKey = `${u.id}-${dayIndex}`;
                          const selectedTmplId = roster[u.id]?.[dayIndex] || "";
                          const matchedTmpl = templates.find(t => t.id === selectedTmplId);
                          const activePostId = rosterPosts[u.id]?.[dayIndex] || "";

                          return (
                            <td key={dayIndex} style={{ padding: "10px 8px", position: "relative" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                
                                {/* Shift pattern selector dropdown */}
                                <select 
                                  value={selectedTmplId} 
                                  onChange={e => setRosterCell(u.id, dayIndex, e.target.value)}
                                  style={{
                                    width: "100%", padding: "6px", fontSize: "12px", borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--color-border)", 
                                    background: matchedTmpl ? matchedTmpl.color : selectedTmplId === "OFF" ? "rgba(239, 68, 68, 0.1)" : "var(--color-card-bg)",
                                    color: matchedTmpl ? "#fff" : selectedTmplId === "OFF" ? "var(--color-danger)" : "var(--color-text-primary)",
                                    fontWeight: matchedTmpl || selectedTmplId === "OFF" ? 700 : 500, cursor: "pointer"
                                  }}
                                >
                                  <option value="">Off Duty</option>
                                  <option value="OFF">Off Duty</option>
                                  {templates.map(t => <option key={t.id} value={t.id} style={{ background: "var(--color-card-bg)", color: "var(--color-text-primary)" }}>{t.name}</option>)}
                                </select>

                                {/* Post assignment selector dropdown */}
                                {selectedTmplId && selectedTmplId !== "OFF" && (
                                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                    <MapPin size={11} color="var(--color-text-muted)" />
                                    <select 
                                      value={activePostId} 
                                      onChange={e => setRosterPost(u.id, dayIndex, e.target.value)}
                                      style={{
                                        width: "100%", padding: "4px", fontSize: "11px", borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
                                        color: "var(--color-text-secondary)", cursor: "pointer"
                                      }}
                                    >
                                      <option value="">Select post...</option>
                                      {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBTAB 2: SHIFT TEMPLATES */}
          {shiftSubTab === "templates" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Reusable Patterns</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Configure template intervals to easily schedule guards.</p>
                </div>
                <button onClick={() => setShowAddTemplate(!showAddTemplate)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", fontSize: "13.5px" }}>
                  <Plus size={16} /> Create Template
                </button>
              </div>

              {/* Add form */}
              {showAddTemplate && (
                <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", boxShadow: "var(--color-card-shadow)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Shift Name</label>
                    <input type="text" placeholder="Morning Patrol" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} style={inputStyle} />
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
                    <label style={labelStyle}>Theme Color</label>
                    <input type="color" value={newTemplateColor} onChange={e => setNewTemplateColor(e.target.value)} style={{ width: "60px", height: "42px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "4px", cursor: "pointer" }} />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={handleAddTemplate} style={{ padding: "10px 18px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setShowAddTemplate(false)} style={{ padding: "10px 14px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Templates display */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {templates.map(t => (
                  <div key={t.id} style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
                    <div style={{ height: "4px", background: t.color }} />
                    <div style={{ padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t.name}</h4>
                          <span style={{ fontSize: "18px", fontWeight: 800, color: t.color, marginTop: "6px", display: "inline-block" }}>
                            {t.startTime} – {t.endTime}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteTemplate(t.id)} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 3: AUTO-SCHEDULE */}
          {shiftSubTab === "autoschedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Automated Roster Generation</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Specify requirements per shift pattern. The engine will distribute slots among available guards.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "flex-start" }}>
                <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Pattern Requirements</h4>
                  {autoRequirements.map((req, idx) => {
                    const tmpl = templates.find(t => t.id === req.templateId);
                    return (
                      <div key={idx} style={{ display: "flex", justifyItems: "center", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", flex: 1, fontWeight: 600 }}>{tmpl?.name || "Shift"}</span>
                        <input 
                          type="number" 
                          min={0} 
                          value={req.count} 
                          onChange={e => {
                            const newReqs = [...autoRequirements];
                            newReqs[idx].count = parseInt(e.target.value) || 0;
                            setAutoRequirements(newReqs);
                          }}
                          style={{ ...inputStyle, width: "70px", padding: "6px 8px" }} 
                        />
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>guards/day</span>
                      </div>
                    );
                  })}
                  <button onClick={handleGenerateRoster} style={{ padding: "10px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}>
                    {isGenerating ? "Computing..." : "Generate Matrix"}
                  </button>
                </div>

                {autoResult && (
                  <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Preview Roster</h4>
                      <button onClick={handleApplyAutoRoster} style={{ padding: "8px 16px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                        Apply To Grid
                      </button>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      Previewing generated matrix assignments. Press <strong>Apply To Grid</strong> and verify before saving to database.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 4: SHIFT COVERAGE */}
          {shiftSubTab === "coverage" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Coverage Statistics</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>Total active guard count per shift template for this week starting {rosterWeekStart}.</p>
              </div>

              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Day</th>
                      {templates.map(t => (
                        <th key={t.id} style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{t.name}</th>
                      ))}
                      <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageData.map((cov, ci) => (
                      <tr key={ci} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600 }}>{cov.day}</td>
                        {cov.templateCoverage.map((tc, idx) => (
                          <td key={idx} style={{ padding: "14px 16px" }}>
                            <span style={{ 
                              padding: "4px 10px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
                              background: tc.assigned > 0 ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                              color: tc.assigned > 0 ? "var(--color-success)" : "var(--color-danger)"
                            }}>
                              {tc.assigned} guards
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: "14px 16px", fontWeight: 700 }}>{cov.total} assigned</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
