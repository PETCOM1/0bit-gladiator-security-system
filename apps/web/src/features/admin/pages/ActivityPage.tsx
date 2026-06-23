"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity } from "lucide-react";
import apiClient from "@/api/client";
import DataTable, { Column } from "@/shared/components/ui/DataTable";

function displayName(u: any) {
  return u?.displayName || [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "-";
}

function formatAction(action: string, meta: any): { label: string; detail: string | null } {
  const map: Record<string, (m: any) => { label: string; detail: string | null }> = {
    USER_INVITED:           (m) => ({ label: "Invited user",           detail: m?.email ?? null }),
    MANAGER_INVITED:        (m) => ({ label: "Invited manager",        detail: m?.email ?? null }),
    LOGIN:                  ()  => ({ label: "Logged in",              detail: null }),
    LOGOUT:                 ()  => ({ label: "Logged out",             detail: null }),
    PASSWORD_RESET:         ()  => ({ label: "Reset password",         detail: null }),
    PROFILE_UPDATED:        ()  => ({ label: "Updated profile",        detail: null }),
    USER_STATUS_UPDATED:    (m) => ({ label: "Updated user status",    detail: m?.status ?? null }),
    USER_ROLE_UPDATED:      (m) => ({ label: "Updated user role",      detail: m?.role ?? null }),
    PROJECT_CREATED:        (m) => ({ label: "Created project",        detail: m?.projectName ?? null }),
    PROJECT_UPDATED:        ()  => ({ label: "Updated project",        detail: null }),
    PROJECT_STATUS_CHANGED: (m) => ({ label: "Changed project status", detail: m?.from && m?.to ? `${m.from} → ${m.to}` : null }),
    MILESTONE_CREATED:      (m) => ({ label: "Created milestone",      detail: m?.title ?? null }),
    MILESTONE_APPROVED:     ()  => ({ label: "Approved milestone",     detail: null }),
    DOCUMENT_CREATED:       (m) => ({ label: "Created document",       detail: m?.title ?? null }),
    INVOICE_STATUS_UPDATED: (m) => ({ label: "Updated invoice",        detail: m?.newStatus ?? null }),
    INTAKE_CONVERTED:       ()  => ({ label: "Converted intake",       detail: null }),
    PROJECT_DELETED:        (m) => ({ label: "Deleted project",        detail: m?.projectName ?? null }),
  };
  const fn = map[action];
  return fn ? fn(meta) : { label: action.replace(/_/g, " ").toLowerCase(), detail: null };
}

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  SUPER_ADMIN: { background: "var(--color-danger-subtle)",  color: "var(--color-danger)",  border: "1px solid rgba(239,68,68,0.25)"   },
  ADMIN:       { background: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(245,158,11,0.25)"  },
  MANAGER:     { background: "var(--color-info-subtle)",    color: "var(--color-info)",    border: "1px solid rgba(59,130,246,0.25)"  },
  USER:        { background: "var(--color-bg-subtle)",      color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] ?? ROLE_STYLES.USER;
  return (
    <span style={{ ...s, display: "inline-flex", alignItems: "center", padding: "3px 12px", borderRadius: "var(--radius-pill)", fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {role?.replace(/_/g, " ")}
    </span>
  );
}

function TimeCell({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <div>
      <p style={{ fontSize: "14px", color: "var(--color-text-primary)", margin: 0, fontWeight: 500 }}>
        {d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
      </p>
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "2px 0 0", fontFeatureSettings: "'tnum'" }}>
        {d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

export function AdminActivityPage() {
  const [logs,          setLogs]          = useState<any[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(false);
  const [total,         setTotal]         = useState(0);
  const [search,        setSearch]        = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = useCallback(async (p: number, actionSearch: string, append = false) => {
    try {
      append ? setIsLoadingMore(true) : setIsLoading(true);
      const params = new URLSearchParams({ page: String(p) });
      if (actionSearch) params.set("action", actionSearch);
      const { data } = await apiClient.get(`/admin/activity?${params}`);
      const newLogs = data.data?.logs ?? [];
      setLogs((prev) => append ? [...prev, ...newLogs] : newLogs);
      setTotal(data.data?.pagination?.total ?? 0);
      setHasMore(p < (data.data?.pagination?.pages ?? 1));
      setPage(p);
    } catch { /* silent */ }
    finally { setIsLoading(false); setIsLoadingMore(false); }
  }, []);

  useEffect(() => { fetchLogs(1, debouncedSearch); }, [debouncedSearch, fetchLogs]);

  const columns: Column<any>[] = [
    {
      header: "User",
      style: { padding: "16px 24px", verticalAlign: "middle" },
      headerStyle: { padding: "12px 24px" },
      render: (log) => {
        const name = displayName(log.user);
        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-accent)" }}>{initials}</span>
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.25 }}>{name}</p>
              {name !== log.user?.email && (
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "2px 0 0" }}>{log.user?.email}</p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Action",
      style: { padding: "16px 24px", verticalAlign: "middle" },
      headerStyle: { padding: "12px 24px" },
      render: (log) => {
        const { label } = formatAction(log.action, log.meta);
        return (
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
            {label}
          </span>
        );
      }
    },
    {
      header: "Detail",
      style: { padding: "16px 24px", verticalAlign: "middle" },
      headerStyle: { padding: "12px 24px" },
      render: (log) => {
        const { detail } = formatAction(log.action, log.meta);
        return (
          <span style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
            {detail || "-"}
          </span>
        );
      }
    },
    {
      header: "Role",
      style: { padding: "16px 24px", verticalAlign: "middle" },
      headerStyle: { padding: "12px 24px" },
      render: (log) => <RoleBadge role={log.user?.role} />
    },
    {
      header: "Time",
      style: { padding: "16px 24px", verticalAlign: "middle" },
      headerStyle: { padding: "12px 24px" },
      render: (log) => <TimeCell iso={log.createdAt} />
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Activity Log
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Full audit trail - all team actions across the platform.
          </p>
        </div>
        {total > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "var(--color-card-bg)",
            border: "1px solid var(--color-card-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--color-card-shadow)",
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--color-text-secondary)"
          }}>
            <span>{total.toLocaleString()} Total Actions</span>
          </div>
        )}
      </div>

      {/* Table card */}
      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <Activity size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>System Activity Records</h2>
        </div>
        <DataTable
          data={logs}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search by action keyword..."
          searchKeys={["action"]}
          itemsPerPage={100}
          filterOptions={[
            {
              label: "Role",
              key: (log: any) => log.user?.role,
              options: [
                { label: "Admin",       value: "ADMIN"       },
                { label: "Manager",     value: "MANAGER"     },
                { label: "User",        value: "USER"        },
                { label: "Super Admin", value: "SUPER_ADMIN" },
              ],
            },
          ]}
          emptyMessage="No activity yet. Team actions will appear here as they happen."
        />
      </div>

      {/* Load more */}
      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
          <button
            onClick={() => fetchLogs(page + 1, debouncedSearch, true)}
            disabled={isLoadingMore}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              fontSize: "13.5px",
              fontWeight: 600,
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              cursor: isLoadingMore ? "not-allowed" : "pointer",
              color: "var(--color-text-primary)",
              opacity: isLoadingMore ? 0.6 : 1,
              transition: "all var(--transition-fast)",
              boxShadow: "var(--color-card-shadow)",
            }}
          >
            {isLoadingMore ? "Loading..." : "Load More Activity"}
          </button>
        </div>
      )}
    </div>
  );
}
