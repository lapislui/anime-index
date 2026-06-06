"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

interface SessionUser {
  id: string;
  email: string;
  shareDashboard: boolean;
  shareToken: string;
  googleConnected: boolean;
  githubConnected: boolean;
  microsoftConnected: boolean;
  discordConnected: boolean;
  facebookConnected: boolean;
  hasPassword: boolean;
}

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User Profile
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Passkey states
  const [passkeys, setPasskeys] = useState<{ id: string; credentialId: string; counter: number }[]>([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeySuccess, setPasskeySuccess] = useState("");

  // SSO states
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
  const [ssoSuccess, setSsoSuccess] = useState("");
  const [ssoError, setSsoError] = useState("");
  const [disconnectLoading, setDisconnectLoading] = useState<string | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Sharing states
  const [shareLoading, setShareLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/logout");
      if (!res.ok) throw new Error("Failed to load user profile");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        // Redirect if not logged in
        router.push("/login?from=/profile");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch user profile details.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchProviders = useCallback(() => {
    fetch("/api/auth/sso/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch((err) => console.error(err));
  }, []);

  const fetchPasskeys = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/passkey");
      if (!res.ok) throw new Error("Failed to load passkeys");
      const data = await res.json();
      setPasskeys(data.passkeys || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchProviders();
    fetchPasskeys();
  }, [fetchUser, fetchProviders, fetchPasskeys]);

  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    if (successParam) {
      if (successParam === "linked") setSsoSuccess("Account successfully linked!");
      else if (successParam === "already_linked") setSsoSuccess("Account is already linked to this profile.");
      router.replace("/profile");
    }
    if (errorParam) {
      if (errorParam === "already_linked_to_other_account") setSsoError("This social account is already linked to another user.");
      else setSsoError(`Link failed: ${errorParam}`);
      router.replace("/profile");
    }
  }, [searchParams, router]);

  // SSO Disconnect
  async function handleDisconnect(providerId: string) {
    if (!confirm(`Are you sure you want to disconnect your ${providerId} account?`)) return;
    setDisconnectLoading(providerId);
    setSsoError("");
    setSsoSuccess("");
    try {
      const res = await fetch("/api/auth/sso/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect account");
      setSsoSuccess(`${providerId} account disconnected successfully.`);
      fetchUser();
    } catch (err: unknown) {
      setSsoError(err instanceof Error ? err.message : "Failed to disconnect account");
    } finally {
      setDisconnectLoading(null);
    }
  }

  // Passkeys
  async function registerPasskey() {
    setPasskeyLoading(true);
    setPasskeyError("");
    setPasskeySuccess("");
    try {
      const optRes = await fetch("/api/auth/passkey?action=register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!optRes.ok) {
        const d = await optRes.json();
        throw new Error(d.error || "Could not get registration options");
      }
      const options = await optRes.json();

      const credential = await startRegistration({ optionsJSON: options });

      const verRes = await fetch("/api/auth/passkey?action=register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error || "Passkey registration verification failed");

      setPasskeySuccess("New passkey successfully registered!");
      fetchPasskeys();
    } catch (err: unknown) {
      console.error(err);
      setPasskeyError(err instanceof Error ? err.message : "Passkey registration failed");
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function deletePasskey(id: string) {
    if (!confirm("Are you sure you want to revoke this passkey?")) return;
    setPasskeyLoading(true);
    setPasskeyError("");
    setPasskeySuccess("");
    try {
      const res = await fetch(`/api/auth/passkey?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to revoke passkey");
      }
      setPasskeySuccess("Passkey revoked successfully.");
      fetchPasskeys();
    } catch (err: unknown) {
      console.error(err);
      setPasskeyError(err instanceof Error ? err.message : "Failed to revoke passkey");
    } finally {
      setPasskeyLoading(false);
    }
  }

  // Password Settings
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setPasswordSuccess(user?.hasPassword ? "Password updated successfully!" : "Password set successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchUser(); // Refresh password status
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  }

  // Sharing Toggle
  async function toggleSharing() {
    if (!user) return;
    setShareLoading(true);
    try {
      const res = await fetch("/api/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareDashboard: !user.shareDashboard }),
      });
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, shareDashboard: !prev.shareDashboard } : prev);
      }
    } finally {
      setShareLoading(false);
    }
  }

  function copyShareLink() {
    if (!user?.shareToken) return;
    const url = `${window.location.origin}/shared/${user.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-32 text-center text-muted">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm font-semibold tracking-wide">Fetching profile security variables...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-20 text-center">
        <div className="glass-panel inline-block rounded-2xl p-8 border-rose-500/20 shadow-lg">
          <span className="text-5xl">⚠️</span>
          <p className="mt-4 text-base font-bold text-rose-400">{error || "Failed to load profile settings."}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-slate-900 border border-border px-5 py-2 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Return to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/15 to-accent-light/10 p-8 sm:p-12">
        <div className="relative z-10">
          <span className="inline-block rounded-full bg-accent/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent border border-accent/25">
            User Center
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Profile Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Configure passwordless passkeys, connect or unlink SSO social providers, toggle public dashboard sharing, or update your password settings.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="space-y-8">
        {/* Profile Details Panel */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>👤</span> Account Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-slate-950/40 rounded-xl p-4 border border-border/30">
              <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Email Address</span>
              <span className="text-sm font-bold text-foreground break-all mt-1 block">{user.email}</span>
            </div>
            <div className="bg-slate-950/40 rounded-xl p-4 border border-border/30">
              <span className="block text-[10px] font-bold text-muted uppercase tracking-wider">Account ID</span>
              <span className="text-sm font-bold text-foreground break-all mt-1 block">{user.id}</span>
            </div>
          </div>
        </div>

        {/* SSO Integrations & Connected Accounts */}
        {Object.values(providers).some(Boolean) && (
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>🔗</span> SSO Integrations & Connected Accounts
              </h3>
              <p className="text-xs text-muted mt-1 max-w-md">
                Connect or disconnect social providers. Connected providers allow you to log in instantly.
              </p>
            </div>

            {ssoError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span> {ssoError}
              </div>
            )}
            {ssoSuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-start gap-2">
                <span className="mt-0.5">✅</span> {ssoSuccess}
              </div>
            )}

            <div className="space-y-3">
              {[
                { id: "google", name: "Google", connected: user.googleConnected },
                { id: "github", name: "GitHub", connected: user.githubConnected },
                { id: "microsoft", name: "Microsoft", connected: user.microsoftConnected },
                { id: "discord", name: "Discord", connected: user.discordConnected },
                { id: "facebook", name: "Facebook", connected: user.facebookConnected }
              ].map((prov) => {
                if (!providers[prov.id as keyof typeof providers]) return null;
                return (
                  <div key={prov.id} className="flex justify-between items-center bg-slate-950/40 rounded-xl p-4 border border-border/40 hover:border-accent/20 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      {prov.id === "google" && (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.19-4.53z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                      )}
                      {prov.id === "github" && (
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                      )}
                      {prov.id === "microsoft" && (
                        <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 0h11v11H0z" fill="#F25022"/>
                          <path d="M12 0h11v11H12z" fill="#7FBA00"/>
                          <path d="M0 12h11v11H0z" fill="#00A4EF"/>
                          <path d="M12 12h11v11H12z" fill="#FFB900"/>
                        </svg>
                      )}
                      {prov.id === "discord" && (
                        <svg className="h-5 w-5 fill-[#5865F2]" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                          <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,52.22,6.83,77.19,77.19,0,0,0,48.92,0,105.15,105.15,0,0,0,18.48,8.07C-3.41,40.76-1,72.7,14.77,95.53A105.73,105.73,0,0,0,46,79.52a74.37,74.37,0,0,0,8.74-14.18A68.56,68.56,0,0,1,39,57.17c1.32-.95,2.61-2,3.83-3a75.14,75.14,0,0,0,81.42,0c1.22,1,2.51,2,3.83,3a68.56,68.56,0,0,1-15.77,8.17,74.37,74.37,0,0,0,8.74,14.18,105.73,105.73,0,0,0,31.27,16C128.25,72.7,130.66,40.76,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.88,46,53.88,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.12,46,96.12,53,91,65.69,84.69,65.69Z"/>
                        </svg>
                      )}
                      {prov.id === "facebook" && (
                        <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      <div>
                        <p className="text-xs font-bold text-foreground">{prov.name}</p>
                        <p className="text-[10px] text-muted">
                          {prov.connected ? "Connected to your account" : "Not connected"}
                        </p>
                      </div>
                    </div>

                    <div>
                      {prov.connected ? (
                        <button
                          onClick={() => handleDisconnect(prov.id)}
                          disabled={disconnectLoading === prov.id}
                          className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {disconnectLoading === prov.id ? "Disconnecting…" : "Disconnect"}
                        </button>
                      ) : (
                        <a
                          href={`/api/auth/sso/${prov.id}/login`}
                          className="inline-block rounded-lg bg-accent/10 border border-accent/20 px-4 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer"
                        >
                          Connect
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security & Passkeys */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>🪪</span> Security & Passkeys
            </h3>
            <p className="text-xs text-muted mt-1 max-w-md">
              Register biometric passkeys for passwordless verification. Securely sign in using Face ID, fingerprint, or hardware keys.
            </p>
          </div>

          {passkeyError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span> {passkeyError}
            </div>
          )}
          {passkeySuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-start gap-2">
              <span className="mt-0.5">✅</span> {passkeySuccess}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Your Registered Passkeys ({passkeys.length})</h4>
            
            {passkeys.length === 0 ? (
              <p className="text-xs text-muted py-2">No passkeys registered on this account yet.</p>
            ) : (
              <div className="space-y-2.5">
                {passkeys.map((pk) => (
                  <div key={pk.id} className="flex justify-between items-center bg-slate-950/40 rounded-xl p-3 border border-border/40 hover:border-accent/10 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-accent">🔑</span>
                      <div>
                        <p className="text-xs font-bold text-foreground">Passkey {pk.credentialId.substring(0, 16)}...</p>
                        <p className="text-[10px] text-muted">Use Count: {pk.counter}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePasskey(pk.id)}
                      disabled={passkeyLoading}
                      className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={registerPasskey}
              disabled={passkeyLoading}
              className="glow-btn rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {passkeyLoading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-slate-950 border-r-transparent" />
                  <span>Registering…</span>
                </>
              ) : (
                <>
                  <span>➕</span> Register New Passkey
                </>
              )}
            </button>
          </div>
        </div>

        {/* Change / Set Password Panel */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>🔐</span> {user.hasPassword ? "Change Password" : "Set Account Password"}
            </h3>
            <p className="text-xs text-muted mt-1 max-w-md">
              {user.hasPassword 
                ? "Update your existing account password. You will need your current password to confirm this."
                : "Create an account password. Setting a password allows you to log in via password in addition to OTP and SSO."}
            </p>
          </div>

          {passwordError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span> {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-start gap-2">
              <span className="mt-0.5">✅</span> {passwordSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            {user.hasPassword && (
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                placeholder="Confirm password"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="glow-btn rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {passwordLoading ? "Saving…" : user.hasPassword ? "Update Password" : "Set Password"}
            </button>
          </form>
        </div>

        {/* Dashboard Sharing Toggle */}
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>🔗</span> Dashboard Public Sharing
              </h3>
              <p className="text-xs text-muted mt-1 max-w-md">
                Make your anime/gaming dashboard publicly viewable. Visitors with this link can view your metrics, stories, and list entries.
              </p>
            </div>
            <button
              onClick={toggleSharing}
              disabled={shareLoading}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                user.shareDashboard ? "border-accent bg-accent/20" : "border-border/40 bg-slate-950/60"
              }`}
              aria-label="Toggle dashboard sharing"
            >
              <span
                className={`inline-block h-5 w-5 translate-x-0.5 translate-y-0.5 transform rounded-full shadow transition-transform duration-200 ${
                  user.shareDashboard ? "translate-x-5 bg-accent" : "bg-muted"
                }`}
              />
            </button>
          </div>

          {user.shareDashboard && (
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in-50">
              <div className="flex-1 rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs font-mono text-muted truncate select-all">
                {typeof window !== "undefined" ? `${window.location.origin}/shared/${user.shareToken}` : `/shared/${user.shareToken}`}
              </div>
              <button
                onClick={copyShareLink}
                className={`glow-btn rounded-xl px-5 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                  copySuccess ? "!bg-emerald-500 shadow-emerald-500/30" : ""
                }`}
              >
                {copySuccess ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  );
}
