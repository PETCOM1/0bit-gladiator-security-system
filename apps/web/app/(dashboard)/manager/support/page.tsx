"use client";

import React, { useEffect, useState } from "react";
import { LifeBuoy, Search, Filter, MessageSquare, Clock, User, Plus, X } from "lucide-react";
import apiClient from "@/api/client";
import { useAuth } from "@/shared/context/AuthContext";

export default function TenantSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "MEDIUM" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/tickets");
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
      const res = await apiClient.get(`/tickets/${id}`);
      setSelectedTicket(res.data.data.ticket);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/tickets", newTicket);
      setIsCreating(false);
      setNewTicket({ subject: "", description: "", priority: "MEDIUM" });
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedTicket) return;
    try {
      await apiClient.post(`/tickets/${selectedTicket.id}/reply`, { content: replyContent });
      setReplyContent("");
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;
    try {
      await apiClient.patch(`/tickets/${selectedTicket.id}/status`, { status: "CLOSED" });
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Help & Support
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Get help from the platform administrators.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", transition: "background var(--transition-fast)" }}
        >
          <Plus size={15} strokeWidth={2} /> New Ticket
        </button>
      </div>

      <div style={{ display: "flex", gap: "24px", flex: 1, minHeight: 0 }}>
        {/* Ticket List */}
        <div style={{ width: "350px", display: "flex", flexDirection: "column", background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "8px 12px 8px 30px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none" }} />
              </div>
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none" }}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
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
                <div key={t.id} onClick={() => fetchTicketDetails(t.id)} style={{ padding: "16px", borderBottom: "1px solid var(--color-border)", cursor: "pointer", background: selectedTicket?.id === t.id ? "var(--color-bg-subtle)" : "transparent", transition: "background var(--transition-fast)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: t.status === "OPEN" ? "var(--color-danger)" : t.status === "CLOSED" ? "var(--color-text-muted)" : "var(--color-warning)", background: t.status === "OPEN" ? "var(--color-danger-subtle)" : t.status === "CLOSED" ? "var(--color-bg-subtle)" : "var(--color-warning-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                      {t.status.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.subject}</h4>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div style={{ flex: 1, background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedTicket ? (
            <>
              {/* Detail Header */}
              <div style={{ padding: "24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px 0" }}>{selectedTicket.subject}</h2>
                  <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                  <button onClick={closeTicket} style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}>
                    Mark as Resolved
                  </button>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {selectedTicket.messages?.map((msg: any) => {
                  const isMe = msg.sender?.role === "MANAGER";
                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{isMe ? "You" : "Support Team"}</span>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ background: isMe ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)", color: isMe ? "var(--color-accent-text)" : "var(--color-text-primary)", padding: "12px 16px", borderRadius: "var(--radius-lg)", borderBottomRightRadius: isMe ? "0" : "var(--radius-lg)", borderBottomLeftRadius: isMe ? "var(--radius-lg)" : "0", maxWidth: "80%", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== "CLOSED" && (
                <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                  <form onSubmit={handleReply} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <textarea 
                      value={replyContent} 
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..." 
                      style={{ width: "100%", minHeight: "100px", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: "14px", color: "var(--color-text-primary)", outline: "none", resize: "vertical" }} 
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" disabled={!replyContent.trim()} style={{ padding: "8px 24px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, cursor: replyContent.trim() ? "pointer" : "not-allowed", opacity: replyContent.trim() ? 1 : 0.6, display: "flex", alignItems: "center", gap: "8px" }}>
                        <MessageSquare size={16} /> Send Reply
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <LifeBuoy size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: 500 }}>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isCreating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-card-bg)", padding: "24px", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: "500px", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Create Support Ticket</h2>
              <button onClick={() => setIsCreating(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Subject <span style={{color: "var(--color-danger)"}}>*</span></label>
                <input required type="text" value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} style={{ width: "100%", padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)", outline: "none" }} placeholder="Brief description of the issue" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Priority</label>
                <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} style={{ width: "100%", padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)", outline: "none" }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Description <span style={{color: "var(--color-danger)"}}>*</span></label>
                <textarea required value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} style={{ width: "100%", minHeight: "120px", padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)", outline: "none", resize: "vertical" }} placeholder="Please provide details about your issue..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={() => setIsCreating(false)} style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={isSubmitting || !newTicket.subject || !newTicket.description} style={{ padding: "10px 24px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, color: "var(--color-accent-text)", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? "Creating..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
