"use client";

import { useState, useRef, useEffect } from "react";
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
          borderRadius:   "var(--radius-md)",
          color:          "var(--color-text-secondary)",
          background:     open ? "var(--color-accent-subtle)" : "transparent",
          border:         "none",
          cursor:         "pointer",
          transition:     "background var(--transition-fast), color var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          if(!open) {
            e.currentTarget.style.background = "var(--color-accent-subtle)";
            e.currentTarget.style.color      = "var(--color-accent)";
          }
        }}
        onMouseLeave={(e) => {
          if(!open) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color      = "var(--color-text-secondary)";
          }
        }}
      >
        <Bell size={18} strokeWidth={1.8} style={{ color: open ? "var(--color-accent)" : "inherit" }} />
        {unreadCount > 0 && (
          <span style={{
            position:    "absolute",
            top:         "6px",
            right:       "6px",
            width:       "8px",
            height:      "8px",
            borderRadius: "var(--radius-pill)",
            background:  "var(--color-danger)",
            border:      "2px solid var(--color-topnav-bg)",
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: "320px",
          maxHeight: "400px",
          background: "var(--color-card-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--color-card-shadow), 0 8px 32px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          overflow: "hidden"
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "transparent", border: "none", fontSize: "12px", color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} onClick={() => { if(!n.read) markRead(n.id); }} style={{ 
                  padding: "12px", 
                  borderRadius: "var(--radius-md)", 
                  background: n.read ? "transparent" : "var(--color-bg-subtle)", 
                  cursor: n.read ? "default" : "pointer",
                  marginBottom: "4px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  transition: "background var(--transition-fast)"
                }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent-subtle)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bell size={14} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: n.read ? 600 : 700, color: "var(--color-text-primary)", margin: "0 0 4px 0" }}>{n.title}</h4>
                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px", display: "block" }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  {!n.read && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-accent)", marginTop: "4px", flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
