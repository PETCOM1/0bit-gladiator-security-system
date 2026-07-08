"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/shared/config/branding.config";
import { GladiatorLogo } from "@/shared/components/GladiatorLogo";

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome   = pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "16px 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(8,12,24,0.9)" : "rgba(8,12,24,0.4)",
      backdropFilter: "blur(12px)",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <GladiatorLogo size={32} style={{ filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))" }} />
        <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          {BRAND.name}
        </span>
      </Link>

      {/* Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        {isHome ? (
          // Anchor links on home page
          ["Work", "Services", "Process", "About"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`}
              style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >{l}</a>
          ))
        ) : (
          // Page links on other pages
          [
            { label: "Home",    href: "/"        },
            { label: "About",   href: "/about"   },
            { label: "Pricing", href: "/pricing" },
            { label: "Contact", href: "/contact" },
          ].map(({ label, href }) => (
            <Link key={label} href={href}
              style={{
                fontSize: "14px", fontWeight: 500, textDecoration: "none", transition: "color 0.15s",
                color: pathname === href ? "#fff" : "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = pathname === href ? "#fff" : "rgba(255,255,255,0.5)")}
            >{label}</Link>
          ))
        )}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <Link href="/login" style={{
          fontSize: "13px", color: "rgba(255,255,255,0.5)",
          textDecoration: "none", fontWeight: 500, transition: "color 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          Client portal
        </Link>
        <Link href="/intake" style={{
          padding: "8px 18px", background: "var(--color-accent)", borderRadius: "8px",
          fontSize: "13px", fontWeight: 700, color: "var(--color-accent-text)",
          textDecoration: "none", transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Start a project
        </Link>
      </div>
    </nav>
  );
}
