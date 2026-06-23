path = 'apps/web/src/shared/components/layout/NotificationBell.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace entire component with a simple link to notifications page
new_content = '''"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <Link
      href="/notifications"
      style={{
        position:       "relative",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          "36px",
        height:         "36px",
        borderRadius:   "8px",
        color:          "#4b5563",
        background:     "transparent",
        border:         "1px solid transparent",
        cursor:         "pointer",
        transition:     "all 0.2s",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f3f4f6";
        e.currentTarget.style.borderColor = "#e5e7eb";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <Bell size={18} strokeWidth={1.8} />
    </Link>
  );
}
'''
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('NotificationBell now links directly to notifications page.')
