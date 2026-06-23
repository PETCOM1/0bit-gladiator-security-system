path = 'apps/web/src/shared/components/layout/SidebarClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the malformed style block
start = content.find('<style>{')
if start != -1:
    end = content.find('}</style>', start)
    if end != -1:
        content = content[:start] + content[end + len('}</style>'):]

# Add transition to Link inline style if missing
if 'transition:' not in content:
    content = content.replace(
        'textDecoration: "none",',
        'textDecoration: "none",\n        transition: "background 0.2s, color 0.2s, transform 0.15s, border-color 0.2s",'
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Sidebar fixed.')
