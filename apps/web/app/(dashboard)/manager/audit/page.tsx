"use client";

import React, { useEffect, useState } from "react";
import { ScrollText, Filter } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await managerService.getTenantAuditLogs();
        setLogs(res.data.data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <ScrollText size={28} color="var(--color-accent)" /> Audit Logs
        </h1>
        <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
          A secure, immutable log of all actions taken within your organization.
        </p>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Timestamp</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>User</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Action</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No actions recorded.</td></tr>
              ) : logs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid var(--color-border)" : "none", fontSize: "13px" }}>
                  <td style={{ padding: "16px 24px", color: "var(--color-text-secondary)" }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)" }}>{log.user?.email || "Unknown"}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ padding: "4px 8px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontFamily: "monospace", fontSize: "12px" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", color: "var(--color-text-muted)" }}>{log.ip || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
