"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import apiClient from "@/api/client";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/notifications");
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(!open); if(!open) fetchNotifications(); }}
        style={{
          position:       "relative",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          "36px",
          height:         "36px",
          borderRadius:   "var(--radius-pill)",
          color:          "var(--color-text-secondary)",
          background:     open ? "var(--color-accent-subtle)" : "rgba(255, 255, 255, 0.03)",
          border:         open
            ? "1px solid var(--color-accent-border)"
            : "1px solid rgba(255, 255, 255, 0.05)",
          cursor:         "pointer",
          transition:     "all var(--transition-fast)",
          boxShadow:      "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-accent-subtle)";
          e.currentTarget.style.borderColor = "var(--color-accent-border)";
          e.currentTarget.style.color      = "var(--color-accent)";
          e.currentTarget.style.transform  = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          if(!open) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color      = "var(--color-text-secondary)";
          }
          e.currentTarget.style.transform  = "translateY(0)";
        }}
      >
        <Bell size={18} strokeWidth={1.8} style={{ color: open ? "var(--color-accent)" : "inherit" }} />
        {unreadCount > 0 && (
          <span style={{
            position:    "absolute",
            top:         "4px",
            right:       "4px",
            width:       "8px",
            height:      "8px",
            borderRadius: "var(--radius-pill)",
            background:  "var(--color-danger)",
            border:      "2px solid rgba(10, 25, 47, 0.9)",
            boxShadow:   "0 0 8px var(--color-danger)",
          }} />
        )}
      </button>

      {open && (
        <div 
          className="glass-panel animate-fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "340px",
            maxHeight: "400px",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
            overflow: "hidden"
          }}
        >
          <div style={{ 
            padding: "14px 16px", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            background: "rgba(255, 255, 255, 0.02)" 
          }}>
            <h3 className="font-heading" style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "transparent", border: "none", fontSize: "12px", color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "10px" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => { if(!n.read) markRead(n.id); }} 
                  style={{ 
                    padding: "12px", 
                    borderRadius: "var(--radius-md)", 
                    background: n.read 
                      ? "transparent" 
                      : "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)", 
                    border: n.read 
                      ? "1px solid transparent" 
                      : "1px solid rgba(245, 158, 11, 0.15)",
                    cursor: n.read ? "default" : "pointer",
                    marginBottom: "6px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    transition: "all var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => {
                    if (!n.read) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.04) 100%)";
                    } else {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!n.read) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)";
                    } else {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent-subtle)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bell size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="font-heading" style={{ fontSize: "13px", fontWeight: n.read ? 600 : 700, color: "var(--color-text-primary)", margin: "0 0 4px 0" }}>{n.title}</h4>
                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px", display: "block" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  {!n.read && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-accent)", marginTop: "4px", flexShrink: 0, boxShadow: "0 0 6px var(--color-accent)" }} />
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer bar linking to dedicated notifications page */}
          <div style={{ 
            padding: "10px 16px", 
            borderTop: "1px solid rgba(255, 255, 255, 0.06)", 
            display: "flex", 
            justifyContent: "center", 
            background: "rgba(255, 255, 255, 0.01)",
            flexShrink: 0
          }}>
            <Link 
              href="/notifications" 
              onClick={() => setOpen(false)}
              className="font-heading"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--color-accent)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)"}
            >
              <span>View All Notifications</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
