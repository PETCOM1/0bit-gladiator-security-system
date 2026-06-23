"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import { NAV_CONFIG } from "@/shared/config/nav.config";
import { BRAND } from "@/shared/config/branding.config";
import {
  LayoutDashboard, FolderKanban, Users, UserCircle,
  FileText, Receipt, UsersRound, Activity, ScrollText,
  Settings, ChevronRight, ChevronLeft,
  MapPin, Calendar, Contact, ShieldAlert, BarChart,
  ClipboardCheck, CheckCircle2, LifeBuoy
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  LayoutDashboard, FolderKanban, Users, UserCircle,
  FileText, Receipt, UsersRound, Activity, ScrollText, Settings,
  MapPin, Calendar, Contact, ShieldAlert, BarChart,
  ClipboardCheck, CheckCircle2, LifeBuoy
};

interface Props {
  isOpen:   boolean;
  onToggle: () => void;
}

export default function SidebarClient({ isOpen, onToggle }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();

  const tenantName = (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") ? BRAND.name : (user?.tenant?.name || BRAND.name);
  const logoMark = (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") ? BRAND.logoMark : (user?.tenant?.name ? user.tenant.name.charAt(0).toUpperCase() : BRAND.logoMark);

  const role     = (user?.role ?? "") as keyof typeof NAV_CONFIG;
  const navItems = NAV_CONFIG[role] ?? [];

  const w = isOpen ? "var(--sidebar-expanded)" : "var(--sidebar-collapsed)";

  return (
    <aside style={{
      width:           w,
      minWidth:        w,
      height:          "100vh",
      backgroundColor: "rgba(10, 25, 47, 0.85)",
      backdropFilter:  "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRight:     "1px solid #e5e7eb",
      display:         "flex",
      flexDirection:   "column",
      flexShrink:      0,
      overflow:        "hidden",
      transition:      "width var(--transition-base), min-width var(--transition-base)",
      position:        "relative",
      zIndex:          20,
    }}>

      {/* ── Logo ─────────────────────────────────────────────────────────────── */}
      <div style={{
        height:         "var(--topnav-height)",
        display:        "flex",
        alignItems:     "center",
        gap:            "10px",
        padding:        "0 14px",
        borderBottom:   "1px solid rgba(255, 255, 255, 0.06)",
        flexShrink:     0,
        overflow:       "hidden",
        justifyContent: isOpen ? "flex-start" : "center",
      }}>
        <div style={{
          width:          "30px",
          height:         "30px",
          borderRadius:   "var(--radius-md)",
          background:     "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       "13px",
          fontWeight:     800,
          color:          "#fff",
          flexShrink:     0,
          letterSpacing:  "-0.02em",
          boxShadow:      "0 0 12px rgba(245, 158, 11, 0.4)",
          border:         "1px solid rgba(255,255,255,0.15)",
        }}>
          {logoMark}
        </div>

        {isOpen && (
          <span style={{
            fontSize:      "15px",
            fontWeight:    700,
            color:         "var(--color-sidebar-text-active)",
            whiteSpace:    "nowrap",
            overflow:      "hidden",
            textOverflow:  "ellipsis",
            letterSpacing: "-0.02em",
          }} title={tenantName}>
            {tenantName}
          </span>
        )}
      </div>

      {/* ── Nav items ────────────────────────────────────────────────────────── */}
      <nav style={{
        flex:          1,
        padding:       "16px 10px",
        display:       "flex",
        flexDirection: "column",
        gap:           "4px",
        overflowY:     "auto",
        overflowX:     "hidden",
      }}>
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href.split("/").length > 2 && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isOpen ? item.label : undefined}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            "10px",
                padding:        "10px 12px",
                borderRadius:   "var(--radius-md)",
                fontSize:       "13.5px",
                fontWeight:     isActive ? 600 : 400,
                color:          isActive
                  ? "var(--color-sidebar-text-active)"
                  : "var(--color-sidebar-text)",
                background:     isActive
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)"
                  : "transparent",
                boxShadow: isActive
                  ? "inset 0 0 8px rgba(245, 158, 11, 0.08), 0 2px 4px rgba(0, 0, 0, 0.2)"
                  : "none",
                textDecoration: "none",
                whiteSpace:     "nowrap",
                overflow:       "hidden",
                justifyContent: isOpen ? "flex-start" : "center",
                position:       "relative",
                transition:     "background var(--transition-fast), color var(--transition-fast)",
                border: isActive ? "1px solid rgba(245, 158, 11, 0.15)" : "1px solid transparent",
              }}
              className={`sidebar-nav-link${isActive ? " active" : ""}`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span style={{
                  position:     "absolute",
                  left:         0,
                  top:          "20%",
                  bottom:       "20%",
                  width:        "3px",
                  borderRadius: "0 3px 3px 0",
                  background:   "var(--color-sidebar-indicator)",
                  boxShadow:    "0 0 8px var(--color-sidebar-indicator)",
                }} />
              )}
              {Icon && (
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              )}
              {isOpen && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Toggle button ────────────────────────────────────────────────────── */}
      <div style={{
        padding:     "12px 8px",
        borderTop:   "1px solid rgba(255, 255, 255, 0.06)",
        flexShrink:  0,
      }}>
        <button
          onClick={onToggle}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: isOpen ? "flex-start" : "center",
            gap:            "10px",
            width:          "100%",
            padding:        "10px 12px",
            borderRadius:   "var(--radius-md)",
            background:     "transparent",
            border:         "none",
            cursor:         "pointer",
            color:          "var(--color-sidebar-text)",
            fontSize:       "13.5px",
            fontWeight:     400,
            whiteSpace:     "nowrap",
            transition:     "background var(--transition-fast), color var(--transition-fast)",
          }}
          className="sidebar-nav-link"
        >
          {isOpen
            ? <><ChevronLeft size={17} strokeWidth={1.8} /><span>Collapse</span></>
            : <ChevronRight size={17} strokeWidth={1.8} />
          }
        </button>
      </div>
    
      
</aside>
  );
}
