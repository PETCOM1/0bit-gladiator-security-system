"use client";

import React from "react";

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    ACTIVE:    { background: "rgba(34,197,94,0.1)",   color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)"   },
    PENDING:   { background: "rgba(245,158,11,0.1)",  color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)"  },
    SUSPENDED: { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)"   },
    DELETED:   { background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 10px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 600,
      ...(styles[status] ?? styles.DELETED),
    }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, React.CSSProperties> = {
    ADMIN:     { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)"   },
    MANAGER:   { background: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)"  },
    DEVELOPER: { background: "rgba(168,85,247,0.1)",  color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)"  },
    CLIENT:    { background: "var(--color-accent-subtle)",  color: "var(--color-accent)", border: "1px solid var(--color-accent-border)"  },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 10px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 600,
      ...(styles[role] ?? styles.CLIENT),
    }}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: "32px", height: "32px",
      borderRadius: "50%",
      background: "rgba(132,204,22,0.15)",
      border: "1px solid var(--color-accent-border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      fontSize: "11px", fontWeight: 700,
      color: "var(--color-accent)",
    }}>
      {initials}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ onClose, title, children }: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        onClick={onClose}
      />
      <div 
        className="glass-panel animate-fade-in"
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: "440px",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 className="font-heading" style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
              color: "var(--color-text-muted)", fontSize: "14px", lineHeight: 1,
              padding: "6px 10px", borderRadius: "var(--radius-sm)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ title, message, confirmLabel, danger = false, onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        onClick={onCancel}
      />
      <div 
        className="glass-panel animate-fade-in"
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: "360px",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        <h3 className="font-heading" style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "8px" }}>{title}</h3>
        <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", marginBottom: "20px", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 16px", fontSize: "13px", fontWeight: 600,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-md)", cursor: "pointer",
            color: "var(--color-text-secondary)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)"; }}
          >
            Cancel
          </button>
          <button
            onClick={async () => { setIsLoading(true); await onConfirm(); setIsLoading(false); }}
            disabled={isLoading}
            style={{
              flex: 1, padding: "10px 16px", fontSize: "13px", fontWeight: 700,
              background: danger ? "#ef4444" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
              color: danger ? "#fff" : "#0b0f19",
              opacity: isLoading ? 0.6 : 1,
              transition: "all 0.15s ease",
              boxShadow: danger ? "0 4px 12px rgba(239, 68, 68, 0.25)" : "0 4px 12px rgba(245, 158, 11, 0.25)",
            }}
            onMouseEnter={(e) => { 
              if (!isLoading) {
                (e.currentTarget as HTMLElement).style.opacity = "0.9";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => { 
              if (!isLoading) {
                (e.currentTarget as HTMLElement).style.opacity = "1";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }
            }}
          >
            {isLoading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function FormInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label className="font-heading" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: "100%", padding: "10px 14px",
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", fontSize: "13.5px",
          color: "var(--color-text-primary)", outline: "none",
          boxSizing: "border-box",
          transition: "all var(--transition-fast)",
        }}
        onFocus={(e) => { 
          e.target.style.borderColor = "var(--color-accent)"; 
          e.target.style.boxShadow = "0 0 0 3px var(--color-accent-border)"; 
        }}
        onBlur={(e)  => { 
          e.target.style.borderColor = "var(--color-border)"; 
          e.target.style.boxShadow = "none"; 
        }}
      />
    </div>
  );
}

// ─── RadioOption ──────────────────────────────────────────────────────────────
export function RadioOption({ value, checked, onChange, label, description }: {
  value: string; checked: boolean; onChange: () => void;
  label: string; description: string;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: "12px",
      padding: "12px", borderRadius: "var(--radius-md)",
      border: `1px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`,
      background: checked ? "var(--color-accent-subtle)" : "transparent",
      cursor: "pointer", transition: "all 0.15s ease",
    }}>
      <input type="radio" value={value} checked={checked} onChange={onChange} style={{ marginTop: "2px", accentColor: "var(--color-accent)" }} />
      <div>
        <p className="font-heading" style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{description}</p>
      </div>
    </label>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
export function ActionButton({ onClick, disabled, variant = "default", children }: {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "warning" | "success";
  children: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" },
    primary: { background: "var(--color-accent)", border: "none", color: "#0b0f19", fontWeight: 600 },
    danger:  { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" },
    warning: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" },
    success: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-premium"
      style={{
        padding: "5px 12px", fontSize: "12px", fontWeight: 600,
        borderRadius: "var(--radius-md)", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
      <div>
        <h1 className="font-heading" style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", marginTop: "4px" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── StatGrid ─────────────────────────────────────────────────────────────────
export function StatGrid({ stats }: { stats: { label: string; value: string | number; color?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: "16px" }}>
      {stats.map(({ label, value, color }) => (
        <div 
          key={label} 
          className="glass-panel glass-panel-hover hud-metric-card"
          style={{
            padding: "18px 20px",
            borderRadius: "var(--radius-xl)",
            transition: "all var(--transition-base)",
          }}
        >
          <p className="font-heading" style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</p>
          <p className="font-heading" style={{ fontSize: "30px", fontWeight: 800, color: color ?? "var(--color-text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
export function TabBar<T extends string>({ tabs, active, onChange }: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div 
      className="glass-panel"
      style={{
        display: "flex", gap: "4px",
        borderRadius: "var(--radius-pill)",
        padding: "4px",
        width: "fit-content",
      }}
    >
      {tabs.map(({ key, label, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="btn-premium font-heading"
            style={{
              padding: "6px 16px", fontSize: "13px", fontWeight: 600,
              borderRadius: "var(--radius-pill)",
              background: isActive 
                ? "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)" 
                : "transparent",
              color: isActive ? "#0b0f19" : "var(--color-text-secondary)",
              boxShadow: isActive ? "0 2px 8px rgba(245, 158, 11, 0.3)" : "none",
              border: "none", cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "var(--color-text-primary)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "var(--color-text-secondary)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {label}
            {count !== undefined && (
              <span style={{
                marginLeft: "6px", fontSize: "11px",
                color: isActive ? "#0b0f19" : "var(--color-text-muted)",
                opacity: 0.8,
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, loading, error, empty }: {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: React.ReactNode;
}) {
  return (
    <div 
      className="glass-panel animate-fade-in"
      style={{
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
      }}
    >
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "60px", color: "var(--color-text-muted)" }}>
          <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "13px" }}>Loading...</span>
        </div>
      ) : error ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
          <p style={{ fontSize: "13px", color: "#ef4444" }}>{error}</p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              {headers.map((h) => (
                <th key={h} className="font-heading" style={{
                  padding: "14px 16px", textAlign: "left",
                  fontSize: "11px", fontWeight: 700,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      )}
      {!loading && !error && empty}
    </div>
  );
}

// ─── TableRow ─────────────────────────────────────────────────────────────────
export function TableRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        cursor: onClick ? "pointer" : undefined,
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.02)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </tr>
  );
}

export function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: "14px 16px", fontSize: "13.5px", color: "var(--color-text-secondary)" }}>
      {children}
    </td>
  );
}
