"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Shield, UserCog, Ban, Mail } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function PersonnelManagerPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  
  const [inviteForm, setInviteForm] = useState({
    email: "", firstName: "", lastName: "", role: "USER" as "SITE_MANAGER" | "USER", siteId: ""
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
      setInviteForm({ email: "", firstName: "", lastName: "", role: "USER", siteId: "" });
      loadData();
      alert("Invitation sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send invitation.");
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

  const handleDisable = async (userId: string) => {
    if (!confirm("Are you sure you want to suspend this user? They will no longer be able to log in.")) return;
    try {
      await managerService.disableUser(userId);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to suspend user.");
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "13px", color: "var(--color-text-primary)", outline: "none"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={28} color="var(--color-accent)" /> Personnel Management
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Manage Security Officers and Site Managers across all your locations.
          </p>
        </div>
        <button
          onClick={() => setIsInviting(!isInviting)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", transition: "background var(--transition-fast)" }}
        >
          <Plus size={16} strokeWidth={2.5} /> Invite Personnel
        </button>
      </div>

      {isInviting && (
        <form onSubmit={handleInvite} style={{ background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "var(--color-card-shadow)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <h3 style={{ gridColumn: "1 / -1", margin: "0 0 8px 0", fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Mail size={16} color="var(--color-accent)" /> Send Invitation
          </h3>
          
          <input required style={inputStyle} placeholder="First Name" value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} />
          <input required style={inputStyle} placeholder="Last Name" value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} />
          <input required type="email" style={inputStyle} placeholder="Email Address" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
          
          <div style={{ display: "flex", gap: "12px" }}>
            <select required style={{...inputStyle, cursor: "pointer"}} value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value as any})}>
              <option value="USER">Security Officer (Guard)</option>
              <option value="SITE_MANAGER">Site Manager</option>
            </select>
            <select required style={{...inputStyle, cursor: "pointer"}} value={inviteForm.siteId} onChange={e => setInviteForm({...inviteForm, siteId: e.target.value})}>
              <option value="" disabled>Assign to Site...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button type="button" onClick={() => setIsInviting(false)} style={{ padding: "8px 16px", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Cancel</button>
            <button type="submit" style={{ padding: "8px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Send Invite</button>
          </div>
        </form>
      )}

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Personnel</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned Site</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading personnel...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No personnel found. Invite someone to get started.</td></tr>
              ) : users.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{user.email}</div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}
                    >
                      <option value="SITE_MANAGER">Site Manager</option>
                      <option value="USER">Security Officer</option>
                    </select>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <select 
                      value={user.site?.id || ""} 
                      onChange={(e) => handleSiteChange(user.id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)", cursor: "pointer" }}
                    >
                      <option value="" disabled>No Site</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: user.accountStatus === "ACTIVE" ? "var(--color-success-subtle)" : 
                                 user.accountStatus === "PENDING" ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)",
                      color: user.accountStatus === "ACTIVE" ? "var(--color-success)" : 
                             user.accountStatus === "PENDING" ? "var(--color-warning)" : "var(--color-danger)"
                    }}>
                      {user.accountStatus}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <button 
                      onClick={() => handleDisable(user.id)}
                      disabled={user.accountStatus === "SUSPENDED"}
                      style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, color: "var(--color-danger)", cursor: user.accountStatus === "SUSPENDED" ? "not-allowed" : "pointer", opacity: user.accountStatus === "SUSPENDED" ? 0.5 : 1 }}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
