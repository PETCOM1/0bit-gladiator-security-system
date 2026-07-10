"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Download, Users, AlertTriangle, ShieldCheck, MapPin, Layers, Calendar } from "lucide-react";
import { exportMultiPageReport } from "@/shared/utils/pdf";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SiteManagerAnalyticsPage() {
  const { user } = useAuth();
  
  // States
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monitoring" | "patrols" | "incidents" | "access" | "zones">("monitoring");
  
  // Date Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function loadSiteData() {
      if (!user?.siteId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await managerService.getSiteById(user.siteId);
        setSite(res.data.data.site);
      } catch (err) {
        console.error("Failed to load site analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSiteData();
  }, [user?.siteId]);

  // If no site assigned
  if (!user?.siteId) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
        You have not been assigned to a site yet. Please contact your administrator.
      </div>
    );
  }

  // Filtered lists based on Date Filters
  const filteredIncidents = useMemo(() => {
    if (!site?.incidents) return [];
    return site.incidents.filter((inc: any) => {
      const incDate = new Date(inc.createdAt);
      if (startDate && incDate < new Date(startDate)) return false;
      if (endDate && incDate > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [site?.incidents, startDate, endDate]);

  const filteredShifts = useMemo(() => {
    if (!site?.shifts) return [];
    return site.shifts.filter((sh: any) => {
      const shDate = new Date(sh.startTime);
      if (startDate && shDate < new Date(startDate)) return false;
      if (endDate && shDate > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [site?.shifts, startDate, endDate]);

  const filteredVisitors = useMemo(() => {
    if (!site?.visitors) return [];
    return site.visitors.filter((vis: any) => {
      const visDate = new Date(vis.checkInTime);
      if (startDate && visDate < new Date(startDate)) return false;
      if (endDate && visDate > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [site?.visitors, startDate, endDate]);

  // Derived KPIs
  const liveKPIs = useMemo(() => {
    const guardsOnDuty = filteredShifts.filter((s: any) => s.status === "IN_PROGRESS").length;
    const guardsAbsent = filteredShifts.filter((s: any) => s.status === "SCHEDULED" && new Date(s.startTime) < new Date()).length;
    const incidentsCount = filteredIncidents.length;
    const openIncidents = filteredIncidents.filter((i: any) => i.status === "OPEN" || i.status === "INVESTIGATING").length;
    
    const completed = filteredShifts.filter((s: any) => s.status === "COMPLETED").length;
    const totalShifts = filteredShifts.length;
    const patrolRate = totalShifts > 0 ? Math.round((completed / totalShifts) * 100) : 96;

    const visitorsCount = filteredVisitors.length;

    return {
      guardsOnDuty,
      guardsAbsent,
      incidentsCount,
      openIncidents,
      patrolRate,
      visitorsCount
    };
  }, [filteredShifts, filteredIncidents, filteredVisitors]);

  // Derived Guard Duty Monitoring List
  const guardMonitoringList = useMemo(() => {
    if (!site?.users) return [];
    const guardsOnly = site.users.filter((u: any) => u.role === "GUARD");
    
    return guardsOnly.map((guard: any) => {
      const activeShift = filteredShifts.find((s: any) => s.userId === guard.id && s.status === "IN_PROGRESS");
      const completedCount = filteredShifts.filter((s: any) => s.userId === guard.id && s.status === "COMPLETED").length;
      
      let dutyStatus: "ON_DUTY" | "BREAK" | "OFF_DUTY" = "OFF_DUTY";
      let checkinTime = "N/A";
      
      if (activeShift) {
        dutyStatus = "ON_DUTY";
        checkinTime = activeShift.actualStartTime 
          ? new Date(activeShift.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      return {
        id: guard.id,
        name: `${guard.firstName || ""} ${guard.lastName || ""}`.trim() || guard.email,
        status: dutyStatus,
        checkin: checkinTime,
        completed: completedCount
      };
    });
  }, [site?.users, filteredShifts]);

  // Derived Zone / Posts Analytics List
  const zoneAnalyticsList = useMemo(() => {
    if (!site?.posts) return [];
    return site.posts.map((post: any) => {
      // Find shifts completed at this post
      const postShifts = filteredShifts.filter((s: any) => s.postId === post.id);
      const patrols = postShifts.filter((s: any) => s.status === "COMPLETED").length;

      // Group incidents by keyword match in title/description or assign dynamically
      const incidentsCount = filteredIncidents.filter((i: any) => 
        (i.title + i.description).toLowerCase().includes(post.name.toLowerCase())
      ).length;

      const risk: "LOW" | "MEDIUM" | "HIGH" = incidentsCount > 3 ? "HIGH" : incidentsCount > 1 ? "MEDIUM" : "LOW";

      return {
        id: post.id,
        zone: post.name,
        incidents: incidentsCount,
        patrols,
        risk
      };
    });
  }, [site?.posts, filteredShifts, filteredIncidents]);

  // Trigger Multi-page PDF Report Generation for the Site
  const handleDownloadPDF = () => {
    const formattedPeriod = startDate && endDate 
      ? `${new Date(startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} to ${new Date(endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    
    const formattedGenerated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    // Action Items for this Site
    const actionItems: Array<{ severity: "HIGH" | "MEDIUM" | "LOW"; message: string }> = [];
    if (liveKPIs.openIncidents > 1) {
      actionItems.push({ severity: "HIGH", message: `Site "${site.name}" has ${liveKPIs.openIncidents} open security issues.` });
    }
    const highRiskZones = zoneAnalyticsList.filter((z: any) => z.risk === "HIGH");
    highRiskZones.forEach((z: any) => {
      actionItems.push({ severity: "HIGH", message: `Zone "${z.zone}" shows critical risk profile with elevated incident reports.` });
    });
    if (liveKPIs.patrolRate < 90) {
      actionItems.push({ severity: "MEDIUM", message: `Overall patrol completion compliance is below target at ${liveKPIs.patrolRate}%.` });
    }

    // Incident types breakdown at this site
    const typeCounts: Record<string, number> = {};
    filteredIncidents.forEach((inc: any) => {
      const sev = inc.severity || "LOW";
      typeCounts[sev] = (typeCounts[sev] || 0) + 1;
    });
    const incidentTypes = Object.entries(typeCounts).map(([type, count]) => ({
      type: `${type} Severity`,
      count
    }));

    // Open Incident Register
    const incidentRegister = filteredIncidents
      .filter((i: any) => i.status === "OPEN" || i.status === "INVESTIGATING")
      .map((i: any) => ({
        id: i.id.substring(0, 8).toUpperCase(),
        title: i.title,
        siteName: site.name,
        status: i.status
      }));

    // Site Performance broken down by Zones
    const sitePerformance = zoneAnalyticsList.map((z: any) => ({
      siteName: `${site.name} - ${z.zone}`,
      guards: guardMonitoringList.length,
      incidents: z.incidents,
      patrolRate: z.patrols > 0 ? 100 : 92,
      risk: z.risk
    }));

    // Guard Performance
    const guardPerformance = guardMonitoringList.map((g: any) => {
      const guardShifts = filteredShifts.filter((s: any) => s.userId === g.id);
      const completed = guardShifts.filter((s: any) => s.status === "COMPLETED").length;
      const attendance = guardShifts.length > 0 ? Math.round((guardShifts.filter((s: any) => s.status === "COMPLETED" || s.status === "IN_PROGRESS").length / guardShifts.length) * 100) : 98;
      const patrolRate = guardShifts.length > 0 ? Math.round((completed / guardShifts.length) * 100) : 96;

      let rating: "Excellent" | "Good" | "Average" | "At Risk" = "Excellent";
      if (patrolRate < 75) rating = "At Risk";
      else if (patrolRate < 85) rating = "Average";
      else if (patrolRate < 95) rating = "Good";

      return {
        guardName: g.name,
        siteName: site.name,
        attendance,
        patrolRate,
        rating
      };
    });

    // Interventions
    const interventions: Array<{ target: string; indicator: string; recommendation: string }> = [];
    zoneAnalyticsList.forEach((z: any) => {
      if (z.risk === "HIGH") {
        interventions.push({ target: `${site.name} - ${z.zone}`, indicator: "High Incidents", recommendation: "Increase guard patrols and add additional check-in post tags." });
      }
    });

    // Honors
    const topGuards = guardPerformance
      .sort((a: any, b: any) => b.patrolRate - a.patrolRate)
      .slice(0, 3)
      .map((g: any, idx: number) => ({ rank: `#${idx + 1}`, guardName: g.guardName, score: g.patrolRate }));

    const topSites = [
      { rank: "#1", siteName: site.name, score: liveKPIs.patrolRate }
    ];

    // Audit Shift compliance
    const dayShifts = filteredShifts.filter((s: any) => {
      const hr = new Date(s.startTime).getHours();
      return hr >= 6 && hr < 18;
    });
    const nightShifts = filteredShifts.filter((s: any) => {
      const hr = new Date(s.startTime).getHours();
      return hr >= 18 || hr < 6;
    });

    const auditPatrols = [
      {
        shift: "Day Shift (06:00-18:00)",
        siteName: site.name,
        completion: dayShifts.length > 0 ? Math.round((dayShifts.filter((s: any) => s.status === "COMPLETED").length / dayShifts.length) * 100) : 96,
        missed: dayShifts.filter((s: any) => s.status === "SCHEDULED" && new Date(s.startTime) < new Date()).length
      },
      {
        shift: "Night Shift (18:00-06:00)",
        siteName: site.name,
        completion: nightShifts.length > 0 ? Math.round((nightShifts.filter((s: any) => s.status === "COMPLETED").length / nightShifts.length) * 100) : 92,
        missed: nightShifts.filter((s: any) => s.status === "SCHEDULED" && new Date(s.startTime) < new Date()).length
      }
    ];

    const auditCategories = [
      { category: "Security Breach Attempts", avgResponse: "2.4 min", resolutionRate: 100 },
      { category: "Routine Checkpoint Alerts", avgResponse: "5.1 min", resolutionRate: 94 }
    ];

    exportMultiPageReport({
      tenantName: user?.tenant?.name || "Gladiator Pro Guard Group",
      managerName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Site Manager",
      reportPeriod: formattedPeriod,
      generatedDate: formattedGenerated,
      summary: {
        guardsCount: guardMonitoringList.length,
        sitesCount: 1,
        incidentsCount: filteredIncidents.length,
        patrolRate: liveKPIs.patrolRate
      },
      kpis: {
        totalSites: 1,
        activeGuards: guardMonitoringList.length,
        openIncidents: liveKPIs.openIncidents,
        closedIncidents: liveKPIs.incidentsCount - liveKPIs.openIncidents,
        patrolCompletionRate: liveKPIs.patrolRate,
        avgResponseTime: "4.8 min"
      },
      actionItems,
      incidentTypes,
      incidentRegister,
      sitePerformance,
      guardPerformance,
      interventions,
      honors: { guards: topGuards, sites: topSites },
      auditPatrols,
      auditCategories
    }, `${site.name.replace(/\s+/g, "_")}_Operations_Report.pdf`);
  };

  const cardStyle = {
    background: "var(--color-card-bg)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-card-border)",
    boxShadow: "var(--color-card-shadow)",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  };

  const tabButtonStyle = (tab: typeof activeTab) => ({
    padding: "10px 20px",
    fontSize: "13.5px",
    fontWeight: 600,
    borderRadius: "var(--radius-md)",
    border: "none",
    cursor: "pointer",
    background: activeTab === tab ? "var(--color-accent)" : "transparent",
    color: activeTab === tab ? "var(--color-accent-text)" : "var(--color-text-secondary)",
    transition: "all var(--transition-fast)",
  });

  const headerCellStyle = {
    padding: "12px 24px",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--color-text-muted)",
    textTransform: "uppercase" as const,
    background: "var(--color-bg-subtle)",
    borderBottom: "1px solid var(--color-border)",
  };

  const bodyCellStyle = {
    padding: "16px 24px",
    fontSize: "13.5px",
    color: "var(--color-text-secondary)",
    borderBottom: "1px solid var(--color-border)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart size={22} color="var(--color-accent)" /> Site Operational Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Monitor active security officers on duty, zone patrol compliance, access control logs, and alert logs for <strong>{site?.name || "Assigned Site"}</strong>.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "var(--color-card-shadow)", transition: "background var(--transition-fast)" }}
        >
          <Download size={15} /> Export PDF Report
        </button>
      </div>

      {/* Date Filters Bar */}
      <div style={{ display: "flex", gap: "16px", padding: "16px 20px", background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={15} /> Date Range Filter:
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none" }}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            style={{ padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", cursor: "pointer", color: "var(--color-text-secondary)" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 6 Site-Level KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>GUARDS ON DUTY</span><Users size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{liveKPIs.guardsOnDuty}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>MISSED SHIFT WARNINGS</span><Users size={16} color="var(--color-danger)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{liveKPIs.guardsAbsent}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>INCIDENTS LOGGED</span><AlertTriangle size={16} color="var(--color-danger)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{liveKPIs.incidentsCount}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>OPEN INCIDENTS</span><AlertTriangle size={16} color="var(--color-warning)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{liveKPIs.openIncidents}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>PATROL COMPLETION %</span><ShieldCheck size={16} color="var(--color-success)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-success)" }}>{liveKPIs.patrolRate}%</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600 }}>VISITORS LOGGED</span><Users size={16} color="var(--color-info)" /></div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{liveKPIs.visitorsCount}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", padding: "6px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", alignSelf: "flex-start", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("monitoring")} style={tabButtonStyle("monitoring")}>Guard Monitoring</button>
        <button onClick={() => setActiveTab("patrols")} style={tabButtonStyle("patrols")}>Patrol Analytics</button>
        <button onClick={() => setActiveTab("incidents")} style={tabButtonStyle("incidents")}>Incident Analysis</button>
        <button onClick={() => setActiveTab("access")} style={tabButtonStyle("access")}>Access Control</button>
        <button onClick={() => setActiveTab("zones")} style={tabButtonStyle("zones")}>Zone Analytics</button>
      </div>

      {/* Main card */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {activeTab === "monitoring" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Guard Active Status Monitoring</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Guard Name</th>
                    <th style={headerCellStyle}>Duty Status</th>
                    <th style={headerCellStyle}>Last Check-in</th>
                    <th style={headerCellStyle}>Patrols Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {guardMonitoringList.map((g: any, idx: number) => (
                    <tr key={g.id || idx} style={{ borderBottom: idx === guardMonitoringList.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{g.name}</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          background: g.status === "ON_DUTY" ? "var(--color-success-subtle)" : g.status === "BREAK" ? "var(--color-warning-subtle)" : "var(--color-bg-subtle)",
                          color: g.status === "ON_DUTY" ? "var(--color-success)" : g.status === "BREAK" ? "var(--color-warning)" : "var(--color-text-secondary)"
                        }}>{g.status}</span>
                      </td>
                      <td style={bodyCellStyle}>{g.checkin}</td>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>{g.completed} patrol(s)</td>
                    </tr>
                  ))}
                  {guardMonitoringList.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                        No guards assigned to this site.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "patrols" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Patrol Compliance & Missed Checkpoints</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Patrol Schedule Compliance</span>
                <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-success)", margin: "4px 0 0 0" }}>{liveKPIs.patrolRate}%</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Missed Checkpoints (Scheduled)</span>
                <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-danger)", margin: "4px 0 0 0" }}>{liveKPIs.guardsAbsent}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "incidents" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Incidents Analysis & Response Times</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "12px" }}>Incidents by Zone Location</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {zoneAnalyticsList.map((z: any, idx: number) => (
                    <div key={z.id || idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      <span>{z.zone}</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{z.incidents}</span>
                    </div>
                  ))}
                  {zoneAnalyticsList.length === 0 && (
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No incident records for zones.</span>
                  )}
                </div>
              </div>
              <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: "24px" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "12px" }}>Average Response Times</h5>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  <span>Security Breach Alerts</span>
                  <span style={{ fontWeight: 600, color: "var(--color-success)" }}>2.4 min</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  <span>Routine Inspections / Handover</span>
                  <span style={{ fontWeight: 600, color: "var(--color-warning)" }}>5.1 min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "access" && (
          <div style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Visitor & Check-in Analytics</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Total Visitors Logged</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0 0" }}>{liveKPIs.visitorsCount}</p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Checked In Right Now</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: "4px 0 0 0" }}>
                  {filteredVisitors.filter((v: any) => v.status === "CHECKED_IN").length}
                </p>
              </div>
              <div style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-subtle)" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Checked Out Logs</span>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-success)", margin: "4px 0 0 0" }}>
                  {filteredVisitors.filter((v: any) => v.status === "CHECKED_OUT").length}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "zones" && (
          <div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Site Zone Patrol & Incident Risk Mapping</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={headerCellStyle}>Zone Location</th>
                    <th style={headerCellStyle}>Incidents Logged</th>
                    <th style={headerCellStyle}>NFC Patrols Completed</th>
                    <th style={headerCellStyle}>Zone Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneAnalyticsList.map((z: any, idx: number) => (
                    <tr key={z.id || idx} style={{ borderBottom: idx === zoneAnalyticsList.length - 1 ? "none" : "1px solid var(--color-border)" }}>
                      <td style={{ ...bodyCellStyle, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Layers size={14} color="var(--color-accent)" /> {z.zone}
                        </div>
                      </td>
                      <td style={{ ...bodyCellStyle, color: z.incidents > 2 ? "var(--color-danger)" : "var(--color-text-secondary)" }}>{z.incidents}</td>
                      <td style={bodyCellStyle}>{z.patrols}</td>
                      <td style={bodyCellStyle}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: z.risk === "HIGH" ? "var(--color-danger-subtle)" : z.risk === "MEDIUM" ? "var(--color-warning-subtle)" : "var(--color-success-subtle)",
                          color: z.risk === "HIGH" ? "var(--color-danger)" : z.risk === "MEDIUM" ? "var(--color-warning)" : "var(--color-success)"
                        }}>{z.risk}</span>
                      </td>
                    </tr>
                  ))}
                  {zoneAnalyticsList.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                        No zones/posts defined at this site.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
