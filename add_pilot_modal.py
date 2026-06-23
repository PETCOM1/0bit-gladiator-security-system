import re

path = 'apps/web/src/features/admin/pages/OverviewPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the select for subscriptionTierId and add Pilot option after Enterprise
lines = content.splitlines()
new_lines = []
for line in lines:
    new_lines.append(line)
    if '<option value="tier-enterprise" style={{ background: "var(--color-card-bg)" }}>Enterprise</option>' in line:
        indent = ' ' * (len(line) - len(line.lstrip()))
        new_lines.append(indent + '<option value="tier-pilot" style={{ background: "var(--color-card-bg)" }}>Pilot (Free)</option>')

content = '\n'.join(new_lines)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Added Pilot to subscription dropdown in modal.')
