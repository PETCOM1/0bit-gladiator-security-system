"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { managerService } from "@/features/manager/services/manager.service";
import { MapPin, Users, ShieldAlert, Contact, Calendar, Activity, Info, ArrowLeft } from "lucide-react";

interface Props {
  siteId: string;
  hideBackButton?: boolean;
}

export default function SiteDetailsView({ siteId, hideBackButton }: Props) {
  const router = useRouter();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "incidents" | "visitors" | "personnel" | "shifts">("overview");

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

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading site profile...</div>;
  if (!site) return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-danger)" }}>Site not found or access denied.</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: <Info size={16} /> },
    { id: "incidents", label: "Occurrence Book", icon: <ShieldAlert size={16} /> },
    { id: "visitors", label: "Visitor Book", icon: <Contact size={16} /> },
    { id: "personnel", label: "Personnel", icon: <Users size={16} /> },
    { id: "shifts", label: "Shifts", icon: <Calendar size={16} /> }
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {!hideBackButton && (
          <button 
            onClick={() => router.back()}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", 
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", 
              borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-secondary)",
              transition: "all var(--transition-fast)" 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <MapPin size={28} color="var(--color-accent)" /> {site.name}
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px", marginBottom: 0 }}>
            {site.address || "No address provided"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", overflowX: "auto" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
              background: activeTab === tab.id ? "var(--color-sidebar-item-active-bg)" : "transparent",
              color: activeTab === tab.id ? "var(--color-sidebar-text-active)" : "var(--color-text-secondary)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: "pointer", transition: "all var(--transition-fast)", whiteSpace: "nowrap"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        
        {activeTab === "overview" && (
          <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
              <div style={{ background: "var(--color-bg-subtle)", padding: "20px", borderRadius: "var(--radius-lg)" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Total Personnel</p>
                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{site.users?.length || 0}</h2>
              </div>
              <div style={{ background: "var(--color-bg-subtle)", padding: "20px", borderRadius: "var(--radius-lg)" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Total Incidents</p>
                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{site.incidents?.length || 0}</h2>
              </div>
              <div style={{ background: "var(--color-bg-subtle)", padding: "20px", borderRadius: "var(--radius-lg)" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Total Visitors</p>
                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{site.visitors?.length || 0}</h2>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>Live Site Coverage</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {site.posts?.length === 0 ? (
                  <div style={{ padding: "20px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", color: "var(--color-text-muted)", textAlign: "center" }}>No posts configured.</div>
                ) : site.posts?.map((post: any) => {
                  const activeShift = site.shifts?.find((s: any) => s.status === "IN_PROGRESS" && s.postId === post.id);
                  return (
                    <div key={post.id} style={{ padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: activeShift ? "var(--color-success-subtle)" : "var(--color-danger-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>{post.name}</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: activeShift ? "var(--color-success)" : "var(--color-danger)", fontWeight: 500, marginTop: "4px" }}>
                          {activeShift ? `Covered by ${activeShift.user?.firstName}` : "Unmanned"}
                        </p>
                      </div>
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: activeShift ? "var(--color-success)" : "var(--color-danger)" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "incidents" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                <tr>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Incident</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Severity</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Reported By</th>
                </tr>
              </thead>
              <tbody>
                {site.incidents.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No incidents recorded.</td></tr>
                ) : site.incidents.map((inc: any, i: number) => (
                  <tr key={inc.id} style={{ borderBottom: i < site.incidents.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500 }}>{new Date(inc.createdAt).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{inc.title}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, background: inc.severity === "CRITICAL" ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)", color: inc.severity === "CRITICAL" ? "var(--color-danger)" : "var(--color-warning)" }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, background: inc.status === "RESOLVED" ? "var(--color-success-subtle)" : "var(--color-bg-subtle)", color: inc.status === "RESOLVED" ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-muted)" }}>{inc.reportedBy?.firstName || "-"} {inc.reportedBy?.lastName || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "visitors" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                <tr>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Name</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Company</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Host</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Check In</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Check Out</th>
                </tr>
              </thead>
              <tbody>
                {site.visitors.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No visitors recorded.</td></tr>
                ) : site.visitors.map((v: any, i: number) => (
                  <tr key={v.id} style={{ borderBottom: i < site.visitors.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{v.name}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-muted)" }}>{v.company || "-"}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-muted)" }}>{v.hostName || "-"}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500 }}>{new Date(v.checkInTime).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500, color: v.checkOutTime ? "var(--color-text-primary)" : "var(--color-warning)" }}>{v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "Active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "personnel" && (
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
            {site.users.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", gridColumn: "1 / -1" }}>No personnel assigned to this site.</div>
            ) : site.users.map((u: any) => (
              <div key={u.id} style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-subtle)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "20px", background: "var(--color-accent-subtle)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
                  {u.firstName?.[0] || ""}{u.lastName?.[0] || ""}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>{u.firstName} {u.lastName}</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>{u.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "shifts" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                <tr>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Personnel</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Start Time</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>End Time</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {site.shifts.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No shifts scheduled.</td></tr>
                ) : site.shifts.map((s: any, i: number) => (
                  <tr key={s.id} style={{ borderBottom: i < site.shifts.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{s.user?.firstName || "-"} {s.user?.lastName || ""}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500 }}>{new Date(s.startTime).toLocaleString()}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500, color: s.endTime ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{s.endTime ? new Date(s.endTime).toLocaleString() : "Active"}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, background: s.status === "COMPLETED" ? "var(--color-success-subtle)" : "var(--color-bg-subtle)", color: s.status === "COMPLETED" ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
