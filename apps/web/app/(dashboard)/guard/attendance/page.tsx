"use client";

import React, { useEffect, useState } from "react";
import { ClipboardCheck, Clock, MapPin, Play, Square, AlertCircle } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SecurityAttendancePage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await managerService.getTenantShifts();
      // Filter for the current user's shifts
      const myShifts = (res.data.data.shifts || []).filter((s: any) => s.userId === user?.id);
      setShifts(myShifts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchShifts(); 
  }, [user]);

  const handleStartShift = async (shiftId?: string) => {
    try {
      await managerService.startShift({ shiftId });
      fetchShifts();
    } catch (err) {
      console.error(err);
      alert("Failed to start shift");
    }
  };

  const handleEndShift = async (shiftId: string) => {
    try {
      await managerService.endShift(shiftId);
      fetchShifts();
    } catch (err) {
      console.error(err);
      alert("Failed to end shift");
    }
  };

  const currentShift = shifts.find(s => s.status === "IN_PROGRESS");
  const upcomingShift = shifts.find(s => s.status === "SCHEDULED" && new Date(s.startTime).toDateString() === new Date().toDateString());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <ClipboardCheck size={24} color="var(--color-accent)" /> Shift Attendance
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Clock in and out of your assigned shifts.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
        {/* Active Shift Card */}
        <div style={{ background: "var(--color-card-bg)", padding: "32px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
          {currentShift ? (
            <>
              <div style={{ padding: "16px", background: "var(--color-success-subtle)", borderRadius: "50%", color: "var(--color-success)" }}>
                <Clock size={48} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>You are ON DUTY</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                  Started at {new Date(currentShift.actualStartTime || currentShift.startTime).toLocaleTimeString()}
                </p>
              </div>
              <button 
                onClick={() => handleEndShift(currentShift.id)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 32px", background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "8px", transition: "opacity var(--transition-fast)" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                <Square size={18} fill="currentColor" /> Check Out
              </button>
            </>
          ) : (
            <>
              <div style={{ padding: "16px", background: "var(--color-bg-subtle)", borderRadius: "50%", color: "var(--color-text-muted)" }}>
                <AlertCircle size={48} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>You are OFF DUTY</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                  {upcomingShift 
                    ? `Next shift starts at ${new Date(upcomingShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                    : "No shifts scheduled for today."}
                </p>
              </div>
              <button 
                onClick={() => handleStartShift(upcomingShift?.id)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 32px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginTop: "8px", transition: "opacity var(--transition-fast)" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                <Play size={18} fill="currentColor" /> Check In
              </button>
            </>
          )}
        </div>

        {/* Shift Details */}
        <div style={{ background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "var(--color-card-shadow)" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--color-text-primary)" }}>Current Assignment</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "8px", background: "var(--color-bg-subtle)", borderRadius: "8px", color: "var(--color-accent)" }}>
                <MapPin size={20} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Post / Location</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>
                  {currentShift?.post?.name || upcomingShift?.post?.name || currentShift?.site?.name || upcomingShift?.site?.name || "Unassigned"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "8px", background: "var(--color-bg-subtle)", borderRadius: "8px", color: "var(--color-text-secondary)" }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Schedule</div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>
                  {currentShift || upcomingShift 
                    ? `${new Date((currentShift || upcomingShift)!.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${(currentShift || upcomingShift)!.endTime ? new Date((currentShift || upcomingShift)!.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Open Ended"}` 
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
