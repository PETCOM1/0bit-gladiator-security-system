import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["GUARD"]} redirectTo="/login">
      {children}
    </RoleGuard>
  );
}
