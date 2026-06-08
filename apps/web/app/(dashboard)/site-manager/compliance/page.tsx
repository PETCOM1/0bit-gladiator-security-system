"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, FileText, Plus } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function CompliancePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [entryText, setEntryText] = useState("");
  const [category, setCategory] = useState("ROUTINE");

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await managerService.getOccurrences();
      setEntries(res.data.data.entries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await managerService.createOccurrence({ entryText, category });
      setShowForm(false);
      setEntryText(""); setCategory("ROUTINE");
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Failed to log occurrence");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={28} color="var(--color-accent)" /> Operational Compliance
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Monitor Occurrence Book entries and compliance logs from security guards.
          </p>
        </div>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Time</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Personnel</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Category</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Entry details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading entries...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No occurrence book entries recorded.</td></tr>
              ) : entries.map((entry, i) => (
                <tr key={entry.id} style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13px" }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500 }}>
                    {entry.user?.firstName} {entry.user?.lastName}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>
                      {entry.category}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-primary)" }}>
                    {entry.entryText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
