"use client";

import React, { useEffect, useState } from "react";
import { ClipboardCheck, MapPin, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function AttendancePage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await managerService.getTenantShifts();
      setShifts(res.data.data.shifts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShifts(); }, []);

  const getAttendanceStatus = (shift: any) => {
    if (shift.status === "SCHEDULED" && new Date(shift.startTime) < new Date()) {
      return { label: "MISSED", color: "var(--color-danger)", bg: "var(--color-danger-subtle)" };
    }
    if (!shift.actualStartTime) return { label: "PENDING", color: "var(--color-text-muted)", bg: "var(--color-bg-subtle)" };
    
    // Check if late (more than 15 mins)
    const scheduledStart = new Date(shift.startTime).getTime();
    const actualStart = new Date(shift.actualStartTime).getTime();
    if (actualStart - scheduledStart > 15 * 60000) {
      return { label: "LATE", color: "var(--color-warning)", bg: "var(--color-warning-subtle)" };
    }
    return { label: "ON TIME", color: "var(--color-success)", bg: "var(--color-success-subtle)" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <ClipboardCheck size={24} color="var(--color-accent)" /> Attendance Tracking
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Monitor clock-in times and identify late or missed shifts.
        </p>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Guard</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Scheduled Time</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Actual Clock In</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading attendance records...</td></tr>
              ) : shifts.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No shifts to display.</td></tr>
              ) : shifts.map((s, i) => {
                const status = getAttendanceStatus(s);
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
                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                      {s.actualStartTime ? new Date(s.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: status.bg, color: status.color }}>
                        {status.label}
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
