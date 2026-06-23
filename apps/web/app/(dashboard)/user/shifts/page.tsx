"use client";

import React, { useEffect, useState } from "react";
import { Calendar, MapPin, User, CheckCircle2, Clock, Ban } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SecurityShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const shiftsRes = await managerService.getTenantShifts();
      const myShifts = (shiftsRes.data.data.shifts || []).filter((s: any) => s.userId === user?.id);
      setShifts(myShifts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchData(); 
  }, [user]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return { bg: "var(--color-success-subtle)", color: "var(--color-success)", icon: <CheckCircle2 size={12} /> };
      case "IN_PROGRESS": return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)", icon: <Clock size={12} /> };
      case "SCHEDULED": return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)", icon: <Calendar size={12} /> };
      default: return { bg: "var(--color-bg-subtle)", color: "var(--color-text-muted)", icon: <Ban size={12} /> };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar size={24} color="var(--color-accent)" /> My Assigned Shifts
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            View your upcoming shifts and post assignments.
          </p>
        </div>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Personnel</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Post</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Scheduled</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading shifts...</td></tr>
              ) : shifts.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No shifts scheduled.</td></tr>
              ) : shifts.map((s, i) => {
                const style = getStatusStyle(s.status);
                return (
                  <tr 
                    key={s.id} 
                    style={{ borderBottom: i < shifts.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>
                      {new Date(s.startTime).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <User size={14} /> {s.user?.firstName} {s.user?.lastName}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        <MapPin size={14} color="var(--color-accent)" /> {s.post?.name || s.site?.name || "Unassigned"}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Start: {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ color: "var(--color-text-muted)", marginTop: "4px" }}>End: {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: style.bg, color: style.color }}>
                        {style.icon} {s.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
