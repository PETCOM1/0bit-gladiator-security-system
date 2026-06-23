"use client";

import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["USER"]}>{children}</RoleGuard>;
}
