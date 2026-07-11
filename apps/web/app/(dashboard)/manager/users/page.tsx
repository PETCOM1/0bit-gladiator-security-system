"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Plus, Search, Mail, Phone, Shield, 
  UserCheck, UserX, Calendar, MapPin, X, Filter, Briefcase, 
  ChevronRight, SlidersHorizontal
} from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

const inputStyle = {
  width: "100%", padding: "10px 14px", background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none",
  transition: "border-color 0.2s"
};

const selectStyle = {
  padding: "8px 12px", background: "var(--color-card-bg)",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  fontSize: "13px", color: "var(--color-text-secondary)", outline: "none",
  cursor: "pointer"
};

export default function TenantStaffManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("ALL");
  
  // UI states
  const [isInviting, setIsInviting] = useState(false);
  
  // Form states
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
      setUsers(userRes.data?.data?.users || []);
      const loadedSites = siteRes.data?.data?.sites || [];
      setSites(loadedSites);
    } catch (err) {
      console.error("Error loading staff listing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Memoized stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.accountStatus === "ACTIVE").length;
    const pending = users.filter(u => u.accountStatus === "PENDING").length;
    const suspended = users.filter(u => u.accountStatus === "SUSPENDED" || u.accountStatus === "DISABLED" || u.accountStatus === "DELETED").length;
    return { total, active, pending, suspended };
  }, [users]);

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.employeeId || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
      const matchesStatus = selectedStatus === "ALL" || u.accountStatus === selectedStatus;
      const matchesSite = selectedSiteFilter === "ALL" || u.site?.id === selectedSiteFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesSite;
    });
  }, [users, searchTerm, selectedRole, selectedStatus, selectedSiteFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Users size={24} color="var(--color-accent)" /> Staff &amp; Team Directory
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Monitor and manage security officers, managers, and profiles across all operations.
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
          <Plus size={16} strokeWidth={2.5} /> Add Team Member
        </button>
      </div>

      {/* KPI Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--color-card-shadow)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "rgba(245, 158, 11, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent)" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Staff</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "4px" }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--color-card-shadow)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "rgba(16, 185, 129, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-success)" }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Active</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "4px" }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--color-card-shadow)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "rgba(245, 158, 11, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-warning)" }}>
            <Mail size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Pending Invites</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "4px" }}>{stats.pending}</div>
          </div>
        </div>

        <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "var(--color-card-shadow)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-lg)", background: "rgba(239, 68, 68, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)" }}>
            <UserX size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Suspended</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "4px" }}>{stats.suspended}</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", boxShadow: "var(--color-card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input 
              type="text" 
              placeholder="Search by name, email, or employee ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "36px", height: "38px" }}
            />
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-muted)" }}>
            <Filter size={14} /> Filters:
          </div>
          <select style={selectStyle} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="SITE_MANAGER">Site Managers</option>
            <option value="GUARD">Security Officers</option>
          </select>

          <select style={selectStyle} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <select style={selectStyle} value={selectedSiteFilter} onChange={e => setSelectedSiteFilter(e.target.value)}>
            <option value="ALL">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Directory Table Card */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Personnel Info</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Assigned Site</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "60px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      <span>Loading team directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "60px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No personnel found matching filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <tr 
                    key={u.id}
                    onClick={() => router.push(`/manager/users/${u.id}`)}
                    style={{ 
                      borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--color-border)" : "none", 
                      background: "transparent",
                      cursor: "pointer",
                      transition: "background var(--transition-fast)" 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--color-text-secondary)", fontSize: "14px", flexShrink: 0 }}>
                          {u.firstName?.[0] || "U"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "14px" }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", marginTop: "2px" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                        background: u.role === "SITE_MANAGER" ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
                        color: u.role === "SITE_MANAGER" ? "var(--color-accent)" : "var(--color-text-secondary)"
                      }}>
                        <Briefcase size={10} />
                        {u.role === "SITE_MANAGER" ? "Site Manager" : "Security Officer"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      {u.site ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13.5px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                          <MapPin size={13} color="var(--color-text-muted)" />
                          {u.site.name}
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        display: "inline-flex", padding: "4px 10px", borderRadius: "20px", fontSize: "10.5px", fontWeight: 700,
                        background: u.accountStatus === "ACTIVE" ? "var(--color-success-subtle)" : 
                                   u.accountStatus === "PENDING" ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)",
                        color: u.accountStatus === "ACTIVE" ? "var(--color-success)" : 
                               u.accountStatus === "PENDING" ? "var(--color-warning)" : "var(--color-danger)"
                      }}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <ChevronRight size={16} color="var(--color-text-muted)" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                    <input required style={inputStyle} placeholder="E.g. John" value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} autoFocus />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Last Name</label>
                    <input required style={inputStyle} placeholder="E.g. Doe" value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Email Address</label>
                  <input required type="email" style={inputStyle} placeholder="john.doe@company.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Designated Role</label>
                    <select required style={{...inputStyle, cursor: "pointer"}} value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value as any})}>
                      <option value="GUARD">Security Officer (Guard)</option>
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
