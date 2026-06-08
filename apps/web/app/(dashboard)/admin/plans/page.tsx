"use client";

import React, { useEffect, useState } from "react";
import { Package, Plus, CheckCircle2, DollarSign, Users, Building2, Save, X, Edit2 } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";

export default function PlanManagerPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getPlans();
      setPlans(res.data.data.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleEdit = (plan: any) => {
    setIsEditing(plan.id);
    setEditForm({ ...plan, features: (plan.features || []).join("\n") });
  };

  const handleSave = async (id: string) => {
    try {
      await superAdminService.updatePlan(id, {
        ...editForm,
        price: parseFloat(editForm.price),
        maxUsers: editForm.maxUsers ? parseInt(editForm.maxUsers) : null,
        maxSites: editForm.maxSites ? parseInt(editForm.maxSites) : null,
        features: typeof editForm.features === "string" ? editForm.features.split("\n").filter((f: string) => f.trim()) : editForm.features
      });
      setIsEditing(null);
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert("Failed to update plan");
    }
  };

  const handleCreate = async () => {
    try {
      await superAdminService.createPlan({
        ...editForm,
        price: parseFloat(editForm.price || "0"),
        maxUsers: editForm.maxUsers ? parseInt(editForm.maxUsers) : null,
        maxSites: editForm.maxSites ? parseInt(editForm.maxSites) : null,
        features: typeof editForm.features === "string" ? editForm.features.split("\n").filter((f: string) => f.trim()) : []
      });
      setIsCreating(false);
      setIsEditing(null);
      setEditForm({});
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert("Failed to create plan");
    }
  };

  const inputStyle = {
    width: "100%", padding: "6px 10px", background: "var(--color-bg-subtle)",
    border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
    fontSize: "13px", color: "var(--color-text-primary)", outline: "none"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Subscription Plans
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Manage pricing tiers and features for tenants.
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditForm({ name: "", price: 0, maxUsers: "", maxSites: "", features: "" });
            setIsEditing("new");
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer", transition: "background var(--transition-fast)" }}
        >
          <Plus size={15} strokeWidth={2} /> New Plan
        </button>
      </div>

      <div style={{ background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <Package size={18} color="var(--color-accent)" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Available Plans</h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Plan Name</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly Price</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Max Users</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Max Sites</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Features</th>
                <th style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isCreating && isEditing === "new" && (
                <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-accent-subtle)" }}>
                  <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input style={inputStyle} placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input type="number" style={inputStyle} placeholder="Price" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} /></td>
                  <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input type="number" style={inputStyle} placeholder="Unlimited" value={editForm.maxUsers} onChange={e => setEditForm({ ...editForm, maxUsers: e.target.value })} /></td>
                  <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input type="number" style={inputStyle} placeholder="Unlimited" value={editForm.maxSites} onChange={e => setEditForm({ ...editForm, maxSites: e.target.value })} /></td>
                  <td style={{ padding: "16px 24px", verticalAlign: "top" }}><textarea style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} placeholder="One per line" value={editForm.features} onChange={e => setEditForm({ ...editForm, features: e.target.value })} /></td>
                  <td style={{ padding: "16px 24px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={handleCreate} style={{ padding: "6px 12px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Save</button>
                      <button onClick={() => { setIsCreating(false); setIsEditing(null); }} style={{ padding: "6px 12px", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading plans...</td></tr>
              ) : plans.map((plan, i) => (
                <tr key={plan.id} style={{ borderBottom: i < plans.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  {isEditing === plan.id ? (
                    <>
                      <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input style={inputStyle} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} disabled /></td>
                      <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input type="number" style={inputStyle} value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} /></td>
                      <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input type="number" style={inputStyle} placeholder="Unlimited" value={editForm.maxUsers || ""} onChange={e => setEditForm({ ...editForm, maxUsers: e.target.value })} /></td>
                      <td style={{ padding: "16px 24px", verticalAlign: "top" }}><input type="number" style={inputStyle} placeholder="Unlimited" value={editForm.maxSites || ""} onChange={e => setEditForm({ ...editForm, maxSites: e.target.value })} /></td>
                      <td style={{ padding: "16px 24px", verticalAlign: "top" }}><textarea style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} value={editForm.features} onChange={e => setEditForm({ ...editForm, features: e.target.value })} /></td>
                      <td style={{ padding: "16px 24px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button onClick={() => handleSave(plan.id)} style={{ padding: "6px 12px", background: "var(--color-accent)", color: "var(--color-accent-text)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Save</button>
                          <button onClick={() => setIsEditing(null)} style={{ padding: "6px 12px", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", verticalAlign: "top" }}>{plan.name}</td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-primary)", verticalAlign: "top" }}>R{plan.price} <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>/mo</span></td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)", verticalAlign: "top" }}>{plan.maxUsers || "Unlimited"}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)", verticalAlign: "top" }}>{plan.maxSites || "Unlimited"}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)", verticalAlign: "top" }}>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                          {(plan.features || []).map((f: string, i: number) => (
                            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                              <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: "2px" }} /> {f}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ padding: "16px 24px", verticalAlign: "top" }}>
                        <button onClick={() => handleEdit(plan)} style={{ padding: "6px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Edit2 size={12} /> Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
