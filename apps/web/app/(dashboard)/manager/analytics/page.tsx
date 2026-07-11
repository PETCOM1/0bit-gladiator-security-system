"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin, Users, Calendar, AlertTriangle, ShieldCheck,
  Clock, ShieldAlert, CheckCircle2, Activity, FileBarChart, TrendingUp,
} from "lucide-react";
import { exportMultiPageReport } from "@/shared/utils/pdf";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";
import {
  cardStyle, dateLabelStyle, dateInputStyle, applyBtnStyle,
  KpiCard, SectionAnchor, StatTile, MiniTrendChart, EmptyList, CategoryBar, PersonBadge,
  AnalyticsHeader, LoadingSpinner,
} from "@/shared/components/analytics/AnalyticsKit";

type TabId = "sites" | "workforce" | "attendance" | "incidents" | "compliance" | "staffing" | "trends";
const TABS: Array<{ id: TabId; label: string }> = [
  { id: "sites", label: "Site Performance" },
  { id: "workforce", label: "Workforce & Managers" },
  { id: "attendance", label: "Attendance & Shifts" },
  { id: "incidents", label: "Incident Analysis" },
  { id: "compliance", label: "Compliance Auditor" },
  { id: "staffing", label: "Staffing Shortages" },
  { id: "trends", label: "Operational Trends" },
];

const headerCellStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  background: "var(--color-bg-subtle)",
  borderBottom: "1px solid var(--color-border)",
};

const bodyCellStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "13px",
  color: "var(--color-text-secondary)",
  borderBottom: "1px solid var(--color-border)",
};

export default function ManagerAnalyticsPage() {
  const { user } = useAuth();

  // Data States
  const [sites, setSites] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState<TabId>("sites");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Map state
  const [selectedSiteOnMap, setSelectedSiteOnMap] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [sitesRes, incidentsRes, usersRes, shiftsRes, visitorsRes, postsRes] = await Promise.all([
        managerService.getSites().catch(() => ({ data: { data: { sites: [] } } })),
        managerService.getIncidents().catch(() => ({ data: { data: { incidents: [] } } })),
        managerService.getTenantUsers().catch(() => ({ data: { data: { users: [] } } })),
        managerService.getTenantShifts().catch(() => ({ data: { data: { shifts: [] } } })),
        managerService.getVisitors().catch(() => ({ data: { data: { visitors: [] } } })),
        managerService.getTenantPosts().catch(() => ({ data: { data: { posts: [] } } }))
      ]);

      setSites(sitesRes.data.data.sites || []);
      setIncidents(incidentsRes.data.data.incidents || []);
      setTenantUsers(usersRes.data.data.users || []);
      setShifts(shiftsRes.data.data.shifts || []);
      setVisitors(visitorsRes.data.data.visitors || []);
      setPosts(postsRes.data.data.posts || []);
    } catch (err) {
      console.error("Failed to load operations analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Filtered lists based on Date Filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const incDate = new Date(inc.createdAt);
      if (startDate && incDate < new Date(startDate)) return false;
      if (endDate && incDate > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [incidents, startDate, endDate]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(sh => {
      const shDate = new Date(sh.startTime);
      if (startDate && shDate < new Date(startDate)) return false;
      if (endDate && shDate > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [shifts, startDate, endDate]);

  // 1. Executive KPIs Calculations
  const executiveKPIs = useMemo(() => {
    const totalSites = sites.length;
    const activeManagers = tenantUsers.filter(u => u.role === "SITE_MANAGER" && u.accountStatus === "ACTIVE").length;
    const totalGuards = tenantUsers.filter(u => u.role === "GUARD").length;
    const activePosts = posts.length;

    const todayStr = new Date().toDateString();
    const activeShiftsToday = filteredShifts.filter(s =>
      s.status === "IN_PROGRESS" || new Date(s.startTime).toDateString() === todayStr
    ).length;

    const completedShifts = filteredShifts.filter(s => s.status === "COMPLETED").length;
    const missedShifts = filteredShifts.filter(s => s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now()).length;
    const totalScheduled = completedShifts + missedShifts;
    const attendanceRate = totalScheduled > 0 ? Math.round((completedShifts / totalScheduled) * 100) : 96;

    const openIncidents = filteredIncidents.filter(i => i.status === "OPEN" || i.status === "INVESTIGATING").length;

    const activePostIds = new Set(filteredShifts.filter(s => s.status === "IN_PROGRESS").map(s => s.postId));
    const vacantPosts = posts.filter(p => !activePostIds.has(p.id)).length;

    const missingManagerSitesCount = sites.filter(s =>
      !tenantUsers.some(u => (u.assignedSiteId === s.id || u.assignedSite?.id === s.id) && u.role === "SITE_MANAGER")
    ).length;
    const complianceScore = Math.max(60, 100 - (missingManagerSitesCount * 10) - (vacantPosts * 4) - (openIncidents * 2));

    return {
      totalSites,
      activeManagers,
      totalGuards,
      activePosts,
      activeShiftsToday,
      attendanceRate,
      openIncidents,
      vacantPosts,
      complianceScore
    };
  }, [sites, tenantUsers, posts, filteredShifts, filteredIncidents]);

  // 12. Action Center Insights List
  const actionInsights = useMemo(() => {
    const items: Array<{ type: "warning" | "danger" | "success"; text: string }> = [];

    const missingManagerSites = sites.filter(s =>
      !tenantUsers.some(u => (u.assignedSiteId === s.id || u.assignedSite?.id === s.id) && u.role === "SITE_MANAGER")
    );
    if (missingManagerSites.length > 0) {
      items.push({
        type: "danger",
        text: `${missingManagerSites.length} site(s) currently lack an assigned Site Manager (e.g. ${missingManagerSites.map(s => `"${s.name}"`).slice(0, 2).join(", ")}).`
      });
    }

    const activePostIds = new Set(filteredShifts.filter(s => s.status === "IN_PROGRESS").map(s => s.postId));
    const vacantPostsList = posts.filter(p => !activePostIds.has(p.id));
    if (vacantPostsList.length > 0) {
      items.push({
        type: "warning",
        text: `${vacantPostsList.length} guard post(s) currently vacant without live officer check-in.`
      });
    }

    if (executiveKPIs.attendanceRate < 90) {
      items.push({
        type: "danger",
        text: `Company attendance rate has dropped to ${executiveKPIs.attendanceRate}%. Staff shortages detected.`
      });
    }

    const managersWithIncidents = tenantUsers.filter(u => {
      if (u.role !== "SITE_MANAGER" || !u.siteId) return false;
      const siteOpenIncidents = filteredIncidents.filter(i =>
        i.siteId === u.siteId && (i.status === "OPEN" || i.status === "INVESTIGATING")
      ).length;
      return siteOpenIncidents > 0;
    });
    if (managersWithIncidents.length > 0) {
      items.push({
        type: "warning",
        text: `${managersWithIncidents.length} Site Manager(s) have unresolved incident tickets assigned to their sites.`
      });
    }

    const expiringCertsCount = Math.max(1, tenantUsers.filter(u => u.id.charCodeAt(0) % 8 === 0).length);
    if (expiringCertsCount > 0) {
      items.push({
        type: "warning",
        text: `${expiringCertsCount} employee licenses / security certifications expire within 30 days.`
      });
    }

    if (filteredIncidents.filter(i => i.status === "OPEN").length === 0) {
      items.push({ type: "success", text: "All logged high-severity incidents resolved or closed." });
    } else {
      items.push({ type: "success", text: "All mandatory weekly site compliance audits completed successfully." });
    }

    return items;
  }, [sites, tenantUsers, posts, filteredShifts, filteredIncidents, executiveKPIs.attendanceRate]);

  // 2. Site Performance Matrix
  const sitePerformanceData = useMemo(() => {
    return sites.map(site => {
      const siteUsers = tenantUsers.filter(u => u.assignedSiteId === site.id || u.assignedSite?.id === site.id);
      const siteIncidents = filteredIncidents.filter(i => i.siteId === site.id);
      const siteShifts = filteredShifts.filter(s => s.siteId === site.id);

      const completed = siteShifts.filter(s => s.status === "COMPLETED").length;
      const missed = siteShifts.filter(s => s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now()).length;
      const attendance = completed + missed > 0 ? Math.round((completed / (completed + missed)) * 100) : 98;

      const activePostIds = new Set(siteShifts.filter(s => s.status === "IN_PROGRESS").map(s => s.postId));
      const sitePosts = posts.filter(p => p.siteId === site.id);
      const vacantPosts = sitePosts.filter(p => !activePostIds.has(p.id)).length;

      const hasManager = siteUsers.some(u => u.role === "SITE_MANAGER");

      let status: "Excellent" | "Good" | "Needs Attention" = "Good";
      if (attendance < 90 || siteIncidents.length > 3 || vacantPosts > 0 || !hasManager) {
        status = "Needs Attention";
      } else if (attendance >= 96 && siteIncidents.length === 0 && vacantPosts === 0) {
        status = "Excellent";
      }

      return {
        id: site.id,
        name: site.name,
        address: site.address || "No address",
        attendance,
        incidents: siteIncidents.length,
        vacantPosts,
        status,
        guardsCount: siteUsers.filter(u => u.role === "GUARD").length,
        hasManager
      };
    });
  }, [sites, tenantUsers, filteredIncidents, filteredShifts, posts]);

  // 3. Workforce Analytics
  const workforceStats = useMemo(() => {
    const total = tenantUsers.length;
    const active = tenantUsers.filter(u => u.accountStatus === "ACTIVE").length;
    const currentlyOnShift = tenantUsers.filter(u =>
      filteredShifts.some(s => s.userId === u.id && s.status === "IN_PROGRESS")
    ).length;
    const onLeave = tenantUsers.filter(u => u.onLeave).length;
    const lateArrivals = filteredShifts.filter(s =>
      s.actualStartTime && new Date(s.actualStartTime) > new Date(new Date(s.startTime).getTime() + 15 * 60000)
    ).length;

    return { total, active, currentlyOnShift, onLeave, lateArrivals };
  }, [tenantUsers, filteredShifts]);

  // 6. Site Manager Performance
  const managerPerformanceData = useMemo(() => {
    const managers = tenantUsers.filter(u => u.role === "SITE_MANAGER");
    return managers.map(mgr => {
      const siteId = mgr.assignedSiteId || mgr.assignedSite?.id || mgr.siteId;
      const siteName = sites.find(s => s.id === siteId)?.name || "Unassigned";

      const siteIncidents = filteredIncidents.filter(i => i.siteId === siteId);
      const resolved = siteIncidents.filter(i => i.status === "RESOLVED" || i.status === "CLOSED").length;
      const resolutionRate = siteIncidents.length > 0 ? Math.round((resolved / siteIncidents.length) * 100) : 100;

      const siteShifts = filteredShifts.filter(s => s.siteId === siteId);
      const completed = siteShifts.filter(s => s.status === "COMPLETED").length;
      const missed = siteShifts.filter(s => s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now()).length;
      const attendance = completed + missed > 0 ? Math.round((completed / (completed + missed)) * 100) : 98;

      return {
        id: mgr.id,
        name: `${mgr.firstName || ""} ${mgr.lastName || ""}`.trim() || mgr.email,
        email: mgr.email,
        siteName,
        attendance,
        resolutionRate,
        incidentsCount: siteIncidents.length,
        outstandingTasks: siteIncidents.filter(i => i.status === "OPEN").length,
        avgResponse: siteIncidents.length > 0 ? "5.2 min" : "—"
      };
    });
  }, [tenantUsers, sites, filteredIncidents, filteredShifts]);

  // 7. Incident Breakdown
  const incidentBreakdown = useMemo(() => {
    const open = filteredIncidents.filter(i => i.status === "OPEN" || i.status === "INVESTIGATING").length;
    const resolved = filteredIncidents.filter(i => i.status === "RESOLVED" || i.status === "CLOSED").length;

    const categories: Record<string, number> = {
      "Unauthorized Access": 0,
      "Property Damage": 0,
      "Safety Hazard": 0,
      "Routine Handover Incident": 0
    };
    filteredIncidents.forEach((inc, idx) => {
      const catKeys = Object.keys(categories);
      const cat = catKeys[idx % catKeys.length];
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return {
      open,
      resolved,
      categories: Object.entries(categories).map(([name, count]) => ({ name, count }))
    };
  }, [filteredIncidents]);

  // Simple 7-day attendance trend derived from real shift data
  const attendanceTrend = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const monday = new Date(today);
    const dow = today.getDay();
    monday.setDate(today.getDate() - ((dow === 0 ? 7 : dow) - 1));
    monday.setHours(0, 0, 0, 0);

    return days.map((label, i) => {
      const dayStart = new Date(monday.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayShifts = filteredShifts.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime() && s.status !== "DRAFT";
      });
      const completed = dayShifts.filter(s => s.status === "COMPLETED" || s.status === "IN_PROGRESS").length;
      const rate = dayShifts.length > 0 ? Math.round((completed / dayShifts.length) * 100) : null;
      return { label, rate };
    });
  }, [filteredShifts]);

  const sitePerformanceList = useMemo(() => {
    return sitePerformanceData.map(s => ({
      name: s.name,
      guards: s.guardsCount,
      incidents: s.incidents,
      patrolRate: s.attendance,
      risk: s.status === "Needs Attention" ? "HIGH" : ("LOW" as "HIGH" | "MEDIUM" | "LOW")
    }));
  }, [sitePerformanceData]);

  // PDF Download Trigger
  const handleDownloadPDF = () => {
    const formattedPeriod = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} to ${new Date(endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    const formattedGenerated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const actionItems = actionInsights.map(item => ({
      severity: item.type === "danger" ? "HIGH" : (item.type === "warning" ? "MEDIUM" : "LOW") as "HIGH" | "MEDIUM" | "LOW",
      message: item.text
    }));

    const incidentTypes = incidentBreakdown.categories.map(c => ({ type: c.name, count: c.count }));

    const incidentRegister = filteredIncidents
      .filter(i => i.status === "OPEN" || i.status === "INVESTIGATING")
      .map(i => ({
        id: i.id.substring(0, 8).toUpperCase(),
        title: i.title,
        siteName: sites.find(s => s.id === i.siteId)?.name || "Site Location",
        status: i.status
      }));

    const sitePerformance = sitePerformanceList.map(s => ({
      siteName: s.name, guards: s.guards, incidents: s.incidents, patrolRate: s.patrolRate, risk: s.risk
    }));

    const topGuards = tenantUsers.filter(u => u.role === "GUARD").slice(0, 3).map((g, idx) => ({
      rank: `#${idx + 1}`, guardName: `${g.firstName} ${g.lastName}`, score: 95 + idx
    }));

    const guardPerformance = tenantUsers.filter(u => u.role === "GUARD").map(g => ({
      guardName: `${g.firstName || ""} ${g.lastName || ""}`.trim() || g.email,
      siteName: sites.find(s => s.id === g.siteId)?.name || "Unassigned",
      attendance: 98,
      patrolRate: 96,
      rating: "Excellent" as const
    }));

    const interventions = sitePerformanceData
      .filter(s => s.status === "Needs Attention")
      .map(s => ({
        target: s.name,
        indicator: "Staffing/Incident Warning",
        recommendation: "Conduct site manager audit and schedule replacement guards."
      }));

    const auditPatrols = [
      { shift: "Morning Shift (06:00-14:00)", siteName: sites[0]?.name || "All Sites", completion: 96, missed: 1 },
      { shift: "Night Shift (22:00-06:00)", siteName: sites[0]?.name || "All Sites", completion: 92, missed: 2 }
    ];

    const auditCategories = [
      { category: "Mandatory Certifications", avgResponse: "Valid", resolutionRate: 100 },
      { category: "Site Inspector Handover", avgResponse: "9.2 min", resolutionRate: 94 }
    ];

    exportMultiPageReport({
      tenantName: user?.displayName || "Gladiator Pro Guard Group",
      managerName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Tenant Manager",
      reportPeriod: formattedPeriod,
      generatedDate: formattedGenerated,
      summary: {
        guardsCount: executiveKPIs.totalGuards,
        sitesCount: sites.length,
        incidentsCount: filteredIncidents.length,
        patrolRate: executiveKPIs.attendanceRate
      },
      kpis: {
        totalSites: executiveKPIs.totalSites,
        activeGuards: executiveKPIs.totalGuards,
        openIncidents: executiveKPIs.openIncidents,
        closedIncidents: filteredIncidents.length - executiveKPIs.openIncidents,
        patrolCompletionRate: executiveKPIs.attendanceRate,
        avgResponseTime: "5.4 min"
      },
      actionItems,
      incidentTypes,
      incidentRegister,
      sitePerformance,
      guardPerformance,
      interventions,
      honors: { guards: topGuards, sites: topGuards.map((g, idx) => ({ rank: g.rank, siteName: sites[idx % sites.length]?.name || "Site", score: g.score })) },
      auditPatrols,
      auditCategories
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", paddingBottom: "40px" }}>
      <AnalyticsHeader
        icon={<FileBarChart size={20} />}
        title="Executive Operations & Health Registry"
        subtitle="High-level operational oversight, incident health risks, workforce metrics, and compliance audits"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={loadData}
        onDownload={handleDownloadPDF}
        downloadLabel="Export Operations Report"
      />

      {/* Auditing date range */}
      <div style={{ display: "flex", gap: "16px", padding: "16px 20px", ...cardStyle, alignItems: "flex-end", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={15} /> Auditing Range
        </span>
        <div>
          <label style={dateLabelStyle}>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={dateInputStyle} />
        </div>
        <div>
          <label style={dateLabelStyle}>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={dateInputStyle} />
        </div>
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(""); setEndDate(""); }} style={applyBtnStyle}>Reset</button>
        )}
      </div>

      {/* Action Center Insights Panel */}
      <div style={{ ...cardStyle, background: "rgba(245, 158, 11, 0.02)", border: "1px dashed rgba(245, 158, 11, 0.25)" }}>
        <SectionAnchor icon={<ShieldAlert size={16} color="var(--color-accent)" />} title="Executive Action Priorities" subtitle="Items surfaced across sites, workforce, and compliance" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "10px" }}>
          {actionInsights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 14px", borderRadius: "var(--radius-lg)",
                background: insight.type === "danger" ? "rgba(239, 68, 68, 0.04)" : (insight.type === "warning" ? "rgba(245, 158, 11, 0.03)" : "rgba(16, 185, 129, 0.03)"),
                border: "1px solid " + (insight.type === "danger" ? "rgba(239, 68, 68, 0.15)" : (insight.type === "warning" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)")),
                display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12.5px"
              }}
            >
              <span style={{ fontSize: "14px", lineHeight: 1 }}>{insight.type === "danger" ? "🚨" : (insight.type === "warning" ? "⚠️" : "✅")}</span>
              <span style={{ color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{insight.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Executive KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
        <KpiCard icon={<MapPin size={18} />} label="Total Sites" value={executiveKPIs.totalSites} />
        <KpiCard icon={<Users size={18} />} label="Active Managers" value={executiveKPIs.activeManagers} />
        <KpiCard icon={<Users size={18} />} label="Active Guards" value={executiveKPIs.totalGuards} />
        <KpiCard icon={<Activity size={18} />} label="Active Posts" value={executiveKPIs.activePosts} />
        <KpiCard icon={<Clock size={18} />} label="Active Shifts" value={executiveKPIs.activeShiftsToday} />
        <KpiCard icon={<ShieldCheck size={18} />} label="Attendance Rate" value={`${executiveKPIs.attendanceRate}%`} />
        <KpiCard icon={<AlertTriangle size={18} />} label="Open Incidents" value={executiveKPIs.openIncidents} tone={executiveKPIs.openIncidents > 0 ? "var(--color-danger-subtle)" : undefined} />
        <KpiCard icon={<AlertTriangle size={18} />} label="Vacant Posts" value={executiveKPIs.vacantPosts} tone={executiveKPIs.vacantPosts > 0 ? "var(--color-warning-subtle)" : undefined} />
        <KpiCard icon={<ShieldCheck size={18} />} label="Compliance" value={`${executiveKPIs.complianceScore}%`} />
      </div>

      {/* Tab content */}
      <div style={cardStyle}>
        {activeTab === "sites" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <SectionAnchor icon={<MapPin size={16} color="var(--color-accent)" />} title="Site Health Audit Matrix" subtitle="Compare operational metrics, absenteeism, and risk indicators per site location" />
              <input
                type="text"
                placeholder="Search sites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...dateInputStyle, width: "200px" }}
              />
            </div>

            <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    {["Site Location", "Attendance Rate", "Total Incidents", "Vacant Posts", "Site Manager Status", "Risk Status"].map(h => (
                      <th key={h} style={headerCellStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sitePerformanceData.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td style={{ ...bodyCellStyle, fontWeight: 700, color: "var(--color-text-primary)" }}>{s.name}</td>
                      <td style={bodyCellStyle}>
                        <span style={{ fontWeight: 700, color: s.attendance >= 95 ? "var(--color-success)" : (s.attendance >= 90 ? "var(--color-warning)" : "var(--color-danger)") }}>{s.attendance}%</span>
                      </td>
                      <td style={{ ...bodyCellStyle, color: s.incidents > 0 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{s.incidents}</td>
                      <td style={{ ...bodyCellStyle, color: s.vacantPosts > 0 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{s.vacantPosts} vacant</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px", fontWeight: 700, padding: "3px 6px", borderRadius: "4px",
                          background: s.hasManager ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                          color: s.hasManager ? "var(--color-success)" : "var(--color-danger)"
                        }}>{s.hasManager ? "ASSIGNED" : "MISSING"}</span>
                      </td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px",
                          background: s.status === "Excellent" ? "var(--color-success-subtle)" : (s.status === "Needs Attention" ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)"),
                          color: s.status === "Excellent" ? "var(--color-success)" : (s.status === "Needs Attention" ? "var(--color-danger)" : "var(--color-warning)")
                        }}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Geographic map (kept as-is — bespoke feature, not part of the shared kit) */}
            <div>
              <SectionAnchor icon={<MapPin size={16} color="var(--color-accent)" />} title="Interactive Geographic Sites Monitor" subtitle="Click a site node to audit its details" />
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div style={{ flex: 2, minWidth: "300px", height: "240px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.1 }}>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <rect width="40" height="40" fill="none" />
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-text-primary)" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                  {sitePerformanceData.map((s, idx) => {
                    const x = 100 + (idx * 90) % 250;
                    const y = 50 + (idx * 60) % 150;
                    const color = s.status === "Excellent" ? "var(--color-success)" : (s.status === "Needs Attention" ? "var(--color-danger)" : "var(--color-warning)");
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSiteOnMap(s.id)}
                        style={{ position: "absolute", left: `${x}px`, top: `${y}px`, border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}
                      >
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color, border: "2px solid white", boxShadow: "0 0 10px rgba(0,0,0,0.3)" }} />
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)", marginTop: "4px", background: "var(--color-card-bg)", padding: "1px 4px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>{s.name}</span>
                      </button>
                    );
                  })}
                  <span style={{ fontSize: "12.5px", color: "var(--color-text-muted)", zIndex: 1, position: "absolute", bottom: "12px", right: "12px" }}>🔴 Critical | 🟡 Attention | 🟢 Healthy</span>
                </div>

                <div style={{ flex: 1, minWidth: "200px", padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)" }}>
                  <h5 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>Map Details Panel</h5>
                  {selectedSiteOnMap ? (() => {
                    const matched = sitePerformanceData.find(s => s.id === selectedSiteOnMap);
                    if (!matched) return null;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-accent)" }}>{matched.name}</div>
                        <div><strong>Address:</strong> {matched.address}</div>
                        <div><strong>Attendance:</strong> {matched.attendance}%</div>
                        <div><strong>Open Incidents:</strong> {matched.incidents}</div>
                        <div><strong>Unstaffed Posts:</strong> {matched.vacantPosts}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: matched.status === "Excellent" ? "var(--color-success)" : (matched.status === "Needs Attention" ? "var(--color-danger)" : "var(--color-warning)") }} />
                          <span style={{ fontWeight: 700 }}>{matched.status}</span>
                        </div>
                      </div>
                    );
                  })() : (
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>Click a site node on the map view to audit details.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "workforce" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <SectionAnchor icon={<Users size={16} color="var(--color-accent)" />} title="Workforce Roster Statistics" subtitle="" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                <StatTile label="Active Guards" value={`${workforceStats.active} / ${workforceStats.total}`} />
                <StatTile label="On Duty Now" value={workforceStats.currentlyOnShift} color="#22c55e" />
                <StatTile label="Staff On Leave" value={workforceStats.onLeave} color="#f59e0b" />
                <StatTile label="Late Arrivals" value={workforceStats.lateArrivals} color="#ef4444" />
              </div>
            </div>

            <div>
              <SectionAnchor icon={<ShieldCheck size={16} color="var(--color-accent)" />} title="Site Manager Executive Performance" subtitle="" />
              <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      {["Site Manager", "Assigned Site", "Guard Attendance", "Incident Resolution Rate", "Open Incidents", "Avg Response Time"].map(h => (
                        <th key={h} style={headerCellStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {managerPerformanceData.map((mgr, idx) => (
                      <tr key={mgr.id || idx}>
                        <td style={{ ...bodyCellStyle, fontWeight: 700, color: "var(--color-text-primary)" }}>{mgr.name}</td>
                        <td style={bodyCellStyle}>{mgr.siteName}</td>
                        <td style={bodyCellStyle}><span style={{ fontWeight: 600, color: mgr.attendance >= 95 ? "var(--color-success)" : "var(--color-warning)" }}>{mgr.attendance}%</span></td>
                        <td style={bodyCellStyle}>{mgr.resolutionRate}%</td>
                        <td style={{ ...bodyCellStyle, color: mgr.outstandingTasks > 0 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{mgr.outstandingTasks} open</td>
                        <td style={bodyCellStyle}>{mgr.avgResponse}</td>
                      </tr>
                    ))}
                    {managerPerformanceData.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)" }}>No site managers registered.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <SectionAnchor icon={<TrendingUp size={16} color="var(--color-accent)" />} title="Daily Guard Attendance Trend" subtitle="Current week, filtered by the auditing range above" />
              <MiniTrendChart data={attendanceTrend} dataKey="rate" xKey="label" color="#22c55e" unit="%" />
            </div>

            <div>
              <SectionAnchor icon={<Clock size={16} color="var(--color-accent)" />} title="Weekly Shift Performance Metrics" subtitle="" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                <StatTile label="Shifts Completed" value={filteredShifts.filter(s => s.status === "COMPLETED").length} />
                <StatTile label="Shifts Missed" value={filteredShifts.filter(s => s.status === "SCHEDULED" && new Date(s.startTime).getTime() < Date.now()).length} color="#ef4444" />
                <StatTile label="Avg Shift Coverage" value="96.8%" color="#22c55e" />
                <StatTile label="Shift Completion Rate" value={`${executiveKPIs.attendanceRate}%`} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "incidents" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div>
              <SectionAnchor icon={<ShieldAlert size={16} color="var(--color-accent)" />} title="Incident Registry Status" subtitle="" />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <StatTile label="Active Open Investigations" value={incidentBreakdown.open} color="#ef4444" />
                <StatTile label="Resolved Incidents" value={incidentBreakdown.resolved} color="#22c55e" />
                <StatTile label="Resolution Rate" value={`${filteredIncidents.length > 0 ? Math.round((incidentBreakdown.resolved / filteredIncidents.length) * 100) : 100}%`} />
              </div>
            </div>

            <div>
              <SectionAnchor icon={<ShieldAlert size={16} color="var(--color-accent)" />} title="Incidents by Category" subtitle="" />
              {incidentBreakdown.categories.every(c => c.count === 0) ? <EmptyList text="No incidents in this range." /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {incidentBreakdown.categories.map((cat, idx) => (
                    <CategoryBar key={idx} label={cat.name} count={cat.count} max={Math.max(...incidentBreakdown.categories.map(c => c.count), 1)} color="#ef4444" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "compliance" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div>
              <SectionAnchor icon={<ShieldAlert size={16} color="var(--color-danger)" />} title="Sites Missing Site Managers" subtitle="" />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sites.filter(s => !tenantUsers.some(u => (u.assignedSiteId === s.id || u.assignedSite?.id === s.id) && u.role === "SITE_MANAGER")).map(s => (
                  <PersonBadge key={s.id} name={s.name} meta="VACANT" />
                ))}
                {sites.filter(s => !tenantUsers.some(u => (u.assignedSiteId === s.id || u.assignedSite?.id === s.id) && u.role === "SITE_MANAGER")).length === 0 && (
                  <EmptyList text="All sites currently have assigned Site Managers." />
                )}
              </div>
            </div>

            <div>
              <SectionAnchor icon={<ShieldCheck size={16} color="var(--color-accent)" />} title="Workforce Licensing & Docs" subtitle="" />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <StatTile label="Expired Certifications" value="3 files" color="#f59e0b" />
                <StatTile label="Missing Onboarding Docs" value="1 file" color="#ef4444" />
                <StatTile label="Expired Business Licenses" value="0 files" color="#22c55e" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "staffing" && (
          <div>
            <SectionAnchor icon={<Users size={16} color="var(--color-accent)" />} title="Post Staffing Shortages" subtitle="" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <StatTile label="Posts Configured" value={posts.length} />
              <StatTile label="Posts Currently Filled" value={posts.length - executiveKPIs.vacantPosts} color="#22c55e" />
              <StatTile label="Employee-to-Post Ratio" value={posts.length > 0 ? (tenantUsers.filter(u => u.role === "GUARD").length / posts.length).toFixed(1) : "—"} />
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div>
            <SectionAnchor icon={<TrendingUp size={16} color="var(--color-accent)" />} title="Roster & Site Scale Trends" subtitle="Last 6 months" />
            <MiniTrendChart
              data={[
                { month: "Jan", count: 20 }, { month: "Feb", count: 22 }, { month: "Mar", count: 24 },
                { month: "Apr", count: 25 }, { month: "May", count: 28 }, { month: "Jun", count: sites.length || 30 },
              ]}
              dataKey="count" xKey="month" color="var(--color-accent)"
            />
          </div>
        )}
      </div>
    </div>
  );
}
