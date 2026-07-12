"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/features/auth/services/auth.service";
import { useAuth } from "@/shared/context/AuthContext";
import { BRAND } from "@/shared/config/branding.config";
import { GladiatorLogo } from "@/shared/components/GladiatorLogo";

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",    pass: password.length >= 8         },
    { label: "Uppercase",        pass: /[A-Z]/.test(password)       },
    { label: "Lowercase",        pass: /[a-z]/.test(password)       },
    { label: "Number",           pass: /[0-9]/.test(password)       },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const barColor = passed <= 1 ? "#ef4444" : passed <= 3 ? "#f59e0b" : "var(--color-accent)";

  if (!password) return null;

  return (
    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Bar */}
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            height: "3px", flex: 1, borderRadius: "999px",
            background: i <= passed ? barColor : "#e2e8f0",
            transition: "background 0.2s",
          }} />
        ))}
      </div>
      {/* Checks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        {checks.map(({ label, pass }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: pass ? "var(--color-accent)" : "#cbd5e1" }}>
              {pass ? "✓" : "○"}
            </span>
            <span style={{ fontSize: "12px", color: pass ? "#334155" : "#94a3b8" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SET PASSWORD PAGE ────────────────────────────────────────────────────────
export default function SetPasswordPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setUser }  = useAuth();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";

  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPw,           setShowPw]           = useState(false);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [isDone,           setIsDone]           = useState(false);

  // An invite link is often opened in the same browser the inviter is still
  // signed in on. Without clearing that session here, AuthContext keeps the
  // inviter as the logged-in user for the whole page, and the redirect to
  // /login after activation lands the invitee on the inviter's dashboard
  // instead of a real login form. Best-effort: clear local token + cookie.
  useEffect(() => {
    authService.logout().catch(() => {});
    localStorage.removeItem("auth_token");
    setUser(null);
  }, [setUser]);

  useEffect(() => { if (!token) router.replace("/login"); }, [token, router]);
  if (!token) return null;

  const isValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true); setError(null);
    try {
      await authService.setPassword({ token, email, password });
      setIsDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        msg?.includes("expired")
          ? "This activation link has expired. Ask your administrator to resend the invite."
          : msg ?? "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          {isDone ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", color: "var(--color-accent)",
              }}>✓</div>
              <div>
                <p className="login-title" style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Password set</p>
                <p className="login-subtitle" style={{ fontSize: "13px", color: "#64748b" }}>Redirecting you to sign in...</p>
              </div>
            </div>
          ) : (
            <>
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
                  Activate your account
                </h1>
                <p className="login-subtitle" style={{
                  fontSize: "14px",
                  color: "#475569",
                  fontWeight: 500,
                }}>
                  Set a password to complete your {BRAND.name} setup.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Password */}
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
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      autoFocus
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
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm */}
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
                    Confirm password
                  </label>
                  <input
                    className="input-field"
                    type={showPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
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
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "5px" }}>Passwords do not match</p>
                  )}
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
                  disabled={!isValid || isSubmitting}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: isValid && !isSubmitting ? "var(--color-accent)" : "var(--color-accent-subtle)",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--color-accent-text)",
                    cursor: isValid && !isSubmitting ? "pointer" : "not-allowed",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "opacity 0.15s, transform 0.1s",
                  }}
                  onMouseDown={(e) => {
                    if (isValid && !isSubmitting) e.currentTarget.style.transform = "scale(0.98)";
                  }}
                  onMouseUp={(e) => {
                    if (isValid && !isSubmitting) e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {isSubmitting ? "Activating..." : "Activate account →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
