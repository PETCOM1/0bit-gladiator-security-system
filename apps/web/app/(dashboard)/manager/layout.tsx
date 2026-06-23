"use client";

import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["MANAGER", "SITE_MANAGER"]}>{children}</RoleGuard>;
}
