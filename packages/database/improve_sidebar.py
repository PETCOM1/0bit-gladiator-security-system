import re

path = 'apps/web/src/shared/components/layout/SidebarClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Better spacing: nav gap
content = content.replace('gap:           "2px",', 'gap:           "4px",')

# 2. Better spacing: nav padding
content = content.replace('padding:       "12px 8px",', 'padding:       "16px 10px",')

# 3. Better spacing: link padding
content = content.replace('padding:        "9px 10px",', 'padding:        "10px 12px",')

# 4. Add subtle hover animations + active glow via inline style block
style_block = """
      <style>{
        .sidebar-nav-link {
          transition: background 0.2s, color 0.2s, transform 0.15s, border-color 0.2s;
          border-radius: var(--radius-md);
        }
        .sidebar-nav-link:hover {
          background: rgba(245, 158, 11, 0.08) !important;
          color: var(--color-text-primary) !important;
          transform: translateX(4px);
          border-color: rgba(245, 158, 11, 0.2) !important;
        }
        .sidebar-nav-link.active {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%) !important;
          border-color: rgba(245, 158, 11, 0.15) !important;
        }
        .sidebar-nav-link.active:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%) !important;
        }
        /* Scrollbar styling for nav */
        nav::-webkit-scrollbar {
          width: 3px;
        }
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        nav::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.3);
          border-radius: 10px;
        }
      }</style>
"""

# Insert just before closing </aside>
last_aside = content.rfind('</aside>')
if last_aside != -1:
    content = content[:last_aside] + style_block + content[last_aside:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Sidebar UI improved.')
