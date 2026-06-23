dash_path = 'apps/web/src/shared/components/layout/DashboardShell.tsx'
with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<main \n          className="glass-panel floating-shell animate-fade-in"\n          style={{',
    '<main style={{'
)
content = content.replace(
    'padding:   "32px",\n    margin:    "20px",\n    marginLeft: "8px",',
    'padding:   "24px",\n    margin:    "0",\n    background: "var(--color-primary)",\n    borderRadius: "0",'
)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('DashboardShell flattened.')

top_path = 'apps/web/src/shared/components/layout/TopNav.tsx'
with open(top_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className="glass-navbar"\n      style={{',
    'style={{'
)
content = content.replace(
    'height:          "var(--topnav-height)",',
    'height:          "var(--topnav-height)",\n        background:      "var(--color-primary)",\n        borderBottom:    "1px solid rgba(255,255,255,0.08)",'
)

with open(top_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('TopNav flattened and matched to sidebar.')
