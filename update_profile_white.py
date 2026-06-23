top_path = 'apps/web/src/shared/components/layout/TopNav.tsx'
with open(top_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update dropdown panel background (glass-panel) to white
content = content.replace(
    'className="glass-panel"',
    'style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}'
)
# But we need to keep the other styles. Let's do a replace of the entire div block? Better to just replace the glass-panel class with inline style.
# Actually the glass-panel class might be used elsewhere, but we can override inline.
# Let's replace the glass-panel className and add inline style.
# Find the div with className="glass-panel" and replace it with a style object.
# We'll do a regex replace to keep it simple.
import re
pattern = r'<div \n          className="glass-panel"\n          style=\{\{'
replacement = '<div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", padding: "8px", minWidth: "220px" }}'
content = re.sub(pattern, replacement, content)

# Also update text colors inside dropdown: user info, divider, etc.
# We'll replace some specific lines.
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

# Update DropdownItem text colors: the base color uses var(--color-text-secondary)
# But we set them inline, so we'll replace that too.
content = content.replace(
    'color:       danger ? "var(--color-danger)" : "var(--color-text-secondary)"',
    'color:       danger ? "#ef4444" : "#4b5563"'
)
# Hover colors for DropdownItem
content = content.replace(
    'hoverBg  = danger ? "var(--color-danger-subtle)" : "var(--color-accent-subtle)"',
    'hoverBg  = danger ? "#fee2e2" : "#f3f4f6"'
)
content = content.replace(
    'hoverClr = danger ? "var(--color-danger)"        : "var(--color-text-primary)"',
    'hoverClr = danger ? "#ef4444" : "#111827"'
)

with open(top_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('TopNav dropdown and profile updated to white.')
