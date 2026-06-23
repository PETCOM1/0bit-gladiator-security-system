"use client";

import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["SUPER_ADMIN"]}>{children}</RoleGuard>;
}
