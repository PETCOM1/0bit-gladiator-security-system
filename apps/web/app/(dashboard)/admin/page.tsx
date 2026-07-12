"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Building2, Plus, X, CheckCircle2, ChevronRight, ChevronLeft, Users, Search, Filter, ShieldAlert } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { superAdminService } from "@/features/super-admin/services/tenant.service";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/shared/context/AuthContext";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize: "14px",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color var(--transition-fast)",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function PlatformAdminDashboardContent() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const greeting = user?.firstName ? `${getGreeting()}, ${user.firstName}` : "Welcome Back";
  const [isModalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("onboard") === "true") {
      setStep(1);
      setModalOpen(true);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    name: "", orgType: "Security Company", registrationNumber: "", physicalAddress: "", countryRegion: "",
    contactEmail: "", contactPhone: "", expectedSites: "", timeZone: "UTC",
    subscriptionTierId: "tier-basic", billingCycle: "MONTHLY", allowedUsers: "50",
    adminFirstName: "", adminLastName: "", adminEmail: ""
  });

  const loadData = async () => {
    try {
      const [tenantsRes, statsRes] = await Promise.all([
        superAdminService.getTenants(),
        superAdminService.getStats()
      ]);
      setTenants(tenantsRes.data?.data?.tenants || []);
      setStats(statsRes.data?.data || null);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) return setStep(step + 1);
    
    setIsSubmitting(true);
    try {
      await superAdminService.createTenant(formData);
      setModalOpen(false);
      setStep(1);
      setFormData({
        name: "", orgType: "Security Company", registrationNumber: "", physicalAddress: "", countryRegion: "",
        contactEmail: "", contactPhone: "", expectedSites: "", timeZone: "UTC",
        subscriptionTierId: "tier-basic", billingCycle: "MONTHLY", allowedUsers: "50",
        adminFirstName: "", adminLastName: "", adminEmail: ""
      });
      loadData();
      alert("Tenant onboarded successfully! An invite email has been sent to the admin.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to onboard tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "ALL" || (t.subscriptionTier?.name || "BASIC") === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage) || 1;
  const paginatedTenants = filteredTenants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterPlan]);

  // Cumulative tenant count per month, derived from each tenant's real
  // signup date — spans from the first tenant's onboarding month through
  // the current month, so the trend line reflects actual platform growth.
  const growthData = React.useMemo(() => {
    if (tenants.length === 0) return [];
    const sorted = [...tenants].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const now = new Date();
    const cursor = new Date(new Date(sorted[0].createdAt).getFullYear(), new Date(sorted[0].createdAt).getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);

    const months: { label: string; monthStart: Date }[] = [];
    while (cursor <= end) {
      months.push({
        label: cursor.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" }),
        monthStart: new Date(cursor),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months.map(({ label, monthStart }) => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
      const cutoff = monthEnd < now ? monthEnd : now;
      const count = sorted.filter(t => new Date(t.createdAt) <= cutoff).length;
      return { name: label, tenants: count };
    });
  }, [tenants]);
  const growthTickInterval = Math.max(0, Math.ceil(growthData.length / 7) - 1);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-card-bg)",
    padding: "24px",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-card-border)",
    boxShadow: "var(--color-card-shadow)",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)",
    cursor: "default"
  };

  const iconWrapperStyle = (bg: string, color: string) => ({
    background: bg,
    color: color,
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            {greeting} (Platform Admin)
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Telemetry, analytics, and tenant management for Gladiator Pro portals.
          </p>
        </div>
        <button
          onClick={() => { setStep(1); setModalOpen(true); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "var(--color-accent)",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--color-accent-text)",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
            transition: "opacity var(--transition-fast)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Plus size={16} strokeWidth={2.2} /> Onboard Company
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        
        {/* MRR */}
        <div 
          style={cardStyle}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-success)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-success-subtle)", "var(--color-success)")}>
            <Building2 size={24} />
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Monthly Recurring Revenue</p>
            <h3 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
              R{stats?.mrr?.toLocaleString() || "0"}
            </h3>
          </div>
        </div>

        {/* Active Tenants */}
        <div 
          style={cardStyle}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={iconWrapperStyle("var(--color-accent-subtle)", "var(--color-accent)")}>
            <Building2 size={24} />
          </div>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Active Companies</p>
            <h3 style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{stats?.totalTenants || 0}</h3>
          </div>
        </div>

        {/* Usage Stats Card */}
        <div 
          style={{ ...cardStyle, gridColumn: "span 1" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--color-info)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Usage & Logs</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Total Geofence Sites</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.totalSites || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Security Guard Officers</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{stats?.totalGuards || 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Growth Chart */}
      <div style={{ 
        background: "var(--color-card-bg)", 
        padding: "24px", 
        borderRadius: "var(--radius-xl)", 
        border: "1px solid var(--color-card-border)", 
        boxShadow: "var(--color-card-shadow)" 
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "24px" }}>
          Tenant Growth Telemetry {growthData.length > 0 ? `(${growthData.length}-Month Trend)` : ""}
        </h3>
        <div style={{ height: "250px", width: "100%" }}>
          {growthData.length === 0 ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "var(--color-text-muted)" }}>
              No tenant signups yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} interval={growthTickInterval} tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} dx={-10} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--color-card-shadow)" }}
                  itemStyle={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600 }}
                  formatter={(value) => [`${value} tenants`, "Cumulative"]}
                />
                <Line type="monotone" dataKey="tenants" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div style={{
        background: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--color-card-shadow)",
        overflow: "hidden"
      }}>
        {/* Table Filters Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Building2 size={18} color="var(--color-accent)" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Active Platforms</h2>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input 
                type="text" placeholder="Search tenants..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "32px", width: "220px", padding: "8px 12px 8px 32px" }} 
              />
            </div>
            <div style={{ position: "relative" }}>
              <Filter size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ ...selectStyle, paddingLeft: "32px", width: "160px", padding: "8px 12px 8px 32px" }}>
                <option value="ALL">All Plans</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                {["Company Name", "Contact Email", "Plan", "Tenant ID", "Joined Date"].map(h => (
                  <th key={h} style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em"
                  }}>{h}</th>
                ))}
                <th style={{ padding: "12px 24px" }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>
                    No tenants matching filters.
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((t, idx) => (
                  <tr key={t.id} 
                    onClick={() => router.push(`/admin/tenants/${t.id}`)}
                    style={{ cursor: "pointer", borderBottom: idx < paginatedTenants.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{t.name}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{t.contactEmail || "—"}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700,
                        background: "var(--color-info-subtle)", color: "var(--color-info)", textTransform: "uppercase"
                      }}>
                        {t.subscriptionTier?.name || "BASIC"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{t.id}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}><ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Showing {filteredTenants.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTenants.length)} of {filteredTenants.length} tenants
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}
              style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <button 
              disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}
              style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Onboard Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px"
        }}>
          <div className="glass-panel animate-fade-in" style={{
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "600px", maxHeight: "90vh",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            
            {/* Modal Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Onboard New Tenant</h2>
                <button onClick={() => setModalOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-muted)", cursor: "pointer", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                  <X size={16} />
                </button>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {[1, 2, 3].map((s, idx) => (
                  <React.Fragment key={s}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: step >= s ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                      <div style={{
                        width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 700, background: step >= s ? "var(--color-accent)" : "var(--color-bg-subtle)",
                        color: step >= s ? "#0b0f19" : "var(--color-text-muted)"
                      }}>{s}</div>
                      <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {s === 1 ? "Organization" : s === 2 ? "Subscription" : "Admin Setup"}
                      </span>
                    </div>
                    {idx < 2 && <div style={{ flex: 1, height: "1px", background: "var(--color-border)", margin: "0 8px" }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "28px 24px", overflowY: "auto", flex: 1 }}>
              <form id="onboard-form" onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {step === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={labelStyle}>Organization Name <span style={{ color: "var(--color-danger)" }}>*</span></label>
                      <input required name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="e.g. Gladiator Pro" autoFocus />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Organization Type</label>
                        <select name="orgType" value={formData.orgType} onChange={handleChange} style={selectStyle}>
                          <option style={{ background: "var(--color-card-bg)" }}>Security Company</option>
                          <option style={{ background: "var(--color-card-bg)" }}>School</option>
                          <option style={{ background: "var(--color-card-bg)" }}>Office</option>
                          <option style={{ background: "var(--color-card-bg)" }}>Estate</option>
                          <option style={{ background: "var(--color-card-bg)" }}>Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Registration Number</label>
                        <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} style={inputStyle} placeholder="Company Reg No." />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Contact Email <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <input required type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} style={inputStyle} placeholder="billing@company.com" />
                      </div>
                      <div>
                        <label style={labelStyle}>Contact Phone</label>
                        <input name="contactPhone" value={formData.contactPhone} onChange={handleChange} style={inputStyle} placeholder="+27 11 123 4567" />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Physical Address</label>
                      <input name="physicalAddress" value={formData.physicalAddress} onChange={handleChange} style={inputStyle} placeholder="123 Corporate Rd, Johannesburg" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Subscription Plan <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <select name="subscriptionTierId" value={formData.subscriptionTierId} onChange={handleChange} style={selectStyle}>
                          <option value="tier-basic" style={{ background: "var(--color-card-bg)" }}>Basic</option>
                          <option value="tier-pro" style={{ background: "var(--color-card-bg)" }}>Pro</option>
                          <option value="tier-enterprise" style={{ background: "var(--color-card-bg)" }}>Enterprise</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Billing Cycle <span style={{ color: "var(--color-danger)" }}>*</span></label>
                        <select name="billingCycle" value={formData.billingCycle} onChange={handleChange} style={selectStyle}>
                          <option value="MONTHLY" style={{ background: "var(--color-card-bg)" }}>Monthly</option>
                          <option value="YEARLY" style={{ background: "var(--color-card-bg)" }}>Yearly</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Allowed Users</label>
                        <input type="number" name="allowedUsers" value={formData.allowedUsers} onChange={handleChange} style={inputStyle} placeholder="50" />
                      </div>
                      <div>
                        <label style={labelStyle}>Expected Sites</label>
                        <input type="number" name="expectedSites" value={formData.expectedSites} onChange={handleChange} style={inputStyle} placeholder="10" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ background: "rgba(245,158,11,0.06)", color: "var(--color-accent)", padding: "14px 16px", borderRadius: "var(--radius-md)", fontSize: "13px", display: "flex", gap: "10px", border: "1px solid rgba(245,158,11,0.2)", lineHeight: 1.5 }}>
                      <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span>On completion, a secure invite link will be sent to the administrator to set their password.</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Admin First Name</label>
                        <input name="adminFirstName" value={formData.adminFirstName} onChange={handleChange} style={inputStyle} placeholder="John" autoFocus />
                      </div>
                      <div>
                        <label style={labelStyle}>Admin Last Name</label>
                        <input name="adminLastName" value={formData.adminLastName} onChange={handleChange} style={inputStyle} placeholder="Doe" />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Admin Email Address <span style={{ color: "var(--color-danger)" }}>*</span></label>
                      <input required type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} style={inputStyle} placeholder="admin@company.com" />
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} style={{
                  padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                  fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                }}>
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}
              
              <button 
                form="onboard-form" type="submit" disabled={isSubmitting}
                style={{
                  padding: "8px 20px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
                  fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "6px", opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)"
                }}
              >
                {step < 3 ? (
                  <>Continue <ChevronRight size={16} /></>
                ) : isSubmitting ? (
                  "Provisioning..."
                ) : (
                  <>Complete Onboarding <CheckCircle2 size={16} /></>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformAdminDashboard() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading platform admin panel...</span>
      </div>
    }>
      <PlatformAdminDashboardContent />
    </Suspense>
  );
}
