"use client";

import Link from "next/link";
import { BRAND } from "@/shared/config/branding.config";
import { GladiatorLogo } from "@/shared/components/GladiatorLogo";

export default function Footer() {
  return (
    <footer style={{
      padding: "40px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      background: "#080c18",
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap", gap: "20px",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <GladiatorLogo size={28} style={{ filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.3))" }} />
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{BRAND.name}</span>
        </Link>

        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} {BRAND.name}. {BRAND.tagline}
        </p>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {[
            { label: "Home",    href: "/"        },
            { label: "About",   href: "/about"   },
            { label: "Pricing", href: "/pricing" },
            { label: "Contact", href: "/contact" },
            { label: "Portal",  href: "/login"   },
          ].map(({ label, href }) => (
            <Link key={label} href={href}
              style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >{label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
