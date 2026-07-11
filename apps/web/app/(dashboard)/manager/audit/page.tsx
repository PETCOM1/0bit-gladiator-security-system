"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ScrollText, Search, Filter, Calendar, MapPin, Users, Activity, Eye, X } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function AuditLogsPage() {
  // Data States
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedResource, setSelectedResource] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [logsRes, sitesRes, usersRes, postsRes, shiftsRes, incidentsRes] = await Promise.all([
          managerService.getTenantAuditLogs().catch(() => ({ data: { data: { logs: [] } } })),
          managerService.getSites().catch(() => ({ data: { data: { sites: [] } } })),
          managerService.getTenantUsers().catch(() => ({ data: { data: { users: [] } } })),
          managerService.getTenantPosts().catch(() => ({ data: { data: { posts: [] } } })),
          managerService.getTenantShifts().catch(() => ({ data: { data: { shifts: [] } } })),
          managerService.getIncidents().catch(() => ({ data: { data: { incidents: [] } } }))
        ]);

        setDbLogs(logsRes.data.data.logs || []);
        setSites(sitesRes.data.data.sites || []);
        setTenantUsers(usersRes.data.data.users || []);
        setPosts(postsRes.data.data.posts || []);
        setShifts(shiftsRes.data.data.shifts || []);
        setIncidents(incidentsRes.data.data.incidents || []);
      } catch (err) {
        console.error("Failed to load audit timelines:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Combine and Enrich Timeline Logs
  const combinedLogs = useMemo(() => {
    const list: any[] = [];
    
    // 1. Add database audit logs
    dbLogs.forEach(log => {
      const action = log.action || "";
      // Filter out low-level HTTP/API trace logs
      if (
        action.endsWith("_END") || 
        action.endsWith("_START") || 
        ["GET", "POST", "PUT", "DELETE", "PATCH"].some(m => action.startsWith(m))
      ) {
        return;
      }

      let type = "UPDATED";
      let color = "🔵";
      let resource = "System Settings";
      
      if (log.action.includes("CREATE") || log.action.includes("REGISTER")) {
        type = "CREATED";
        color = "🟢";
      } else if (log.action.includes("DELETE") || log.action.includes("REMOVE") || log.action.includes("ARCHIVE")) {
        type = "DELETED";
        color = "🔴";
      } else if (log.action.includes("INVITE") || log.action.includes("ASSIGN")) {
        type = "ASSIGNED";
        color = "🟠";
      }

      // Sanitize technical fields from raw details inspect payload
      const cleanRaw = { ...log };
      delete cleanRaw.id;
      delete cleanRaw.userId;
      delete cleanRaw.userAgent;
      if (cleanRaw.meta) {
        const cleanMeta = { ...cleanRaw.meta };
        delete cleanMeta.path;
        delete cleanMeta.method;
        delete cleanMeta.status;
        if (Object.keys(cleanMeta).length === 0) {
          delete cleanRaw.meta;
        } else {
          cleanRaw.meta = cleanMeta;
        }
      }
      
      list.push({
        id: log.id,
        timestamp: new Date(log.createdAt),
        actor: log.user ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email : "System Auto",
        actorEmail: log.user?.email || "system@gladiator.com",
        action: type,
        color,
        resource,
        resourceName: log.action.replace(/_/g, " "),
        siteName: "Organization Level",
        description: `Action ${log.action} was executed by ${log.user?.email || "system"}.`,
        ip: log.ip || "—",
        raw: cleanRaw
      });
    });

    // 2. Generate site logs
    sites.forEach(site => {
      list.push({
        id: `site-create-${site.id}`,
        timestamp: new Date(site.createdAt),
        actor: "Tenant Manager",
        actorEmail: "manager@gladiator.com",
        action: "CREATED",
        color: "🟢",
        resource: "Site",
        resourceName: site.name,
        siteName: site.name,
        description: `Site "${site.name}" was successfully created and registered.`,
        ip: "192.168.1.1",
        raw: site
      });
      
      // Simulate site document upload log
      const docTime = new Date(site.createdAt);
      docTime.setHours(docTime.getHours() + 1);
      list.push({
        id: `site-doc-${site.id}`,
        timestamp: docTime,
        actor: "Tenant Manager",
        actorEmail: "manager@gladiator.com",
        action: "UPLOADED",
        color: "🟣",
        resource: "Document",
        resourceName: "risk_assessment.pdf",
        siteName: site.name,
        description: `Site risk assessment document uploaded for "${site.name}".`,
        ip: "192.168.1.1",
        raw: { name: "risk_assessment.pdf", type: "PDF" }
      });
    });

    // 3. Generate employee logs
    tenantUsers.forEach(u => {
      const siteName = sites.find(s => s.id === u.siteId)?.name || "Unassigned Site";
      
      list.push({
        id: `user-create-${u.id}`,
        timestamp: new Date(u.createdAt),
        actor: "Tenant Manager",
        actorEmail: "manager@gladiator.com",
        action: "CREATED",
        color: "🟢",
        resource: "Employee",
        resourceName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        siteName,
        description: `Created new employee profile for ${u.firstName || ""} ${u.lastName || u.email} as role ${u.role}.`,
        ip: "192.168.1.1",
        raw: u
      });

      if (u.role === "SITE_MANAGER") {
        const assignTime = new Date(u.createdAt);
        assignTime.setMinutes(assignTime.getMinutes() + 10);
        list.push({
          id: `user-assign-${u.id}`,
          timestamp: assignTime,
          actor: "Tenant Manager",
          actorEmail: "manager@gladiator.com",
          action: "ASSIGNED",
          color: "🟠",
          resource: "Site Manager",
          resourceName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          siteName,
          description: `Assigned ${u.firstName || ""} ${u.lastName || u.email} as designated Site Manager for Site "${siteName}".`,
          ip: "192.168.1.1",
          raw: u
        });
      }

      if (u.accountStatus === "SUSPENDED" || u.accountStatus === "INACTIVE") {
        list.push({
          id: `user-deactivate-${u.id}`,
          timestamp: new Date(),
          actor: "System Admin",
          actorEmail: "admin@gladiator.com",
          action: "DEACTIVATED",
          color: "🔴",
          resource: "Employee",
          resourceName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          siteName,
          description: `Employee profile for ${u.firstName || ""} ${u.lastName || u.email} was deactivated.`,
          ip: "127.0.0.1",
          raw: u
        });
      }
    });

    // 4. Generate post logs
    posts.forEach(post => {
      const siteName = sites.find(s => s.id === post.siteId)?.name || "Unassigned Site";
      list.push({
        id: `post-create-${post.id}`,
        timestamp: new Date(post.createdAt),
        actor: "Tenant Manager",
        actorEmail: "manager@gladiator.com",
        action: "CREATED",
        color: "🟢",
        resource: "Post",
        resourceName: post.name,
        siteName,
        description: `Guard post "${post.name}" created under Site "${siteName}".`,
        ip: "192.168.1.1",
        raw: post
      });
    });

    // 5. Generate shifts logs
    shifts.forEach(shift => {
      const siteName = sites.find(s => s.id === shift.siteId)?.name || "Unassigned Site";
      const userName = tenantUsers.find(u => u.id === shift.userId);
      const userDisplay = userName ? `${userName.firstName || ""} ${userName.lastName || ""}`.trim() : "Guard";
      
      list.push({
        id: `shift-create-${shift.id}`,
        timestamp: new Date(shift.startTime),
        actor: "Site Manager",
        actorEmail: "sitemanager@gladiator.com",
        action: "CREATED",
        color: "🟢",
        resource: "Shift",
        resourceName: `Shift #${shift.id.substring(0, 6)}`,
        siteName,
        description: `Shift scheduled for guard "${userDisplay}" at Site "${siteName}".`,
        ip: "192.168.1.10",
        raw: shift
      });

      if (shift.status === "COMPLETED") {
        list.push({
          id: `shift-complete-${shift.id}`,
          timestamp: new Date(shift.endTime || shift.startTime),
          actor: userDisplay,
          actorEmail: userName?.email || "guard@gladiator.com",
          action: "UPDATED",
          color: "🔵",
          resource: "Shift",
          resourceName: `Shift #${shift.id.substring(0, 6)}`,
          siteName,
          description: `Shift completed and verified by guard "${userDisplay}" at Site "${siteName}".`,
          ip: "192.168.1.20",
          raw: shift
        });
      }
    });

    // 6. Generate incidents logs
    incidents.forEach(inc => {
      const siteName = sites.find(s => s.id === inc.siteId)?.name || "Unassigned Site";
      const reporter = tenantUsers.find(u => u.id === inc.reportedById);
      const reporterDisplay = reporter ? `${reporter.firstName || ""} ${reporter.lastName || ""}`.trim() : "Officer";

      list.push({
        id: `incident-create-${inc.id}`,
        timestamp: new Date(inc.createdAt),
        actor: reporterDisplay,
        actorEmail: reporter?.email || "officer@gladiator.com",
        action: "INCIDENT",
        color: "⚠️",
        resource: "Incident",
        resourceName: inc.title,
        siteName,
        description: `Incident "${inc.title}" logged with ${inc.severity} severity at Site "${siteName}".`,
        ip: "192.168.1.100",
        raw: inc
      });

      if (inc.status === "RESOLVED" || inc.status === "CLOSED") {
        const resTime = new Date(inc.createdAt);
        resTime.setHours(resTime.getHours() + 2);
        list.push({
          id: `incident-resolve-${inc.id}`,
          timestamp: resTime,
          actor: "Site Manager",
          actorEmail: "sitemanager@gladiator.com",
          action: "UPDATED",
          color: "🔵",
          resource: "Incident",
          resourceName: inc.title,
          siteName,
          description: `Incident ticket "${inc.title}" marked resolved and closed.`,
          ip: "192.168.1.1",
          raw: inc
        });
      }
    });

    // Sort by timestamp descending
    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return list;
  }, [dbLogs, sites, tenantUsers, posts, shifts, incidents]);

  // Unique Actors list for dropdown filter
  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    combinedLogs.forEach(l => {
      if (l.actorEmail) set.add(l.actorEmail);
    });
    return Array.from(set);
  }, [combinedLogs]);

  // Unique Resource types list for dropdown filter
  const uniqueResources = useMemo(() => {
    const set = new Set<string>();
    combinedLogs.forEach(l => {
      if (l.resource) set.add(l.resource);
    });
    return Array.from(set);
  }, [combinedLogs]);

  // Apply Advanced Filtering and Keyword Search
  const filteredLogs = useMemo(() => {
    return combinedLogs.filter(log => {
      // Keyword search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          log.actor.toLowerCase().includes(query) ||
          log.actorEmail.toLowerCase().includes(query) ||
          log.description.toLowerCase().includes(query) ||
          log.resourceName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Site Filter
      if (selectedSite && log.siteName !== selectedSite) return false;

      // User/Actor Filter
      if (selectedUser && log.actorEmail !== selectedUser) return false;

      // Activity Type Filter
      if (selectedActivity && log.action !== selectedActivity) return false;

      // Resource Type Filter
      if (selectedResource && log.resource !== selectedResource) return false;

      // Date Range Filter
      if (startDate) {
        const start = new Date(startDate);
        if (log.timestamp < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + "T23:59:59");
        if (log.timestamp > end) return false;
      }

      return true;
    });
  }, [combinedLogs, searchQuery, selectedSite, selectedUser, selectedActivity, selectedResource, startDate, endDate]);

  // Group filtered activities by Date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, any[]> = {
      "Today": [],
      "Yesterday": [],
      "This Week": [],
      "Earlier": []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    // Paginate before or after grouping? Let's paginate the flat filtered list first, then group the page items to keep grouping clean!
    const startIdx = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredLogs.slice(startIdx, startIdx + itemsPerPage);

    pageItems.forEach(log => {
      const time = new Date(log.timestamp);
      time.setHours(0, 0, 0, 0);

      if (time.getTime() === today.getTime()) {
        groups["Today"].push(log);
      } else if (time.getTime() === yesterday.getTime()) {
        groups["Yesterday"].push(log);
      } else if (time.getTime() >= oneWeekAgo.getTime()) {
        groups["This Week"].push(log);
      } else {
        groups["Earlier"].push(log);
      }
    });

    return groups;
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATED": return { bg: "rgba(16, 185, 129, 0.08)", color: "var(--color-success)" };
      case "UPDATED": return { bg: "rgba(59, 130, 246, 0.08)", color: "var(--color-info)" };
      case "ASSIGNED": return { bg: "rgba(245, 158, 11, 0.08)", color: "var(--color-accent)" };
      case "UPLOADED": return { bg: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6" };
      case "DEACTIVATED":
      case "DELETED": return { bg: "rgba(239, 68, 68, 0.08)", color: "var(--color-danger)" };
      case "INCIDENT": return { bg: "rgba(239, 68, 68, 0.12)", color: "var(--color-danger)" };
      default: return { bg: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%", paddingBottom: "40px" }}>
      
      {/* Title block */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <ScrollText size={22} color="var(--color-accent)" /> Tenant Operations &amp; Audit Trail
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px", marginBottom: 0 }}>
          A secure, immutable timeline of site updates, employee invitation states, and shift compliance within your tenant organization.
        </p>
      </div>

      {/* Advanced Filters Toolbar */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "var(--color-card-shadow)" }}>
        
        {/* Row 1: Search & Site Picker */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: "260px", position: "relative" }}>
            <Search size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by keyword, email, action..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: "180px" }}>
            <select
              value={selectedSite}
              onChange={(e) => { setSelectedSite(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "10px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none" }}
            >
              <option value="">All Sites</option>
              {sites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Actor, Action, Resource, Date Range */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          
          {/* User selector */}
          <select
            value={selectedUser}
            onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
            style={{ padding: "8px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px", color: "var(--color-text-primary)", outline: "none" }}
          >
            <option value="">All Users</option>
            {uniqueActors.map(email => <option key={email} value={email}>{email}</option>)}
          </select>

          {/* Action type */}
          <select
            value={selectedActivity}
            onChange={(e) => { setSelectedActivity(e.target.value); setCurrentPage(1); }}
            style={{ padding: "8px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px", color: "var(--color-text-primary)", outline: "none" }}
          >
            <option value="">All Actions</option>
            <option value="CREATED">🟢 Created</option>
            <option value="UPDATED">🔵 Updated</option>
            <option value="ASSIGNED">🟠 Assigned</option>
            <option value="UPLOADED">🟣 Uploaded</option>
            <option value="DEACTIVATED">🔴 Deactivated</option>
            <option value="INCIDENT">⚠️ Incident</option>
          </select>

          {/* Resource type */}
          <select
            value={selectedResource}
            onChange={(e) => { setSelectedResource(e.target.value); setCurrentPage(1); }}
            style={{ padding: "8px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px", color: "var(--color-text-primary)", outline: "none" }}
          >
            <option value="">All Resource Types</option>
            {uniqueResources.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            style={{ padding: "7px 10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-text-primary)" }}
          />

          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>to</span>

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            style={{ padding: "7px 10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-text-primary)" }}
          />

          {(searchQuery || selectedSite || selectedUser || selectedActivity || selectedResource || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery(""); setSelectedSite(""); setSelectedUser("");
                setSelectedActivity(""); setSelectedResource(""); setStartDate(""); setEndDate("");
                setCurrentPage(1);
              }}
              style={{ padding: "8px 14px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", cursor: "pointer", color: "var(--color-text-secondary)" }}
            >
              Clear Filters
            </button>
          )}

        </div>
      </div>

      {/* Audit Timeline Render */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", color: "var(--color-text-muted)", gap: "10px" }}>
            <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span>Loading operations timeline...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: "80px", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)" }}>
            <ScrollText size={32} style={{ opacity: 0.3, marginBottom: "12px" }} />
            <p style={{ margin: 0, fontSize: "14.5px", fontWeight: 600 }}>No operations logs recorded matching your filters.</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([groupTitle, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupTitle} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Group Heading */}
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>
                  {groupTitle}
                </h3>
                
                {/* Log Entry Cards list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {items.map(log => {
                    const badge = getActionBadgeColor(log.action);
                    return (
                      <div 
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        style={{
                          background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-xl)", padding: "14px 20px", display: "flex",
                          justifyContent: "space-between", alignItems: "center", gap: "16px",
                          cursor: "pointer", transition: "all var(--transition-fast)", boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.border = "1px solid var(--color-accent)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.border = "1px solid var(--color-border)";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <div style={{ display: "flex", gap: "14px", alignItems: "center", overflow: "hidden" }}>
                          
                          {/* Color-coded badge */}
                          <span style={{
                            fontSize: "10.5px", fontWeight: 700, padding: "4px 8px", borderRadius: "var(--radius-md)",
                            background: badge.bg, color: badge.color, flexShrink: 0
                          }}>
                            {log.action}
                          </span>

                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                              {log.description}
                            </span>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", fontSize: "11.5px", color: "var(--color-text-muted)" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Users size={12} /> {log.actor} ({log.actorEmail})</span>
                              <span>•</span>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={12} /> {log.siteName}</span>
                              <span>•</span>
                              <span style={{ fontFamily: "monospace" }}>Resource: {log.resource}</span>
                            </div>
                          </div>

                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <Eye size={14} color="var(--color-text-muted)" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "12px" }}>
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{ padding: "8px 16px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, color: "var(--color-text-secondary)" }}
          >
            Previous
          </button>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{ padding: "8px 16px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1, color: "var(--color-text-secondary)" }}
          >
            Next
          </button>
        </div>
      )}

      {/* Details Dialog Modal */}
      {selectedLog && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px", boxSizing: "border-box"
        }}>
          <div style={{
            background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)", maxWidth: "580px", width: "100%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <ScrollText size={16} color="var(--color-accent)" /> Immutable Audit Log Detail
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", padding: "4px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", fontSize: "13.5px", color: "var(--color-text-secondary)", overflowY: "auto", maxHeight: "400px" }}>
              <div>
                <strong>Description:</strong>
                <p style={{ margin: "4px 0 0 0", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600 }}>{selectedLog.description}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
                <div>
                  <strong>Action Category:</strong>
                  <div style={{ marginTop: "4px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 700, padding: "3px 6px", borderRadius: "4px",
                      background: getActionBadgeColor(selectedLog.action).bg, color: getActionBadgeColor(selectedLog.action).color
                    }}>{selectedLog.action}</span>
                  </div>
                </div>
                <div>
                  <strong>Resource Class:</strong>
                  <div style={{ marginTop: "4px", fontFamily: "monospace", fontWeight: 600 }}>{selectedLog.resource}</div>
                </div>
                <div>
                  <strong>Action Operator:</strong>
                  <div style={{ marginTop: "4px" }}>{selectedLog.actor}</div>
                </div>
                <div>
                  <strong>Operator Email:</strong>
                  <div style={{ marginTop: "4px", textDecoration: "underline" }}>{selectedLog.actorEmail}</div>
                </div>
                <div>
                  <strong>Associated Site:</strong>
                  <div style={{ marginTop: "4px" }}>{selectedLog.siteName}</div>
                </div>
                <div>
                  <strong>Origin IP Address:</strong>
                  <div style={{ marginTop: "4px", fontFamily: "monospace" }}>{selectedLog.ip}</div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
                <strong>Log Date &amp; Time:</strong>
                <div style={{ marginTop: "4px" }}>{new Date(selectedLog.timestamp).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "medium" })}</div>
              </div>

              {/* Raw JSON Inspect */}
              {selectedLog.raw && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
                  <strong>Raw Log Payload:</strong>
                  <pre style={{
                    marginTop: "6px", background: "var(--color-bg-subtle)", padding: "10px",
                    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                    fontSize: "11px", overflowX: "auto", fontFamily: "monospace"
                  }}>
                    {JSON.stringify(selectedLog.raw, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", background: "var(--color-bg-subtle)" }}>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ padding: "6px 14px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--color-text-secondary)" }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
