"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  FolderKanban, Plus, X, MapPin, Edit2, Save, Building, Trash2, Search, Users, Activity, ArrowRight, ShieldAlert, Info
} from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

const inputStyle = {
  padding: "10px 14px",
  background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize: "14px",
  color: "var(--color-text-primary)",
  outline: "none",
  transition: "border var(--transition-fast)",
  width: "100%",
  boxSizing: "border-box" as const
};

const cardStyle = {
  background: "var(--color-card-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--color-card-shadow)",
  padding: "24px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "16px",
  position: "relative" as const,
  transition: "transform var(--transition-base), border-color var(--transition-base)",
  cursor: "pointer"
};

function OperationsContent() {
  const router = useRouter();
  const [sites, setSites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Site CRUD state
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteForm, setSiteForm] = useState({ name: "", address: "" });

  // Site Manager assignment and reminder states
  const [postponedReminders, setPostponedReminders] = useState<string[]>([]);
  const [assigningSiteId, setAssigningSiteId] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [submittingManager, setSubmittingManager] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("postponedSiteReminders");
      if (stored) {
        try {
          setPostponedReminders(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handlePostponeReminder = (siteIds: string[]) => {
    const updated = Array.from(new Set([...postponedReminders, ...siteIds]));
    setPostponedReminders(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("postponedSiteReminders", JSON.stringify(updated));
    }
  };

  const handleAssignSiteManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSiteId || !selectedManagerId) return;
    setSubmittingManager(true);
    try {
      const selectedUser = users.find(u => u.id === selectedManagerId);
      if (selectedUser) {
        if (selectedUser.role !== "SITE_MANAGER") {
          await managerService.updateUserRole(selectedManagerId, "SITE_MANAGER");
        }
        await managerService.assignUserToSite(selectedManagerId, assigningSiteId);
      }
      setAssigningSiteId(null);
      setSelectedManagerId("");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to assign Site Manager.");
    } finally {
      setSubmittingManager(false);
    }
  };

  const unassignedSites = useMemo(() => {
    return sites.filter(site => {
      const hasManager = users.some(u => 
        (u.assignedSiteId === site.id || u.assignedSite?.id === site.id) && 
        u.role === "SITE_MANAGER"
      );
      return !hasManager;
    });
  }, [sites, users]);

  const unassignedSitesForBanner = useMemo(() => {
    return unassignedSites.filter(s => !postponedReminders.includes(s.id));
  }, [unassignedSites, postponedReminders]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, siteRes, shiftRes] = await Promise.all([
        managerService.getTenantUsers(),
        managerService.getSites(),
        managerService.getTenantShifts()
      ]);
      setUsers(userRes.data?.data?.users || []);
      setSites(siteRes.data?.data?.sites || []);
      setShifts(shiftRes.data?.data?.shifts || []);
    } catch (err) {
      console.error("Failed to load operations data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSite = async (id?: string) => {
    if (!siteForm.name.trim()) { alert("Site name is required."); return; }
    try {
      if (id) {
        await managerService.updateSite(id, siteForm);
      } else {
        await managerService.createSite(siteForm);
      }
      setIsCreatingSite(false);
      setEditingSiteId(null);
      setSiteForm({ name: "", address: "" });
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save site.");
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!confirm("Are you sure you want to delete this site? This action cannot be undone.")) return;
    try {
      await managerService.deleteSite(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete site.");
    }
  };

  // Filtered sites based on search query
  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (site.address && site.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderKanban size={24} color="var(--color-accent)" /> Monitored Sites &amp; Operations
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "6px" }}>
            Select any site card below to view live telemetry, manage schedules, and check Occurrence Book logs.
          </p>
        </div>
        <button
          onClick={() => { setIsCreatingSite(true); setSiteForm({ name: "", address: "" }); }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", boxShadow: "0 4px 12px rgba(245,158,11,0.25)" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={16} strokeWidth={2.5} /> Add Site
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", position: "relative", width: "100%", maxWidth: "480px" }}>
        <input
          style={{ ...inputStyle, paddingLeft: "40px" }}
          placeholder="Search sites by name or address..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <Search size={18} color="var(--color-text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
      </div>

      {/* Gentle Banner reminder for unassigned Site Managers */}
      {unassignedSitesForBanner.length > 0 && (
        <div style={{
          background: "rgba(245, 158, 11, 0.04)",
          border: "1px solid rgba(245, 158, 11, 0.15)",
          borderRadius: "var(--radius-xl)",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          boxShadow: "var(--color-card-shadow)",
          flexWrap: "wrap",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", minWidth: 0, flex: 1 }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-accent)", flexShrink: 0
            }}>
              <ShieldAlert size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Site Manager Assignment Recommended
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {unassignedSitesForBanner.length === 1 
                  ? `"${unassignedSitesForBanner[0].name}" has no designated Site Manager assigned to oversee day-to-day operations.`
                  : `You have ${unassignedSitesForBanner.length} sites without designated Site Managers.`
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button 
              onClick={() => {
                setAssigningSiteId(unassignedSitesForBanner[0].id);
                setSelectedManagerId("");
              }}
              style={{
                padding: "8px 16px", background: "var(--color-accent)", color: "var(--color-accent-text)",
                border: "none", borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600,
                cursor: "pointer", transition: "opacity var(--transition-fast)"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Assign Site Manager
            </button>
            <button 
              onClick={() => handlePostponeReminder(unassignedSitesForBanner.map(s => s.id))}
              style={{
                padding: "8px 16px", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px",
                fontWeight: 600, cursor: "pointer", transition: "background var(--transition-fast)"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--color-border)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--color-bg-subtle)"}
            >
              Remind Me Later
            </button>
          </div>
        </div>
      )}

      {/* Sites Grid */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
          <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "14px" }}>Loading monitored sites...</span>
        </div>
      ) : filteredSites.length === 0 ? (
        <div style={{ padding: "80px 40px", background: "var(--color-card-bg)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-xl)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <Building size={48} style={{ opacity: 0.15, color: "var(--color-text-primary)" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>No sites found</h3>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", margin: 0, maxWidth: "340px" }}>
            {searchQuery ? "No sites match your search term. Try adjusting your query." : "You have not set up any sites yet. Click 'Add Site' above to create one."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {filteredSites.map(site => {
            const isEditing = editingSiteId === site.id;
            const siteUsersCount = users.filter(u => u.assignedSiteId === site.id || u.assignedSite?.id === site.id).length;
            const activeShiftsCount = shifts.filter(s => s.siteId === site.id && s.status === "IN_PROGRESS").length;
            const hasSiteManager = users.some(u => 
              (u.assignedSiteId === site.id || u.assignedSite?.id === site.id) && 
              u.role === "SITE_MANAGER"
            );

            return (
              <div
                key={site.id}
                style={{
                  ...cardStyle,
                  borderColor: isEditing ? "var(--color-accent)" : "var(--color-border)",
                }}
                onMouseEnter={e => {
                  if (!isEditing) {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.08)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isEditing) {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.boxShadow = "var(--color-card-shadow)";
                  }
                }}
                onClick={() => {
                  if (!isEditing) router.push(`/manager/sites/${site.id}`);
                }}
              >
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} onClick={e => e.stopPropagation()}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Edit Site</h3>
                    <input
                      style={inputStyle} value={siteForm.name} autoFocus
                      placeholder="Site name" onChange={e => setSiteForm({ ...siteForm, name: e.target.value })}
                    />
                    <input
                      style={inputStyle} value={siteForm.address}
                      placeholder="Address" onChange={e => setSiteForm({ ...siteForm, address: e.target.value })}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={() => handleSaveSite(site.id)}
                        style={{ flex: 1, padding: "8px 14px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <Save size={14} /> Save
                      </button>
                      <button
                        onClick={() => { setEditingSiteId(null); setSiteForm({ name: "", address: "" }); }}
                        style={{ padding: "8px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13px", color: "var(--color-text-secondary)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={site.name}>
                          {site.name}
                        </h3>
                        <span style={{ fontSize: "13px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <MapPin size={13} style={{ flexShrink: 0 }} /> {site.address || "No address provided"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingSiteId(site.id); setSiteForm({ name: site.name, address: site.address || "" }); }}
                          title="Edit site"
                          style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-secondary)", padding: "6px", borderRadius: "var(--radius-md)", display: "flex" }}
                        ><Edit2 size={13} /></button>
                        <button
                          onClick={() => handleDeleteSite(site.id)}
                          title="Delete site"
                          style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", cursor: "pointer", color: "var(--color-danger)", padding: "6px", borderRadius: "var(--radius-md)", display: "flex" }}
                        ><Trash2 size={13} /></button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", borderTop: "1px solid var(--color-border)", paddingTop: "14px", marginTop: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        <Users size={15} color="var(--color-text-muted)" />
                        <span><strong>{siteUsersCount}</strong> Assigned</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: activeShiftsCount > 0 ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                        <Activity size={15} color={activeShiftsCount > 0 ? "var(--color-success)" : "var(--color-text-muted)"} className={activeShiftsCount > 0 ? "animate-pulse" : ""} />
                        <span><strong>{activeShiftsCount}</strong> On-Duty</span>
                      </div>
                    </div>

                    {!hasSiteManager && (
                      <div 
                        style={{
                          background: "rgba(245, 158, 11, 0.03)",
                          border: "1px solid rgba(245, 158, 11, 0.15)",
                          borderRadius: "var(--radius-lg)",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "4px",
                          boxSizing: "border-box"
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                          <Info size={14} color="var(--color-accent)" style={{ flexShrink: 0 }} /> No Site Manager
                        </span>
                        <button 
                          onClick={() => {
                            setAssigningSiteId(site.id);
                            setSelectedManagerId("");
                          }}
                          style={{
                            padding: "4px 10px", background: "var(--color-accent)", color: "var(--color-accent-text)",
                            border: "none", borderRadius: "var(--radius-sm)", fontSize: "11px", fontWeight: 700,
                            cursor: "pointer", transition: "opacity var(--transition-fast)"
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                          Assign
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, color: "var(--color-accent)", marginTop: "4px" }}>
                      <span>View Site Console</span>
                      <ArrowRight size={14} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Site Modal */}
      {isCreatingSite && (
        <div
          onClick={() => setIsCreatingSite(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(11,15,25,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px" }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "460px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)" }}>Add New Site</h2>
              <button onClick={() => setIsCreatingSite(false)} style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Site Name</label>
                <input autoFocus style={inputStyle} placeholder="E.g. Downtown Mall" value={siteForm.name} onChange={e => setSiteForm({ ...siteForm, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address / Location</label>
                <input style={inputStyle} placeholder="123 Commerce St" value={siteForm.address} onChange={e => setSiteForm({ ...siteForm, address: e.target.value })} />
              </div>
            </div>
            <div style={{ padding: "18px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setIsCreatingSite(false)} style={{ padding: "10px 20px", background: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleSaveSite()} style={{ padding: "10px 20px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <Save size={15} /> Save Site
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Assign Site Manager Modal */}
      {assigningSiteId && (
        <div 
          onClick={() => setAssigningSiteId(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px"
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)", width: "100%", maxWidth: "420px",
              display: "flex", flexDirection: "column", overflow: "hidden"
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={16} color="var(--color-accent)" /> Assign Site Manager
              </h3>
              <button 
                onClick={() => setAssigningSiteId(null)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSiteManager} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Choose a member from your staff roster to designate as the Site Manager for <strong>{sites.find(s => s.id === assigningSiteId)?.name}</strong>.
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Staff Member *</label>
                  <select 
                    required 
                    value={selectedManagerId} 
                    onChange={e => setSelectedManagerId(e.target.value)} 
                    style={{
                      padding: "10px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)",
                      outline: "none", cursor: "pointer"
                    }}
                  >
                    <option value="">Choose a staff member...</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role === "SITE_MANAGER" ? "Site Manager" : "Officer"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ padding: "18px 24px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button 
                  type="button" 
                  onClick={() => setAssigningSiteId(null)} 
                  style={{ padding: "10px 20px", background: "transparent", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "13.5px", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingManager || !selectedManagerId}
                  style={{ padding: "10px 20px", background: selectedManagerId ? "var(--color-accent)" : "var(--color-bg-subtle)", color: selectedManagerId ? "var(--color-accent-text)" : "var(--color-text-muted)", border: "none", borderRadius: "var(--radius-md)", cursor: selectedManagerId ? "pointer" : "not-allowed", fontSize: "13.5px", fontWeight: 600 }}
                >
                  {submittingManager ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerOperationsConsole() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: "12px", padding: "80px", color: "var(--color-text-muted)" }}>
        <div style={{ width: "16px", height: "16px", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "14px" }}>Loading operations dashboard...</span>
      </div>
    }>
      <SuspenseWrapper />
    </Suspense>
  );
}

function SuspenseWrapper() {
  return <OperationsContent />;
}
