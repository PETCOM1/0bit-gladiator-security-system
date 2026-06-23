path = 'apps/web/src/shared/components/layout/TopNav.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change avatar from pill to subtle square with small radius
content = content.replace(
    'borderRadius:    "var(--radius-pill)",',
    'borderRadius:    "6px",'
)

# Change the button container from pill to subtle square
content = content.replace(
    'borderRadius: "var(--radius-pill)",',
    'borderRadius: "6px",'
)

# Also ensure dropdown has subtle curves (already 8px, but set to 6px for consistency)
content = content.replace(
    'borderRadius: "8px",',
    'borderRadius: "6px",'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Profile component now has subtle (square-ish) curves.')
