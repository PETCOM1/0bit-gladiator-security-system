"use client";

import React, { useEffect, useState } from "react";
import { Activity, Clock, User } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";
import DataTable, { Column } from "@/shared/components/ui/DataTable";

export default function GlobalAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const columns: Column<any>[] = [
    {
      header: "Timestamp",
      render: (log) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={14} style={{ flexShrink: 0 }} />{" "}
          <span style={{ whiteSpace: "nowrap" }}>
            {new Date(log.createdAt).toLocaleString()}
          </span>
        </div>
      ),
      style: { width: "220px" },
    },
    {
      header: "User",
      render: (log) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "var(--color-bg-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-secondary)",
          }}>
            <User size={12} />
          </div>
          <span style={{ wordBreak: "break-all" }}>{log.user?.email || "System"}</span>
        </div>
      ),
    },
    {
      header: "Action",
      render: (log) => (
        <span style={{
          padding: "4px 8px",
          background: "var(--color-accent-subtle)",
          color: "var(--color-accent)",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}>
          {log.action}
        </span>
      ),
      style: { width: "180px" },
    },
    {
      header: "Meta",
      render: (log) => (
        <span style={{
          fontFamily: "monospace",
          fontSize: "12px",
          color: "var(--color-text-muted)",
          wordBreak: "break-word",
        }}>
          {log.meta ? JSON.stringify(log.meta) : "—"}
        </span>
      ),
    },
    {
      header: "IP Address",
      render: (log) => log.ipAddress || "—",
      style: { width: "130px" },
    },
  ];

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
      <div style={{
        background: "var(--color-card-bg)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-card-border)",
        boxShadow: "var(--color-card-shadow)",
        overflow: "hidden",
      }}>
        <DataTable
          data={logs}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search logs..."
          searchKeys={["action", "user.email"]}
          externalPagination={{
            currentPage: currentPage,
            totalPages: totalPages,
            onPageChange: fetchLogs,
          }}
          filterOptions={[
            {
              label: "Action",
              key: "action",
              options: [
                { label: "Login", value: "LOGIN" },
                { label: "Google Login", value: "LOGIN_GOOGLE" },
                { label: "Google Register", value: "REGISTERED_GOOGLE" },
                { label: "Password Set", value: "PASSWORD_SET" },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
