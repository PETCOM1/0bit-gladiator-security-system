"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Shield, UserCog, Ban, Mail, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function SiteManagerPersonnelPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [inviteForm, setInviteForm] = useState({
    email: "", firstName: "", lastName: "", role: "GUARD" as "SITE_MANAGER" | "GUARD", siteId: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, siteRes] = await Promise.all([
        managerService.getTenantUsers(),
        managerService.getSites()
      ]);
      setUsers(userRes.data.data.users || []);
      setSites(siteRes.data.data.sites || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await managerService.inviteUser(inviteForm);
      setIsInviting(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "GUARD", siteId: "" });
      loadData();
      alert("Invitation sent successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send invitation.");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await managerService.updateUserRole(userId, newRole);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update role.");
    }
  };

  const handleSiteChange = async (userId: string, newSiteId: string) => {
    try {
      await managerService.assignUserToSite(userId, newSiteId);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to reassign site.");
    }
  };

  const handleToggleStatus = async (user: any) => {
    const action = user.accountStatus === "ACTIVE" ? "suspend" : "activate";
    try {
      await managerService.disableUser(user.id);
      loadData();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} user.`);
    }
  };

  // Search & Pagination Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const employeeId = (u.employeeId || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || email.includes(search) || employeeId.includes(search);
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  
  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const inputStyle = {
    width: "100%", padding: "8px 12px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "13px", color: "var(--color-text-primary)", outline: "none"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Users size={24} color="var(--color-accent)" /> Personnel Management
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Manage Security Officers and Site Managers across all your locations.
          </p>
        </div>
        <button
          onClick={() => {
            setInviteForm({ email: "", firstName: "", lastName: "", role: "GUARD", siteId: sites[0]?.id || "" });
            setIsInviting(true);
          }}
          style={{ 
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", 
            background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", 
            fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", 
            cursor: "pointer", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)" 
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> Invite Personnel
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center", boxShadow: "var(--color-card-shadow)" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search personnel by name, email, or ID..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px", height: "38px" }}
          />
        </div>
      </div>

      {/* Directory Table */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Personnel</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Assigned Site</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span>Loading personnel...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No personnel found.</td></tr>
              ) : paginatedUsers.map((u, i) => (
                <tr 
                  key={u.id} 
                  onClick={() => router.push(`/site-manager/officers/${u.id}`)}
                  style={{ 
                    borderBottom: i < paginatedUsers.length - 1 ? "1px solid var(--color-border)" : "none", 
                    transition: "background var(--transition-fast)",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>{u.firstName} {u.lastName}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "16px 24px" }} onClick={e => e.stopPropagation()}>
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}
                    >
                      <option value="SITE_MANAGER">Site Manager</option>
                      <option value="GUARD">Security Officer</option>
                    </select>
                  </td>
                  <td style={{ padding: "16px 24px" }} onClick={e => e.stopPropagation()}>
                    <select 
                      value={u.site?.id || ""} 
                      onChange={(e) => handleSiteChange(u.id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)", cursor: "pointer", maxWidth: "160px" }}
                    >
                      <option value="" disabled>No Site</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: u.accountStatus === "ACTIVE" ? "var(--color-success-subtle)" : 
                                 u.accountStatus === "PENDING" ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)",
                      color: u.accountStatus === "ACTIVE" ? "var(--color-success)" : 
                             u.accountStatus === "PENDING" ? "var(--color-warning)" : "var(--color-danger)"
                    }}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleToggleStatus(u)}
                      style={{ 
                        padding: "6px 12px", background: "transparent", 
                        border: `1px solid ${u.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)"}`, 
                        borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, 
                        color: u.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)", 
                        cursor: "pointer"
                      }}
                    >
                      {u.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Popup Modal */}
      {isInviting && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px"
        }}>
          <div style={{
            background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "480px",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={16} color="var(--color-accent)" /> Add Team Member
              </h2>
              <button type="button" onClick={() => setIsInviting(false)} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>First Name</label>
                    <input required style={inputStyle} placeholder="First Name" value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} autoFocus />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Last Name</label>
                    <input required style={inputStyle} placeholder="Last Name" value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Email Address</label>
                  <input required type="email" style={inputStyle} placeholder="email@address.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Designated Role</label>
                    <select required style={{...inputStyle, cursor: "pointer"}} value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value as any})}>
                      <option value="GUARD">Security Officer</option>
                      <option value="SITE_MANAGER">Site Manager</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Assign to Site</label>
                    <select required style={{...inputStyle, cursor: "pointer"}} value={inviteForm.siteId} onChange={e => setInviteForm({...inviteForm, siteId: e.target.value})}>
                      <option value="" disabled>Select site...</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

              </div>

              <div style={{ padding: "18px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsInviting(false)} style={{ padding: "10px 20px", background: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13.5px", fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13.5px", fontWeight: 600 }}>Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
