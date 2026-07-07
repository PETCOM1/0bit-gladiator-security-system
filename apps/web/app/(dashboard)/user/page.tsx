"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn, LogOut, Clock, Calendar, MapPin, CheckCircle2,
  ChevronLeft, ChevronRight, Shield, PlusCircle, ShieldAlert,
  X, Eye, ArrowRight, Sunrise, Moon, Sun, Sunset,
} from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
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

const shiftIcon = (startTime: string) => {
  const h = new Date(startTime).getHours();
  if (h >= 5 && h < 12) return <Sunrise size={14} />;
  if (h >= 12 && h < 17) return <Sun size={14} />;
  if (h >= 17 && h < 21) return <Sunset size={14} />;
  return <Moon size={14} />;
};

const shiftLabel = (startTime: string, endTime: string) => {
  const sh = new Date(startTime).getHours();
  const eh = endTime ? new Date(endTime).getHours() : 0;
  if (sh === 6 && eh === 18) return "DAY SHIFT";
  if (sh >= 18 || (sh >= 18 && eh <= 8)) return "NIGHT SHIFT";
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

const isFutureShift = (startTime: string) => {
  const earlyThreshold = Date.now() + 15 * 60 * 1000;
  return new Date(startTime).getTime() > earlyThreshold;
};

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── main component ──────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterWeekStart, setRosterWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [visitorForm, setVisitorForm] = useState({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
  const [incidentForm, setIncidentForm] = useState({ title: "", description: "", severity: "LOW" });

  const loadData = async () => {
    try {
      const shiftsRes = await managerService.getTenantShifts();
      const all: any[] = (shiftsRes.data?.data?.shifts || []).filter(
        (s: any) => s.userId === user?.id
      );
      setMyShifts(all);
      const inProg = all.find((s) => s.status === "IN_PROGRESS");
      if (inProg) setActiveShift(inProg);
    } catch (err) {
      console.error("Failed to load shifts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // ─── derived ───────────────────────────────────────────────────────────────
  const firstName =
    user?.firstName ||
    user?.displayName?.split(" ")[0] ||
    "Officer";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayShift = myShifts.find((s) => {
    const d = new Date(s.startTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const upcomingShifts = myShifts
    .filter((s) => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime() > today.getTime() && s.status === "SCHEDULED";
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  const getShiftForWeekDay = (dayIndex: number) => {
    const d = new Date(rosterWeekStart);
    d.setDate(d.getDate() + dayIndex);
    return myShifts.find((s) => {
      const sd = new Date(s.startTime);
      return sd.toDateString() === d.toDateString();
    });
  };

  // ─── handlers ─────────────────────────────────────────────────────────────
  const handleClockIn = async (shiftId?: string) => {
    try {
      const res = await guardService.startShift(shiftId);
      setActiveShift(res.data.data.shift);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    try {
      await guardService.endShift(activeShift.id);
      setActiveShift(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const submitVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.logVisitor(visitorForm);
      setShowVisitorModal(false);
      setVisitorForm({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.reportIncident(incidentForm);
      setShowIncidentModal(false);
      setIncidentForm({ title: "", description: "", severity: "LOW" });
    } catch (err) {
      console.error(err);
    }
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
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

      {/* ══ CURRENT ASSIGNMENT (in progress only) ════════════════════════════ */}
      {activeShift && (
        <div style={{ ...card, border: "1px solid rgba(34,197,94,0.4)", background: "linear-gradient(135deg,rgba(34,197,94,0.08) 0%,var(--color-card-bg) 60%)", position: "relative" }}>
          <div style={{ height: "3px", background: "linear-gradient(90deg,#22c55e,#16a34a)", position: "absolute", top: 0, left: 0, right: 0 }} />
          <div style={{ padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e" }} />
                <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e" }}>
                  Current Assignment — On Duty
                </span>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "180px" }}>
              <button onClick={() => setShowVisitorModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", color: "#0b0f19", fontWeight: 700, fontSize: "13.5px", cursor: "pointer" }}>
                <PlusCircle size={16} /> Log Visitor
              </button>
              <button onClick={() => setShowIncidentModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontWeight: 700, fontSize: "13.5px", cursor: "pointer" }}>
                <ShieldAlert size={16} /> Report Incident
              </button>
              <button onClick={handleClockOut}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "13.5px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                <LogOut size={16} /> Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TODAY'S SHIFT ════════════════════════════════════════════════════ */}
      <div>
        <h2 style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--color-text-muted)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={13} color="var(--color-accent)" /> Today's Shift
        </h2>
        {todayShift ? (() => {
          const st = statusConfig(todayShift.status);
          const lbl = shiftLabel(todayShift.startTime, todayShift.endTime);
          return (
            <div style={{ ...card, border: `1px solid ${st.border}`, background: `linear-gradient(135deg,${st.bg} 0%,var(--color-card-bg) 70%)`, position: "relative" }}>
              <div style={{ height: "3px", background: `linear-gradient(90deg,${st.dot},transparent)` }} />
              <div style={{ padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", flex: "1 1 300px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "var(--radius-xl)", background: st.bg, border: `2px solid ${st.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", flexShrink: 0 }}>
                    <span style={{ color: st.dot, display: "flex" }}>{shiftIcon(todayShift.startTime)}</span>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: st.color, textTransform: "uppercase", textAlign: "center", lineHeight: 1 }}>{lbl.split(" ")[0]}</span>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                          <MapPin size={13} color="var(--color-text-muted)" /> {todayShift.site.name}
                        </div>
                      )}
                      {todayShift.post?.name && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: st.color, fontWeight: 700 }}>
                          <Shield size={13} color={st.dot} /> Post: {todayShift.post.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {todayShift.status === "SCHEDULED" && !activeShift && (
                    <button 
                      onClick={() => {
                        if (isFutureShift(todayShift.startTime)) {
                          alert("Cannot clock in to a future shift. You can only clock in up to 15 minutes before the shift starts.");
                          return;
                        }
                        handleClockIn(todayShift.id);
                      }}
                      disabled={isFutureShift(todayShift.startTime)}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        padding: "12px 20px", 
                        background: isFutureShift(todayShift.startTime) ? "var(--color-bg-subtle)" : "#22c55e", 
                        border: isFutureShift(todayShift.startTime) ? "1px solid var(--color-border)" : "none", 
                        borderRadius: "var(--radius-md)", 
                        color: isFutureShift(todayShift.startTime) ? "var(--color-text-muted)" : "#fff", 
                        fontWeight: 700, 
                        fontSize: "14px", 
                        cursor: isFutureShift(todayShift.startTime) ? "not-allowed" : "pointer", 
                        boxShadow: isFutureShift(todayShift.startTime) ? "none" : "0 4px 16px rgba(34,197,94,0.35)" 
                      }}
                    >
                      <LogIn size={16} /> {isFutureShift(todayShift.startTime) ? "Clock In (Locked)" : "Clock In"}
                    </button>
                  )}
                  <button onClick={() => router.push(`/user/shifts?id=${todayShift.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                    <Eye size={16} /> View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })() : (
          <div style={{ ...card, padding: "36px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", background: "var(--color-bg-subtle)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-card-bg)", border: "1px dashed var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={20} color="var(--color-text-muted)" />
            </div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>No Shift Today</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>Enjoy your rest day. Check upcoming shifts below.</p>
          </div>
        )}
      </div>

      {/* ══ WEEKLY SCHEDULE STRIP ════════════════════════════════════════════ */}
      <div style={{ ...card }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--color-text-muted)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={13} color="var(--color-accent)" /> Weekly Schedule
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              {rosterWeekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
              {(() => { const d = new Date(rosterWeekStart); d.setDate(d.getDate() + 6); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); })()}
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
            const lbl = shift ? shiftLabel(shift.startTime, shift.endTime) : null;
            return (
              <div key={di}
                onClick={() => shift && router.push(`/user/shifts?id=${shift.id}`)}
                style={{ borderRight: di < 6 ? "1px solid var(--color-border)" : "none", padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: shift ? "pointer" : "default", background: isToday ? "var(--color-accent-subtle)" : "transparent", transition: "background var(--transition-fast)", minHeight: "120px", borderTop: isToday ? "3px solid var(--color-accent)" : "3px solid transparent" }}
                onMouseEnter={e => { if (shift) e.currentTarget.style.background = isToday ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? "var(--color-accent-subtle)" : "transparent"; }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}>{day}</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1, color: isToday ? "var(--color-accent)" : isPast ? "var(--color-text-muted)" : "var(--color-text-primary)", marginTop: "2px" }}>{dayDate.getDate()}</div>
                </div>
                {shift ? (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ padding: "4px 6px", borderRadius: "6px", background: st!.bg, border: `1px solid ${st!.border}`, fontSize: "9px", fontWeight: 800, color: st!.color, textTransform: "uppercase", textAlign: "center", letterSpacing: "0.04em", width: "100%", boxSizing: "border-box" }}>
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

      {/* ══ UPCOMING SHIFTS (cards) ═══════════════════════════════════════════ */}
      {upcomingShifts.length > 0 && (
        <div>
          <h2 style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--color-text-muted)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowRight size={13} color="var(--color-accent)" /> Upcoming Shifts
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {upcomingShifts.map(shift => {
              const st = statusConfig(shift.status);
              const lbl = shiftLabel(shift.startTime, shift.endTime);
              return (
                <div key={shift.id}
                  style={{ border: `1px solid ${st.border}`, borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", background: `linear-gradient(140deg,${st.bg} 0%,var(--color-card-bg) 60%)`, cursor: "pointer", transition: "transform var(--transition-base), box-shadow var(--transition-base)", overflow: "hidden" } as any}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.18)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--color-card-shadow)"; }}
                  onClick={() => router.push(`/user/shifts?id=${shift.id}`)}
                >
                  <div style={{ height: "3px", background: `linear-gradient(90deg,${st.dot},transparent)` }} />
                  <div style={{ padding: "20px 20px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>{fmtDate(shift.startTime)}</div>
                        <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: st.dot }}>{shiftIcon(shift.startTime)}</span> {lbl}
                        </div>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {shift.site?.name && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
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
                    <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/user/shifts?id=${shift.id}`); }}
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

      {/* ══ EMPTY STATE ═══════════════════════════════════════════════════════ */}
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

      {/* ══ VISITOR MODAL ════════════════════════════════════════════════════ */}
      {showVisitorModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,15,25,0.6)", backdropFilter: "blur(12px)" }} onClick={() => setShowVisitorModal(false)} />
          <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "440px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Log Visitor</h2>
              <button onClick={() => setShowVisitorModal(false)} style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", padding: "6px 10px", borderRadius: "var(--radius-sm)", display: "flex" }}><X size={16} /></button>
            </div>
            <form onSubmit={submitVisitor} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={labelStyle}>Full Name *</label><input required value={visitorForm.name} onChange={e => setVisitorForm({ ...visitorForm, name: e.target.value })} style={inputStyle} placeholder="John Doe" /></div>
              <div><label style={labelStyle}>ID Number</label><input value={visitorForm.idNumber} onChange={e => setVisitorForm({ ...visitorForm, idNumber: e.target.value })} style={inputStyle} placeholder="Optional" /></div>
              <div><label style={labelStyle}>Vehicle Registration</label><input value={visitorForm.vehicleReg} onChange={e => setVisitorForm({ ...visitorForm, vehicleReg: e.target.value })} style={inputStyle} placeholder="ABC 123 GP" /></div>
              <div><label style={labelStyle}>Purpose of Visit</label><input value={visitorForm.purpose} onChange={e => setVisitorForm({ ...visitorForm, purpose: e.target.value })} style={inputStyle} placeholder="Site inspection" /></div>
              <button type="submit" style={{ width: "100%", background: "var(--color-accent)", color: "#0b0f19", fontWeight: 700, padding: "13px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontSize: "14px" }}>Log Visitor IN</button>
            </form>
          </div>
        </div>
      )}

      {/* ══ INCIDENT MODAL ════════════════════════════════════════════════════ */}
      {showIncidentModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,15,25,0.6)", backdropFilter: "blur(12px)" }} onClick={() => setShowIncidentModal(false)} />
          <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "440px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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
              <button type="submit" style={{ width: "100%", background: "#ef4444", color: "#fff", fontWeight: 700, padding: "13px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", fontSize: "14px" }}>Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
