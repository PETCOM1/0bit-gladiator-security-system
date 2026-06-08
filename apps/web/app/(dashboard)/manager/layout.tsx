import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["MANAGER"]} redirectTo="/login">
      {children}
    </RoleGuard>
  );
}
