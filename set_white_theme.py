# Update SidebarClient.tsx
side_path = 'apps/web/src/shared/components/layout/SidebarClient.tsx'
with open(side_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Background to white
content = content.replace(
    'background:      "var(--color-primary)",',
    'background:      "#ffffff",'
)
content = content.replace(
    'background:      "rgba(10, 25, 47, 0.92)",',
    'background:      "#ffffff",'
)
# Remove backdrop blur
content = content.replace(
    'backdropFilter:  "none",',
    'backdropFilter:  "none",'
)
# Border to light gray
content = content.replace(
    'borderRight:     "1px solid rgba(255, 255, 255, 0.08)",',
    'borderRight:     "1px solid #e5e7eb",'
)
content = content.replace(
    'borderRight:     "1px solid rgba(255, 255, 255, 0.06)",',
    'borderRight:     "1px solid #e5e7eb",'
)

# Text colors to dark
content = content.replace(
    'color:          "rgba(255,255,255,0.7)",',
    'color:          "#4b5563",'
)
content = content.replace(
    'color:          isActive ? "#fff" : "rgba(255,255,255,0.7)",',
    'color:          isActive ? "#111827" : "#4b5563",'
)
# Active background
content = content.replace(
    'background:     isActive ? "rgba(245, 158, 11, 0.12)" : "transparent",',
    'background:     isActive ? "#f3f4f6" : "transparent",'
)
# Hover background (inline styles)
# We'll handle via CSS classes, but we can also adjust inline hover in the JSX.
# We'll replace the onMouseEnter/Leave to use light gray.
content = content.replace(
    'e.currentTarget.style.background = "rgba(255,255,255,0.05)";',
    'e.currentTarget.style.background = "#f3f4f6";'
)
content = content.replace(
    'e.currentTarget.style.color = "#fff";',
    'e.currentTarget.style.color = "#111827";'
)
content = content.replace(
    'e.currentTarget.style.background = "transparent";',
    'e.currentTarget.style.background = "transparent";'
)
content = content.replace(
    'e.currentTarget.style.color = "rgba(255,255,255,0.7)";',
    'e.currentTarget.style.color = "#4b5563";'
)

# Logo background
content = content.replace(
    'background:     "linear-gradient(135deg, var(--color-accent), #f59e0b)",',
    'background:     "linear-gradient(135deg, var(--color-accent), #f59e0b)",'
)
# But keep logo as is.

# Sidebar brand text (tenant name) – keep dark
content = content.replace(
    'color:         "#fff",',
    'color:         "#111827",'
)
# Also the section headers (MENU, OTHER)
content = content.replace(
    'color:      "rgba(255,255,255,0.25)",',
    'color:      "#9ca3af",'
)

# Border on active link
content = content.replace(
    'border:         isActive ? "1px solid rgba(245, 158, 11, 0.15)" : "1px solid transparent",',
    'border:         isActive ? "1px solid #e5e7eb" : "1px solid transparent",'
)

# Toggle button color
content = content.replace(
    'color:          "rgba(255,255,255,0.4)",',
    'color:          "#9ca3af",'
)
content = content.replace(
    'e.currentTarget.style.color = "#fff";',
    'e.currentTarget.style.color = "#111827";'
)
content = content.replace(
    'e.currentTarget.style.color = "rgba(255,255,255,0.4)";',
    'e.currentTarget.style.color = "#9ca3af";'
)

# Active indicator bar color
content = content.replace(
    'background: "var(--color-accent)",',
    'background: "var(--color-accent)",'
)
# Keep accent for indicator.

with open(side_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('SidebarClient updated to white.')

# Update TopNav.tsx
top_path = 'apps/web/src/shared/components/layout/TopNav.tsx'
with open(top_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'background:      "var(--color-primary)",',
    'background:      "#ffffff",'
)
content = content.replace(
    'borderBottom:    "1px solid rgba(255,255,255,0.08)",',
    'borderBottom:    "1px solid #e5e7eb",'
)
# Avatar background stays accent

with open(top_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('TopNav updated to white.')

# Update DashboardShell.tsx
dash_path = 'apps/web/src/shared/components/layout/DashboardShell.tsx'
with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'background: "var(--color-primary)",',
    'background: "#ffffff",'
)
# The main background already set to white, also the outer container background
content = content.replace(
    'backgroundColor: "var(--color-bg)",',
    'backgroundColor: "#f9fafb",'
)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('DashboardShell updated to white background.')

print('All components now use white background with light gray borders.')
