# placeholder
path = r"C:\Users\Munyadziwa Petrus\Desktop\Gladiator MVP\0bit-gladiator-security-system\apps\web\src\shared\components\ui\DataTable.tsx"

with open(path) as f:
    content = f.read()

replacements = [
    ("rgba(10, 25, 47, 0.2)", "var(--color-bg-subtle)"),
    ("rgba(10, 25, 47, 0.6)", "var(--color-card-bg)"),
    ("rgba(10, 25, 47, 0.3)", "var(--color-bg-subtle)"),
    ("rgba(10, 25, 47, 0.1)", "var(--color-bg-subtle)"),
    ("rgba(255, 255, 255, 0.06)", "var(--color-border)"),
    ("rgba(255, 255, 255, 0.08)", "var(--color-border)"),
    ("rgba(255, 255, 255, 0.04)", "var(--color-border)"),
    ("rgba(255, 255, 255, 0.05)", "var(--color-border)"),
    ("rgba(255, 255, 255, 0.02)", "var(--color-card-bg)"),
    ("rgba(255,255,255,0.02)", "var(--color-card-bg)"),
    ("rgba(255,255,255,0.05)", "var(--color-card-bg)"),
    ("rgba(255,255,255,0.1)", "var(--color-border)"),
    ("rgba(255,255,255,0.15)", "var(--color-border)"),
    ("linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))", "var(--color-accent)"),
    ("var(--color-accent-text)", "#fff"),
    ('border: "2px solid rgba(255,255,255,0.1)"', 'border: "2px solid var(--color-border)"'),
    ("fontFamily: \"var(--font-heading)\",", ""),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(path, "w") as f:
    f.write(content)

print("Done")