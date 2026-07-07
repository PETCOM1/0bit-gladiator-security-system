"use client";

import { useState, useEffect } from "react";
import SidebarClient from "./SidebarClient";
import TopNav from "./TopNav";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      display:         isMobile ? "block" : "flex",
      height:          isMobile ? "auto" : "100vh",
      minHeight:       isMobile ? "100vh" : "auto",
      overflow:        isMobile ? "visible" : "hidden",
      backgroundColor: "#f9fafb",
      paddingBottom:   isMobile ? "80px" : 0, // to prevent bottom nav overlap
      backgroundImage: "radial-gradient(circle at top right, rgba(245, 158, 11, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.03), transparent 30%)",
    }}>
      {/* LEFT COLUMN — sidebar owns full height on desktop, bottom nav on mobile */}
      <SidebarClient
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      {/* RIGHT COLUMN — top nav + scrollable content */}
      <div style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        overflow:      isMobile ? "visible" : "hidden",
        minWidth:      0,
      }}>
        <TopNav />
        <main style={{
            flex:      1,
            overflowY: isMobile ? "visible" : "auto",
            padding:   isMobile ? "16px" : "32px",
            margin:    isMobile ? "10px" : "20px",
            marginLeft: isMobile ? "10px" : "8px",
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

