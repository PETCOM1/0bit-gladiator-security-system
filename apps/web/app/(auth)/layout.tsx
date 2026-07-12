"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/shared/config/branding.config";
import { GladiatorLogo } from "@/shared/components/GladiatorLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCleanPage = pathname === "/login" || pathname === "/" || pathname === "/set-password";

  if (isCleanPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a" }}>
      {/* Minimal top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,12,24,0.8)",
        backdropFilter: "blur(12px)",
      }}>
        {/* Logo / back home */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <GladiatorLogo size={28} style={{ filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.3))" }} />
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            {BRAND.name}
          </span>
        </Link>

        {/* Back link */}
        <Link href="/" style={{
          fontSize: "13px", color: "rgba(255,255,255,0.35)",
          textDecoration: "none", fontWeight: 500,
          display: "flex", alignItems: "center", gap: "6px",
          transition: "color 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          ← Back to site
        </Link>
      </div>

      {/* Page content — padded to clear the fixed bar */}
      <div style={{ paddingTop: "57px" }}>
        {children}
      </div>
    </div>
  );
}
