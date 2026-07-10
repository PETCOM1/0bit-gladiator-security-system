"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";
import DataTable, { Column } from "@/shared/components/ui/DataTable";

interface AuditEntry {
  id:        string;
  action:    string;
  ip:        string | null;
  meta:      any;
  createdAt: string;
  user: {
    email:       string;
    displayName: string | null;
    firstName:   string | null;
    lastName:    string | null;
    role:        string;
  } | null;
}

function timeAgo(date: string) {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function actionLabel(action: string) {
  return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

type ActionType = "success" | "info" | "danger" | "warning" | "default";

function actionType(action: string): ActionType {
  if (action.includes("LOGIN"))                                        return "success";
  if (action.includes("INVITE") || action.includes("REGISTER"))       return "info";
  if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("SUSPEND")) return "danger";
  if (action.includes("PASSWORD") || action.includes("RESET"))        return "warning";
  return "default";
}

const ACTION_COLORS: Record<ActionType, { bg: string; color: string }> = {
  success: { bg: "var(--color-success-subtle)", color: "var(--color-success)" },
  info:    { bg: "var(--color-info-subtle)",    color: "var(--color-info)"    },
  danger:  { bg: "var(--color-danger-subtle)",  color: "var(--color-danger)"  },
  warning: { bg: "var(--color-warning-subtle)", color: "var(--color-warning)" },
  default: { bg: "var(--color-bg-subtle)",      color: "var(--color-text-muted)" },
};

export default function AuditLogPage() {
  const [logs,      setLogs]      = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [total,     setTotal]     = useState(0);

  const fetchLogs = useCallback(async (p: number) => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiClient.get(endpoints.superAdmin.audit, { params: { page: p } });
      const d   = res.data?.data;
      setLogs(d?.logs ?? []);
      setPages(d?.pages ?? 1);
      setTotal(d?.total ?? 0);
    } catch {
      setError("Failed to load audit log.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(page); }, [fetchLogs, page]);

  const displayName = (u: AuditEntry["user"]) =>
    u?.displayName || [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";

  const columns: Column<AuditEntry>[] = [
    {
      header: "Event",
      render: (log) => {
        const type  = actionType(log.action);
        const style = ACTION_COLORS[type];
        return (
          <span style={{
            fontSize:      "12px",
            fontWeight:    600,
            background:    style.bg,
            color:         style.color,
            padding:       "3px 10px",
            borderRadius:  "var(--radius-pill)",
            display:       "inline-block",
            whiteSpace:    "nowrap",
            textTransform: "capitalize",
          }}>
            {actionLabel(log.action)}
          </span>
        );
      },
    },
    {
      header: "User",
      render: (log) => (
        <>
          <div style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-primary)" }}>
            {displayName(log.user)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            {log.user?.email ?? "—"}
          </div>
        </>
      ),
    },
    {
      header: "Role",
      render: (log) => log.user?.role && (
        <span style={{
          fontSize:      "11px",
          fontWeight:    600,
          background:    "var(--color-accent-subtle)",
          color:         "var(--color-accent)",
          padding:       "2px 8px",
          borderRadius:  "var(--radius-pill)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}>
          {log.user.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "IP",
      render: (log) => log.ip || "—",
      style: { fontFamily: "monospace", fontSize: "12px" },
    },
    {
      header: "When",
      render: (log) => timeAgo(log.createdAt),
      style: { whiteSpace: "nowrap" },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Audit Log
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          {total > 0 ? `${total.toLocaleString()} events recorded` : "Full history of platform events"}
        </p>
      </div>

      {/* Table card */}
      <div style={{
        background:   "var(--color-card-bg)",
        border:       "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow:    "var(--color-card-shadow)",
        overflow:     "hidden",
      }}>
        {error ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--color-danger)" }}>{error}</p>
          </div>
        ) : logs.length === 0 && !isLoading ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>No events yet</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Events will appear here as users take actions</p>
          </div>
        ) : (
          <DataTable
            data={logs}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Search logs..."
            searchKeys={["action", "user.email", "user.displayName"]}
            externalPagination={{
              currentPage: page,
              totalPages: pages,
              onPageChange: (p) => setPage(p),
              totalEntries: total,
            }}
            filterOptions={[
              {
                label: "Role",
                key: (item) => item.user?.role ?? "",
                options: [
                  { label: "Super Admin", value: "SUPER_ADMIN" },
                  { label: "Admin", value: "ADMIN" },
                  { label: "Manager", value: "MANAGER" },
                  { label: "Site Manager", value: "SITE_MANAGER" },
                  { label: "Guard", value: "GUARD" },
                ],
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
