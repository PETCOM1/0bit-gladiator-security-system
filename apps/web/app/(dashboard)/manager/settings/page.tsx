"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Settings, Save, Building, Phone, Mail, Globe, MapPin, ShieldAlert, Award, FileText, CheckCircle2 } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";
import { useAuth } from "@/shared/context/AuthContext";

export default function SettingsManagerPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    registrationNumber: "",
    taxId: "",
    industry: "",
    description: "",
    physicalAddress: "",
    city: "",
    state: "",
    postalCode: "",
    countryRegion: ""
  });

  const [initialForm, setInitialForm] = useState<typeof form | null>(null);

  // Load Initial Data from User's Tenant Profile
  useEffect(() => {
    if (user?.tenant) {
      const t = user.tenant;

      // Parse Address details from serialized field
      let addressObj = { physical: "", city: "", state: "", postal: "" };
      try {
        if (t.physicalAddress && t.physicalAddress.startsWith("{")) {
          addressObj = JSON.parse(t.physicalAddress);
        } else {
          addressObj.physical = t.physicalAddress || "";
        }
      } catch {}

      // Parse Business/Industry details from serialized field
      let bizObj = { industry: "", taxId: "", description: "" };
      try {
        if (t.orgType && t.orgType.startsWith("{")) {
          bizObj = JSON.parse(t.orgType);
        } else {
          bizObj.industry = t.orgType || "";
        }
      } catch {}

      const loadedForm = {
        name: t.name || "",
        contactEmail: t.contactEmail || "",
        contactPhone: t.contactPhone || "",
        website: "", // local placeholder
        registrationNumber: t.registrationNumber || "",
        taxId: bizObj.taxId || "",
        industry: bizObj.industry || "",
        description: bizObj.description || "",
        physicalAddress: addressObj.physical || "",
        city: addressObj.city || "",
        state: addressObj.state || "",
        postalCode: addressObj.postal || "",
        countryRegion: t.countryRegion || ""
      };

      setForm(loadedForm);
      setInitialForm(loadedForm);
    }
  }, [user]);

  // Check if form is dirty (has unsaved changes)
  const isDirty = useMemo(() => {
    if (!initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  // Warn on page reload/exit if changes are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    setSaveSuccess(false);

    // Serialize details to match Prisma Tenant fields
    const serializedAddress = JSON.stringify({
      physical: form.physicalAddress,
      city: form.city,
      state: form.state,
      postal: form.postalCode
    });

    const serializedBiz = JSON.stringify({
      industry: form.industry,
      taxId: form.taxId,
      description: form.description
    });

    try {
      await managerService.updateTenantProfile({
        name: form.name,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        registrationNumber: form.registrationNumber,
        orgType: serializedBiz,
        physicalAddress: serializedAddress,
        countryRegion: form.countryRegion
      });

      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to update organization profile settings.");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const cardStyle = {
    background: "var(--color-card-bg)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--color-card-shadow)",
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px"
  };

  const sectionTitleStyle = {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "var(--color-text-primary)",
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    marginBottom: "6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em"
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px 10px 36px",
    background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "14px",
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border var(--transition-fast)"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%", paddingBottom: "40px" }}>
      
      {/* Title block */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <Settings size={22} color="var(--color-accent)" /> Organization Settings
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px", marginBottom: 0 }}>
          Update your organization's business details, registration coordinates, and contact profiles.
        </p>
      </div>

      {/* Dirty Warning banner */}
      {isDirty && (
        <div style={{
          background: "rgba(245, 158, 11, 0.04)",
          border: "1px dashed rgba(245, 158, 11, 0.3)",
          borderRadius: "var(--radius-xl)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <ShieldAlert size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            <strong>Unsaved Changes:</strong> You have modified your company profile. Please save your configurations before leaving.
          </span>
        </div>
      )}

      {/* Success alert notification */}
      {saveSuccess && (
        <div style={{
          background: "rgba(16, 185, 129, 0.05)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "var(--radius-xl)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Organization profile changes saved successfully!
          </span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Layout Grid: Left column for info forms, Right column for Logo placeholder */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* General Info Card */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}><Building size={16} color="var(--color-accent)" /> General Information</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Company Name *</label>
                  <div style={{ position: "relative" }}>
                    <Building size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      required
                      style={inputStyle}
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Gladiator Security Ltd"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      type="email"
                      style={inputStyle}
                      value={form.contactEmail}
                      onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="e.g. operations@gladiator.com"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Company Phone Number</label>
                  <div style={{ position: "relative" }}>
                    <Phone size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      style={inputStyle}
                      value={form.contactPhone}
                      onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="e.g. +27 11 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Website (Optional)</label>
                  <div style={{ position: "relative" }}>
                    <Globe size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      style={inputStyle}
                      value={form.website}
                      onChange={e => setForm({ ...form, website: e.target.value })}
                      placeholder="e.g. www.gladiator.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Info Card */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}><Award size={16} color="var(--color-accent)" /> Business Registration</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Registration Number</label>
                  <div style={{ position: "relative" }}>
                    <FileText size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      style={inputStyle}
                      value={form.registrationNumber}
                      onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                      placeholder="e.g. 2024/098172/07"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Tax/VAT Number (Optional)</label>
                  <div style={{ position: "relative" }}>
                    <FileText size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      style={inputStyle}
                      value={form.taxId}
                      onChange={e => setForm({ ...form, taxId: e.target.value })}
                      placeholder="e.g. ZA489274928"
                    />
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Industry Category</label>
                  <div style={{ position: "relative" }}>
                    <Building size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      style={inputStyle}
                      value={form.industry}
                      onChange={e => setForm({ ...form, industry: e.target.value })}
                      placeholder="e.g. Commercial & Private Security Services"
                    />
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Company Description (Optional)</label>
                  <textarea 
                    style={{
                      width: "100%", height: "80px", padding: "10px 12px", background: "var(--color-bg-subtle)",
                      border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px",
                      color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box", resize: "none"
                    }}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide a brief summary profile of your security agency..."
                  />
                </div>
              </div>
            </div>

            {/* Address Info Card */}
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}><MapPin size={16} color="var(--color-accent)" /> Address Details</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "span 3" }}>
                  <label style={labelStyle}>Physical Address</label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      style={inputStyle}
                      value={form.physicalAddress}
                      onChange={e => setForm({ ...form, physicalAddress: e.target.value })}
                      placeholder="e.g. 100 West Street, Sandton"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>City</label>
                  <input 
                    style={{ ...inputStyle, paddingLeft: "12px" }}
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Johannesburg"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Province/State</label>
                  <input 
                    style={{ ...inputStyle, paddingLeft: "12px" }}
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. Gauteng"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Postal Code</label>
                  <input 
                    style={{ ...inputStyle, paddingLeft: "12px" }}
                    value={form.postalCode}
                    onChange={e => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="e.g. 2196"
                  />
                </div>

                <div style={{ gridColumn: "span 3" }}>
                  <label style={labelStyle}>Country / Region</label>
                  <div style={{ position: "relative" }}>
                    <Globe size={16} color="var(--color-text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      style={inputStyle}
                      value={form.countryRegion}
                      onChange={e => setForm({ ...form, countryRegion: e.target.value })}
                      placeholder="e.g. South Africa"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Logo Upload placeholder */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Company Logo</h2>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "10px 0" }}>
              <div style={{
                width: "120px", height: "120px", borderRadius: "var(--radius-xl)",
                background: "var(--color-bg-subtle)", border: "2px dashed var(--color-border)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                color: "var(--color-text-muted)"
              }}>
                {user?.tenant?.logoUrl ? (
                  <img src={user.tenant.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Building size={48} style={{ opacity: 0.3 }} />
                )}
              </div>
              
              <div style={{
                background: "rgba(59, 130, 246, 0.04)",
                border: "1px solid rgba(59, 130, 246, 0.15)",
                borderRadius: "var(--radius-lg)",
                padding: "12px",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.4,
                textAlign: "center"
              }}>
                <strong>AWS S3 Integration:</strong> Logo upload will be fully available once AWS cloud file storage has been configured.
              </div>
            </div>
          </div>

        </div>

        {/* Form Actions Footer bar */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: "12px",
          borderTop: "1px solid var(--color-border)", paddingTop: "20px"
        }}>
          <button 
            type="button"
            disabled={!isDirty || loading}
            onClick={() => {
              if (initialForm) setForm(initialForm);
            }}
            style={{
              padding: "10px 20px", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px",
              fontWeight: 600, cursor: (!isDirty || loading) ? "not-allowed" : "pointer", opacity: (!isDirty || loading) ? 0.5 : 1
            }}
          >
            Discard Changes
          </button>
          
          <button 
            disabled={loading || !form.name.trim() || !isDirty}
            type="submit" 
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px",
              background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none",
              borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600,
              cursor: (loading || !form.name.trim() || !isDirty) ? "not-allowed" : "pointer",
              opacity: (loading || !form.name.trim() || !isDirty) ? 0.7 : 1,
              boxShadow: "var(--color-card-shadow)"
            }}
          >
            <Save size={16} /> Save Settings
          </button>
        </div>

      </form>
    </div>
  );
}
