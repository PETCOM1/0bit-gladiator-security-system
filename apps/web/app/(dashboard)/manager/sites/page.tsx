"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Edit2, ShieldAlert, Building, Save, X, UserCog, ExternalLink } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function SitesManagerPage() {
  const router = useRouter();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", address: "" });

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await managerService.getSites();
      setSites(res.data.data.sites || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSites(); }, []);

  const handleSaveSite = async (id?: string) => {
    try {
      if (id) {
        await managerService.updateSite(id, editForm);
      } else {
        await managerService.createSite(editForm);
      }
      setIsCreating(false);
      setIsEditing(null);
      fetchSites();
    } catch (err) {
      console.error(err);
      alert("Failed to save site.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to close this site? This action cannot be undone.")) return;
    try {
      await managerService.deleteSite(id);
      fetchSites();
    } catch (err) {
      console.error(err);
      alert("Failed to close site.");
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "13px", color: "var(--color-text-primary)", outline: "none"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <Building size={28} color="var(--color-accent)" /> Site Management
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Create and manage physical locations across your organization.
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditForm({ name: "", address: "" });
            setIsEditing("new");
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", transition: "background var(--transition-fast)" }}
        >
          <Plus size={16} strokeWidth={2.5} /> Add New Site
        </button>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Site Name</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address / Location</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Site Manager</th>
                <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading sites...</td></tr>
              ) : sites.length === 0 && !isCreating ? (
                <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>No sites found. Add your first site to get started.</td></tr>
              ) : sites.map((site, i) => (
                <tr key={site.id} onClick={() => { if (isEditing !== site.id) router.push(`/manager/sites/${site.id}`); }} style={{ borderBottom: i < sites.length - 1 ? "1px solid var(--color-border)" : "none", transition: "background var(--transition-fast)", cursor: isEditing === site.id ? "default" : "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg-subtle)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {isEditing === site.id ? (
                    <>
                      <td style={{ padding: "16px 24px" }}><input style={inputStyle} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                      <td style={{ padding: "16px 24px" }}><input style={inputStyle} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></td>
                      <td style={{ padding: "16px 24px" }}><span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>-</span></td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={(e) => { e.stopPropagation(); handleSaveSite(site.id); }} style={{ padding: "8px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Save</button>
                          <button onClick={(e) => { e.stopPropagation(); setIsEditing(null); }} style={{ padding: "8px 16px", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "20px 24px", fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <MapPin size={16} color="var(--color-accent)" />
                          {site.name}
                        </div>
                      </td>
                      <td style={{ padding: "20px 24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>{site.address || "No address provided"}</td>
                      <td style={{ padding: "20px 24px" }}>
                        {/* We will join this with the personnel system later */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                          <UserCog size={14} /> Assigned via Personnel
                        </div>
                      </td>
                      <td style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <button onClick={(e) => { e.stopPropagation(); setIsEditing(site.id); setEditForm({ name: site.name, address: site.address || "" }); }} style={{ padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(site.id); }} style={{ padding: "6px 12px", background: "var(--color-danger-subtle)", border: "none", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, color: "var(--color-danger)", cursor: "pointer" }}>
                            Close Site
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isCreating && isEditing === "new" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px"
        }}>
          <div style={{
            background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)", width: "100%", maxWidth: "500px",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Add New Site</h2>
              <button onClick={() => { setIsCreating(false); setIsEditing(null); }} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Site Name</label>
                <input style={inputStyle} placeholder="E.g. Downtown Mall" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Address / Location</label>
                <input style={inputStyle} placeholder="123 Commerce St" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
            </div>
            <div style={{ padding: "20px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => { setIsCreating(false); setIsEditing(null); }} style={{ padding: "10px 20px", background: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleSaveSite()} style={{ padding: "10px 20px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <Save size={16} /> Save Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
