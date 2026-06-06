"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

import { useMode } from "@/context/ModeContext";

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
  };
  topTags: TagStat[];
  recentActivity: Activity[];
  shareDashboard: boolean;
  shareToken: string;
}

export default function DashboardPage() {
  const { mode } = useMode();
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
  const completedVal = mode === "games" ? (statusCounts.played || 0) : (statusCounts.completed || 0);
  const activeVal = mode === "games" ? (statusCounts.playing || 0) : (statusCounts.watching || 0);
  const plannedVal = mode === "games" ? (statusCounts.backlog || 0) : (statusCounts.planned || 0);
  const droppedVal = mode === "games" ? (statusCounts.cant_play || 0) : (statusCounts.dropped || 0);
  
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
    </div>
  );
}
