"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Mail, X, Search, ChevronLeft, ChevronRight, MapPin, ShieldCheck, ShieldAlert } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SiteManagerPersonnelPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  
  // Search, Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [postFilter, setPostFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Invite Form (hardcoded to GUARD role and current user's site)
  const [inviteForm, setInviteForm] = useState({
    email: "", firstName: "", lastName: "", role: "GUARD" as const, siteId: ""
  });

  // Populate invite form site ID when current user loads
  useEffect(() => {
    if (currentUser?.siteId) {
      setInviteForm(prev => ({ ...prev, siteId: currentUser.siteId || "" }));
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser?.siteId) return;
    setLoading(true);
    try {
      const [userRes, siteRes] = await Promise.all([
        managerService.getTenantUsers(),
        managerService.getSiteById(currentUser.siteId)
      ]);
      
      // Filter list to only show guards assigned to this supervisor's site
      const allUsers = userRes.data.data.users || [];
      const siteGuards = allUsers.filter((u: any) => u.siteId === currentUser.siteId && u.role === "GUARD");
      setUsers(siteGuards);
      
      // Load posts for dropdowns
      setPosts(siteRes.data.data.site.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.siteId) return;
    try {
      await managerService.inviteUser(inviteForm);
      setIsInviting(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "GUARD", siteId: currentUser?.siteId || "" });
      loadData();
      alert("Invitation sent successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send invitation.");
    }
  };

  const handlePostChange = async (userId: string, newPostId: string) => {
    try {
      await managerService.assignUserToPost(userId, newPostId || null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to assign post.");
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

  // Search & Filter & Pagination Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = fullName.includes(search) || email.includes(search);
      
      const matchesStatus = statusFilter === "ALL" || u.accountStatus === statusFilter;
      
      const matchesPost = postFilter === "ALL" || 
        (postFilter === "UNASSIGNED" && !u.postId) || 
        u.postId === postFilter;
        
      return matchesSearch && matchesStatus && matchesPost;
    });
  }, [users, searchTerm, statusFilter, postFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, postFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Styles
  const inputStyle = {
    width: "100%", padding: "10px 14px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "14px", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" as const
  };

  const selectStyle = {
    padding: "8px 12px", background: "var(--color-card-bg)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "13.5px", color: "var(--color-text-secondary)", outline: "none", cursor: "pointer"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%", paddingBottom: "40px" }}>
      
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Users size={22} color="var(--color-accent)" /> Security Officers
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px", margin: 0 }}>
            Manage security guards and post assignments for your site.
          </p>
        </div>
        <button
          onClick={() => setIsInviting(true)}
          style={{ 
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", 
            background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", 
            fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", 
            cursor: "pointer", boxShadow: "var(--color-card-shadow)" 
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> Invite Officer
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ 
        background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", 
        border: "1px solid var(--color-border)", padding: "18px 20px", 
        display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", 
        boxShadow: "var(--color-card-shadow)" 
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search officers by name or email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px", height: "38px" }}
          />
        </div>
        
        {/* Status Filter */}
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          style={selectStyle}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        {/* Post Filter */}
        <select 
          value={postFilter} 
          onChange={e => setPostFilter(e.target.value)} 
          style={selectStyle}
        >
          <option value="ALL">All Posts</option>
          <option value="UNASSIGNED">Unassigned</option>
          {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Directory Table */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Officer</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</th>
                <th style={{ padding: "14px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Assigned Guard Post</th>
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
                      <span>Loading site officers...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No security officers found matching your query filters.
                  </td>
                </tr>
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
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                      Security Officer
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={14} color="var(--color-text-muted)" />
                      <select 
                        value={u.postId || ""} 
                        onChange={(e) => handlePostChange(u.id, e.target.value)}
                        style={{ 
                          padding: "5px 8px", fontSize: "12.5px", borderRadius: "var(--radius-sm)", 
                          border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", 
                          color: "var(--color-text-primary)", cursor: "pointer", maxWidth: "160px" 
                        }}
                      >
                        <option value="">Unassigned</option>
                        {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
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
            background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
            boxShadow: "var(--color-card-shadow)", width: "100%", maxWidth: "480px",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={16} color="var(--color-accent)" /> Invite Security Officer
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
                  <input required type="email" style={inputStyle} placeholder="officer@agency.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(59, 130, 246, 0.04)", border: "1px solid rgba(59, 130, 246, 0.12)", padding: "12px 16px", borderRadius: "var(--radius-lg)" }}>
                  <ShieldCheck size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                    Invitee will be registered as a <strong>Security Officer</strong> and assigned to your current site.
                  </span>
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
