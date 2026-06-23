import re

path = 'apps/web/src/features/admin/pages/ActivityPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the log entry rendering section with a cleaner table-like design
# We'll keep the existing code structure but update the styling of the log items
old_pattern = r'<div key={log\.id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 20px", borderBottom: i < dayLogs\.length - 1 \? "1px solid var\(--color-border\)" : "none" }}>.*?</div>'

new_entry = '''
<div key={log.id} style={{
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "12px 20px",
  borderBottom: i < dayLogs.length - 1 ? "1px solid #f0f0f0" : "none",
  background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)",
  transition: "background 0.15s",
}}>
  {/* Dot */}
  <div style={{
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: dotColor,
    flexShrink: 0,
  }} />

  {/* Content - flex row for better alignment */}
  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>{label}</span>
        {detail && (
          <span style={{
            fontSize: "12px",
            color: "#6b7280",
            background: "#f3f4f6",
            padding: "1px 10px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
          }}>{detail}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
        <span style={{ fontSize: "12px", color: "#6b7280" }}>{displayName(log.user)}</span>
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
      </div>
    </div>
    {/* Time */}
    <span style={{
      fontSize: "12px",
      color: "#9ca3af",
      flexShrink: 0,
      fontFeatureSettings: "'tnum'",
    }}>
      {new Date(log.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
    </span>
  </div>
</div>
'''

# Use regex to replace the entire log entry div block
# We'll use a simpler approach: find and replace the key sections
content = re.sub(
    r'<div key={log\.id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 20px", borderBottom: i < dayLogs\.length - 1 \? "1px solid var\(--color-border\)" : "none" }}>.*?</div>(?=\n\s*\);)',
    new_entry,
    content,
    flags=re.DOTALL
)

# Also update the date divider to be cleaner
content = content.replace(
    'fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap"',
    'fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap"'
)

# Update the card background to white
content = content.replace(
    'background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden"',
    'background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden"'
)

# Update the search input to match white theme
content = content.replace(
    'background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)"',
    'background: "#ffffff", border: "1px solid #e5e7eb"'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('ActivityPage table improved and consistent.')
