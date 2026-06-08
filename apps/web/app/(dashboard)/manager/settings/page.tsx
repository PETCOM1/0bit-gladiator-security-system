"use client";

import React, { useState } from "react";
import { Settings, Save, Building, Phone, Map } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function SettingsManagerPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await managerService.updateTenantProfile({ name: form.name });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "14px", color: "var(--color-text-primary)", outline: "none",
    transition: "border var(--transition-fast)"
  };

  const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <Settings size={28} color="var(--color-accent)" /> Organization Settings
        </h1>
        <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
          Update your organization's profile and preferences.
        </p>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", padding: "32px" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div>
            <label style={labelStyle}>Organization Name</label>
            <div style={{ position: "relative" }}>
              <Building size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
              <input 
                required 
                style={{ ...inputStyle, paddingLeft: "36px" }} 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="E.g. Acme Security Corp"
              />
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px" }}>This is the name that appears on reports and invoices.</p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "10px 0" }} />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              disabled={loading || !form.name}
              type="submit" 
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
