"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useMode } from "@/context/ModeContext";
import { startRegistration } from "@simplewebauthn/browser";

interface TagStat {
  id: string;
  name: string;
  color: string;
  _count: {
    animes: number;
  };
}

interface Activity {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  anime: {
    id: string;
    title: string;
  };
}

interface StatsData {
  totalAnime: number;
  totalEpisodes: number;
  statusCounts: {
    watching?: number;
    completed?: number;
    planned?: number;
    dropped?: number;
    played?: number;
    playing?: number;
    backlog?: number;
    cant_play?: number;
    planning?: number;
    installed?: number;
  };
  topTags: TagStat[];
  recentActivity: Activity[];
  shareDashboard: boolean;
  shareToken: string;
}

function DashboardPageInner() {
  const { mode } = useMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Passkey states
  const [passkeys, setPasskeys] = useState<{ id: string; credentialId: string; counter: number }[]>([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeySuccess, setPasskeySuccess] = useState("");

  // SSO states
  const [user, setUser] = useState<{
    id: string;
    email: string;
    googleConnected: boolean;
    githubConnected: boolean;
    microsoftConnected: boolean;
    discordConnected: boolean;
    facebookConnected: boolean;
  } | null>(null);

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

  const loadStats = useCallback(() => {
    setLoading(true);
    fetch(`/api/stats?mode=${mode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard metrics");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error loading metrics. Please verify database connection.");
        setLoading(false);
      });
  }, [mode]);

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

  const fetchUser = useCallback(() => {
    fetch("/api/auth/logout")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load user profile");
        return res.json();
      })
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchProviders = useCallback(() => {
    fetch("/api/auth/sso/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch((err) => console.error(err));
  }, []);

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

  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    if (successParam) {
      if (successParam === "linked") setSsoSuccess("Account successfully linked!");
      else if (successParam === "already_linked") setSsoSuccess("Account is already linked to this profile.");
      router.replace("/dashboard");
    }
    if (errorParam) {
      if (errorParam === "already_linked_to_other_account") setSsoError("This social account is already linked to another user.");
      else setSsoError(`Link failed: ${errorParam}`);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  useEffect(() => {
    loadStats();
    fetchPasskeys();
    fetchUser();
    fetchProviders();
  }, [loadStats, fetchPasskeys, fetchUser, fetchProviders]);

  async function toggleSharing() {
    if (!stats) return;
    setShareLoading(true);
    try {
      const res = await fetch("/api/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareDashboard: !stats.shareDashboard }),
      });
      if (res.ok) {
        setStats((prev) => prev ? { ...prev, shareDashboard: !prev.shareDashboard } : prev);
      }
    } finally {
      setShareLoading(false);
    }
  }

  function copyShareLink() {
    if (!stats?.shareToken) return;
    const url = `${window.location.origin}/shared/${stats.shareToken}?mode=${mode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-32 text-center text-muted sm:px-6 lg:px-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm font-semibold tracking-wide">Compiling Library Metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="glass-panel inline-block rounded-2xl p-8 border-rose-500/20 shadow-lg">
          <span className="text-5xl">⚠️</span>
          <p className="mt-4 text-base font-bold text-rose-400">{error || "Failed to load statistics."}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-slate-900 border border-border px-5 py-2 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  const { totalAnime, totalEpisodes, statusCounts, topTags, recentActivity } = stats;

  // Compute percentages
  const completedVal = mode === "games" 
    ? (statusCounts.played || 0) + (statusCounts.completed || 0) 
    : (statusCounts.completed || 0);
  const activeVal = mode === "games" 
    ? (statusCounts.playing || 0) + (statusCounts.installed || 0) 
    : (statusCounts.watching || 0);
  const plannedVal = mode === "games" 
    ? (statusCounts.backlog || 0) + (statusCounts.planning || 0) 
    : (statusCounts.planned || 0);
  const droppedVal = mode === "games" 
    ? (statusCounts.cant_play || 0) + (statusCounts.dropped || 0) 
    : (statusCounts.dropped || 0);
  
  const totalStatusCount = completedVal + activeVal + plannedVal + droppedVal || 1;
  const getPercent = (count: number) => Math.round((count / totalStatusCount) * 100);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20 animate-pulse">
          Library Intelligence
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {mode === "games" ? "Personal Game Metrics" : mode === "movies" ? "Personal Movie Metrics" : "Personal Anime Metrics"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {mode === "games"
            ? "Analyze gameplay statuses, journal chapter logs, and custom tag preferences from your database."
            : mode === "movies"
            ? "Analyze watched status distributions, movie parts volume, and custom tag preferences from your database."
            : "Analyze watch status distributions, episode journaling volume, and custom tag preferences from your database."}
        </p>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: mode === "games" ? "Total Games" : mode === "movies" ? "Total Movies" : "Total Series", val: totalAnime, icon: mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📺", grad: "from-blue-600/10 to-blue-400/5" },
          { label: mode === "games" ? "Chapters Logged" : mode === "movies" ? "Parts Logged" : "Episodes Logged", val: totalEpisodes, icon: "📝", grad: "from-emerald-600/10 to-emerald-400/5" },
          { label: mode === "games" ? "Played" : mode === "movies" ? "Watched" : "Completed", val: completedVal, icon: "🏆", grad: "from-amber-600/10 to-amber-400/5" },
          { label: mode === "games" ? "Playing" : mode === "movies" ? "Watching" : "In Progress", val: activeVal, icon: "⏳", grad: "from-purple-600/10 to-purple-400/5" },
        ].map((c, i) => (
          <div
            key={i}
            className={`glass-panel rounded-2xl p-6 bg-gradient-to-br ${c.grad} border border-border/40 shadow-md relative overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted">{c.label}</p>
                <h3 className="text-3xl font-extrabold mt-2 text-foreground">{c.val}</h3>
              </div>
              <span className="text-2xl">{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Progress & Tags (col-span-7) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Status distribution card */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Status Distribution</h3>
              <p className="text-xs text-muted">Ratios based on total items added to library</p>
            </div>

            <div className="space-y-4">
              {[
                { label: mode === "games" ? "Played" : mode === "movies" ? "Watched" : "Completed", val: completedVal, color: "bg-cyan-400" },
                { label: mode === "games" ? "Playing" : mode === "movies" ? "Watching" : "Watching", val: activeVal, color: "bg-emerald-400" },
                { label: mode === "games" ? "Backlog" : mode === "movies" ? "Plan to Watch" : "Planned", val: plannedVal, color: "bg-amber-400" },
                { label: mode === "games" ? "Can't Play" : mode === "movies" ? "Dropped" : "Dropped", val: droppedVal, color: "bg-rose-400" },
              ].map((s, idx) => {
                const pct = getPercent(s.val);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{s.label} ({s.val})</span>
                      <span className="text-muted">{pct}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950/80 rounded-full overflow-hidden border border-border/20">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tags popularity card */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Top Genre Tags</h3>
              <p className="text-xs text-muted">Most populated categories in your workspace</p>
            </div>

            {topTags.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No tags have been assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {topTags.map((tag) => (
                  <div key={tag.id} className="flex justify-between items-center bg-slate-950/20 rounded-xl p-3 border border-border/10">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-xs font-bold text-foreground">{tag.name}</span>
                    </div>
                    <span className="text-xs font-semibold bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-muted">
                      {tag._count.animes} {tag._count.animes === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed (col-span-5) */}
        <div className="lg:col-span-5">
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5 sticky top-[100px]">
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Activity Feed</h3>
              <p className="text-xs text-muted">Latest episode breakdown updates</p>
            </div>

            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
                <span className="text-4xl mb-3">✍️</span>
                <p className="text-xs">No journaling log cataloged yet.</p>
                <Link
                  href="/organize"
                  className="text-xs mt-3 text-accent hover:underline font-semibold"
                >
                  Import entries & start journaling
                </Link>
              </div>
            ) : (
              <div className="relative border-l border-border/30 pl-4 space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="relative space-y-1">
                    <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-accent ring-4 ring-slate-950" />
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <h4 className="text-xs font-bold text-foreground leading-snug">
                      Logged {mode === "games" ? "Chapter" : mode === "movies" ? "Part" : "Episode"} {activity.number}: &ldquo;{activity.title}&rdquo;
                    </h4>
                    <p className="text-[10px] text-muted-light leading-relaxed">
                      Entry:{" "}
                      <Link
                        href={mode === "games" ? `/game/${activity.anime.id}` : mode === "movies" ? `/movie/${activity.anime.id}` : `/anime/${activity.anime.id}`}
                        className="text-accent hover:underline font-semibold"
                      >
                        {activity.anime.title}
                      </Link>
                    </p>
                    <Link
                      href={
                        mode === "games" 
                          ? `/game/${activity.anime.id}/chapter/${activity.id}`
                          : mode === "movies"
                          ? `/movie/${activity.anime.id}/part/${activity.id}`
                          : `/anime/${activity.anime.id}/episode/${activity.id}`
                      }
                      className="inline-block text-[10px] font-bold text-accent hover:text-accent-light underline transition-colors pt-1"
                    >
                      View breakdown &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Sharing Panel */}
      <div className="mt-8 glass-panel rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-foreground">Dashboard Sharing</h3>
            <p className="text-xs text-muted mt-1 max-w-md">
              Make your stats publicly viewable via a unique link. Anyone with the link can see your
              library metrics without being able to edit anything.
            </p>
          </div>
          <button
            id="sharing-toggle"
            onClick={toggleSharing}
            disabled={shareLoading}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              stats?.shareDashboard ? "border-accent bg-accent/20" : "border-border/40 bg-slate-950/60"
            }`}
            aria-label="Toggle dashboard sharing"
          >
            <span
              className={`inline-block h-5 w-5 translate-x-0.5 translate-y-0.5 transform rounded-full shadow transition-transform duration-200 ${
                stats?.shareDashboard ? "translate-x-5 bg-accent" : "bg-muted"
              }`}
            />
          </button>
        </div>

        {stats?.shareDashboard && (
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs font-mono text-muted truncate select-all">
              {typeof window !== "undefined" ? `${window.location.origin}/shared/${stats.shareToken}?mode=${mode}` : `/shared/${stats?.shareToken}?mode=${mode}`}
            </div>
            <button
              id="copy-share-link"
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

      {/* Security & Passkeys Panel */}
      <div className="mt-8 glass-panel rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>🪪</span> Security & Passkeys
          </h3>
          <p className="text-xs text-muted mt-1 max-w-md">
            Register secure, passwordless passkeys for your account. Once registered, you can log in using biometric verification (Face ID, fingerprint, or hardware security keys).
          </p>
        </div>

        {passkeyError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 flex items-start gap-2 animate-in fade-in-50">
            <span className="mt-0.5">⚠️</span> {passkeyError}
          </div>
        )}
        {passkeySuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-start gap-2 animate-in fade-in-50">
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
                <div key={pk.id} className="flex justify-between items-center bg-slate-950/40 rounded-xl p-3 border border-border/40">
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

      {/* SSO Integrations Panel */}
      <div className="mt-8 glass-panel rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>🔗</span> SSO Integrations & Connected Accounts
          </h3>
          <p className="text-xs text-muted mt-1 max-w-md">
            Connect or disconnect Single Sign-On providers to your account. Connected providers can be used to log in instantly.
          </p>
        </div>

        {ssoError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 flex items-start gap-2 animate-in fade-in-50">
            <span className="mt-0.5">⚠️</span> {ssoError}
          </div>
        )}
        {ssoSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-start gap-2 animate-in fade-in-50">
            <span className="mt-0.5">✅</span> {ssoSuccess}
          </div>
        )}

        <div className="space-y-3">
          {[
            { id: "google", name: "Google", connected: user?.googleConnected },
            { id: "github", name: "GitHub", connected: user?.githubConnected },
            { id: "microsoft", name: "Microsoft", connected: user?.microsoftConnected },
            { id: "discord", name: "Discord", connected: user?.discordConnected },
            { id: "facebook", name: "Facebook", connected: user?.facebookConnected }
          ].map((prov) => {
            const isConfigured = providers[prov.id as keyof typeof providers];
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
                      {prov.connected ? "Connected to your account" : isConfigured ? "Not connected" : "Unavailable"}
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
                  ) : isConfigured ? (
                    <a
                      href={`/api/auth/sso/${prov.id}/login`}
                      className="inline-block rounded-lg bg-accent/10 border border-accent/20 px-4 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer"
                    >
                      Connect
                    </a>
                  ) : (
                    <button
                      disabled
                      title={`${prov.name} SSO is not configured in .env`}
                      className="rounded-lg bg-slate-950/20 border border-border/20 px-4 py-1.5 text-xs font-bold text-muted/50 opacity-40 cursor-not-allowed"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageInner />
    </Suspense>
  );
}
