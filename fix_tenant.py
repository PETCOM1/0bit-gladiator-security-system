import re

path = 'apps/web/src/shared/components/layout/SidebarClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the tenantName assignment
old = r'const tenantName = user\?\.tenant\?\.name \|\| BRAND\.name;'
new = 'const tenantName = (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") ? BRAND.name : (user?.tenant?.name || BRAND.name);'
content = re.sub(old, new, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Sidebar tenant name fixed.')
