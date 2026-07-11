"use client";

import React from "react";
import { RefreshCw, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const cardStyle: React.CSSProperties = {
  background: "var(--color-card-bg)",
  border: "1px solid var(--color-card-border)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--color-card-shadow)",
  padding: "20px 24px",
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)",
  display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px",
};

export const sectionSubStyle: React.CSSProperties = {
  fontSize: "12.5px", color: "var(--color-text-muted)", marginBottom: "18px",
};

const chartTooltipStyle = { background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--color-card-shadow)" };
const chartTooltipItemStyle = { color: "var(--color-text-primary)", fontSize: "13px", fontWeight: 600 };

export const dateLabelStyle: React.CSSProperties = {
  display: "block", fontSize: "10.5px", fontWeight: 700, color: "var(--color-text-muted)",
  textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "5px",
};
export const dateInputStyle: React.CSSProperties = {
  padding: "8px 10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none",
};
export const applyBtnStyle: React.CSSProperties = {
  padding: "8px 16px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer",
};

export function KpiCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div style={{ ...cardStyle, padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-md)", background: tone || "var(--color-accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--color-accent)" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "21px", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontSize: "11.5px", color: "var(--color-text-muted)", marginTop: "5px", fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

export function SectionAnchor({ id, icon, title, subtitle }: { id?: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: "90px" }}>
      <div style={sectionTitleStyle}>{icon} {title}</div>
      <div style={sectionSubStyle}>{subtitle}</div>
    </div>
  );
}

export function StatTile({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
      <div style={{ fontSize: "20px", fontWeight: 800, color: color || "var(--color-text-primary)", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

export function MiniTrendChart({ data, dataKey, xKey, color, unit }: { data: any[]; dataKey: string; xKey: string; color: string; unit?: string }) {
  return (
    <div style={{ height: "160px", width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} dy={6} />
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={30} />
          <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} formatter={(v: any) => [`${v}${unit || ""}`, ""]} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmptyList({ text }: { text: string }) {
  return <div style={{ fontSize: "12.5px", color: "var(--color-text-muted)", fontStyle: "italic", padding: "8px 0" }}>{text}</div>;
}

export function CategoryBar({ label, count, max, color, valueLabel }: { label: string; count: number; max: number; color?: string; valueLabel?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</span>
        <span style={{ fontSize: "12.5px", fontWeight: 700, color: color || "var(--color-accent)" }}>{valueLabel ?? count}</span>
      </div>
      <div style={{ height: "8px", background: "var(--color-bg-subtle)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color || "var(--color-accent)", borderRadius: "999px" }} />
      </div>
    </div>
  );
}

export function PersonBadge({ name, meta }: { name: string; meta?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{name}</span>
      {meta && <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)", fontWeight: 600 }}>{meta}</span>}
    </div>
  );
}

export const COVERAGE_COLORS: Record<string, { dot: string; bg: string; border: string; label: string }> = {
  full: { dot: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", label: "Fully Covered" },
  minor: { dot: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.3)", label: "Minor Gaps" },
  understaffed: { dot: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", label: "Understaffed" },
  critical: { dot: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", label: "Critical" },
};

// ── Shared header: icon-box + title/subtitle (left), refresh + pill tabs + download button (right) ──
export function AnalyticsHeader<T extends string>({
  icon, title, subtitle, tabs, activeTab, onTabChange, onRefresh, onDownload, downloadDisabled, downloadLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tabs: Array<{ id: T; label: string }>;
  activeTab: T;
  onTabChange: (id: T) => void;
  onRefresh?: () => void;
  onDownload: () => void;
  downloadDisabled?: boolean;
  downloadLabel?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", position: "sticky", top: 0, zIndex: 10, background: "var(--color-bg)", paddingBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent)", flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>{title}</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "2px" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {onRefresh && (
          <button onClick={onRefresh} title="Refresh" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
            <RefreshCw size={15} />
          </button>
        )}
        {tabs.length > 1 && (
          <div style={{ display: "flex", gap: "4px", background: "var(--color-bg-subtle)", padding: "4px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                style={{
                  padding: "8px 16px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                  background: activeTab === t.id ? "var(--color-card-bg)" : "transparent",
                  color: activeTab === t.id ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontWeight: activeTab === t.id ? 700 : 600, fontSize: "13px",
                  boxShadow: activeTab === t.id ? "var(--color-card-shadow)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={onDownload}
          disabled={downloadDisabled}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
            background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
            fontSize: "13px", fontWeight: 700, color: "var(--color-accent-text)",
            cursor: downloadDisabled ? "not-allowed" : "pointer", opacity: downloadDisabled ? 0.6 : 1,
            boxShadow: "var(--color-card-shadow)", whiteSpace: "nowrap",
          }}
        >
          <Download size={15} /> {downloadLabel || "Download PDF Report"}
        </button>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-danger)" }}>
      {message}
      <div><button onClick={onRetry} style={{ marginTop: "12px", padding: "8px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Retry</button></div>
    </div>
  );
}
