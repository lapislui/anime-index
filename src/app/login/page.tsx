"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startAuthentication,
} from "@simplewebauthn/browser";

type Tab = "login" | "register" | "otp" | "passkey";
type OtpStep = "email" | "code";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/";
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [providers, setProviders] = useState<{
    google: boolean;
    github: boolean;
    microsoft: boolean;
    discord: boolean;
    facebook: boolean;
  }>({
    google: false,
    github: false,
    microsoft: false,
    discord: false,
    facebook: false,
  });

  const hasSSO = Object.values(providers).some(Boolean);

  // Fetch active providers
  useEffect(() => {
    fetch("/api/auth/sso/providers")
      .then((r) => r.json())
      .then((d) => setProviders(d))
      .catch(() => {});
  }, []);

  // Handle URL errors (e.g. redirected from callback)
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      if (err === "state_mismatch") setError("CSRF verification failed. Please try again.");
      else if (err === "no_code" || err === "auth_failed" || err === "auth_error") setError("SSO authentication failed.");
      else if (err === "no_user_id") setError("Could not retrieve unique identity from provider.");
      else setError(`Authentication error: ${err}`);
    }
  }, [searchParams]);

  // Auto-redirect if already logged in
  useEffect(() => {
    fetch("/api/auth/logout")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) router.push(redirectTo);
      })
      .catch(() => {});
  }, [router, redirectTo]);

  const reset = () => {
    setError("");
    setSuccess("");
  };

  // ── Email/Password Login ────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Register ────────────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Request ─────────────────────────────────────────────────────────────
  async function handleOtpRequest(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp?action=request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP request failed");
      setSuccess("OTP sent! Check your email (or the server terminal in dev mode).");
      setOtpStep("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP request failed");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Verify ──────────────────────────────────────────────────────────────
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp?action=verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }


  // ── Passkey Login ────────────────────────────────────────────────────────────
  async function handlePasskeyLogin(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const optRes = await fetch("/api/auth/passkey?action=login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const optData = await optRes.json();
      if (!optRes.ok) throw new Error(optData.error || "Could not get authentication options");

      const { userId, ...options } = optData;
      const credential = await startAuthentication({ optionsJSON: options });

      const verRes = await fetch("/api/auth/passkey?action=login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, credential }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error || "Passkey authentication failed");
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Passkey authentication failed");
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "login", label: "Password", icon: "🔐" },
    { id: "register", label: "Register", icon: "✨" },
    { id: "otp", label: "Magic Link", icon: "✉️" },
    { id: "passkey", label: "Passkey", icon: "🪪" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-light/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-light/20 border border-accent/20 mb-4">
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Anime Index</h1>
          <p className="mt-1 text-sm text-muted">Your personal anime archive</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          {/* Tab Navigation */}
          <div className="flex rounded-xl overflow-hidden border border-border/40 mb-8 bg-slate-950/40">
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`auth-tab-${t.id}`}
                onClick={() => { setTab(t.id); reset(); setOtpStep("email"); setOtpCode(""); }}
                className={`flex-1 py-2.5 text-xs font-bold transition-all duration-200 flex flex-col items-center gap-0.5 ${
                  tab === t.id
                    ? "bg-accent/15 text-accent border-b-2 border-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-start gap-2">
              <span className="mt-0.5">✅</span> {success}
            </div>
          )}

          {/* ── Login Tab ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="glow-btn w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>
          )}

          {/* ── Register Tab ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                  placeholder="Min 8 characters"
                />
              </div>
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="glow-btn w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Creating account…" : "Create Account →"}
              </button>
            </form>
          )}

          {/* ── OTP Tab ── */}
          {tab === "otp" && (
            <>
              {otpStep === "email" ? (
                <form onSubmit={handleOtpRequest} className="space-y-4">
                  <p className="text-xs text-muted leading-relaxed">
                    Enter your email and we&apos;ll send a one-time passcode. No password needed.
                    In development, the code appears in the server terminal.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      id="otp-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button
                    id="otp-request-submit"
                    type="submit"
                    disabled={loading}
                    className="glow-btn w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending…" : "Send OTP Code →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <p className="text-xs text-muted">
                    OTP sent to <strong className="text-foreground">{email}</strong>.
                    Check the server terminal if running in dev mode.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">6-Digit Code</label>
                    <input
                      id="otp-code"
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-3 text-xl font-mono tracking-[0.5em] text-foreground text-center placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    id="otp-verify-submit"
                    type="submit"
                    disabled={loading}
                    className="glow-btn w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verifying…" : "Verify & Sign In →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpStep("email"); setOtpCode(""); reset(); }}
                    className="w-full text-xs text-muted hover:text-foreground transition-colors py-1"
                  >
                    ← Use different email
                  </button>
                </form>
              )}
            </>
          )}

          {/* ── Passkey Tab ── */}
          {tab === "passkey" && (
            <form onSubmit={handlePasskeyLogin} className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                Sign in with a biometric passkey (Face ID, fingerprint, hardware key). You must have
                registered a passkey from your dashboard security settings first.
              </p>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  id="passkey-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <button
                id="passkey-login-submit"
                type="submit"
                disabled={loading}
                className="glow-btn w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Authenticating…" : "🪪 Sign In with Passkey"}
              </button>
            </form>
          )}
          {hasSSO && (
            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="bg-[#0b0f19] px-3 text-muted">Or Sign In With</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {providers.google && (
                  <a
                    id="sso-google"
                    href="/api/auth/sso/google/login"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-slate-900/80 hover:border-accent/40 transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92( 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.19-4.53z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Google
                  </a>
                )}
                {providers.github && (
                  <a
                    id="sso-github"
                    href="/api/auth/sso/github/login"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-slate-900/80 hover:border-accent/40 transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    GitHub
                  </a>
                )}
                {providers.microsoft && (
                  <a
                    id="sso-microsoft"
                    href="/api/auth/sso/microsoft/login"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-slate-900/80 hover:border-accent/40 transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 0h11v11H0z" fill="#F25022"/>
                      <path d="M12 0h11v11H12z" fill="#7FBA00"/>
                      <path d="M0 12h11v11H0z" fill="#00A4EF"/>
                      <path d="M12 12h11v11H12z" fill="#FFB900"/>
                    </svg>
                    Microsoft
                  </a>
                )}
                {providers.discord && (
                  <a
                    id="sso-discord"
                    href="/api/auth/sso/discord/login"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-slate-900/80 hover:border-accent/40 transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-[#5865F2]" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.22,6.83,77.19,77.19,0,0,0,48.92,0,105.15,105.15,0,0,0,18.48,8.07C-3.41,40.76-1,72.7,14.77,95.53A105.73,105.73,0,0,0,46,79.52a74.37,74.37,0,0,0,8.74-14.18A68.56,68.56,0,0,1,39,57.17c1.32-.95,2.61-2,3.83-3a75.14,75.14,0,0,0,81.42,0c1.22,1,2.51,2,3.83,3a68.56,68.56,0,0,1-15.77,8.17,74.37,74.37,0,0,0,8.74,14.18,105.73,105.73,0,0,0,31.27,16C128.25,72.7,130.66,40.76,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.88,46,53.88,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.12,46,96.12,53,91,65.69,84.69,65.69Z"/>
                    </svg>
                    Discord
                  </a>
                )}
                {providers.facebook && (
                  <a
                    id="sso-facebook"
                    href="/api/auth/sso/facebook/login"
                    className={`flex items-center justify-center gap-2 rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-slate-900/80 hover:border-accent/40 transition-all cursor-pointer ${
                      [providers.google, providers.github, providers.microsoft, providers.discord].filter(Boolean).length % 2 !== 0 ? "col-span-2" : "col-span-1"
                    }`}
                  >
                    <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted">
          Private anime library — authentication required to access your data.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
