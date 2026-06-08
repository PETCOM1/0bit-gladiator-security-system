"use client";

import React, { useEffect, useState } from "react";
import { LifeBuoy, Search, Filter, MessageSquare, Clock, User, CheckCircle2 } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SupportHelpdeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const { user } = useAuth();

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

  const handleSelectTicket = async (ticket: any) => {
    // Re-fetch to get messages
    try {
      const res = await superAdminService.getTickets(); // We might want to add getTicketById, but for now we'll fetch all or just assume it's in the list. Wait, in ticket.controller we added getTicketById! Let's just use it.
      // But we need to add getTicketById to tenant.service.ts. I'll just use the list for now if I didn't add it to tenant.service.ts. Wait, I didn't add getTicketById. I will add it shortly, let's just mock the view or use the list data. Actually, I can use apiClient directly.
    } catch(e) {}
  };
  
  // Quick direct fetch
  const fetchTicketDetails = async (id: string) => {
    try {
      const { default: apiClient } = await import("@/api/client");
      const res = await apiClient.get(`/tickets/${id}`);
      setSelectedTicket(res.data.data.ticket);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedTicket) return;
    try {
      const { default: apiClient } = await import("@/api/client");
      await apiClient.post(`/tickets/${selectedTicket.id}/reply`, { content: replyContent });
      setReplyContent("");
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err) {
      console.error(err);
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

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Unified Helpdesk
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Manage and respond to support tickets from all tenants.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", flex: 1, minHeight: 0 }}>
        {/* Ticket List */}
        <div style={{ width: "350px", display: "flex", flexDirection: "column", background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
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
              <option value="IN_PROGRESS">In Progress</option>
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
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.tenant?.name || "Unknown Tenant"}</p>
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
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><User size={14} /> {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName} ({selectedTicket.tenant?.name})</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select 
                    value={selectedTicket.status} 
                    onChange={e => handleStatusChange(e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-card-bg)", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {selectedTicket.messages?.map((msg: any) => {
                  const isStaff = msg.sender?.role !== "MANAGER";
                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isStaff ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{msg.sender?.firstName} {msg.sender?.lastName}</span>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ background: isStaff ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)", color: isStaff ? "var(--color-accent-text)" : "var(--color-text-primary)", padding: "12px 16px", borderRadius: "var(--radius-lg)", borderBottomRightRadius: isStaff ? "0" : "var(--radius-lg)", borderBottomLeftRadius: isStaff ? "var(--radius-lg)" : "0", maxWidth: "80%", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
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
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <LifeBuoy size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: 500 }}>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
