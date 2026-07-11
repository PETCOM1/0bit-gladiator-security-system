"use client";

import { useEffect, useState } from "react";
import { Package, CheckCircle2 } from "lucide-react";
import { superAdminService } from "@/features/super-admin/services/tenant.service";

export function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getPlans()
      .then((res) => setPlans(res.data?.data?.plans ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Subscription Plans
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Pricing tiers available to tenants on the platform
        </p>
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
                {["Plan Name", "Monthly Price", "Max Users", "Max Sites", "Features"].map((h) => (
                  <th key={h} style={{ padding: "12px 24px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading plans...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No plans found.</td></tr>
              ) : (
                plans.map((plan, i) => {
                  const rawFeatures = plan.features;
                  let featuresArray: string[] = [];
                  if (Array.isArray(rawFeatures)) {
                    featuresArray = rawFeatures;
                  } else if (rawFeatures && typeof rawFeatures === "object") {
                    featuresArray = rawFeatures.description
                      ? [rawFeatures.description]
                      : Object.entries(rawFeatures).map(([k, v]) => `${k}: ${v}`);
                  } else if (typeof rawFeatures === "string") {
                    featuresArray = [rawFeatures];
                  }
                  return (
                    <tr key={plan.id} style={{ borderBottom: i < plans.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", verticalAlign: "top" }}>{plan.name}</td>
                      <td style={{ padding: "16px 24px", fontSize: "14px", color: "var(--color-text-primary)", verticalAlign: "top" }}>
                        R{plan.price} <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>/mo</span>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)", verticalAlign: "top" }}>{plan.maxUsers || "Unlimited"}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)", verticalAlign: "top" }}>{plan.maxSites || "Unlimited"}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--color-text-secondary)", verticalAlign: "top" }}>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                          {featuresArray.map((f, fi) => (
                            <li key={fi} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                              <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: "2px" }} /> {f}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
