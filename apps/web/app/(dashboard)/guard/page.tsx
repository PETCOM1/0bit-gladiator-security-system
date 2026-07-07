"use client";

import { useState, useEffect } from "react";
import {
  LogIn, LogOut, Clock, Calendar, MapPin, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, Shield, User, PlusCircle, ShieldAlert,
  X, Eye, Play, History, ArrowRight, Sunrise, Moon, Sun, Sunset,
} from "lucide-react";
import { guardService } from "@/features/guard/services/guard.service";
import { useAuth } from "@/shared/context/AuthContext";

// ─── helpers ────────────────────────────────────────────────────────────────
const getMonday = (d: Date) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff));
};

const fmt12 = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const calcDuration = (start: string, end: string) => {
  const hrs = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  return `${Math.abs(hrs).toFixed(0)} hrs`;
};

const shiftIcon = (startTime: string) => {
  const h = new Date(startTime).getHours();
  if (h >= 5 && h < 12) return <Sunrise size={14} />;
  if (h >= 12 && h < 17) return <Sun size={14} />;
  if (h >= 17 && h < 21) return <Sunset size={14} />;
  return <Moon size={14} />;
};

const shiftLabel = (startTime: string, endTime: string) => {
  const sh = new Date(startTime).getHours();
  const eh = new Date(endTime).getHours();
  if (sh === 6 && eh === 18) return "DAY SHIFT";
  if (sh === 18 || (sh >= 18 && eh <= 8)) return "NIGHT SHIFT";
  if (sh >= 6 && sh < 14) return "MORNING SHIFT";
  if (sh >= 14 && sh < 22) return "AFTERNOON SHIFT";
  return "PATROL SHIFT";
};

const statusConfig = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return { label: "IN PROGRESS", dot: "#22c55e", bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)" };
    case "COMPLETED":
      return { label: "COMPLETED", dot: "#64748b", bg: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.3)" };
    case "SCHEDULED":
      return { label: "SCHEDULED", dot: "#3b82f6", bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" };
    default:
      return { label: status, dot: "#94a3b8", bg: "var(--color-bg-subtle)", color: "#94a3b8", border: "var(--color-border)" };
  }
};

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── main component ──────────────────────────────────────────────────────────
export default function GuardDashboard() {
  const { user } = useAuth();

  // core data
  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // week navigation
  const [rosterWeekStart, setRosterWeekStart] = useState<Date>(() => getMonday(new Date()));

  // active / selected shift
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [selectedShift, setSelectedShift] = useState<any | null>(null); // detail modal

  // modals
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // forms
  const [visitorForm, setVisitorForm] = useState({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
  const [incidentForm, setIncidentForm] = useState({ title: "", description: "", severity: "LOW" });

  const loadData = async () => {
    try {
      const [visRes, incRes, shiftsRes] = await Promise.all([
        guardService.getVisitors(),
        guardService.getIncidents(),
        guardService.getMyShifts(),
      ]);
      setVisitors(visRes.data?.data?.visitors || []);
      setIncidents(incRes.data?.data?.incidents || []);
      const allShifts: any[] = shiftsRes.data?.data?.shifts || [];
      setMyShifts(allShifts);
      // detect in-progress
      const inProg = allShifts.find(s => s.status === "IN_PROGRESS");
      if (inProg) setActiveShift(inProg);
    } catch (err) {
      console.error("Failed to load guard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ─── derived data ──────────────────────────────────────────────────────────
  const firstName = user?.firstName || user?.displayName?.split(" ")[0] || "Officer";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayShift = myShifts.find(s => {
    const d = new Date(s.startTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const upcomingShifts = myShifts
    .filter(s => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime() > today.getTime() && s.status === "SCHEDULED";
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  const completedShifts = myShifts
    .filter(s => s.status === "COMPLETED")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 8);

  const getShiftForWeekDay = (dayIndex: number) => {
    const d = new Date(rosterWeekStart);
    d.setDate(d.getDate() + dayIndex);
    return myShifts.find(s => {
      const sd = new Date(s.startTime);
      return sd.toDateString() === d.toDateString();
    });
  };

  // ─── handlers ─────────────────────────────────────────────────────────────
  const handleClockIn = async (shiftId?: string) => {
    try {
      const res = await guardService.startShift();
      const s = res.data.data.shift;
      setActiveShift(s);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    try {
      await guardService.endShift(activeShift.id);
      setActiveShift(null);
      loadData();
    } catch (err) { console.error(err); }
  };

  const submitVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.logVisitor(visitorForm);
      setShowVisitorModal(false);
      setVisitorForm({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
      loadData();
    } catch (err) { console.error(err); }
  };

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.reportIncident(incidentForm);
      setShowIncidentModal(false);
      setIncidentForm({ title: "", description: "", severity: "LOW" });
      loadData();
    } catch (err) { console.error(err); }
  };

  // ─── shared styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "var(--color-card-bg)",
    border: "1px solid var(--color-card-border)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--color-card-shadow)",
    overflow: "hidden",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)", fontSize: "14px",
    color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box",
    transition: "border-color var(--transition-fast)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 700,
    color: "var(--color-text-muted)", marginBottom: "6px",
    textTransform: "uppercase", letterSpacing: "0.06em",
  };

  // ─── loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading your shifts...</span>
      </div>
    );
  }

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ══ HEADER GREETING ═══════════════════════════════════════════════════ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em", margin: 0 }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowVisitorModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 16px", background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", color: "var(--color-accent)", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all var(--transition-fast)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--color-accent)"; e.currentTarget.style.color = "#0b0f19"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-accent-subtle)"; e.currentTarget.style.color = "var(--color-accent)"; }}
          >
            <PlusCircle size={15} /> Log Visitor
          </button>
          <button
            onClick={() => setShowIncidentModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all var(--transition-fast)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
          >
            <ShieldAlert size={15} /> Report Incident
          </button>
        </div>
      </div>

      {/* ══ CURRENT SHIFT STATUS (if in progress) ════════════════════════════ */}
      {activeShift && (
        <div style={{ ...card, border: "1px solid rgba(34,197,94,0.4)", background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, var(--color-card-bg) 60%)", position: "relative", overflow: "hidden" }}>
          {/* glow accent top bar */}
          <div style={{ height: "3px", background: "linear-gradient(90deg, #22c55e, #16a34a)", position: "absolute", top: 0, left: 0, right: 0 }} />
          <div style={{ padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "flex-start" }}>
            {/* Left: status info */}
            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e" }}>Current Assignment — On Duty</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {[
                  { label: "Site", value: activeShift.site?.name || "—", icon: <MapPin size={13} /> },
                  { label: "Post", value: activeShift.post?.name || "—", icon: <Shield size={13} /> },
                  { label: "Shift", value: `${fmt12(activeShift.startTime)} – ${activeShift.endTime ? fmt12(activeShift.endTime) : "—"}`, icon: <Clock size={13} /> },
                  { label: "Checked In", value: activeShift.actualStartTime ? fmt12(activeShift.actualStartTime) : "—", icon: <CheckCircle2 size={13} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "#22c55e" }}>{icon}</span> {label}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "180px" }}>
              <button
                onClick={() => setShowVisitorModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", color: "#0b0f19", fontWeight: 700, fontSize: "13.5px", cursor: "pointer", transition: "opacity var(--transition-fast)" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <PlusCircle size={16} /> Log Visitor
              </button>
              <button
                onClick={() => setShowIncidentModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontWeight: 700, fontSize: "13.5px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
              >
                <ShieldAlert size={16} /> Report Incident
              </button>
              <button
                onClick={handleClockOut}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "13.5px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
              >
                <LogOut size={16} /> Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TODAY'S SHIFT CARD ════════════════════════════════════════════════ */}
      <div>
        <h2 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={14} color="var(--color-accent)" /> Today's Shift
        </h2>
        {todayShift ? (() => {
          const st = statusConfig(todayShift.status);
          const lbl = shiftLabel(todayShift.startTime, todayShift.endTime || todayShift.startTime);
          return (
            <div style={{ ...card, border: `1px solid ${st.border}`, background: `linear-gradient(135deg, ${st.bg} 0%, var(--color-card-bg) 70%)`, position: "relative" }}>
              <div style={{ height: "3px", background: `linear-gradient(90deg, ${st.dot}, transparent)` }} />
              <div style={{ padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", flex: "1 1 300px" }}>
                  {/* Shift icon block */}
                  <div style={{ width: "64px", height: "64px", borderRadius: "var(--radius-xl)", background: st.bg, border: `2px solid ${st.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", flexShrink: 0 }}>
                    <span style={{ color: st.dot, display: "flex" }}>{shiftIcon(todayShift.startTime)}</span>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: st.color, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", lineHeight: 1 }}>{lbl.split(" ")[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: st.color, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: st.dot, display: "inline-block" }} /> {st.label}
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                      {fmt12(todayShift.startTime)} – {todayShift.endTime ? fmt12(todayShift.endTime) : "—"}
                    </div>
                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {todayShift.site?.name && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                          <MapPin size={13} color="var(--color-text-muted)" /> {todayShift.site.name}
                        </div>
                      )}
                      {todayShift.post?.name && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                          <Shield size={13} color={st.dot} /> Post: <span style={{ color: st.color, fontWeight: 700 }}>{todayShift.post.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {todayShift.status === "SCHEDULED" && !activeShift && (
                    <button
                      onClick={() => handleClockIn(todayShift.id)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "#22c55e", border: "none", borderRadius: "var(--radius-md)", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 16px rgba(34,197,94,0.35)", transition: "opacity var(--transition-fast)" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      <LogIn size={16} /> Clock In
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedShift(todayShift)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                  >
                    <Eye size={16} /> View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })() : (
          <div style={{ ...card, padding: "36px 28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: "var(--color-bg-subtle)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-card-bg)", border: "1px dashed var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={20} color="var(--color-text-muted)" />
            </div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>No Shift Today</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>You don't have a shift assigned for today. Enjoy your rest day.</p>
          </div>
        )}
      </div>

      {/* ══ COMPACT WEEKLY SCHEDULE STRIP ════════════════════════════════════ */}
      <div style={{ ...card }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={14} color="var(--color-accent)" /> Weekly Schedule
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              {rosterWeekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {(() => { const d = new Date(rosterWeekStart); d.setDate(d.getDate() + 6); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); })()}
            </span>
            <button onClick={() => setRosterWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; })}
              style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setRosterWeekStart(getMonday(new Date()))}
              style={{ padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)" }}>
              Today
            </button>
            <button onClick={() => setRosterWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; })}
              style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {DAYS_SHORT.map((day, di) => {
            const dayDate = new Date(rosterWeekStart);
            dayDate.setDate(dayDate.getDate() + di);
            const shift = getShiftForWeekDay(di);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            const isPast = dayDate < new Date(new Date().setHours(0, 0, 0, 0));
            const st = shift ? statusConfig(shift.status) : null;
            const lbl = shift ? shiftLabel(shift.startTime, shift.endTime || shift.startTime) : null;

            return (
              <div
                key={di}
                onClick={() => shift && setSelectedShift(shift)}
                style={{
                  borderRight: di < 6 ? "1px solid var(--color-border)" : "none",
                  padding: "14px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  cursor: shift ? "pointer" : "default",
                  background: isToday ? "var(--color-accent-subtle)" : "transparent",
                  transition: "background var(--transition-fast)",
                  minHeight: "120px",
                  borderTop: isToday ? "3px solid var(--color-accent)" : "3px solid transparent",
                }}
                onMouseEnter={e => { if (shift) e.currentTarget.style.background = isToday ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? "var(--color-accent-subtle)" : "transparent"; }}
              >
                {/* day label */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}>{day}</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1, color: isToday ? "var(--color-accent)" : isPast ? "var(--color-text-muted)" : "var(--color-text-primary)", marginTop: "2px" }}>{dayDate.getDate()}</div>
                </div>

                {/* shift pill or off */}
                {shift ? (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ padding: "4px 8px", borderRadius: "6px", background: st!.bg, border: `1px solid ${st!.border}`, fontSize: "9.5px", fontWeight: 800, color: st!.color, textTransform: "uppercase", textAlign: "center", letterSpacing: "0.04em", width: "100%", boxSizing: "border-box" }}>
                      {lbl!.split(" ")[0]}
                    </div>
                    {shift.post?.name && (
                      <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", fontWeight: 600 }}>
                        {shift.post.name}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 500, opacity: isPast ? 0.5 : 0.8 }}>Off</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ UPCOMING SHIFT CARDS ═════════════════════════════════════════════ */}
      {upcomingShifts.length > 0 && (
        <div>
          <h2 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowRight size={14} color="var(--color-accent)" /> Upcoming Shifts
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {upcomingShifts.map(shift => {
              const st = statusConfig(shift.status);
              const lbl = shiftLabel(shift.startTime, shift.endTime || shift.startTime);
              return (
                <div
                  key={shift.id}
                  style={{ ...card, border: `1px solid ${st.border}`, background: `linear-gradient(140deg, ${st.bg} 0%, var(--color-card-bg) 60%)`, cursor: "pointer", transition: "transform var(--transition-base), box-shadow var(--transition-base)", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.18)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--color-card-shadow)"; }}
                  onClick={() => setSelectedShift(shift)}
                >
                  <div style={{ height: "3px", background: `linear-gradient(90deg, ${st.dot}, transparent)` }} />
                  <div style={{ padding: "20px 20px 16px" }}>
                    {/* date + shift type */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>{fmtDate(shift.startTime)}</div>
                        <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: st.dot }}>{shiftIcon(shift.startTime)}</span> {lbl}
                        </div>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {st.label}
                      </span>
                    </div>

                    {/* details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {shift.site?.name && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                          <MapPin size={13} color="var(--color-text-muted)" /> {shift.site.name}
                        </div>
                      )}
                      {shift.post?.name && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: st.color, fontWeight: 700 }}>
                          <Shield size={13} color={st.dot} /> Post: {shift.post.name}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 700 }}>
                        <Clock size={13} color="var(--color-accent)" /> {fmt12(shift.startTime)} – {shift.endTime ? fmt12(shift.endTime) : "—"}
                      </div>
                    </div>

                    {/* footer action */}
                    <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedShift(shift); }}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", cursor: "pointer", transition: "all var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = st.dot; e.currentTarget.style.color = st.color; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ SHIFT HISTORY ════════════════════════════════════════════════════ */}
      {completedShifts.length > 0 && (
        <div style={{ ...card }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <History size={16} color="var(--color-text-muted)" />
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Shift History</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  {["Date", "Site", "Post", "Time", "Duration", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", fontSize: "10px", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedShifts.map((s, i) => {
                  const st = statusConfig(s.status);
                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: i < completedShifts.length - 1 ? "1px solid var(--color-border)" : "none", cursor: "pointer", transition: "background var(--transition-fast)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg-subtle)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => setSelectedShift(s)}
                    >
                      <td style={{ padding: "14px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>{fmtDate(s.startTime)}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{s.site?.name || "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{s.post?.name || "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {fmt12(s.startTime)} – {s.endTime ? fmt12(s.endTime) : "—"}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        {s.endTime ? calcDuration(s.startTime, s.endTime) : "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {st.label}
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

      {/* ══ EMPTY STATE (no shifts at all) ═══════════════════════════════════ */}
      {myShifts.length === 0 && (
        <div style={{ ...card, padding: "60px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--color-accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={28} color="var(--color-accent)" />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>No Shifts Assigned Yet</h3>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", margin: 0, textAlign: "center", maxWidth: "360px", lineHeight: 1.6 }}>
            Your site manager hasn't assigned any shifts to you yet. Check back soon or contact your supervisor.
          </p>
        </div>
      )}

      {/* ══ SHIFT DETAIL MODAL ═══════════════════════════════════════════════ */}
      {selectedShift && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,15,25,0.65)", backdropFilter: "blur(12px)" }} onClick={() => setSelectedShift(null)} />
          <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "460px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "0 24px 64px rgba(0,0,0,0.45)", overflow: "hidden" }}>
            {/* modal top bar */}
            <div style={{ height: "4px", background: `linear-gradient(90deg, ${statusConfig(selectedShift.status).dot}, transparent)` }} />
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Shift Details</div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: statusConfig(selectedShift.status).dot }}>{shiftIcon(selectedShift.startTime)}</span>
                  {shiftLabel(selectedShift.startTime, selectedShift.endTime || selectedShift.startTime)}
                </h2>
              </div>
              <button
                onClick={() => setSelectedShift(null)}
                style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* status badge */}
              <span style={{ alignSelf: "flex-start", padding: "5px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", background: statusConfig(selectedShift.status).bg, color: statusConfig(selectedShift.status).color, border: `1px solid ${statusConfig(selectedShift.status).border}` }}>
                {statusConfig(selectedShift.status).label}
              </span>

              {/* detail rows */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
                {[
                  { label: "Date", value: fmtDate(selectedShift.startTime), icon: <Calendar size={13} /> },
                  { label: "Shift Hours", value: `${fmt12(selectedShift.startTime)} – ${selectedShift.endTime ? fmt12(selectedShift.endTime) : "—"}`, icon: <Clock size={13} /> },
                  { label: "Site", value: selectedShift.site?.name || "—", icon: <MapPin size={13} /> },
                  { label: "Post", value: selectedShift.post?.name || "—", icon: <Shield size={13} /> },
                  ...(selectedShift.actualStartTime ? [{ label: "Clocked In", value: fmt12(selectedShift.actualStartTime), icon: <LogIn size={13} /> }] : []),
                  ...(selectedShift.actualEndTime ? [{ label: "Clocked Out", value: fmt12(selectedShift.actualEndTime), icon: <LogOut size={13} /> }] : []),
                  ...(selectedShift.endTime ? [{ label: "Duration", value: calcDuration(selectedShift.startTime, selectedShift.endTime), icon: <Clock size={13} /> }] : []),
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "var(--color-accent)" }}>{icon}</span> {label}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* clock-in action if scheduled */}
              {selectedShift.status === "SCHEDULED" && !activeShift && (
                <button
                  onClick={() => { handleClockIn(selectedShift.id); setSelectedShift(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", background: "#22c55e", border: "none", borderRadius: "var(--radius-md)", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 16px rgba(34,197,94,0.3)", transition: "opacity var(--transition-fast)" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <LogIn size={18} /> Clock In to This Shift
                </button>
              )}
              {selectedShift.status === "IN_PROGRESS" && (
                <button
                  onClick={() => { handleClockOut(); setSelectedShift(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontWeight: 700, fontSize: "15px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                >
                  <LogOut size={18} /> Check Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ VISITOR MODAL ════════════════════════════════════════════════════ */}
      {showVisitorModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,15,25,0.6)", backdropFilter: "blur(12px)" }} onClick={() => setShowVisitorModal(false)} />
          <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "440px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Log Visitor</h2>
              <button onClick={() => setShowVisitorModal(false)} style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", padding: "6px 10px", borderRadius: "var(--radius-sm)", display: "flex" }}><X size={16} /></button>
            </div>
            <form onSubmit={submitVisitor} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={labelStyle}>Full Name *</label><input required value={visitorForm.name} onChange={e => setVisitorForm({ ...visitorForm, name: e.target.value })} style={inputStyle} placeholder="John Doe" /></div>
              <div><label style={labelStyle}>ID Number</label><input value={visitorForm.idNumber} onChange={e => setVisitorForm({ ...visitorForm, idNumber: e.target.value })} style={inputStyle} placeholder="Optional" /></div>
              <div><label style={labelStyle}>Vehicle Registration</label><input value={visitorForm.vehicleReg} onChange={e => setVisitorForm({ ...visitorForm, vehicleReg: e.target.value })} style={inputStyle} placeholder="ABC 123 GP" /></div>
              <div><label style={labelStyle}>Purpose of Visit</label><input value={visitorForm.purpose} onChange={e => setVisitorForm({ ...visitorForm, purpose: e.target.value })} style={inputStyle} placeholder="Site inspection" /></div>
              <button type="submit" style={{ width: "100%", background: "var(--color-accent)", color: "#0b0f19", fontWeight: 700, padding: "13px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontSize: "14px", marginTop: "4px", boxShadow: "0 4px 12px rgba(245,158,11,0.25)" }}>Log Visitor IN</button>
            </form>
          </div>
        </div>
      )}

      {/* ══ INCIDENT MODAL ════════════════════════════════════════════════════ */}
      {showIncidentModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,15,25,0.6)", backdropFilter: "blur(12px)" }} onClick={() => setShowIncidentModal(false)} />
          <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "440px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Report Incident</h2>
              <button onClick={() => setShowIncidentModal(false)} style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", padding: "6px 10px", borderRadius: "var(--radius-sm)", display: "flex" }}><X size={16} /></button>
            </div>
            <form onSubmit={submitIncident} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={labelStyle}>Title *</label><input required value={incidentForm.title} onChange={e => setIncidentForm({ ...incidentForm, title: e.target.value })} style={inputStyle} placeholder="Suspicious movement near fence" /></div>
              <div>
                <label style={labelStyle}>Severity</label>
                <select value={incidentForm.severity} onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="LOW" style={{ background: "var(--color-card-bg)" }}>Low — Routine</option>
                  <option value="MEDIUM" style={{ background: "var(--color-card-bg)" }}>Medium — Monitor</option>
                  <option value="HIGH" style={{ background: "var(--color-card-bg)" }}>High — Immediate Action</option>
                  <option value="CRITICAL" style={{ background: "var(--color-card-bg)" }}>Critical — Emergency</option>
                </select>
              </div>
              <div><label style={labelStyle}>Description *</label><textarea required value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} style={{ ...inputStyle, height: "96px", resize: "none" }} placeholder="Provide detailed description..." /></div>
              <button type="submit" style={{ width: "100%", background: "#ef4444", color: "#fff", fontWeight: 700, padding: "13px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontSize: "14px", marginTop: "4px", boxShadow: "0 4px 12px rgba(239,68,68,0.25)" }}>Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
