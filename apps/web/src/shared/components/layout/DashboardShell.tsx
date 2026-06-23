"use client";

import { useState } from "react";
import SidebarClient from "./SidebarClient";
import TopNav from "./TopNav";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display:         "flex",
      height:          "100vh",
      overflow:        "hidden",
      backgroundColor: "var(--color-bg)",
      backgroundImage: "radial-gradient(circle at top right, rgba(245, 158, 11, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.03), transparent 30%)",
    }}>
      {/* LEFT COLUMN — sidebar owns full height */}
      <SidebarClient
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      {/* RIGHT COLUMN — top nav + scrollable content */}
      <div style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        minWidth:      0,
      }}>
        <TopNav />
        <main 
          className="glass-panel floating-shell animate-fade-in"
          style={{
            flex:      1,
            overflowY: "auto",
            padding:   "32px",
            margin:    "20px",
            marginLeft: "8px",
            display:   "flex",
            flexDirection: "column",
            gap:       "24px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
