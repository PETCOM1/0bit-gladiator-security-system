"use client";

import React, { useEffect, useState } from "react";
import { LifeBuoy, Search, MessageSquare, Clock, User, CheckCircle2, Smile, Paperclip, Send, ShieldAlert, Award, CornerUpLeft, X } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SupportHelpdeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [activePickerMsgId, setActivePickerMsgId] = useState<string | null>(null);
  const { user } = useAuth();

  // Mock emoji reactions state to make it interactive and alive
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({
    "initial": { "😊": 6 },
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getTickets();
      setTickets(res.data.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const fetchTicketDetails = async (id: string) => {
    try {
      const { default: apiClient } = await import("@/api/client");
      const res = await apiClient.get(`/tickets/${id}`);
      setSelectedTicket(res.data.data.ticket);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyContent.trim() || !selectedTicket) return;
    try {
      const { default: apiClient } = await import("@/api/client");
      const formattedContent = replyingToMessage
        ? `> *Replying to ${replyingToMessage.sender?.firstName || "User"}: "${replyingToMessage.content}"*\n\n${replyContent}`
        : replyContent;

      await apiClient.post(`/tickets/${selectedTicket.id}/reply`, { content: formattedContent });
      setReplyContent("");
      setReplyingToMessage(null);
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const { default: apiClient } = await import("@/api/client");
      await apiClient.patch(`/tickets/${selectedTicket.id}/status`, { status });
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    setReactions(prev => {
      const msgReactions = prev[msgId] || {};
      return {
        ...prev,
        [msgId]: {
          ...msgReactions,
          [emoji]: (msgReactions[emoji] || 0) + 1
        }
      };
    });
    setActivePickerMsgId(null);
  };

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "calc(100vh - 120px)", minHeight: "550px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Help Desk Support Portal
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Interact with managers, site staff, and support engineers in real-time.
        </p>
      </div>

      <div style={{ display: "flex", gap: "24px", flex: 1, minHeight: 0 }}>
        {/* Ticket List */}
        <div style={{ width: "320px", display: "flex", flexDirection: "column", background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input type="text" placeholder="Search ticket..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "8px 12px 8px 30px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none" }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none", cursor: "pointer" }}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>No tickets found.</div>
            ) : (
              filteredTickets.map(t => (
                <div key={t.id} onClick={() => fetchTicketDetails(t.id)} style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)", cursor: "pointer", background: selectedTicket?.id === t.id ? "var(--color-bg-subtle)" : "transparent", transition: "background var(--transition-fast)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: t.status === "OPEN" ? "var(--color-danger)" : t.status === "RESOLVED" ? "var(--color-success)" : "var(--color-warning)", background: t.status === "OPEN" ? "var(--color-danger-subtle)" : t.status === "RESOLVED" ? "var(--color-success-subtle)" : "var(--color-warning-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                      {t.status.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.subject}</h4>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.tenant?.name || "System"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Chat Details */}
        <div style={{ flex: 1, background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedTicket ? (
            <>
              {/* Chat Sub-Header */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={16} color="var(--color-accent)" />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>Support Chat</span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>— visible to everyone in this cohort</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Status:</span>
                  <select 
                    value={selectedTicket.status} 
                    onChange={e => handleStatusChange(e.target.value)}
                    style={{ padding: "4px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Initial Ticket Subject message */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--color-text-secondary)", fontSize: "13px" }}>
                    {selectedTicket.createdBy?.firstName?.[0] || "T"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "80%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "100%", overflow: "hidden" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>{selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}</span>
                      <span style={{ fontSize: "11px", background: "var(--color-info-subtle)", color: "var(--color-info)", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, flexShrink: 0 }}>COORDINATOR</span>
                    </div>
                    <div style={{ background: "#f0f4f8", color: "var(--color-text-primary)", padding: "14px 18px", borderRadius: "12px", borderTopLeftRadius: "2px", fontSize: "14px", lineHeight: 1.5, border: "1px solid var(--color-border)" }}>
                      <h4 style={{ margin: "0 0 6px 0", fontWeight: 700 }}>Subject: {selectedTicket.subject}</h4>
                      {selectedTicket.description}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "4px" }}>{new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button 
                        onClick={() => setReplyingToMessage({ sender: selectedTicket.createdBy, content: selectedTicket.description })}
                        style={{ display: "flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "11.5px", fontWeight: 600 }}
                      >
                        <CornerUpLeft size={13} /> Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ticket messages */}
                {selectedTicket.messages?.map((msg: any) => {
                  const isMe = msg.senderId === user?.id || msg.sender?.id === user?.id;
                  const isStaff = msg.sender?.role === "ADMIN" || msg.sender?.role === "SUPER_ADMIN";
                  return (
                    <div key={msg.id} style={{ display: "flex", gap: "12px", alignSelf: isMe ? "flex-end" : "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: isMe ? "var(--color-accent-subtle)" : "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: isMe ? "var(--color-accent)" : "var(--color-text-secondary)", fontSize: "13px", flexShrink: 0 }}>
                        {msg.sender?.firstName?.[0] || "U"}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "80%", alignItems: isMe ? "flex-end" : "flex-start", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "100%", overflow: "hidden", flexDirection: isMe ? "row-reverse" : "row" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>{msg.sender?.firstName} {msg.sender?.lastName}</span>
                          <span style={{ fontSize: "10.5px", background: isStaff ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)", color: isStaff ? "var(--color-accent)" : "var(--color-text-secondary)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700, flexShrink: 0 }}>
                            {isStaff ? "Support Staff" : "Manager"}
                          </span>
                        </div>
                        <div style={{ background: isMe ? "rgba(245, 158, 11, 0.08)" : "#f0f4f8", color: "var(--color-text-primary)", padding: "14px 18px", borderRadius: "12px", borderTopLeftRadius: isMe ? "12px" : "2px", borderTopRightRadius: isMe ? "2px" : "12px", fontSize: "14px", lineHeight: 1.5, border: isMe ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid var(--color-border)", whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px", flexDirection: isMe ? "row-reverse" : "row", position: "relative" }}>
                          {/* Active Emojis List */}
                          {Object.entries(reactions[msg.id] || {}).map(([emoji, count]) => {
                            if (count <= 0) return null;
                            return (
                              <button 
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                style={{ display: "flex", alignItems: "center", gap: "4px", background: "white", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "2px 8px", fontSize: "12px", cursor: "pointer", color: "var(--color-text-secondary)" }}
                              >
                                {emoji} <span>{count}</span>
                              </button>
                            );
                          })}

                          {/* Trigger Emoji Picker Button */}
                          <button
                            onClick={() => setActivePickerMsgId(activePickerMsgId === msg.id ? null : msg.id)}
                            style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
                          >
                            <Smile size={16} />
                          </button>

                          {/* Absolute Dropdown Emoji Picker */}
                          {activePickerMsgId === msg.id && (
                            <div style={{
                              position: "absolute", bottom: "100%", [isMe ? "right" : "left"]: 0, marginBottom: "6px",
                              display: "flex", gap: "6px", background: "var(--color-card-bg)", borderRadius: "20px", padding: "4px 10px",
                              border: "1px solid var(--color-border)", boxShadow: "var(--color-card-shadow)", zIndex: 100
                            }}>
                              {["👍", "😊", "❤️", "🔥", "🎉"].map(emoji => (
                                <span 
                                  key={emoji} 
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  style={{ cursor: "pointer", fontSize: "14px", padding: "2px", transition: "transform 0.1s", userSelect: "none" }}
                                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.25)"; }}
                                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                                >
                                  {emoji}
                                </span>
                              ))}
                            </div>
                          )}

                          <button 
                            onClick={() => setReplyingToMessage(msg)}
                            style={{ display: "flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                          >
                            <CornerUpLeft size={13} /> Reply
                          </button>
                          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-card-bg)", display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Replying To Preview Banner */}
                {replyingToMessage && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", padding: "8px 12px", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)" }}>Replying to {replyingToMessage.sender?.firstName || "User"}</span>
                      <span style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "450px" }}>{replyingToMessage.content}</span>
                    </div>
                    <button 
                      onClick={() => setReplyingToMessage(null)}
                      style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "8px 12px" }}>
                  <button style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Smile size={20} />
                  </button>
                  <button style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Paperclip size={20} />
                  </button>
                  <textarea 
                    value={replyContent} 
                    onChange={e => setReplyContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message the support room... (Shift+Enter for a new line)" 
                    style={{ flex: 1, background: "transparent", border: "none", fontSize: "14px", color: "var(--color-text-primary)", outline: "none", resize: "none", height: "24px", fontFamily: "inherit", lineHeight: "24px" }} 
                  />
                  <button 
                    onClick={() => handleReply()} 
                    disabled={!replyContent.trim()} 
                    style={{ background: replyContent.trim() ? "var(--color-accent)" : "transparent", color: replyContent.trim() ? "white" : "var(--color-text-muted)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: replyContent.trim() ? "pointer" : "not-allowed", transition: "all var(--transition-fast)" }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <LifeBuoy size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: 500 }}>Select a ticket to open chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
