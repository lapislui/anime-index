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
