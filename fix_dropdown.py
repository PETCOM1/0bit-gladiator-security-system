top_path = 'apps/web/src/shared/components/layout/TopNav.tsx'
with open(top_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove glass-panel class from dropdown
content = content.replace(
    'className="glass-panel"\n              style={{',
    'style={{'
)

# Add solid white background, border, and shadow to dropdown
content = content.replace(
    'position:    "absolute",\n              top:         "calc(100% + 8px)",\n              right:       0,\n              minWidth:    "220px",',
    'position:    "absolute",\n              top:         "calc(100% + 8px)",\n              right:       0,\n              minWidth:    "220px",\n              background:  "#ffffff",\n              border:      "1px solid #e5e7eb",\n              borderRadius: "8px",\n              boxShadow:   "0 10px 25px rgba(0,0,0,0.1)",'
)

# Adjust user info text colors for white background
content = content.replace(
    'color: "var(--color-text-primary)"',
    'color: "#111827"'
)
content = content.replace(
    'color: "var(--color-text-muted)"',
    'color: "#6b7280"'
)

# Divider color
content = content.replace(
    'background: "var(--color-border)"',
    'background: "#e5e7eb"'
)

with open(top_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('TopNav dropdown updated to white solid.')
