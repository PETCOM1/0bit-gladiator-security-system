"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import { superAdminService } from "../services/tenant.service";
import DataTable, { Column } from "@/shared/components/ui/DataTable";

interface PlatformUser {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  accountStatus: string;
  createdAt: string;
  lastActiveAt?: string | null;
  tenant?: { id: string; name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:     "Super Admin",
  ADMIN:           "Admin",
  ACCOUNT_MANAGER: "Account Manager",
  MANAGER:         "Manager",
  SITE_MANAGER:    "Site Manager",
  GUARD:           "Guard",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 10px", borderRadius: "var(--radius-pill)",
      fontSize: "11px", fontWeight: 700,
      background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)",
      border: "1px solid var(--color-border)",
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    ACTIVE:    { background: "var(--color-success-subtle)", color: "var(--color-success)", border: "1px solid var(--color-success-subtle)" },
    PENDING:   { background: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid var(--color-warning-subtle)" },
    SUSPENDED: { background: "var(--color-danger-subtle)",  color: "var(--color-danger)",  border: "1px solid var(--color-danger-subtle)"  },
  };
  const s = styles[status] ?? styles.PENDING;
  return (
    <span style={{
      ...s,
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "var(--radius-pill)",
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {status}
    </span>
  );
}

// ─── Permanent delete confirm dialog (type-to-confirm, since irreversible) ─────
function DeleteConfirmDialog({ user, onClose, onConfirm }: {
  user: PlatformUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const matches = confirmText.trim().toLowerCase() === user.email.toLowerCase();

  const handleConfirm = async () => {
    if (!matches) return;
    setBusy(true); setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to delete user.");
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: "440px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-danger)",
        borderRadius: "var(--radius-xl)", padding: "28px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <AlertTriangle size={20} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              Permanently delete this user?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "6px", lineHeight: 1.6 }}>
              This cannot be undone. All data tied to <strong>{user.email}</strong> that
              isn't required for operational history (audit logs, notifications, shifts)
              will be permanently erased. If this account has logged visitors, reported
              incidents, or has other activity history, deletion will fail — suspend the
              account instead in that case.
            </p>
          </div>
        </div>

        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Type "{user.email}" to confirm
        </label>
        <input
          type="text" value={confirmText} autoFocus
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={user.email}
          style={{
            width: "100%", padding: "10px 14px", boxSizing: "border-box",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)",
            outline: "none", marginBottom: "16px",
          }}
        />

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 500,
            color: "var(--color-text-secondary)", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!matches || busy}
            style={{
              flex: 1, padding: "10px",
              background: "var(--color-danger)", border: "none", borderRadius: "var(--radius-md)",
              fontSize: "13px", fontWeight: 700, color: "#fff",
              cursor: !matches || busy ? "not-allowed" : "pointer",
              opacity: !matches || busy ? 0.5 : 1,
            }}
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── USERS PAGE ─────────────────────────────────────────────────────────────────
export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users,      setUsers]      = useState<PlatformUser[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformUser | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await superAdminService.getUsers();
      setUsers(res.data?.data?.users ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await superAdminService.hardDeleteUser(deleteTarget.id);
    setDeleteTarget(null);
    await fetchUsers();
  };

  const columns: Column<PlatformUser>[] = [
    {
      header: "User",
      render: (u) => {
        const name = u.displayName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
        const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "var(--radius-pill)",
              background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)" }}>{initials}</span>
            </div>
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.2 }}>{name}</p>
              {name !== u.email && (
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "2px 0 0" }}>{u.email}</p>
              )}
            </div>
          </div>
        );
      },
    },
    { header: "Role", render: (u) => <RoleBadge role={u.role} /> },
    { header: "Tenant", render: (u) => u.tenant?.name ?? <span style={{ color: "var(--color-text-muted)" }}>—</span> },
    { header: "Status", render: (u) => <StatusBadge status={u.accountStatus} /> },
    {
      header: "Joined",
      render: (u) => new Date(u.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
      style: { whiteSpace: "nowrap" },
    },
    {
      header: "Actions",
      render: (u) => u.id === currentUser?.id ? (
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>You</span>
      ) : (
        <button onClick={() => setDeleteTarget(u)} style={{
          padding: "4px 12px", fontSize: "12px", fontWeight: 600,
          color: "var(--color-danger)", background: "var(--color-danger-subtle)",
          border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer",
        }}>
          Delete permanently
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Users</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Every account on the platform, across every role and tenant
        </p>
      </div>

      <div style={{
        background: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--color-card-shadow)",
        overflow: "hidden",
      }}>
        {error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : (
          <DataTable
            data={users}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Search users by name or email..."
            searchKeys={["displayName", "firstName", "lastName", "email"]}
            filterOptions={[
              {
                label: "Role",
                key: "role",
                options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ label, value })),
              },
              {
                label: "Status",
                key: "accountStatus",
                options: [
                  { label: "Active", value: "ACTIVE" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Suspended", value: "SUSPENDED" },
                ],
              },
            ]}
          />
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmDialog
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
