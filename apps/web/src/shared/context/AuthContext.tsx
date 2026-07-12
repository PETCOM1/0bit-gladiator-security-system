"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { useRouter, usePathname } from "next/navigation";

// Pages that must never inherit whatever session cookie happens to be
// sitting in the browser (e.g. an invite link opened while the inviter is
// still signed in). AuthProvider's own session check is skipped on these
// so it can't race the page's own logout-and-clear effect.
const NO_SESSION_CHECK_PATHS = ["/set-password"];

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "ACCOUNT_MANAGER" | "MANAGER" | "SITE_MANAGER" | "GUARD";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  language?: string | null;
  dateOfBirth?: string | null;
  accountStatus: string;
  siteId?: string | null;
  tenantId?: string | null;
  tenant?: { 
    name: string;
    orgType?: string | null;
    registrationNumber?: string | null;
    physicalAddress?: string | null;
    countryRegion?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    logoUrl?: string | null;
  } | null;
  createdAt?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_ROUTES: Record<string, string> = {
  SUPER_ADMIN:     "/super-admin",
  ADMIN:           "/admin",
  ACCOUNT_MANAGER: "/staff",
  MANAGER:         "/manager",
  SITE_MANAGER:    "/site-manager",
  GUARD:           "/guard",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // ← moved inside the component
  const pathname = usePathname();

  const loadUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => { await loadUser(); };

  useEffect(() => {
    // Skip the session check entirely on pages that must start "logged out"
    // regardless of whatever cookie is already in the browser — otherwise
    // this GET /me can race a page's own logout-and-clear effect and
    // silently re-authenticate the wrong user (e.g. an invite link opened
    // while the inviter is still signed in). Only runs once on mount, so
    // this only matters for a fresh page load landing directly on the path
    // (which is how invite links are opened).
    if (NO_SESSION_CHECK_PATHS.includes(pathname)) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {   

    const response = await authService.login({ email, password });  
    const { user, token } = response.data ?? {};


    if (token) localStorage.setItem("auth_token", token);
    setUser(user ?? null);
    if (user) {
      window.location.href = ROLE_ROUTES[user.role] ?? "/";
    }
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem("auth_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}