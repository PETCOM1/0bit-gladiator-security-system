"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, ShieldCheck, Mail, Globe, Palette } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getSettings();
      setSettings(res.data.data.settings);
      const data: Record<string, string> = {};
      res.data.data.settings.forEach((s: any) => {
        data[s.key] = s.value;
      });
      setFormData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      await superAdminService.updateSetting(key, formData[key]);
      alert("Setting saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  const getSettingGroup = (key: string) => {
    if (key.includes("registration") || key.includes("login")) return "Security & Access";
    if (key.includes("theme") || key.includes("logo") || key.includes("brand")) return "White-Labeling & Branding";
    if (key.includes("smtp") || key.includes("email")) return "Email Configuration";
    return "General System";
  };

  // Group settings
  const groupedSettings = settings.reduce((acc: any, curr: any) => {
    const group = getSettingGroup(curr.key);
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Platform Settings
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Configure global system behavior, white-labeling, and security rules.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "40px", color: "var(--color-text-muted)", textAlign: "center" }}>Loading settings...</div>
      ) : (
        Object.entries(groupedSettings).map(([group, groupSettings]: any) => (
          <div key={group} style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", padding: "24px", boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "4px" }}>
              {group === "Security & Access" && <ShieldCheck size={20} color="var(--color-accent)" />}
              {group === "White-Labeling & Branding" && <Palette size={20} color="var(--color-accent)" />}
              {group === "Email Configuration" && <Mail size={20} color="var(--color-accent)" />}
              {group === "General System" && <Settings size={20} color="var(--color-accent)" />}
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>{group}</h2>
            </div>

            {groupSettings.map((setting: any) => (
              <div key={setting.key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", textTransform: "capitalize" }}>{setting.key.replace(/_/g, " ")}</label>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "2px 0 0 0" }}>{setting.description || "System configuration variable."}</p>
                  </div>
                  <button onClick={() => handleSave(setting.key)} disabled={saving} style={{ padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Save size={14} /> Save
                  </button>
                </div>
                
                {setting.key === "registration_mode" ? (
                  <select 
                    value={formData[setting.key]} 
                    onChange={e => setFormData({ ...formData, [setting.key]: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none" }}
                  >
                    <option value="OPEN">Open (Anyone can register)</option>
                    <option value="INVITE_ONLY">Invite Only (Admins must invite)</option>
                    <option value="DISABLED">Disabled (No new users)</option>
                  </select>
                ) : setting.key.includes("logo") || setting.key.includes("url") ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Globe size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                      <input 
                        type="text" 
                        value={formData[setting.key] || ""} 
                        onChange={e => setFormData({ ...formData, [setting.key]: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none" }}
                      />
                    </div>
                  </div>
                ) : setting.key.includes("theme_color") ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input 
                      type="color" 
                      value={formData[setting.key] || "#000000"} 
                      onChange={e => setFormData({ ...formData, [setting.key]: e.target.value })}
                      style={{ width: "40px", height: "40px", padding: 0, border: "none", borderRadius: "8px", cursor: "pointer", background: "transparent" }}
                    />
                    <input 
                      type="text" 
                      value={formData[setting.key] || ""} 
                      onChange={e => setFormData({ ...formData, [setting.key]: e.target.value })}
                      style={{ flex: 1, padding: "10px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none", fontFamily: "monospace" }}
                    />
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={formData[setting.key] || ""} 
                    onChange={e => setFormData({ ...formData, [setting.key]: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)", outline: "none" }}
                  />
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
