import re

path = 'apps/web/src/features/admin/pages/OverviewPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the ENTERPRISE option line and insert Pilot after it
lines = content.splitlines()
new_lines = []
for line in lines:
    new_lines.append(line)
    if '<option value="ENTERPRISE">Enterprise</option>' in line:
        indent = ' ' * (len(line) - len(line.lstrip()))
        new_lines.append(indent + '<option value="Pilot">Pilot</option>')

content = '\n'.join(new_lines)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Added Pilot option to filter dropdown.')
