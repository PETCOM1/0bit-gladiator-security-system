"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Mail, Phone, Shield, Activity, Clock, ArrowLeft,
  UserCheck, UserX, Calendar, MapPin, Info, Briefcase, FileText
} from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

const inputStyle = {
  width: "100%", padding: "10px 14px", background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  fontSize: "13.5px", color: "var(--color-text-primary)", outline: "none",
  transition: "border-color 0.2s"
};

const cardStyle = {
  background: "var(--color-card-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--color-card-shadow)",
  overflow: "hidden"
};

export default function StaffProfilePage({ params }: PageProps) {
  const router = useRouter();
  const { id: staffId } = use(params);

  const [staff, setStaff] = useState<any | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, siteRes, shiftRes, obRes] = await Promise.all([
        managerService.getTenantUsers(),
        managerService.getSites(),
        managerService.getTenantShifts().catch(() => ({ data: { data: { shifts: [] } } })),
        managerService.getOccurrences().catch(() => ({ data: { data: { entries: [] } } }))
      ]);
      
      const allUsers = userRes.data?.data?.users || [];
      const foundStaff = allUsers.find((u: any) => u.id === staffId);
      
      setStaff(foundStaff || null);
      setSites(siteRes.data?.data?.sites || []);
      setShifts(shiftRes.data?.data?.shifts || []);
      setOccurrences(obRes.data?.data?.entries || []);
    } catch (err) {
      console.error("Error loading staff member profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staffId) loadData();
  }, [staffId]);

  const handleRoleChange = async (newRole: string) => {
    if (!staff) return;
    setUpdatingUser(true);
    try {
      await managerService.updateUserRole(staff.id, newRole);
      setStaff((prev: any) => prev ? { ...prev, role: newRole } : null);
    } catch (err) {
      console.error(err);
      alert("Failed to update role.");
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleSiteChange = async (newSiteId: string) => {
    if (!staff) return;
    setUpdatingUser(true);
    try {
      await managerService.assignUserToSite(staff.id, newSiteId);
      // Reload profile
      const userRes = await managerService.getTenantUsers();
      const updated = (userRes.data?.data?.users || []).find((u: any) => u.id === staff.id);
      if (updated) setStaff(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to reassign site.");
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!staff) return;
    setUpdatingUser(true);
    const action = staff.accountStatus === "ACTIVE" ? "suspend" : "activate";
    try {
      await managerService.disableUser(staff.id);
      // Reload
      const userRes = await managerService.getTenantUsers();
      const updated = (userRes.data?.data?.users || []).find((u: any) => u.id === staff.id);
      if (updated) setStaff(updated);
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} user.`);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleToggleLeave = async () => {
    if (!staff) return;
    setUpdatingUser(true);
    try {
      await managerService.toggleUserLeave(staff.id);
      const userRes = await managerService.getTenantUsers();
      const updated = (userRes.data?.data?.users || []).find((u: any) => u.id === staff.id);
      if (updated) setStaff(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to toggle leave status.");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Detailed profile stats & events
  const staffDetails = useMemo(() => {
    if (!staff) return null;
    const staffShifts = shifts.filter(s => s.userId === staff.id);
    const staffOccurrences = occurrences.filter(o => o.userId === staff.id);
    const liveShift = staffShifts.find(s => s.status === "IN_PROGRESS");
    const completedShiftsCount = staffShifts.filter(s => s.status === "COMPLETED").length;
    
    return {
      shifts: staffShifts,
      occurrences: staffOccurrences,
      liveShift,
      completedShiftsCount,
      totalHours: staffShifts.reduce((acc, s) => {
        if (s.status === "COMPLETED" && s.startTime && s.endTime) {
          const hours = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60);
          return acc + hours;
        }
        return acc;
      }, 0).toFixed(1)
    };
  }, [staff, shifts, occurrences]);

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading staff profile...</span>
      </div>
    );
  }

  if (!staff) {
    return (
      <div style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-danger)" }}>Staff Member Not Found</h3>
        <button onClick={() => router.push("/manager/users")} style={{ padding: "8px 16px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px" }}>
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button 
          onClick={() => router.push("/manager/users")}
          style={{ 
            display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", 
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", 
            borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-secondary)",
            transition: "all var(--transition-fast)" 
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            {staff.firstName} {staff.lastName}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px", marginBottom: 0 }}>
            Staff Profile Console &amp; Analytics
          </p>
        </div>
      </div>

      {/* Main Grid: Info Sidebar & Activity Console */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" }}>
        
        {/* Left Side: Profile Information & Controls */}
        <div style={{ width: "380px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={cardStyle}>
            {/* Header info */}
            <div style={{ padding: "28px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)", textAlign: "center" }}>
              <div style={{ display: "inline-flex", width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-accent-subtle)", color: "var(--color-accent)", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, marginBottom: "14px", border: "4px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                {staff.firstName?.[0] || "U"}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 4px 0" }}>{staff.firstName} {staff.lastName}</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 16px 0" }}>{staff.email}</p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", padding: "4px 10px", borderRadius: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                  {staff.role === "SITE_MANAGER" ? "Site Manager" : "Security Officer"}
                </span>
                <span style={{ 
                  fontSize: "11px", padding: "4px 10px", borderRadius: "12px", fontWeight: 700,
                  background: staff.accountStatus === "ACTIVE" ? "var(--color-success-subtle)" : 
                             staff.accountStatus === "PENDING" ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)",
                  color: staff.accountStatus === "ACTIVE" ? "var(--color-success)" : 
                         staff.accountStatus === "PENDING" ? "var(--color-warning)" : "var(--color-danger)"
                }}>
                  {staff.accountStatus}
                </span>
              </div>
            </div>

            {/* Profile fields */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Employee ID:</span>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{staff.employeeId || "GLD-" + staff.id.slice(0,6).toUpperCase()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Leave Status:</span>
                  <span style={{ fontWeight: 600, color: staff.onLeave ? "var(--color-warning)" : "var(--color-success)" }}>
                    {staff.onLeave ? "On Leave" : "Active Duty"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Joined On:</span>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              {/* Administrative controls */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>Staff Management Controls</h4>
                
                {/* Change Role Dropdown */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px", fontWeight: 600 }}>Modify Staff Role</label>
                  <select 
                    disabled={updatingUser}
                    style={{ ...inputStyle, padding: "8px 12px" }}
                    value={staff.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  >
                    <option value="GUARD">Security Officer (Guard)</option>
                    <option value="SITE_MANAGER">Site Manager</option>
                  </select>
                </div>

                {/* Assign Site Dropdown */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px", fontWeight: 600 }}>Assign Site</label>
                  <select 
                    disabled={updatingUser}
                    style={{ ...inputStyle, padding: "8px 12px" }}
                    value={staff.site?.id || ""}
                    onChange={(e) => handleSiteChange(e.target.value)}
                  >
                    <option value="" disabled>Select a site...</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                  <button
                    onClick={handleToggleLeave}
                    disabled={updatingUser}
                    style={{
                      padding: "8px 12px", background: "transparent", 
                      border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                      fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                    }}
                  >
                    {staff.onLeave ? "Return to Duty" : "Put on Leave"}
                  </button>

                  <button
                    onClick={handleToggleStatus}
                    disabled={updatingUser}
                    style={{
                      padding: "8px 12px", background: "transparent",
                      border: `1px solid ${staff.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)"}`,
                      borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600,
                      color: staff.accountStatus === "ACTIVE" ? "var(--color-danger)" : "var(--color-success)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                    }}
                  >
                    {staff.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Performance stats & logs */}
        <div style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Stats Summary strip */}
          {staffDetails && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <div style={{ ...cardStyle, padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ color: "var(--color-accent)", display: "flex" }}><Clock size={20} /></div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Hours Worked</div>
                  <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px" }}>{staffDetails.totalHours} hrs</div>
                </div>
              </div>
              
              <div style={{ ...cardStyle, padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ color: "var(--color-success)", display: "flex" }}><Calendar size={20} /></div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Completed Shifts</div>
                  <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "2px" }}>{staffDetails.completedShiftsCount}</div>
                </div>
              </div>

              <div style={{ ...cardStyle, padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", background: staffDetails.liveShift ? "var(--color-success-subtle)" : "var(--color-card-bg)" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: staffDetails.liveShift ? "var(--color-success)" : "var(--color-text-muted)" }} />
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Status</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: staffDetails.liveShift ? "var(--color-success)" : "var(--color-text-primary)", marginTop: "2px" }}>
                    {staffDetails.liveShift ? "ON SHIFT (LIVE)" : "OFF DUTY"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shifts History */}
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color="var(--color-accent)" />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Recent Shifts History</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <tr>
                    {["Post / Site", "Start Time", "End Time", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!staffDetails || staffDetails.shifts.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                        No shifts logs recorded for this user.
                      </td>
                    </tr>
                  ) : (
                    staffDetails.shifts.slice(0, 10).map((s: any, idx: number) => (
                      <tr key={s.id} style={{ borderBottom: idx < 9 ? "1px solid var(--color-border)" : "none" }}>
                        <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {s.post?.name || "Ad-Hoc Patrol"}
                          <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", fontWeight: 400, marginTop: "2px" }}>
                            {s.site?.name || "No assigned site"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                          {s.actualStartTime ? new Date(s.actualStartTime).toLocaleString() : new Date(s.startTime).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                          {s.actualEndTime ? new Date(s.actualEndTime).toLocaleString() : s.endTime ? new Date(s.endTime).toLocaleString() : "—"}
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{
                            padding: "3px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 700,
                            background: s.status === "COMPLETED" ? "var(--color-bg-subtle)" : 
                                       s.status === "IN_PROGRESS" ? "var(--color-success-subtle)" : "var(--color-info-subtle)",
                            color: s.status === "COMPLETED" ? "var(--color-text-secondary)" : 
                                   s.status === "IN_PROGRESS" ? "var(--color-success)" : "var(--color-info)"
                          }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Occurrence Book logs */}
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={16} color="var(--color-accent)" />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Recent Occurrence Book Logs</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <tr>
                    {["Timestamp", "Category", "Log Details"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!staffDetails || staffDetails.occurrences.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                        No Occurrence Book entries posted by this user.
                      </td>
                    </tr>
                  ) : (
                    staffDetails.occurrences.slice(0, 10).map((o: any, idx: number) => (
                      <tr key={o.id} style={{ borderBottom: idx < 9 ? "1px solid var(--color-border)" : "none" }}>
                        <td style={{ padding: "12px 20px", fontSize: "12.5px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{
                            padding: "3px 8px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700,
                            background: o.category === "EMERGENCY" ? "var(--color-danger-subtle)" : "var(--color-bg-subtle)",
                            color: o.category === "EMERGENCY" ? "var(--color-danger)" : "var(--color-text-secondary)"
                          }}>
                            {o.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: "13px", color: "var(--color-text-primary)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.entryText}>
                          {o.entryText}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
