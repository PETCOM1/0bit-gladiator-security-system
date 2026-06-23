"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BRAND } from "@/shared/config/branding.config";
import { 
  Shield, ShieldAlert, Map, Clock, ClipboardList, 
  Monitor, Activity, FileCheck, CheckCircle2, 
  ChevronRight, Radio, Users, Eye, Sparkles
} from "lucide-react";

// ─── CUSTOM COMPONENT: HIGH-TECH COMMAND CENTER MOCKUP ────────────────────────
function CommandConsoleMockup() {
  const [activeAlert, setActiveAlert] = useState(0);
  const [pingPulse, setPingPulse] = useState(true);

  // Cycle active alert in mockup for dynamic interaction
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAlert((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const alerts = [
    { id: "A-204", site: "North Geofence", event: "Fence Perimeter Scan", time: "Just Now", status: "SCANNING", color: "var(--color-accent)" },
    { id: "A-203", site: "Main Lobby Entrance", event: "SOS Triggered (Test)", time: "2 min ago", status: "ACKNOWLEDGED", color: "#3b82f6" },
    { id: "A-202", site: "Gate B Checkpoint", event: "Patrol Complete - Guard 12", time: "5 min ago", status: "RESOLVED", color: "#10b981" },
  ];

  return (
    <div className="glass-panel accent-gold-glow-hover" style={{
      width: "100%",
      maxWidth: "960px",
      borderRadius: "16px",
      background: "rgba(10, 25, 47, 0.4)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      overflow: "hidden",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.05)",
      marginTop: "48px",
      display: "flex",
      flexDirection: "column",
      textAlign: "left",
      transition: "all 0.4s ease",
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        background: "rgba(8, 12, 24, 0.6)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginLeft: "12px", letterSpacing: "0.08em" }}>
            GLADIATOR-OPS // LIVE TELEMETRY
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            fontSize: "11px",
            color: "var(--color-accent)",
            fontWeight: 700,
            background: "rgba(245, 158, 11, 0.1)",
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <Radio size={10} className="animate-pulse" /> LIVE STREAM
          </span>
        </div>
      </div>

      {/* Main Console Area */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", minHeight: "360px", flexWrap: "wrap" }}>
        
        {/* Left Column: Alerts Feed */}
        <div style={{
          padding: "24px",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(8, 12, 24, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>
            Active Dispatch Queue
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {alerts.map((item, idx) => {
              const active = idx === activeAlert;
              return (
                <div 
                  key={item.id} 
                  onClick={() => setActiveAlert(idx)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: active ? "rgba(245, 158, 11, 0.08)" : "transparent",
                    border: active ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)" }}>{item.id}</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${item.color}20`, color: item.color }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{item.site}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{item.event}</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>{item.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Radar Map / Details Mockup */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
          
          {/* Grid Background */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }} />

          {/* Top Info */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Selected Site Telemetry</span>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginTop: "2px" }}>{alerts[activeAlert].site}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Active Guards</span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-accent)" }}>4 On Duty</div>
              </div>
            </div>

            {/* Simulated Live Alert Details */}
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${alerts[activeAlert].color}15`, color: alerts[activeAlert].color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldAlert size={16} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Incident Dispatch Queue: Event Active</div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px", lineHeight: 1.4 }}>
                  Officer dispatch sent to site. GPS coordinates locked at 33° 55&apos; S, 18° 25&apos; E. Occurrence book updated.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Radar Screen simulation */}
          <div style={{
            height: "160px",
            background: "radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 80%)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "8px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "16px",
            overflow: "hidden",
            zIndex: 2,
          }}>
            {/* Concentric rings */}
            <div style={{ position: "absolute", width: "120px", height: "120px", border: "1px dashed rgba(255,255,255,0.03)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", width: "80px", height: "80px", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", width: "40px", height: "40px", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "50%" }} />

            {/* Sweep hand using spin animation */}
            <div 
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "90px",
                height: "90px",
                transformOrigin: "top left",
                background: "linear-gradient(45deg, rgba(245,158,11,0.15) 0%, transparent 50%)",
                borderRadius: "0 0 100% 0",
                animation: "spin 6s linear infinite",
              }} 
            />

            {/* Glowing signal dots */}
            <div style={{
              position: "absolute", top: "40%", left: "35%",
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#ef4444", boxShadow: "0 0 8px #ef4444",
              display: "inline-block",
            }} className="animate-pulse" />
            
            <div style={{
              position: "absolute", top: "70%", left: "60%",
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#10b981", boxShadow: "0 0 8px #10b981",
              display: "inline-block",
            }} />

            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", position: "absolute", bottom: "8px", right: "8px" }}>
              GEO-RADAR SCANNING...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION: HERO ────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "140px 24px 80px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
      background: "radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: "10%", left: "50%",
        transform: "translateX(-50%)",
        width: "800px", height: "400px",
        background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "6px 16px",
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        borderRadius: "999px",
        fontSize: "12px", fontWeight: 700, color: "var(--color-accent)",
        letterSpacing: "0.06em", textTransform: "uppercase",
        marginBottom: "32px",
        position: "relative",
        zIndex: 2,
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} className="animate-pulse" />
        OPERATIONS SHIELD ACTIVE
      </div>

      <h1 style={{
        fontSize: "clamp(38px, 6vw, 68px)",
        fontWeight: 800, color: "#fff",
        lineHeight: 1.05, letterSpacing: "-0.03em",
        maxWidth: "900px", marginBottom: "24px",
        position: "relative",
        zIndex: 2,
      }}>
        Command Center for<br />
        <span style={{
          background: "linear-gradient(135deg, var(--color-accent), #fcd34d)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Modern Security Teams
        </span>
      </h1>

      <p style={{
        fontSize: "18px", color: "rgba(255,255,255,0.5)",
        maxWidth: "600px", lineHeight: 1.7, marginBottom: "40px",
        position: "relative",
        zIndex: 2,
      }}>
        {BRAND.tagline} Empowering officers, dispatchers, and clients with real-time geofenced tracking, occurrence books, and transparent reporting.
      </p>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <Link href="/intake" className="btn-premium" style={{
          padding: "14px 36px", background: "var(--color-accent)",
          borderRadius: "8px", fontSize: "14px", fontWeight: 700,
          color: "#0b0f19", textDecoration: "none",
          boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
        }}>
          Request Intake Portal
        </Link>
        <Link href="/login" style={{
          padding: "14px 36px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px", fontSize: "14px", fontWeight: 600,
          color: "#fff", textDecoration: "none",
          transition: "all var(--transition-base)",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          Access Client Portal
        </Link>
      </div>

      {/* Dynamic Command Console Mockup */}
      <CommandConsoleMockup />

      {/* Live Stats Row */}
      <div style={{
        display: "flex", gap: "48px", marginTop: "80px",
        flexWrap: "wrap", justifyContent: "center",
        position: "relative", zIndex: 2
      }}>
        {[
          { value: "1.2M+", label: "Patrol Points Checked", icon: CheckCircle2, color: "var(--color-accent)" },
          { value: "99.99%", label: "Uptime Dispatch SLA", icon: Shield, color: "#10b981" },
          { value: "< 15s", label: "Average Officer Alert Rate", icon: Clock, color: "#3b82f6" },
        ].map(({ value, label, icon: Icon, color }) => (
          <div key={label} style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            padding: "16px 24px",
            borderRadius: "12px"
          }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${color}10`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{value}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION: FEATURES ────────────────────────────────────────────────────────
const FEATURE_ITEMS = [
  { icon: Map, title: "Geofenced Patrols", desc: "Design exact guard routes. Track officer locations in real-time with automatic checkpoint triggers and alerts for missed stops." },
  { icon: ClipboardList, title: "Smart Occurrence Book", desc: "No more paper logbooks. Officers record security logs, incidents, and visitor tracking with high-quality media attachments." },
  { icon: ShieldAlert, title: "Instant SOS Alerts", desc: "Single-tap panic triggers report directly to the manager console with live GPS coordinates, mapping, and instant notification loops." },
  { icon: Clock, title: "Rostering & Timesheets", desc: "Create, dispatch, and review officer schedules. Automatically compute compliance metrics, shift logs, and active patrol hours." },
  { icon: Monitor, title: "Platform Command", desc: "Unified dashboards tailored for guards, site managers, admins, and platform owners. Role-based access ensures maximum security." },
  { icon: FileCheck, title: "Client Portals", desc: "Give property owners access to their dedicated telemetry. Streamline communication, show compliance logs, and view invoices." },
];

function Features() {
  return (
    <section id="work" style={{ padding: "120px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "64px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
          Operations & Shield Modules
        </p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Everything required to manage<br />security teams at scale.
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {FEATURE_ITEMS.map(({ icon: Icon, title, desc }) => (
          <div 
            key={title} 
            className="glass-panel-hover"
            style={{
              padding: "36px",
              background: "#080c18",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "16px",
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(245,158,11,0.08)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <Icon size={22} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>{title}</h3>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION: PROCESS ─────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Site Configuration", desc: "Map your client sites, set up geofenced boundaries, import guard user profiles, and design checkpoint codes." },
  { n: "02", title: "Duty Rosters & Deployment", desc: "Schedule shifts within the manager center. Officers receive schedules and tasks instantly inside the Mobile Portal." },
  { n: "03", title: "Live Operations Patrol", desc: "Guards execute tours, clocking in via NFC or QR checkins. Every report feed uploads instantly to global logs." },
  { n: "04", title: "Client Reports & Audits", desc: "Clients check live logs or receive auto-generated reports, occurrence details, compliance scores, and invoices." },
];

function Process() {
  return (
    <section id="process" style={{ padding: "120px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "64px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>How it works</p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          A secure flow designed<br />for operational confidence.
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {STEPS.map(({ n, title, desc }) => (
          <div key={n} style={{
            display: "grid", gridTemplateColumns: "60px 220px 1fr",
            alignItems: "start", gap: "24px",
            padding: "28px 32px", 
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: "12px",
            transition: "all 0.2s ease",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.04)"; }}
          >
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-accent)" }}>{n}</span>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h3>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION: SECURITY FOCUS / ABOUT ──────────────────────────────────────────
function About() {
  return (
    <section id="about" style={{
      padding: "120px 24px",
      background: "rgba(255,255,255,0.02)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Military-Grade Standard</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "24px" }}>
            Operational Uptime.<br />Guaranteed Compliance.
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "16px" }}>
            Gladiator Pro is constructed with absolute reliability in mind. Security companies demand robust, real-time channels that never go dark.
          </p>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "40px" }}>
            Whether handling minor guard checks or severe emergency dispatching, telemetry streams securely with redundant systems.
          </p>
          <Link href="/about" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            fontSize: "14px", fontWeight: 700, color: "var(--color-accent)", textDecoration: "none",
          }}>
            Explore our architecture <ChevronRight size={16} />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { label: "Dispatch Response Time", value: "< 12s" },
            { label: "Real-time Telemetry Latency", value: "< 100ms" },
            { label: "Data Retention Standards", value: "Compliant" },
            { label: "Guaranteed System SLA", value: "99.99%" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
            }}>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>{label}</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION: CTA ─────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section style={{ padding: "120px 24px", textAlign: "center" }}>
      <div style={{
        maxWidth: "720px", margin: "0 auto",
        padding: "64px 32px", 
        background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 100%)",
        border: "1px solid rgba(245, 158, 11, 0.15)", 
        borderRadius: "24px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(245,158,11,0.02)", pointerEvents: "none" }} />
        
        <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "16px", position: "relative", zIndex: 2 }}>
          Secure Your Operations
        </h2>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)", marginBottom: "40px", lineHeight: 1.7, maxWidth: "500px", margin: "0 auto 40px", position: "relative", zIndex: 2 }}>
          Ready to deploy Gladiator Pro to your team? Fill out our intake details and get started with a site audit.
        </p>
        <Link href="/intake" className="btn-premium" style={{
          display: "inline-block",
          padding: "16px 48px", background: "var(--color-accent)",
          borderRadius: "8px", fontSize: "15px", fontWeight: 700,
          color: "#0b0f19", textDecoration: "none",
          boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
          position: "relative",
          zIndex: 2,
        }}>
          Get Started Now
        </Link>
      </div>
    </section>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Process />
      <About />
      <CTA />
    </>
  );
}
