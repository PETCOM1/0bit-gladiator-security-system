import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["ACCOUNT_MANAGER"]} redirectTo="/login">
      {children}
    </RoleGuard>
  );
}
