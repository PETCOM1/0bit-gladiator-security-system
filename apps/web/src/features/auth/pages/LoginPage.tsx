"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/shared/context/AuthContext";
import { BRAND } from "@/shared/config/branding.config";
import { GladiatorLogo } from "@/shared/components/GladiatorLogo";

const ROLE_ROUTES: Record<string, string> = {
  SUPER_ADMIN:     "/super-admin",
  ADMIN:           "/admin",
  ACCOUNT_MANAGER: "/staff",
  MANAGER:         "/manager",
  SITE_MANAGER:    "/site-manager",
  GUARD:           "/guard",
};

const OAUTH_ERRORS: Record<string, string> = {
  google_denied:           "Google sign-in was cancelled.",
  suspended:               "Your account has been suspended. Please contact support.",
  not_found:               "No account found. Please contact support.",
  oauth_failed:            "Google sign-in failed. Please try again.",
  google_no_email:         "Your Google account has no email address we can use.",
  google_invite_only:      "This platform is invite-only. Ask an admin to invite you before signing in.",
  google_pending_approval: "Your account is awaiting admin approval.",
};

export default function LoginPage() {
  const router              = useRouter();
  const searchParams        = useSearchParams();
  const { login, user, isLoading } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Redirect as soon as user is set
  useEffect(() => {
    if (!isLoading && user) {
      router.push(ROLE_ROUTES[user.role] ?? "/");
    }
  }, [user, isLoading, router]);

  // Surface OAuth redirect errors
  useEffect(() => {
    const err = searchParams.get("error");
    if (err && OAUTH_ERRORS[err]) setError(OAUTH_ERRORS[err]);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api-gladiator-security-system.onrender.com/api/v1";
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "#080c18",
      fontFamily: "var(--font-inter), sans-serif",
    }}>
      <style>{`
        @media (max-width: 768px) {
          .left-panel {
            display: none !important;
          }
          .right-panel {
            width: 100% !important;
            flex: 1 !important;
            padding: 24px !important;
            background: #080c18 !important;
          }
          .login-card {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            padding: 32px 24px !important;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6) !important;
            border-radius: 16px !important;
          }
          .login-title {
            color: #ffffff !important;
          }
          .login-subtitle {
            color: rgba(255, 255, 255, 0.5) !important;
          }
          .input-field {
            background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
          }
          .input-field::placeholder {
            color: rgba(255, 255, 255, 0.3) !important;
          }
          .input-label {
            color: rgba(255, 255, 255, 0.5) !important;
          }
          .oauth-button {
            background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            color: #ffffff !important;
          }
          .oauth-button:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
          }
          .divider-line {
            background: rgba(255, 255, 255, 0.08) !important;
          }
          .divider-text {
            color: rgba(255, 255, 255, 0.3) !important;
          }
          .footer-text {
            color: rgba(255, 255, 255, 0.3) !important;
          }
        }
      `}</style>

      {/* Left Panel - Branding (Dark Navy Theme) */}
      <div className="left-panel" style={{
        flex: 1.1,
        background: "linear-gradient(135deg, #070b13 0%, #0d1527 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px",
        position: "relative",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Glow Effects */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "rgba(245, 158, 11, 0.08)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(30, 41, 59, 0.6)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }} />

        {/* Top Header/Product Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--color-accent)",
            boxShadow: "0 0 8px var(--color-accent)",
          }} />
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Ironclad Security Management
          </span>
        </div>

        {/* Center Content */}
        <div style={{ maxWidth: "480px", margin: "auto 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <GladiatorLogo size={56} style={{ filter: "drop-shadow(0 0 16px rgba(245, 158, 11, 0.5))" }} />
            <span style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-outfit), sans-serif",
            }}>
              {BRAND.name}
            </span>
          </div>
          
          <h2 style={{
            fontSize: "36px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
            fontFamily: "var(--font-outfit), sans-serif",
          }}>
            Transforming Site Security into Complete Visibility.
          </h2>
          <p style={{
            fontSize: "16px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.55)",
            fontWeight: 450,
          }}>
            Ironclad shift management, digital occurrence logbooks, and real-time visitor registration tailored for modern security operations.
          </p>
        </div>

        {/* Footer/Meta Info */}
        <div>
          {/* Horizontal Modules List */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "10px",
            fontWeight: 800,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.08em",
            marginBottom: "24px",
            flexWrap: "wrap",
            textTransform: "uppercase",
          }}>
            <span>Visitor Register</span>
            <span style={{ color: "var(--color-accent)" }}>•</span>
            <span>Occurrence Book</span>
            <span style={{ color: "var(--color-accent)" }}>•</span>
            <span>Shift Logistics</span>
            <span style={{ color: "var(--color-accent)" }}>•</span>
            <span>Patrol Tracker</span>
          </div>

          <div style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 500,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "20px",
          }}>
            <span>PRODUCT OF ZERO BIT STUDIO</span>
            <span>© {BRAND.year} {BRAND.name}</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (Sleek Light Theme by default) */}
      <div className="right-panel" style={{
        flex: 0.9,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px",
      }}>
        <div className="login-card" style={{ width: "100%", maxWidth: "420px" }}>
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 className="login-title" style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "8px",
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-outfit), sans-serif",
            }}>
              Welcome to {BRAND.name}
            </h1>
            <p className="login-subtitle" style={{
              fontSize: "14px",
              color: "#475569",
              fontWeight: 500,
            }}>
              Sign in to access your dashboard console.
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            className="oauth-button"
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0",
          }}>
            <div className="divider-line" style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span className="divider-text" style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
              or sign in with email
            </span>
            <div className="divider-line" style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <div>
              <label className="input-label" style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Email Address
              </label>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-accent)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label className="input-label" style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{
                  fontSize: "12px",
                  color: "var(--color-accent)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="input-field"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    paddingRight: "52px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--color-accent)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#ef4444",
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: loading ? "var(--color-accent-subtle)" : "var(--color-accent)",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--color-accent-text)",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "opacity 0.15s, transform 0.1s",
              }}
              onMouseDown={(e) => {
                if (!loading) e.currentTarget.style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                if (!loading) e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
