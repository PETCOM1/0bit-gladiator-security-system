"use client";

import React, { useState, useEffect } from "react";
import {
  Users, UserCheck, Shield, Clock, CheckCircle2, ShieldAlert, DoorOpen,
  TrendingUp, AlertTriangle, MapPin, Award, UserX, Timer, Download,
  RefreshCw, BookOpen, LogIn, Activity, ChevronRight,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { exportSiteAnalyticsReport } from "@/shared/utils/pdf";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

const cardStyle: React.CSSProperties = {
  background: "var(--color-card-bg)",
  border: "1px solid var(--color-card-border)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--color-card-shadow)",
  padding: "20px 24px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)",
  display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px",
};

const sectionSubStyle: React.CSSProperties = {
  fontSize: "12.5px", color: "var(--color-text-muted)", marginBottom: "18px",
};

const chartTooltipStyle = { background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--color-card-shadow)" };
const chartTooltipItemStyle = { color: "var(--color-text-primary)", fontSize: "13px", fontWeight: 600 };

function KpiCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div style={{ ...cardStyle, padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-md)", background: tone || "var(--color-accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--color-accent)" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "21px", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", marginTop: "5px", fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

function SectionAnchor({ id, icon, title, subtitle }: { id: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: "90px" }}>
      <div style={sectionTitleStyle}>{icon} {title}</div>
      <div style={sectionSubStyle}>{subtitle}</div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
      <div style={{ fontSize: "20px", fontWeight: 800, color: color || "var(--color-text-primary)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

function MiniTrendChart({ data, dataKey, xKey, color, unit }: { data: any[]; dataKey: string; xKey: string; color: string; unit?: string }) {
  return (
    <div style={{ height: "160px", width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} dy={6} />
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={30} />
          <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} formatter={(v: any) => [`${v}${unit || ""}`, ""]} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyList({ text }: { text: string }) {
  return <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", fontStyle: "italic", padding: "8px 0" }}>{text}</div>;
}

function PersonBadge({ name, meta }: { name: string; meta?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{name}</span>
      {meta && <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)", fontWeight: 600 }}>{meta}</span>}
    </div>
  );
}

const COVERAGE_COLORS: Record<string, { dot: string; bg: string; border: string; label: string }> = {
  full: { dot: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", label: "Fully Covered" },
  minor: { dot: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.3)", label: "Minor Gaps" },
  understaffed: { dot: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", label: "Understaffed" },
  critical: { dot: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", label: "Critical" },
};

const NAV_SECTIONS = [
  { id: "kpis", label: "Overview" },
  { id: "attendance", label: "Attendance" },
  { id: "coverage", label: "Shift Coverage" },
  { id: "posts", label: "Post Performance" },
  { id: "personnel", label: "Personnel" },
  { id: "incidents", label: "Incidents" },
  { id: "visitors", label: "Visitors" },
  { id: "ob", label: "Occurrence Book" },
  { id: "weekly", label: "Weekly Coverage" },
  { id: "alerts", label: "Alerts" },
  { id: "trends", label: "Trends" },
];

export default function SiteManagerAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await managerService.getSiteAnalytics();
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load site analytics:", err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.siteId) loadData(); else setLoading(false); }, [user?.siteId]);

  const handleDownloadPDF = () => {
    if (!data) return;
    exportSiteAnalyticsReport({
      siteName: data.site?.name || "Site",
      generatedDate: new Date(data.generatedAt).toLocaleString(),
      kpis: data.kpis,
      attendance: data.attendance,
      shiftCoverage: data.shiftCoverage,
      postPerformance: data.postPerformance,
      personnelPerformance: data.personnelPerformance,
      incidentAnalytics: data.incidentAnalytics,
      visitorAnalytics: data.visitorAnalytics,
      occurrenceBook: data.occurrenceBook,
      weeklyCoverage: data.weeklyCoverage,
      alerts: data.alerts,
    }, `Site_Analytics_${(data.site?.name || "site").replace(/\s+/g, "_")}.pdf`);
  };

  if (!user?.siteId) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
        You have not been assigned to a site yet. Please contact your administrator.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-danger)" }}>
        {error || "No data available."}
        <div><button onClick={loadData} style={{ marginTop: "12px", padding: "8px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Retry</button></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%", paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Site Analytics</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {data.site?.name} — operational insights, staffing, attendance, and incidents
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleDownloadPDF} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)" }}>
            <Download size={15} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* Section nav */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", position: "sticky", top: "0", zIndex: 10, background: "var(--color-bg)", padding: "8px 0" }}>
        {NAV_SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{ padding: "6px 12px", borderRadius: "999px", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textDecoration: "none", whiteSpace: "nowrap" }}>
            {s.label}
          </a>
        ))}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div id="kpis" style={{ scrollMarginTop: "90px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
          <KpiCard icon={<Users size={18} />} label="Total Personnel" value={data.kpis.totalPersonnel} />
          <KpiCard icon={<UserCheck size={18} />} label="Personnel On Duty" value={data.kpis.personnelOnDuty} />
          <KpiCard icon={<Shield size={18} />} label="Active Posts" value={data.kpis.activePosts} />
          <KpiCard icon={<Clock size={18} />} label="Active Shifts Today" value={data.kpis.activeShiftsToday} />
          <KpiCard icon={<CheckCircle2 size={18} />} label="Attendance Rate" value={data.kpis.attendanceRate !== null ? `${data.kpis.attendanceRate}%` : "—"} />
          <KpiCard icon={<Activity size={18} />} label="Shift Coverage" value={data.kpis.shiftCoverage !== null ? `${data.kpis.shiftCoverage}%` : "—"} />
          <KpiCard icon={<ShieldAlert size={18} />} label="Open Incidents" value={data.kpis.openIncidents} tone={data.kpis.openIncidents > 0 ? "var(--color-danger-subtle)" : undefined} />
          <KpiCard icon={<DoorOpen size={18} />} label="Visitors On Site" value={data.kpis.visitorsOnSite} />
        </div>
      </div>

      {/* ── Attendance Analytics ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="attendance" icon={<UserCheck size={16} color="var(--color-accent)" />} title="Attendance Analytics" subtitle="Workforce attendance trends and check-in reliability" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <StatTile label="On-Time Check-ins" value={data.attendance.onTimeCheckIns} color="#22c55e" />
          <StatTile label="Late Arrivals" value={data.attendance.lateArrivals} color="#f59e0b" />
          <StatTile label="Missed Check-ins" value={data.attendance.missedCheckIns} color="#ef4444" />
          <StatTile label="Missed Check-outs" value={data.attendance.missedCheckOuts} color="#ef4444" />
          <StatTile label="Attendance %" value={data.attendance.attendancePercentage !== null ? `${data.attendance.attendancePercentage}%` : "—"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Daily (14 days)</div>
            <MiniTrendChart data={data.attendance.dailyTrend} dataKey="rate" xKey="label" color="#3b82f6" unit="%" />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Weekly (8 weeks)</div>
            <MiniTrendChart data={data.attendance.weeklyTrend} dataKey="rate" xKey="label" color="#6366f1" unit="%" />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Monthly (6 months)</div>
            <MiniTrendChart data={data.attendance.monthlyTrend} dataKey="rate" xKey="label" color="#8b5cf6" unit="%" />
          </div>
        </div>
      </div>

      {/* ── Shift Coverage Analytics ─────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="coverage" icon={<Activity size={16} color="var(--color-accent)" />} title="Shift Coverage Analytics" subtitle="Scheduling performance for the current week" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <StatTile label="Total Scheduled" value={data.shiftCoverage.totalScheduled} />
          <StatTile label="Filled" value={data.shiftCoverage.filled} color="#22c55e" />
          <StatTile label="Vacant" value={data.shiftCoverage.vacant} color="#ef4444" />
          <StatTile label="Coverage %" value={data.shiftCoverage.coveragePercentage !== null ? `${data.shiftCoverage.coveragePercentage}%` : "—"} />
          <StatTile label="Unstaffed Posts" value={data.shiftCoverage.unstaffedPosts} color={data.shiftCoverage.unstaffedPosts > 0 ? "#f97316" : undefined} />
          <StatTile label="Overtime Assignments" value={data.shiftCoverage.overtimeAssignments} />
          <StatTile label="Shift Completion Rate" value={data.shiftCoverage.shiftCompletionRate !== null ? `${data.shiftCoverage.shiftCompletionRate}%` : "—"} />
        </div>
      </div>

      {/* ── Post Performance ─────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="posts" icon={<MapPin size={16} color="var(--color-accent)" />} title="Post Performance" subtitle="How each post is operating this week (incidents & OB entries are tracked site-wide, not per post, in the current system)" />
        {data.postPerformance.length === 0 ? <EmptyList text="No posts configured for this site yet." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Post", "Assigned Personnel", "Coverage %", "Attendance History", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.postPerformance.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 12px", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{p.name}{!p.isActive && <span style={{ marginLeft: "6px", fontSize: "10px", color: "var(--color-text-muted)" }}>(inactive)</span>}</td>
                    <td style={{ padding: "10px 12px", fontSize: "13px" }}>{p.assignedPersonnel}</td>
                    <td style={{ padding: "10px 12px", fontSize: "13px" }}>{p.coveragePercentage !== null ? `${p.coveragePercentage}%` : "—"}</td>
                    <td style={{ padding: "10px 12px", fontSize: "13px" }}>{p.attendanceHistoryPercentage !== null ? `${p.attendanceHistoryPercentage}%` : "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {p.needsAttention ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "var(--color-danger-subtle)", color: "var(--color-danger)" }}><AlertTriangle size={11} /> Needs Attention</span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(34,197,94,0.1)", color: "#22c55e" }}><CheckCircle2 size={11} /> Healthy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Personnel Performance ────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="personnel" icon={<Award size={16} color="var(--color-accent)" />} title="Personnel Performance" subtitle="Standout performers and follow-up candidates (trailing 30 days)" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Award size={13} color="#22c55e" /> Most Punctual</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.personnelPerformance.mostPunctual.length === 0 ? <EmptyList text="Not enough data yet." /> : data.personnelPerformance.mostPunctual.map((g: any) => <PersonBadge key={g.id} name={g.name} meta={`${g.onTimePercentage}% on-time`} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={13} color="#f59e0b" /> Repeated Late Arrivals</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.personnelPerformance.repeatedLateArrivals.length === 0 ? <EmptyList text="None flagged." /> : data.personnelPerformance.repeatedLateArrivals.map((g: any) => <PersonBadge key={g.id} name={g.name} meta={`${g.lateArrivals} late`} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><CheckCircle2 size={13} color="#3b82f6" /> Highest Attendance</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.personnelPerformance.highestAttendance.length === 0 ? <EmptyList text="Not enough data yet." /> : data.personnelPerformance.highestAttendance.map((g: any) => <PersonBadge key={g.id} name={g.name} meta={`${g.attendancePercentage}%`} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Timer size={13} color="#8b5cf6" /> Most Overtime Worked</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.personnelPerformance.mostOvertimeWorked.length === 0 ? <EmptyList text="No overtime recorded." /> : data.personnelPerformance.mostOvertimeWorked.map((g: any) => <PersonBadge key={g.id} name={g.name} meta={`${Math.round(g.overtimeMinutes / 60 * 10) / 10}h`} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><UserX size={13} color="var(--color-text-muted)" /> Currently On Leave</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.personnelPerformance.onLeave.length === 0 ? <EmptyList text="No one on leave." /> : data.personnelPerformance.onLeave.map((g: any) => <PersonBadge key={g.id} name={g.name} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><UserX size={13} color="var(--color-danger)" /> Absent Today</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.personnelPerformance.absentToday.length === 0 ? <EmptyList text="No one absent today." /> : data.personnelPerformance.absentToday.map((g: any) => <PersonBadge key={g.id} name={g.name} />)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Incident Analytics ───────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="incidents" icon={<ShieldAlert size={16} color="var(--color-accent)" />} title="Incident Analytics" subtitle="Operational incidents this site has logged" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <StatTile label="Total Incidents" value={data.incidentAnalytics.total} />
          <StatTile label="Open" value={data.incidentAnalytics.open} color={data.incidentAnalytics.open > 0 ? "#ef4444" : undefined} />
          <StatTile label="Resolved" value={data.incidentAnalytics.resolved} color="#22c55e" />
          <StatTile label="Avg Resolution Time" value={data.incidentAnalytics.avgResolutionTimeHours !== null ? `${data.incidentAnalytics.avgResolutionTimeHours}h` : "—"} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>By Category</div>
            {data.incidentAnalytics.byCategory.length === 0 ? <EmptyList text="No incidents logged in the last 6 months." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.incidentAnalytics.byCategory.map((c: any) => (
                  <div key={c.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600 }}>{c.category}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-accent)" }}>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Trend (8 weeks)</div>
            <MiniTrendChart data={data.incidentAnalytics.trend} dataKey="count" xKey="label" color="#ef4444" />
          </div>
        </div>
      </div>

      {/* ── Visitor Analytics ────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="visitors" icon={<DoorOpen size={16} color="var(--color-accent)" />} title="Visitor Analytics" subtitle="Visitor traffic and dwell time" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <StatTile label="Visitors Today" value={data.visitorAnalytics.today} />
          <StatTile label="Visitors This Week" value={data.visitorAnalytics.thisWeek} />
          <StatTile label="Currently On Site" value={data.visitorAnalytics.onSite} />
          <StatTile label="Avg Visit Duration" value={data.visitorAnalytics.avgVisitDurationMinutes !== null ? `${data.visitorAnalytics.avgVisitDurationMinutes}m` : "—"} />
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Frequent Visitors (90 days)</div>
        {data.visitorAnalytics.frequentVisitors.length === 0 ? <EmptyList text="No repeat visitors yet." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.visitorAnalytics.frequentVisitors.map((v: any, i: number) => <PersonBadge key={i} name={v.name} meta={`${v.count} visits`} />)}
          </div>
        )}
      </div>

      {/* ── Occurrence Book Analytics ────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="ob" icon={<BookOpen size={16} color="var(--color-accent)" />} title="Occurrence Book Analytics" subtitle="OB entry activity and reporting patterns" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <StatTile label="Entries Today" value={data.occurrenceBook.entriesToday} />
          <StatTile label="Entries This Week" value={data.occurrenceBook.entriesThisWeek} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Most Common Categories</div>
            {data.occurrenceBook.mostCommon.length === 0 ? <EmptyList text="No OB entries in the last 90 days." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.occurrenceBook.mostCommon.map((c: any) => (
                  <div key={c.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600 }}>{c.category}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-accent)" }}>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Peak Reporting Periods</div>
            {data.occurrenceBook.peakReportingPeriods.length === 0 ? <EmptyList text="Not enough data yet." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.occurrenceBook.peakReportingPeriods.map((p: any, i: number) => <PersonBadge key={i} name={p.hourRange} meta={`${p.count} entries`} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly Coverage Overview ─────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="weekly" icon={<Activity size={16} color="var(--color-accent)" />} title="Weekly Coverage Overview" subtitle="Staffing snapshot for the current week (Mon–Sun)" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
          {data.weeklyCoverage.map((d: any) => {
            const c = COVERAGE_COLORS[d.status];
            return (
              <div key={d.day} style={{ background: d.isToday ? c.bg : "var(--color-bg-subtle)", border: `1px solid ${d.isToday ? c.border : "var(--color-border)"}`, borderRadius: "var(--radius-md)", padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{d.day}</div>
                <div style={{ fontSize: "10.5px", color: "var(--color-text-muted)", marginBottom: "8px" }}>{d.date.slice(5)}</div>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.dot, margin: "0 auto 6px" }} />
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{d.coveragePercentage !== null ? `${d.coveragePercentage}%` : "—"}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>{d.filledShifts} filled / {d.vacantShifts} vacant</div>
                {d.guardsOnLeave !== null && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{d.guardsOnLeave} on leave</div>}
                {d.guardsAbsent !== null && <div style={{ fontSize: "10px", color: d.guardsAbsent > 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>{d.guardsAbsent} absent</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
          {Object.entries(COVERAGE_COLORS).map(([key, c]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.dot }} />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 600 }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Operational Alerts ───────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="alerts" icon={<AlertTriangle size={16} color="var(--color-danger)" />} title="Operational Alerts" subtitle="Items requiring immediate attention" />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.alerts.vacantPosts.map((p: any) => (
            <AlertRow key={`vp-${p.id}`} icon={<MapPin size={14} />} text={`Vacant post: ${p.name}`} />
          ))}
          {data.alerts.unassignedShifts > 0 && (
            <AlertRow icon={<Clock size={14} />} text={`${data.alerts.unassignedShifts} unassigned shift(s) in the next 7 days`} />
          )}
          {data.alerts.missedCheckIns.map((m: any) => (
            <AlertRow key={m.shiftId} icon={<LogIn size={14} />} text={`${m.guardName} missed check-in for their ${new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} shift`} />
          ))}
          {data.alerts.openHighPriorityIncidents > 0 && (
            <AlertRow icon={<ShieldAlert size={14} />} text={`${data.alerts.openHighPriorityIncidents} open high-priority incident(s)`} severe />
          )}
          {data.alerts.visitorsOverstaying.map((v: any) => (
            <AlertRow key={v.id} icon={<DoorOpen size={14} />} text={`${v.name} has been on site for ${v.hoursOnSite}h (exceeds expected visit time)`} />
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-muted)", fontSize: "12.5px" }}>
            <ChevronRight size={13} /> Expiring employee document tracking isn't set up yet — no document/certification-expiry data exists in the system.
          </div>
          {data.alerts.vacantPosts.length === 0 && data.alerts.unassignedShifts === 0 && data.alerts.missedCheckIns.length === 0 && data.alerts.openHighPriorityIncidents === 0 && data.alerts.visitorsOverstaying.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px", background: "rgba(34,197,94,0.08)", borderRadius: "var(--radius-md)", color: "#22c55e", fontSize: "13px", fontWeight: 600 }}>
              <CheckCircle2 size={16} /> No urgent operational issues right now.
            </div>
          )}
        </div>
      </div>

      {/* ── Trends & Insights ────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <SectionAnchor id="trends" icon={<TrendingUp size={16} color="var(--color-accent)" />} title="Trends & Insights" subtitle="How the site has performed over the last 8 weeks" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Attendance Rate</div>
            <MiniTrendChart data={data.trends.attendance} dataKey="rate" xKey="label" color="#3b82f6" unit="%" />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Shift Coverage</div>
            <MiniTrendChart data={data.trends.shiftCoverage} dataKey="coveragePercentage" xKey="label" color="#6366f1" unit="%" />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Incidents</div>
            <MiniTrendChart data={data.trends.incidents} dataKey="count" xKey="label" color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Visitors (14 days)</div>
            <MiniTrendChart data={data.trends.visitors} dataKey="count" xKey="label" color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>Occurrence Book (14 days)</div>
            <MiniTrendChart data={data.trends.occurrenceBook} dataKey="count" xKey="label" color="#8b5cf6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ icon, text, severe }: { icon: React.ReactNode; text: string; severe?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: severe ? "var(--color-danger-subtle)" : "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: severe ? "1px solid var(--color-danger)" : "1px solid var(--color-border)" }}>
      <span style={{ color: severe ? "var(--color-danger)" : "var(--color-accent)", display: "flex" }}>{icon}</span>
      <span style={{ fontSize: "12.5px", fontWeight: 600, color: severe ? "var(--color-danger)" : "var(--color-text-primary)" }}>{text}</span>
    </div>
  );
}
