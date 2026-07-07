"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar, MapPin, Clock, Shield, CheckCircle2, LogIn, LogOut,
  History, ArrowRight, Eye, X, Sunrise, Moon, Sun, Sunset,
  ChevronLeft, ChevronRight,
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
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const calcDuration = (start: string, end: string) => {
  const hrs = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  return `${Math.abs(hrs).toFixed(0)} hrs`;
};

const shiftIcon = (startTime: string) => {
  const h = new Date(startTime).getHours();
  if (h >= 5 && h < 12) return <Sunrise size={16} />;
  if (h >= 12 && h < 17) return <Sun size={16} />;
  if (h >= 17 && h < 21) return <Sunset size={16} />;
  return <Moon size={16} />;
};

const shiftLabel = (startTime: string, endTime?: string) => {
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
    case "IN_PROGRESS":  return { label: "In Progress",  dot: "#22c55e", bg: "rgba(34,197,94,0.12)",   color: "#22c55e", border: "rgba(34,197,94,0.3)" };
    case "COMPLETED":    return { label: "Completed",    dot: "#64748b", bg: "rgba(100,116,139,0.12)", color: "#64748b", border: "rgba(100,116,139,0.3)" };
    case "SCHEDULED":    return { label: "Scheduled",    dot: "#3b82f6", bg: "rgba(59,130,246,0.12)",  color: "#3b82f6", border: "rgba(59,130,246,0.3)" };
    default:             return { label: status,         dot: "#94a3b8", bg: "var(--color-bg-subtle)", color: "#94a3b8", border: "var(--color-border)" };
  }
};

const isFutureShift = (startTime: string) => {
  const earlyThreshold = Date.now() + 15 * 60 * 1000;
  return new Date(startTime).getTime() > earlyThreshold;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── component ───────────────────────────────────────────────────────────────
function MyShiftsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const shiftId = searchParams.get("id");

  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [rosterWeekStart, setRosterWeekStart] = useState<Date>(() => getMonday(new Date()));

  const loadData = async () => {
    try {
      const res = await managerService.getTenantShifts();
      const all: any[] = (res.data?.data?.shifts || []).filter((s: any) => s.userId === user?.id);
      setMyShifts(all);
      const inProg = all.find((s) => s.status === "IN_PROGRESS");
      if (inProg) setActiveShift(inProg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (myShifts.length > 0 && shiftId) {
      const found = myShifts.find((s) => s.id === shiftId);
      if (found) {
        setSelectedShift(found);
      }
    }
  }, [myShifts, shiftId]);

  const handleClockIn = async (shiftId?: string) => {
    try {
      const res = await guardService.startShift(shiftId);
      setActiveShift(res.data.data.shift);
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

  // ─── derived data ─────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const upcomingShifts = myShifts
    .filter((s) => { const d = new Date(s.startTime); d.setHours(0,0,0,0); return d.getTime() >= today.getTime() && s.status !== "COMPLETED"; })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const completedShifts = myShifts
    .filter((s) => s.status === "COMPLETED" || s.status === "IN_PROGRESS")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const getShiftForWeekDay = (dayIndex: number) => {
    const d = new Date(rosterWeekStart);
    d.setDate(d.getDate() + dayIndex);
    return myShifts.find((s) => new Date(s.startTime).toDateString() === d.toDateString());
  };

  // ─── styles ───────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "var(--color-card-bg)",
    border: "1px solid var(--color-card-border)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--color-card-shadow)",
    overflow: "hidden",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
    letterSpacing: "0.1em", color: "var(--color-text-muted)",
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px",
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "12px", color: "var(--color-text-muted)" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span>Loading your shifts...</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

      {/* ── PAGE TITLE ──────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
          <Calendar size={26} color="var(--color-accent)" /> My Assigned Shifts
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "6px" }}>
          Your complete shift schedule — upcoming assignments, weekly view, and full history.
        </p>
      </div>

      {/* ── STAT SUMMARY ROW ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
        {[
          { label: "Total Shifts",   value: myShifts.length,       color: "var(--color-accent)",   bg: "var(--color-accent-subtle)",   icon: <Calendar size={18} /> },
          { label: "Upcoming",       value: upcomingShifts.length,  color: "#3b82f6",               bg: "rgba(59,130,246,0.12)",        icon: <ArrowRight size={18} /> },
          { label: "Completed",      value: completedShifts.filter(s => s.status === "COMPLETED").length, color: "var(--color-success)",  bg: "var(--color-success-subtle)",  icon: <CheckCircle2 size={18} /> },
          ...(activeShift ? [{ label: "On Duty Now", value: "●", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: <Shield size={18} /> }] : []),
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{ ...card, padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-md)", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px", fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── WEEKLY SCHEDULE ─────────────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}><Calendar size={13} color="var(--color-accent)" /> Weekly Schedule</div>
        <div style={{ ...card }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
              {rosterWeekStart.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} –{" "}
              {(() => { const d = new Date(rosterWeekStart); d.setDate(d.getDate() + 6); return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); })()}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button onClick={() => setRosterWeekStart(p => { const d = new Date(p); d.setDate(d.getDate() - 7); return d; })}
                style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setRosterWeekStart(getMonday(new Date()))}
                style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)" }}>
                This Week
              </button>
              <button onClick={() => setRosterWeekStart(p => { const d = new Date(p); d.setDate(d.getDate() + 7); return d; })}
                style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {DAYS.map((day, di) => {
              const dayDate = new Date(rosterWeekStart);
              dayDate.setDate(dayDate.getDate() + di);
              const shift = getShiftForWeekDay(di);
              const isToday = dayDate.toDateString() === new Date().toDateString();
              const isPast = dayDate < new Date(new Date().setHours(0,0,0,0));
              const st = shift ? statusConfig(shift.status) : null;
              const lbl = shift ? shiftLabel(shift.startTime, shift.endTime) : null;
              return (
                <div key={di}
                  onClick={() => shift && setSelectedShift(shift)}
                  style={{ borderRight: di < 6 ? "1px solid var(--color-border)" : "none", padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: shift ? "pointer" : "default", background: isToday ? "var(--color-accent-subtle)" : "transparent", transition: "background var(--transition-fast)", minHeight: "140px", borderTop: isToday ? "3px solid var(--color-accent)" : "3px solid transparent" }}
                  onMouseEnter={e => { if (shift) e.currentTarget.style.background = isToday ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isToday ? "var(--color-accent-subtle)" : "transparent"; }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}>{day}</div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: isToday ? "var(--color-accent)" : isPast ? "var(--color-text-muted)" : "var(--color-text-primary)", lineHeight: 1, marginTop: "2px" }}>{dayDate.getDate()}</div>
                  </div>
                  {shift ? (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                      <div style={{ color: st!.dot, display: "flex" }}>{shiftIcon(shift.startTime)}</div>
                      <div style={{ padding: "4px 6px", borderRadius: "6px", background: st!.bg, border: `1px solid ${st!.border}`, fontSize: "9px", fontWeight: 800, color: st!.color, textTransform: "uppercase", textAlign: "center", letterSpacing: "0.04em", width: "100%", boxSizing: "border-box" }}>
                        {lbl!.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)", textAlign: "center" }}>
                        {fmt12(shift.startTime).replace(":00","").replace(" ","")}<br />
                        <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>{shift.endTime ? fmt12(shift.endTime).replace(":00","").replace(" ","") : "—"}</span>
                      </div>
                      {shift.post?.name && (
                        <div style={{ fontSize: "9px", color: st!.color, fontWeight: 700, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", background: st!.bg, padding: "2px 4px", borderRadius: "4px", boxSizing: "border-box" }}>
                          {shift.post.name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500, opacity: isPast ? 0.4 : 0.7 }}>Off</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── UPCOMING SHIFTS (detailed cards) ────────────────────────────────── */}
      <div>
        <div style={sectionLabel}><ArrowRight size={13} color="var(--color-accent)" /> Upcoming Shifts ({upcomingShifts.length})</div>
        {upcomingShifts.length === 0 ? (
          <div style={{ ...card, padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>
            No upcoming shifts scheduled.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {upcomingShifts.map(shift => {
              const st = statusConfig(shift.status);
              const lbl = shiftLabel(shift.startTime, shift.endTime);
              const isInProgress = shift.status === "IN_PROGRESS";
              return (
                <div key={shift.id} style={{ ...card, border: `1px solid ${st.border}`, background: `linear-gradient(135deg,${st.bg} 0%,var(--color-card-bg) 55%)`, position: "relative" }}>
                  <div style={{ height: "3px", background: `linear-gradient(90deg,${st.dot},transparent)` }} />
                  <div style={{ padding: "22px 24px", display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>

                    {/* Left: shift type icon */}
                    <div style={{ width: "58px", height: "58px", borderRadius: "var(--radius-xl)", background: st.bg, border: `2px solid ${st.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", flexShrink: 0 }}>
                      <span style={{ color: st.dot }}>{shiftIcon(shift.startTime)}</span>
                      <span style={{ fontSize: "8px", fontWeight: 800, color: st.color, textTransform: "uppercase", textAlign: "center", lineHeight: 1 }}>{lbl.split(" ")[0]}</span>
                    </div>

                    {/* Middle: details */}
                    <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>{lbl}</span>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {st.label}
                        </span>
                        {isInProgress && <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>● LIVE</span>}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>{fmtDate(shift.startTime)}</div>

                      {/* detail grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px 20px", marginTop: "8px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={10} color="var(--color-accent)" /> Shift Hours</span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                            {fmt12(shift.startTime)} – {shift.endTime ? fmt12(shift.endTime) : "—"}
                          </span>
                          {shift.endTime && (
                            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{calcDuration(shift.startTime, shift.endTime)}</span>
                          )}
                        </div>
                        {shift.site?.name && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={10} color="var(--color-accent)" /> Site</span>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{shift.site.name}</span>
                          </div>
                        )}
                        {shift.post?.name && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "4px" }}><Shield size={10} color={st.dot} /> Post</span>
                            <span style={{ fontSize: "14px", fontWeight: 800, color: st.color }}>{shift.post.name}</span>
                          </div>
                        )}
                        {shift.actualStartTime && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "4px" }}><LogIn size={10} color="#22c55e" /> Clocked In</span>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#22c55e" }}>{fmt12(shift.actualStartTime)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "160px" }}>
                      {shift.status === "SCHEDULED" && !activeShift && (
                        <button 
                          onClick={() => {
                            if (isFutureShift(shift.startTime)) {
                              alert("Cannot clock in to a future shift. You can only clock in up to 15 minutes before the shift starts.");
                              return;
                            }
                            handleClockIn(shift.id);
                          }}
                          disabled={isFutureShift(shift.startTime)}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            gap: "8px", 
                            padding: "11px 16px", 
                            background: isFutureShift(shift.startTime) ? "var(--color-bg-subtle)" : "#22c55e", 
                            border: isFutureShift(shift.startTime) ? "1px solid var(--color-border)" : "none", 
                            borderRadius: "var(--radius-md)", 
                            color: isFutureShift(shift.startTime) ? "var(--color-text-muted)" : "#fff", 
                            fontWeight: 700, 
                            fontSize: "13px", 
                            cursor: isFutureShift(shift.startTime) ? "not-allowed" : "pointer", 
                            boxShadow: isFutureShift(shift.startTime) ? "none" : "0 4px 12px rgba(34,197,94,0.3)", 
                            opacity: isFutureShift(shift.startTime) ? 0.7 : 1 
                          }}
                        >
                          <LogIn size={15} /> {isFutureShift(shift.startTime) ? "Clock In (Locked)" : "Clock In"}
                        </button>
                      )}
                      {shift.status === "IN_PROGRESS" && (
                        <button onClick={() => handleClockOut()}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}>
                          <LogOut size={15} /> Check Out
                        </button>
                      )}
                      <button onClick={() => setSelectedShift(shift)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px 16px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all var(--transition-fast)" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = st.dot; e.currentTarget.style.color = st.color; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                        <Eye size={15} /> Full Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SHIFT HISTORY ───────────────────────────────────────────────────── */}
      <div>
        <div style={sectionLabel}><History size={13} color="var(--color-text-muted)" /> Shift History ({completedShifts.length})</div>
        {completedShifts.length === 0 ? (
          <div style={{ ...card, padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>
            No completed shifts yet.
          </div>
        ) : (
          <div style={{ ...card }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                    {["Date", "Shift Type", "Site", "Post", "Scheduled", "Clocked In", "Duration", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 18px", fontSize: "10px", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {completedShifts.map((s, i) => {
                    const st = statusConfig(s.status);
                    const lbl = shiftLabel(s.startTime, s.endTime);
                    return (
                      <tr key={s.id}
                        style={{ borderBottom: i < completedShifts.length - 1 ? "1px solid var(--color-border)" : "none", cursor: "pointer", transition: "background var(--transition-fast)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg-subtle)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        onClick={() => setSelectedShift(s)}
                      >
                        <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--color-text-primary)", fontSize: "13px", whiteSpace: "nowrap" }}>
                          {fmtDateShort(s.startTime)}
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                            <span style={{ color: st.dot }}>{shiftIcon(s.startTime)}</span> {lbl}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{s.site?.name || "—"}</td>
                        <td style={{ padding: "14px 18px", fontSize: "13px", fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>{s.post?.name || "—"}</td>
                        <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {fmt12(s.startTime)} – {s.endTime ? fmt12(s.endTime) : "—"}
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: "13px", color: "#22c55e", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {s.actualStartTime ? fmt12(s.actualStartTime) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                          {s.status === "IN_PROGRESS"
                            ? `${calcDuration(s.actualStartTime || s.startTime, new Date().toISOString())} (elapsed)`
                            : s.endTime ? calcDuration(s.startTime, s.endTime) : "—"}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
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
      </div>

      {/* ── SHIFT DETAIL MODAL ──────────────────────────────────────────────── */}
      {selectedShift && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,15,25,0.65)", backdropFilter: "blur(12px)" }} onClick={() => setSelectedShift(null)} />
          <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "480px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "0 24px 64px rgba(0,0,0,0.45)", overflow: "hidden" }}>
            <div style={{ height: "4px", background: `linear-gradient(90deg,${statusConfig(selectedShift.status).dot},transparent)` }} />
            <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Shift Details</div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: statusConfig(selectedShift.status).dot }}>{shiftIcon(selectedShift.startTime)}</span>
                  {shiftLabel(selectedShift.startTime, selectedShift.endTime)}
                </h2>
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>{fmtDate(selectedShift.startTime)}</p>
              </div>
              <button onClick={() => setSelectedShift(null)}
                style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ alignSelf: "flex-start", padding: "5px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", background: statusConfig(selectedShift.status).bg, color: statusConfig(selectedShift.status).color, border: `1px solid ${statusConfig(selectedShift.status).border}` }}>
                {statusConfig(selectedShift.status).label}
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
                {[
                  { label: "Shift Type",    value: shiftLabel(selectedShift.startTime, selectedShift.endTime), icon: <Calendar size={12} /> },
                  { label: "Date",          value: fmtDateShort(selectedShift.startTime), icon: <Calendar size={12} /> },
                  { label: "Shift Hours",   value: `${fmt12(selectedShift.startTime)} – ${selectedShift.endTime ? fmt12(selectedShift.endTime) : "—"}`, icon: <Clock size={12} /> },
                  { label: "Duration",      value: selectedShift.endTime ? calcDuration(selectedShift.startTime, selectedShift.endTime) : "—", icon: <Clock size={12} /> },
                  { label: "Site",          value: selectedShift.site?.name || "—", icon: <MapPin size={12} /> },
                  { label: "Post",          value: selectedShift.post?.name || "—", icon: <Shield size={12} /> },
                  ...(selectedShift.actualStartTime ? [{ label: "Clocked In",  value: fmt12(selectedShift.actualStartTime), icon: <LogIn size={12} /> }] : []),
                  ...(selectedShift.actualEndTime   ? [{ label: "Clocked Out", value: fmt12(selectedShift.actualEndTime),   icon: <LogOut size={12} /> }] : []),
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "var(--color-accent)" }}>{icon}</span> {label}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</div>
                  </div>
                ))}
              </div>
              {selectedShift.status === "SCHEDULED" && !activeShift && (
                <button 
                  onClick={() => {
                    if (isFutureShift(selectedShift.startTime)) {
                      alert("Cannot clock in to a future shift. You can only clock in up to 15 minutes before the shift starts.");
                      return;
                    }
                    handleClockIn(selectedShift.id); 
                    setSelectedShift(null); 
                  }}
                  disabled={isFutureShift(selectedShift.startTime)}
                  style={{ 
                    width: "100%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "8px", 
                    padding: "14px", 
                    background: isFutureShift(selectedShift.startTime) ? "var(--color-bg-subtle)" : "#22c55e", 
                    border: isFutureShift(selectedShift.startTime) ? "1px solid var(--color-border)" : "none", 
                    borderRadius: "var(--radius-md)", 
                    color: isFutureShift(selectedShift.startTime) ? "var(--color-text-muted)" : "#fff", 
                    fontWeight: 700, 
                    fontSize: "15px", 
                    cursor: isFutureShift(selectedShift.startTime) ? "not-allowed" : "pointer", 
                    boxShadow: isFutureShift(selectedShift.startTime) ? "none" : "0 4px 16px rgba(34,197,94,0.3)" 
                  }}
                >
                  <LogIn size={18} /> {isFutureShift(selectedShift.startTime) ? "Clock In Locked" : "Clock In to This Shift"}
                </button>
              )}
              {selectedShift.status === "IN_PROGRESS" && (
                <button onClick={() => { handleClockOut(); setSelectedShift(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
                  <LogOut size={18} /> Check Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyShiftsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "12px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Loading your shifts...</span>
      </div>
    }>
      <MyShiftsContent />
    </Suspense>
  );
}
