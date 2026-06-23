"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/api/client";
import { Bell, Trash2, CheckSquare } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";

interface Notification {
  id:        string;
  title:     string;
  body:      string;
  read:      boolean;
  link:      string | null;
  createdAt: string;
}

function timeAgo(date: string) {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isLoading,     setIsLoading]     = useState(true);
  const [markingAll,    setMarkingAll]    = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get("/notifications");
      setNotifications(data.data?.notifications ?? []);
      setUnreadCount(data.data?.unreadCount ?? 0);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const n = notifications.find((x) => x.id === id);
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((x) => x.id !== id));
      if (n && !n.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "12px" }}>
            Notifications
            {unreadCount > 0 && (
              <span className="font-heading" style={{
                fontSize: "11px", fontWeight: 700,
                background: "var(--color-accent)", color: "#0b0f19",
                padding: "2px 10px", borderRadius: "var(--radius-pill)",
                boxShadow: "0 0 10px rgba(245, 158, 11, 0.4)",
              }}>
                {unreadCount} NEW
              </span>
            )}
          </h1>
          <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Review system logs, operational alerts, and threat updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllRead}
            disabled={markingAll}
            variant="outline"
            size="sm"
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </Button>
        )}
      </div>

      {/* List container */}
      <div className="glass-panel" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "64px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid rgba(255, 255, 255, 0.08)", borderTopColor: "var(--color-accent)", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading alerts...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "64px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "50%", 
              background: "rgba(255,255,255,0.02)", 
              border: "1px solid rgba(255,255,255,0.05)",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              marginBottom: "16px",
              color: "var(--color-text-muted)",
            }}>
              <Bell size={20} />
            </div>
            <p className="font-heading" style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>All caught up</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>No new alerts to report at this time</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map((n, i) => (
              <div
                key={n.id}
                style={{
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: "16px",
                  padding: "18px 24px",
                  borderBottom: i < notifications.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                  background: n.read 
                    ? "transparent" 
                    : "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.01) 100%)",
                  position: "relative",
                  transition: "all var(--transition-base)",
                }}
              >
                {/* HUD Active left bar for unread notifications */}
                {!n.read && (
                  <div style={{
                    position: "absolute", 
                    left: 0, 
                    top: 0, 
                    bottom: 0, 
                    width: "4px",
                    background: "var(--color-accent)",
                    boxShadow: "0 0 10px rgba(245, 158, 11, 0.4)",
                  }} />
                )}

                {/* Icon indicator */}
                <div style={{ 
                  width: "36px", 
                  height: "36px", 
                  borderRadius: "50%", 
                  background: n.read ? "rgba(255, 255, 255, 0.02)" : "var(--color-accent-subtle)", 
                  color: n.read ? "var(--color-text-muted)" : "var(--color-accent)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  flexShrink: 0,
                  border: n.read ? "1px solid rgba(255, 255, 255, 0.04)" : "1px solid var(--color-accent-border)",
                }}>
                  <Bell size={15} />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <p className="font-heading" style={{ fontSize: "14px", fontWeight: n.read ? 600 : 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)", margin: "0 0 8px", lineHeight: 1.45 }}>
                    {n.body}
                  </p>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      style={{ 
                        padding: "5px 12px", 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        background: "rgba(255,255,255,0.03)", 
                        border: "1px solid rgba(255,255,255,0.06)", 
                        borderRadius: "var(--radius-md)", 
                        color: "var(--color-text-secondary)", 
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "var(--color-accent-subtle)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-border)";
                        (e.currentTarget as HTMLElement).style.color = "var(--color-accent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                        (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                      }}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    title="Delete Notification"
                    style={{ 
                      width: "28px", 
                      height: "28px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      background: "transparent", 
                      border: "none", 
                      borderRadius: "var(--radius-md)",
                      color: "var(--color-text-muted)", 
                      cursor: "pointer", 
                      transition: "all var(--transition-fast)" 
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-danger)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(239, 68, 68, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
