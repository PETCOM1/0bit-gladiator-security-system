"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, ArrowLeft, Mail, Phone, MapPin, Users, Activity, CheckCircle2, DollarSign, Ban, Play, ChevronDown, ChevronUp } from "lucide-react";
import { superAdminService } from "../services/tenant.service";

export default function TenantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Subsection Toggle States
  const [managersOpen, setManagersOpen] = useState(true);
  const [supervisorsOpen, setSupervisorsOpen] = useState(true);
  const [guardsOpen, setGuardsOpen] = useState(true);
  const [othersOpen, setOthersOpen] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    superAdminService.getTenantById(params.id as string)
      .then(res => setTenant(res.data?.data?.tenant))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleToggleStatus = async () => {
    if (!tenant || updating) return;
    
    const newStatus = tenant.subscriptionStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    if (!confirm(`Are you sure you want to ${newStatus === "SUSPENDED" ? "suspend" : "activate"} this tenant?`)) return;

    setUpdating(true);
    try {
      await superAdminService.updateTenantStatus(tenant.id, newStatus);
      setTenant({ ...tenant, subscriptionStatus: newStatus });
    } catch (err) {
      console.error(err);
      alert("Failed to update tenant status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", color: "var(--color-text-muted)" }}>Loading tenant profile...</div>;
  }

  if (!tenant) {
    return <div style={{ padding: "40px", color: "var(--color-danger)" }}>Tenant not found.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
              {tenant.name}
              <span style={{
                padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700,
                background: tenant.subscriptionStatus === "SUSPENDED" ? "var(--color-danger-subtle)" : "var(--color-success-subtle)", 
                color: tenant.subscriptionStatus === "SUSPENDED" ? "var(--color-danger)" : "var(--color-success)", textTransform: "uppercase"
              }}>
                {tenant.subscriptionStatus}
              </span>
            </h1>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Tenant ID: <span style={{ fontFamily: "monospace" }}>{tenant.id}</span>
            </p>
          </div>
        </div>

        <button 
          onClick={handleToggleStatus}
          disabled={updating}
          style={{ 
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 16px", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600,
            background: tenant.subscriptionStatus === "SUSPENDED" ? "var(--color-success)" : "var(--color-danger)",
            color: "white", border: "none", cursor: updating ? "not-allowed" : "pointer",
            transition: "all var(--transition-fast)", opacity: updating ? 0.7 : 1
          }}
        >
          {tenant.subscriptionStatus === "SUSPENDED" ? <Play size={16} /> : <Ban size={16} />}
          {updating ? "Updating..." : tenant.subscriptionStatus === "SUSPENDED" ? "Activate Tenant" : "Suspend Tenant"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        
        {/* Company Overview Card */}
        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={18} color="var(--color-accent)" /> Company Details
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Type</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500 }}>{tenant.orgType || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Reg Number</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500 }}>{tenant.registrationNumber || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Contact Email</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}><Mail size={14}/> {tenant.contactEmail || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Contact Phone</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}><Phone size={14}/> {tenant.contactPhone || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Address</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", textAlign: "right", maxWidth: "200px" }}><MapPin size={14} style={{ flexShrink: 0 }}/> {tenant.physicalAddress || "—"}</span>
            </div>
          </div>
        </div>

        {/* Subscription Info Card */}
        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="var(--color-accent)" /> Subscription & Usage
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Plan</span>
              <span style={{
                padding: "2px 8px", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700,
                background: "var(--color-info-subtle)", color: "var(--color-info)", textTransform: "uppercase"
              }}>
                {tenant.subscriptionPlan}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Billing Cycle</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500 }}>{tenant.billingCycle}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Expected Sites</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500 }}>{tenant.expectedSites || "Unlimited"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Allowed Users</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500 }}>{tenant.allowedUsers || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "13px", fontWeight: 600 }}>Onboarded Date</span>
              <span style={{ color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 500 }}>{new Date(tenant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Users / Admins Table */}
      {(() => {
        const managers = (tenant.users || []).filter((u: any) => u.role === "MANAGER" || u.role === "ADMIN" || u.role === "SUPER_ADMIN");
        const supervisors = (tenant.users || []).filter((u: any) => u.role === "SITE_MANAGER");
        const guards = (tenant.users || []).filter((u: any) => u.role === "USER");
        const others = (tenant.users || []).filter((u: any) => u.role !== "MANAGER" && u.role !== "ADMIN" && u.role !== "SUPER_ADMIN" && u.role !== "SITE_MANAGER" && u.role !== "USER");

        const renderUserTable = (usersList: any[], emptyMessage: string) => {
          if (usersList.length === 0) {
            return (
              <div style={{ padding: "20px 24px", color: "var(--color-text-muted)", fontSize: "13.5px", fontStyle: "italic" }}>
                {emptyMessage}
              </div>
            );
          }
          return (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Name", "Email", "Role", "Status"].map(h => (
                      <th key={h} style={{
                        padding: "10px 24px", textAlign: "left", fontSize: "10.5px", fontWeight: 700,
                        color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u: any, i: number) => (
                    <tr key={u.id} style={{ borderBottom: i < usersList.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <td style={{ padding: "14px 24px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{u.firstName} {u.lastName}</td>
                      <td style={{ padding: "14px 24px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>{u.email}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ padding: "3px 8px", background: "var(--color-bg-subtle)", borderRadius: "4px", fontSize: "11.5px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>{u.role}</span>
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700,
                          background: u.accountStatus === 'ACTIVE' ? "var(--color-success-subtle)" : "var(--color-warning-subtle)", 
                          color: u.accountStatus === 'ACTIVE' ? "var(--color-success)" : "var(--color-warning)", textTransform: "uppercase"
                        }}>
                          {u.accountStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Managers Section */}
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              <div 
                onClick={() => setManagersOpen(!managersOpen)}
                style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-subtle)", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Users size={16} color="var(--color-accent)" />
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Management & Admins</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", background: "var(--color-border)", padding: "2px 8px", borderRadius: "10px" }}>{managers.length}</span>
                  {managersOpen ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>
              {managersOpen && renderUserTable(managers, "No management personnel found.")}
            </div>

            {/* Supervisors Section */}
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              <div 
                onClick={() => setSupervisorsOpen(!supervisorsOpen)}
                style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-subtle)", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Users size={16} color="var(--color-info)" />
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Site Supervisors</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", background: "var(--color-border)", padding: "2px 8px", borderRadius: "10px" }}>{supervisors.length}</span>
                  {supervisorsOpen ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>
              {supervisorsOpen && renderUserTable(supervisors, "No site supervisors found.")}
            </div>

            {/* Guards Section */}
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
              <div 
                onClick={() => setGuardsOpen(!guardsOpen)}
                style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-subtle)", cursor: "pointer", userSelect: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Users size={16} color="var(--color-success)" />
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>On-Site Security Guards</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", background: "var(--color-border)", padding: "2px 8px", borderRadius: "10px" }}>{guards.length}</span>
                  {guardsOpen ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>
              {guardsOpen && renderUserTable(guards, "No active security guards registered.")}
            </div>

            {others.length > 0 && (
              <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
                <div 
                  onClick={() => setOthersOpen(!othersOpen)}
                  style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-subtle)", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Users size={16} color="var(--color-text-secondary)" />
                    <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Other Personnel</h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", background: "var(--color-border)", padding: "2px 8px", borderRadius: "10px" }}>{others.length}</span>
                    {othersOpen ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                  </div>
                </div>
                {othersOpen && renderUserTable(others, "")}
              </div>
            )}
          </div>
        );
      })()}

      {/* Payment History Table */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <DollarSign size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Payment History</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Date", "Amount", "Currency", "Invoice Number", "Status"].map(h => (
                  <th key={h} style={{
                    padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: 700,
                    color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!tenant.payments || tenant.payments.length === 0) ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>
                    No payment history available.
                  </td>
                </tr>
              ) : (
                tenant.payments.map((p: any, i: number) => (
                  <tr key={p.id} style={{ borderBottom: i < tenant.payments.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{p.amount.toFixed(2)}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>{p.currency}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-primary)", fontFamily: "monospace" }}>{p.invoiceNumber || "—"}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700,
                        background: p.status === 'PAID' ? "var(--color-success-subtle)" : p.status === 'FAILED' ? "var(--color-danger-subtle)" : "var(--color-warning-subtle)", 
                        color: p.status === 'PAID' ? "var(--color-success)" : p.status === 'FAILED' ? "var(--color-danger)" : "var(--color-warning)", textTransform: "uppercase"
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
