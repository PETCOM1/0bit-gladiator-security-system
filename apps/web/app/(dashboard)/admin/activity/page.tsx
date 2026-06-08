"use client";

import React, { useEffect, useState } from "react";
import { Activity, Search, Clock, User } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";

export default function GlobalAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (page: number) => {
    setLoading(true);
    try {
      const res = await superAdminService.getAuditLogs(page);
      setLogs(res.data.data.logs);
      setTotalPages(res.data.data.pages || 1);
      setCurrentPage(res.data.data.page || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLogs(newPage);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (log.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Global Audit Logs
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Monitor every action across the entire platform.
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Activity size={18} color="var(--color-accent)" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>System Events</h2>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input 
              type="text" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: "260px", padding: "8px 12px 8px 32px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)", outline: "none" }} 
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Timestamp", "User", "Action", "Meta", "IP Address"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No events found.</td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom: i < filteredLogs.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={14} style={{flexShrink: 0}} /> <span style={{whiteSpace: "nowrap"}}>{new Date(log.createdAt).toLocaleString()}</span></div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", wordBreak: "break-all" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)" }}><User size={12} /></div>
                        {log.user?.email || "System"}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ padding: "4px 8px", background: "var(--color-accent-subtle)", color: "var(--color-accent)", borderRadius: "4px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "monospace", wordBreak: "break-word" }}>
                      {log.meta ? JSON.stringify(log.meta) : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "var(--color-text-secondary)", wordBreak: "break-all" }}>{log.ipAddress || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}
              style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <button 
              disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}
              style={{ padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: currentPage === totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
