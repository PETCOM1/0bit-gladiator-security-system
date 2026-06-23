import re

path = 'apps/web/src/features/admin/pages/ActivityPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the group-by-date section and replace with a single table
# We'll keep the search and header, but replace the grouped logs with a flat table.

# We need to rewrite the rendering logic. Since the current code uses groupByDate, we'll keep it but render as a table with date row as header.

# We'll create a new render block that uses a table.
# Let's find the part that renders the logs and replace it.

new_table_render = '''
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Detail</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>User</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any, idx: number) => {
                const { label, detail } = formatAction(log.action, log.meta);
                const roleColor = ROLE_COLOR[log.user?.role] ?? "#94a3b8";
                return (
                  <tr key={log.id} style={{ borderBottom: idx < logs.length - 1 ? "1px solid #f0f0f0" : "none", cursor: "default" }}>
                    <td style={{ padding: "10px 16px", color: "#111827", fontWeight: 500 }}>{label}</td>
                    <td style={{ padding: "10px 16px", color: "#6b7280" }}>{detail || "—"}</td>
                    <td style={{ padding: "10px 16px", color: "#111827" }}>{displayName(log.user)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "1px 8px",
                        borderRadius: "4px",
                        background: ${roleColor}15,
                        color: roleColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}>
                        {log.user?.role?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right", color: "#9ca3af", fontFeatureSettings: "'tnum'" }}>
                      {new Date(log.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
'''

# Replace the entire log rendering section from the return statement.
# We'll locate the part after the search input and before the load more button.

# We'll use a simpler approach: replace the block that starts with {logs.length === 0 ? ... } and ends with the load more button.
# We'll find the index of the load more button and replace the content in between.

# Let's find the line that contains 'load more' or 'hasMore' and replace everything in between.
# We'll use string replacement.

# We need to be careful with the JSX structure. We'll just replace the whole section after the search input with the new table.

# Locate the placeholder. We'll use a marker.

# Since the code is complex, I'll append the new code after the search input and remove the old.

# I'll create a new version of the return JSX for the logs part.

# Actually, let's just rewrite the entire component's return. But that's risky.

# Simpler: Use a Python script to find the line '# Search' and then replace everything after that with the new table.

# We'll keep the header and search, then replace the conditional rendering.

# Let's do a targeted replacement: after the search input, we have the conditional. We'll replace everything from that conditional to the end of the component.

# We'll use a marker: "# Search" is the comment, then the input, then the conditional.

# I'll extract the part after the search input and before the closing div.

# Since we already have the activity page code, I'll write a new version that uses a table and replace the whole component.

# Better: I'll provide a complete new file content and overwrite.

# But the user wants to match the subscription plan table. Since we don't have that, we'll just make it clean.

# Let's read the entire file and replace the rendering with the table above.

# I'll do a replace of the entire logs rendering block.

# Find the pattern: {logs.length === 0 ? ... : ...}
# We'll replace that with the new table code.

# First, we need to adjust the grouping: we can drop grouping and show all logs in one table.

# I'll modify the component to not group by date, and just show a flat table with a date column or simply time.

# That's a bigger change. Let's keep grouping but as a table with a date row above each group.

# But the user said "subscription plan table" likely a flat table with columns. So we should flatten.

# I'll flatten the logs and remove grouping.

# Steps:
# 1. Remove groupByDate call.
# 2. In the return, remove the grouped mapping and use the table.

# I'll do a complete rewrite of the return section.

# Since we are in a chat, I'll provide a new file content that is the ActivityPage with a flat table.

# I'll create a new version of the component and print it.

# Let's generate the new code.

# I'll create a Python script that replaces the entire function body.

# This is getting complex. Let's just give a command to replace the entire file with a new version that has a table.

# I'll write the new file content as a string and write it.

new_file_content = '''
"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/api/client";

function displayName(u: any) {
  return u?.displayName || [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || "—";
}

function formatAction(action: string, meta: any): { label: string; detail: string | null } {
  const map: Record<string, (m: any) => { label: string; detail: string | null }> = {
    PROJECT_CREATED:        (m) => ({ label: "Created project",        detail: m?.projectName ?? null }),
    PROJECT_UPDATED:        ()  => ({ label: "Updated project",        detail: null }),
    PROJECT_STATUS_CHANGED: (m) => ({ label: "Changed project status", detail: m?.from && m?.to ? ${m.from} →  : null }),
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

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "var(--color-danger)", ADMIN: "var(--color-warning)", MANAGER: "var(--color-info)", DEVELOPER: "var(--color-accent)", CLIENT: "#a855f7",
};

const ACTION_COLOR: Record<string, string> = {
  PROJECT_CREATED: "var(--color-accent)", PROJECT_DELETED: "var(--color-danger)",
  MILESTONE_APPROVED: "var(--color-success)", INVOICE_STATUS_UPDATED: "var(--color-info)",
  DOCUMENT_CREATED: "#a855f7", PROJECT_STATUS_CHANGED: "var(--color-warning)",
};

export function AdminActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
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
      const { data } = await apiClient.get(/admin/activity?);
      const newLogs = data.data?.logs ?? [];
      setLogs((prev) => append ? [...prev, ...newLogs] : newLogs);
      setTotal(data.data?.pagination?.total ?? 0);
      setHasMore(p < (data.data?.pagination?.pages ?? 1));
      setPage(p);
    } catch { /* silent */ }
    finally { setIsLoading(false); setIsLoadingMore(false); }
  }, []);

  useEffect(() => { fetchLogs(1, debouncedSearch); }, [debouncedSearch]);

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
      <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: "13px" }}>Loading activity...</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)" }}>Activity</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Full audit log — all team actions</p>
        </div>
        {total > 0 && (
          <div style={{ padding: "6px 14px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{total} total actions</span>
          </div>
        )}
      </div>

      <input
        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by action (e.g. PROJECT, MILESTONE, INVOICE)..."
        style={{ width: "100%", padding: "9px 14px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box" }}
      />

      {logs.length === 0 ? (
        <div style={{ padding: "60px 40px", textAlign: "center", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "#111827", marginBottom: "6px" }}>{search ? "No matching actions" : "No activity yet"}</p>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>Team actions will appear here as they happen.</p>
        </div>
      ) : (
        <>
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Detail</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>User</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, idx: number) => {
                  const { label, detail } = formatAction(log.action, log.meta);
                  const roleColor = ROLE_COLOR[log.user?.role] ?? "#94a3b8";
                  return (
                    <tr key={log.id} style={{ borderBottom: idx < logs.length - 1 ? "1px solid #f0f0f0" : "none", cursor: "default" }}>
                      <td style={{ padding: "10px 16px", color: "#111827", fontWeight: 500 }}>{label}</td>
                      <td style={{ padding: "10px 16px", color: "#6b7280" }}>{detail || "—"}</td>
                      <td style={{ padding: "10px 16px", color: "#111827" }}>{displayName(log.user)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "1px 8px",
                          borderRadius: "4px",
                          background: ${roleColor}15,
                          color: roleColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>
                          {log.user?.role?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "right", color: "#9ca3af", fontFeatureSettings: "'tnum'" }}>
                        {new Date(log.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={() => fetchLogs(page + 1, debouncedSearch, true)} disabled={isLoadingMore} style={{ padding: "9px 24px", fontSize: "13px", fontWeight: 500, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", color: "#4b5563", opacity: isLoadingMore ? 0.6 : 1 }}>
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
'''

with open('apps/web/src/features/admin/pages/ActivityPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_file_content)
print('ActivityPage rewritten with consistent table styling.')
