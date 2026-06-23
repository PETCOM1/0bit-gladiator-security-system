import re

path = r'apps/web/src/features/auth/pages/LoginPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_routes = '''const ROLE_ROUTES: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN:       "/admin",
  MANAGER:     "/manager",
  SITE_MANAGER: "/site-manager",
  USER:        "/guard",
};'''

pattern = r'const ROLE_ROUTES: Record<string, string> = \{[^;]*\};'
content = re.sub(pattern, new_routes, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ LoginPage routes updated.')
