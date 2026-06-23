notif_path = 'apps/web/src/shared/components/layout/NotificationBell.tsx'
with open(notif_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove glass-panel class
content = content.replace(
    'className="glass-panel"\n              style={{',
    'style={{'
)

# Replace dropdown background and border
content = content.replace(
    'position:    "absolute",\n              top:         "calc(100% + 8px)",\n              right:       0,\n              width:       "380px",',
    'position:    "absolute",\n              top:         "calc(100% + 8px)",\n              right:       0,\n              width:       "380px",\n              background:  "#ffffff",\n              border:      "1px solid #e5e7eb",\n              borderRadius: "8px",\n              boxShadow:   "0 10px 25px rgba(0,0,0,0.1)",'
)

# Adjust text colors
content = content.replace(
    'color: "var(--color-text-primary)"',
    'color: "#111827"'
)
content = content.replace(
    'color: "var(--color-text-muted)"',
    'color: "#6b7280"'
)
content = content.replace(
    'background: "var(--color-border)"',
    'background: "#e5e7eb"'
)

with open(notif_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('NotificationBell dropdown updated to white solid.')
