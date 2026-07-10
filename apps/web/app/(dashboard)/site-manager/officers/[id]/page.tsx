"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Mail, Shield, UserCog, Ban, MapPin, 
  Clock, Calendar, FileText, CheckCircle2, AlertTriangle, Info, UserCheck, UserX
} from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function SiteManagerPersonnelProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<any | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, siteRes, shiftRes, obRes] = await Promise.all([
        managerService.getTenantUsers(),
        managerService.getSites(),
        managerService.getTenantShifts().catch(() => ({ data: { data: { shifts: [] } } })),
        managerService.getOccurrences().catch(() => ({ data: { data: { occurrences: [] } } }))
      ]);

      const foundUser = (userRes.data?.data?.users || []).find((u: any) => u.id === userId);
      setUser(foundUser || null);
      setSites(siteRes.data?.data?.sites || []);
      setShifts(shiftRes.data?.data?.shifts || []);
      setOccurrences(obRes.data?.data?.occurrences || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
    setUpdating(true);
    try {
      await managerService.updateUserRole(user.id, newRole);
      setUser((prev: any) => prev ? { ...prev, role: newRole } : null);
    } catch (err) {
      console.error(err);
      alert("Failed to update role.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSiteChange = async (newSiteId: string) => {
    if (!user) return;
    setUpdating(true);
    try {
      await managerService.assignUserToSite(user.id, newSiteId);
      // Reload user object to get the full site relation updated
      const userRes = await managerService.getTenantUsers();
      const foundUser = (userRes.data?.data?.users || []).find((u: any) => u.id === userId);
      if (foundUser) setUser(foundUser);
    } catch (err) {
      console.error(err);
      alert("Failed to reassign site.");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    setUpdating(true);
    const action = user.accountStatus === "ACTIVE" ? "suspend" : "activate";
    try {
      await managerService.disableUser(user.id);
      // Reload
      const userRes = await managerService.getTenantUsers();
      const foundUser = (userRes.data?.data?.users || []).find((u: any) => u.id === userId);
      if (foundUser) setUser(foundUser);
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} user.`);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleLeave = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      await managerService.toggleUserLeave(user.id);
      const userRes = await managerService.getTenantUsers();
      const foundUser = (userRes.data?.data?.users || []).find((u: any) => u.id === userId);
      if (foundUser) setUser(foundUser);
    } catch (err) {
      console.error(err);
      alert("Failed to toggle leave status.");
    } finally {
      setUpdating(false);
    }
  };

  // Filtered stats for this user
  const userShifts = useMemo(() => shifts.filter(s => s.userId === userId), [shifts, userId]);
  const userOccurrences = useMemo(() => occurrences.filter(o => o.userId === userId), [occurrences, userId]);
  const liveShift = useMemo(() => userShifts.find(s => s.status === "IN_PROGRESS"), [userShifts]);
  const completedShiftsCount = useMemo(() => userShifts.filter(s => s.status === "COMPLETED").length, [userShifts]);
  
  const totalHours = useMemo(() => {
    return userShifts.reduce((acc, s) => {
      if (s.status === "COMPLETED" && s.startTime && s.endTime) {
        const hours = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }
      return acc;
    }, 0).toFixed(1);
  }, [userShifts]);

  const inputStyle = {
    width: "100%", padding: "10px 14px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none",
    transition: "border-color 0.2s"
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "10px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "18px", height: "18px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>Loading personnel profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-text-primary)" }}>Personnel Not Found</h2>
        <button onClick={() => router.push("/site-manager/officers")} style={{ marginTop: "16px", padding: "8px 16px", background: "var(--color-accent)", border: "none", color: "white", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      
      {/* Back button */}
      <div>
        <button 
          onClick={() => router.push("/site-manager/officers")}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Personnel Directory
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Main Details Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
          
          {/* Header Profile Info Card */}
          <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "24px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", boxShadow: "var(--color-card-shadow)" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--color-accent-subtle)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800 }}>
              {user.firstName?.[0] || "U"}
            </div>
            
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
                  {user.firstName} {user.lastName}
                </h2>
                <span style={{ fontSize: "11px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", padding: "3px 10px", borderRadius: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                  {user.role === "SITE_MANAGER" ? "Site Manager" : "Security Officer"}
                </span>
                <span style={{ 
                  fontSize: "11px", padding: "3px 10px", borderRadius: "12px", fontWeight: 700,
                  background: user.accountStatus === "ACTIVE" ? "var(--color-success-subtle)" : 
                             user.accountStatus === "PENDING" ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)",
                  color: user.accountStatus === "ACTIVE" ? "var(--color-success)" : 
                         user.accountStatus === "PENDING" ? "var(--color-warning)" : "var(--color-danger)"
                }}>
                  {user.accountStatus}
                </span>
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--color-text-muted)", marginTop: "6px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={14} /> {user.email}</span>
                {user.site && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> Assigned: {user.site.name}</span>}
              </div>
            </div>
          </div>

          {/* Stats Metrics Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "var(--color-card-shadow)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent)" }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Work Hours</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px" }}>{totalHours} hrs</div>
              </div>
            </div>

            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "var(--color-card-shadow)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-success)" }}>
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Shifts</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px" }}>{completedShiftsCount}</div>
              </div>
            </div>

            <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "var(--color-card-shadow)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "rgba(59, 130, 246, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-info)" }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Logs Filed</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px" }}>{userOccurrences.length}</div>
              </div>
            </div>
          </div>

          {/* Shift Logs Table */}
          <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", boxShadow: "var(--color-card-shadow)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 16px 0" }}>Recent Shift History</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    <th style={{ padding: "8px 12px" }}>Date</th>
                    <th style={{ padding: "8px 12px" }}>Duration / Time</th>
                    <th style={{ padding: "8px 12px" }}>Site</th>
                    <th style={{ padding: "8px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userShifts.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "24px 12px", textAlign: "center", color: "var(--color-text-muted)" }}>No shift logs found.</td></tr>
                  ) : userShifts.slice(0, 5).map(s => {
                    const duration = s.endTime 
                      ? ((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1) + " hrs"
                      : "—";
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--color-bg-subtle)" }}>
                        <td style={{ padding: "12px" }}>{new Date(s.startTime).toLocaleDateString()}</td>
                        <td style={{ padding: "12px" }}>
                          <div>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}</div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>Duration: {duration}</div>
                        </td>
                        <td style={{ padding: "12px", fontWeight: 500 }}>{s.site?.name || "Unknown Site"}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ 
                            fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px",
                            background: s.status === "COMPLETED" ? "var(--color-success-subtle)" : "var(--color-accent-subtle)",
                            color: s.status === "COMPLETED" ? "var(--color-success)" : "var(--color-accent)"
                          }}>{s.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Occurrence Book entries */}
          <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", boxShadow: "var(--color-card-shadow)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 16px 0" }}>Recent Occurrence Book Logs</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {userOccurrences.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>No logs filed by this user.</div>
              ) : userOccurrences.slice(0, 5).map(o => (
                <div key={o.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>
                      {o.category}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)" }}>
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "13.5px", color: "var(--color-text-primary)", lineHeight: 1.4 }}>{o.entryText}</div>
                  {o.location && <div style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginTop: "6px" }}>📍 Location: {o.location}</div>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Admin Controls Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "20px", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", margin: 0 }}>
              Administrative Controls
            </h3>

            {/* Shift Alert indicator if online */}
            {liveShift && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-success-subtle)", border: "1px solid var(--color-success)", padding: "10px 14px", borderRadius: "var(--radius-md)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-success)", animation: "pulse 1.5s infinite" }} />
                <div style={{ fontSize: "12.5px", color: "var(--color-success)", fontWeight: 700 }}>
                  Currently On Duty (Live Shift)
                </div>
              </div>
            )}

            {/* Profile Info block */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Employee ID:</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{user.employeeId || "GLD-" + user.id.slice(0,6).toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Date Hired:</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Leave Status:</span>
                <span style={{ fontWeight: 600, color: user.onLeave ? "var(--color-warning)" : "var(--color-success)" }}>
                  {user.onLeave ? "On Leave" : "Active"}
                </span>
              </div>
            </div>

            {/* Control Forms */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {/* Role Dropdown */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px", fontWeight: 600 }}>Modify Staff Role</label>
                <select 
                  disabled={updating}
                  style={{ ...inputStyle, padding: "8px 12px" }}
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  <option value="GUARD">Security Officer</option>
                  <option value="SITE_MANAGER">Site Manager</option>
                </select>
              </div>

              {/* Site Dropdown */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px", fontWeight: 600 }}>Assign Site</label>
                <select 
                  disabled={updating}
                  style={{ ...inputStyle, padding: "8px 12px" }}
                  value={user.site?.id || ""}
                  onChange={(e) => handleSiteChange(e.target.value)}
                >
                  <option value="" disabled>Select a site...</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
                <button
                  onClick={() => handleToggleLeave()}
                  disabled={updating}
                  style={{
                    padding: "8px 12px", background: "transparent", 
                    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                    fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                  }}
                >
                  <Info size={14} />
                  {user.onLeave ? "Return to Duty" : "Put on Leave"}
                </button>

                <button
                  onClick={() => handleToggleStatus()}
                  disabled={updating}
                  style={{
                    padding: "8px 12px", background: "transparent",
                    border: `1px solid ${user.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)"}`,
                    borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600,
                    color: user.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                  }}
                >
                  {user.accountStatus === "ACTIVE" ? <UserX size={14} /> : <UserCheck size={14} />}
                  {user.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
