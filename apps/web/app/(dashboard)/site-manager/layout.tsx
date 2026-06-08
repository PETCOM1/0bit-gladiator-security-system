import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function SiteManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["SITE_MANAGER", "MANAGER"]} redirectTo="/login">
      {children}
    </RoleGuard>
  );
}
