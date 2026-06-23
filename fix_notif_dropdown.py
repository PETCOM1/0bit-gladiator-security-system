import re

path = 'apps/web/src/shared/components/layout/NotificationBell.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove className="glass-panel animate-fade-in" from the dropdown div
content = re.sub(r'className="glass-panel animate-fade-in"', '', content)

# Replace the dropdown container style with solid white
# Find the div with position: absolute, top: calc(100% + 8px), etc.
pattern = r'(position:\s*"absolute",\s+top:\s*"calc\(100% \+ 8px\)",\s+right:\s*0,\s+width:\s*"340px",\s+maxHeight:\s*"400px",)'
replacement = r'\1\n            background:  "#ffffff",\n            border:      "1px solid #e5e7eb",\n            borderRadius: "8px",\n            boxShadow:   "0 10px 25px rgba(0,0,0,0.1)",\n            overflow:    "hidden",'
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Remove rgba backgrounds from header and footer
content = content.replace('background: "rgba(255, 255, 255, 0.02)"', 'background: "transparent"')
content = content.replace('background: "rgba(255, 255, 255, 0.01)"', 'background: "transparent"')

# Adjust border colors
content = content.replace('rgba(255, 255, 255, 0.06)', '#e5e7eb')

# Adjust text colors
content = content.replace('var(--color-text-secondary)', '#4b5563')
content = content.replace('var(--color-accent-subtle)', '#f3f4f6')
content = content.replace('var(--color-accent)', '#f59e0b')

# Also fix the "No new notifications" text
content = content.replace('color: "#6b7280"', 'color: "#9ca3af"')

# Update the bell icon and other elements to use dark colors
content = content.replace('color: "var(--color-accent)"', 'color: "#f59e0b"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('NotificationBell dropdown updated to solid white.')
