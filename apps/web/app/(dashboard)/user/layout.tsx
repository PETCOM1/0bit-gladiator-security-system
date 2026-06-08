import { RoleGuard } from "@/shared/components/guards/RoleGuard";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["USER"]} redirectTo="/login">
      {children}
    </RoleGuard>
  );
}
