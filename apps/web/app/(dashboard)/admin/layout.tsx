"use client";

import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>{children}</RoleGuard>;
}
