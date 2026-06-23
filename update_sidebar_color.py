path = 'apps/web/src/shared/components/layout/SidebarClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace background with brand primary color
content = content.replace(
    'background:      "rgba(10, 25, 47, 0.92)",',
    'background:      "var(--color-primary)",'
)
content = content.replace(
    'backdropFilter:  "blur(24px)",',
    'backdropFilter:  "none",'
)
content = content.replace(
    'WebkitBackdropFilter: "blur(24px)",',
    'WebkitBackdropFilter: "none",'
)
content = content.replace(
    'borderRight:     "1px solid rgba(255, 255, 255, 0.06)",',
    'borderRight:     "1px solid rgba(255, 255, 255, 0.08)",'
)
content = content.replace(
    'color:          "rgba(255,255,255,0.6)",',
    'color:          "rgba(255,255,255,0.7)",'
)
content = content.replace(
    'color:          isActive ? "#fff" : "rgba(255,255,255,0.6)",',
    'color:          isActive ? "#fff" : "rgba(255,255,255,0.7)",'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Sidebar color updated to brand primary.')
