"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { animes: number; games?: number };
}

interface TagStat {
  id: string;
  name: string;
  color: string;
  _count: { animes: number };
}

interface Activity {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  anime: { id: string; title: string };
}

interface SharedStats {
  ownerEmail: string;
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
  shareAnime?: boolean;
  shareGames?: boolean;
  shareMovies?: boolean;
  shareActivity?: boolean;
  shareTags?: boolean;
}

interface LibraryItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  year: number | null;
  format: string | null;
  genres: string | null;
  tags: Tag[];
  _count: { episodes?: number; chapters?: number; parts?: number };
}

interface MediaEntry {
  id: string;
  url: string;
  type: string; // "image" or "clip"
  caption: string | null;
}

interface BreakdownLog {
  id: string;
  number: number;
  title: string;
  story: string;
  media: MediaEntry[];
}

interface ItemDetails extends LibraryItem {
  episodes?: BreakdownLog[];
  chapters?: BreakdownLog[];
  parts?: BreakdownLog[];
}

const statusLabels: Record<string, { label: string; className: string }> = {
  watching: { label: "Watching", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  completed: { label: "Completed", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  dropped: { label: "Dropped", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
  planned: { label: "Planned", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  played: { label: "Played", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  playing: { label: "Playing", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  backlog: { label: "Backlog", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  cant_play: { label: "Can't Play", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
};

export default function SharedDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { token } = use(params);
  const resolvedSearchParams = use(searchParams);
  
  const [mode, setMode] = useState(resolvedSearchParams.mode || "anime");
  const [tab, setTab] = useState<"dashboard" | "library">("dashboard");
  const [stats, setStats] = useState<SharedStats | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);
  
  // Loading & Error States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Follow Status
  const [followStatus, setFollowStatus] = useState<{
    loggedIn: boolean;
    isSelf: boolean;
    isFollowing: boolean;
  } | null>(null);

  // Fetch Stats Data
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setError("");
    try {
      const res = await fetch(`/api/stats/shared/${token}?mode=${mode}`);
      if (!res.ok) throw new Error("Dashboard not found or not shared");
      const data = await res.json();
      setStats(data);

      // Auto-correct mode if current one is private
      if (mode === "anime" && data.shareAnime === false) {
        if (data.shareGames !== false) {
          setMode("games");
        } else if (data.shareMovies !== false) {
          setMode("movies");
        }
      } else if (mode === "games" && data.shareGames === false) {
        if (data.shareAnime !== false) {
          setMode("anime");
        } else if (data.shareMovies !== false) {
          setMode("movies");
        }
      } else if (mode === "movies" && data.shareMovies === false) {
        if (data.shareAnime !== false) {
          setMode("anime");
        } else if (data.shareGames !== false) {
          setMode("games");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Shared dashboard profile is private or does not exist.");
    } finally {
      setLoadingStats(false);
    }
  }, [token, mode]);

  // Fetch Library Items Data
  const fetchLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const res = await fetch(`/api/stats/shared/${token}/library?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setLibraryItems(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLibrary(false);
    }
  }, [token, mode]);

  // Fetch Follow Check
  const checkFollowStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/friends/check?followingToken=${token}`);
      if (res.ok) {
        const data = await res.json();
        setFollowStatus(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
    checkFollowStatus();
  }, [fetchStats, checkFollowStatus]);

  useEffect(() => {
    if (tab === "library") {
      fetchLibrary();
    }
  }, [tab, fetchLibrary]);

  // Handle Mode Change
  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setSelectedItem(null);
  };

  // Follow / Unfollow Owner
  async function toggleFollow() {
    if (!followStatus || !stats || followLoading) return;
    setFollowLoading(true);
    try {
      if (followStatus.isFollowing) {
        // Unfollow
        const res = await fetch(`/api/friends?followingId=${stats.ownerEmail}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setFollowStatus((prev) => prev ? { ...prev, isFollowing: false } : prev);
        }
      } else {
        // Follow
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: token }),
        });
        if (res.ok) {
          setFollowStatus((prev) => prev ? { ...prev, isFollowing: true } : prev);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  }

  // Open Details Modal
  async function openDetails(itemId: string) {
    setLoadingDetails(true);
    setSelectedItem(null);
    try {
      const res = await fetch(`/api/stats/shared/${token}/detail?mode=${mode}&itemId=${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedItem(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  }

  if (loadingStats) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-32 text-center text-muted sm:px-6 lg:px-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-muted">Opening Shared Portal...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="glass-panel inline-block rounded-2xl p-8 border-rose-500/20 shadow-lg">
          <span className="text-5xl">🔒</span>
          <p className="mt-4 text-base font-bold text-rose-400">{error || "This library is private."}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-slate-900 border border-border px-5 py-2 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Go to Discover
          </Link>
        </div>
      </div>
    );
  }

  const { ownerEmail, totalAnime, totalEpisodes, statusCounts, topTags, recentActivity } = stats;

  const completedVal = mode === "games" ? (statusCounts.played || 0) : (statusCounts.completed || 0);
  const activeVal = mode === "games" ? (statusCounts.playing || 0) : (statusCounts.watching || 0);
  const plannedVal = mode === "games" ? (statusCounts.backlog || 0) : (statusCounts.planned || 0);
  const droppedVal = mode === "games" ? (statusCounts.cant_play || 0) : (statusCounts.dropped || 0);

  const totalStatusCount = completedVal + activeVal + plannedVal + droppedVal || 1;
  const getPercent = (count: number) => Math.round((count / totalStatusCount) * 100);
  const allPrivate = !!(stats && stats.shareAnime === false && stats.shareGames === false && stats.shareMovies === false);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        {/* Follow Status Header Button */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          {followStatus && (
            <>
              {followStatus.loggedIn ? (
                <>
                  {followStatus.isSelf ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-accent/10 border border-accent/20 px-3.5 py-1.5 text-xs font-bold text-accent">
                      👤 My Profile
                    </span>
                  ) : (
                    <button
                      onClick={toggleFollow}
                      disabled={followLoading}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 shadow-md border cursor-pointer ${
                        followStatus.isFollowing
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 group"
                          : "bg-accent hover:opacity-95 text-slate-950 border-transparent font-extrabold"
                      }`}
                    >
                      {followStatus.isFollowing ? (
                        <>
                          <span className="group-hover:hidden">Following 🟢</span>
                          <span className="hidden group-hover:inline">Unfollow 🔴</span>
                        </>
                      ) : (
                        <>
                          <span>👥</span> Follow
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <Link
                  href={`/login?from=/shared/${token}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-border px-3.5 py-1.5 text-xs font-bold text-muted hover:text-foreground transition-all"
                >
                  🔑 Login to Follow
                </Link>
              )}
            </>
          )}
        </div>

        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20">
          Shared Profile
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {ownerEmail.split("@")[0]}&apos;s Catalog
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Viewing public {mode === "games" ? "game" : mode === "movies" ? "movie" : "anime"} logs from{" "}
          <span className="text-foreground font-semibold">{ownerEmail}</span>.
        </p>

        {/* Mode Selector */}
        {stats && (stats.shareAnime !== false || stats.shareGames !== false || stats.shareMovies !== false) && (
          <div className="relative inline-flex rounded-xl bg-slate-900/60 p-0.5 border border-border/60 mt-6 z-10">
            {[
              { id: "anime", label: "Anime", visible: stats.shareAnime !== false },
              { id: "games", label: "Games", visible: stats.shareGames !== false },
              { id: "movies", label: "Movies", visible: stats.shareMovies !== false }
            ]
              .filter(m => m.visible)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`relative z-10 flex items-center gap-1 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                    mode === m.id ? "text-slate-950 font-extrabold bg-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      {stats && (stats.shareAnime !== false || stats.shareGames !== false || stats.shareMovies !== false) && (
        <div className="flex border-b border-border/40 mb-8 bg-slate-950/20 rounded-xl p-1 max-w-xs border border-border/20">
          <button
            onClick={() => setTab("dashboard")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "dashboard" ? "bg-accent/15 text-accent border border-accent/20" : "text-muted hover:text-foreground"
            }`}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            onClick={() => setTab("library")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "library" ? "bg-accent/15 text-accent border border-accent/20" : "text-muted hover:text-foreground"
            }`}
          >
            <span>📚</span> Library
          </button>
        </div>
      )}

      {/* ─── TAB 1: DASHBOARD VIEW ─── */}
      {tab === "dashboard" && (
        <>
          {allPrivate ? (
            <div className="glass-panel rounded-2xl py-20 text-center border-border/40 shadow-lg">
              <span className="text-5xl">🔒</span>
              <h3 className="mt-4 text-base font-bold text-foreground">All metrics are private</h3>
              <p className="mt-2 text-xs text-muted max-w-sm mx-auto leading-relaxed">
                The owner of this dashboard has configured all Anime, Gaming, and Movie metrics to be private.
              </p>
            </div>
          ) : (
            <>
              {/* Metrics Row */}
              <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                  { label: mode === "games" ? "Total Games" : mode === "movies" ? "Total Movies" : "Total Series", val: totalAnime, icon: mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📺", grad: "from-blue-600/10 to-blue-400/5" },
                  { label: mode === "games" ? "Chapters Logged" : mode === "movies" ? "Parts Logged" : "Episodes Logged", val: totalEpisodes, icon: "📝", grad: "from-emerald-600/10 to-emerald-400/5" },
                  { label: mode === "games" ? "Played" : mode === "movies" ? "Watched" : "Completed", val: completedVal, icon: "🏆", grad: "from-amber-600/10 to-amber-400/5" },
                  { label: mode === "games" ? "Playing" : mode === "movies" ? "Watching" : "In Progress", val: activeVal, icon: "⏳", grad: "from-purple-600/10 to-purple-400/5" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`glass-panel rounded-2xl p-6 bg-gradient-to-br ${c.grad} border border-border/40 shadow-md`}
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
                {/* Status Distribution + Tags */}
                <div className={`${stats.shareActivity !== false ? "lg:col-span-7" : "lg:col-span-12"} space-y-8`}>
                  <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-foreground">Status Distribution</h3>
                      <p className="text-xs text-muted">Ratios based on total items added to library</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: mode === "games" ? "Played" : mode === "movies" ? "Watched" : "Completed", val: completedVal, color: "bg-amber-400" },
                        { label: mode === "games" ? "Playing" : mode === "movies" ? "Watching" : "Watching", val: activeVal, color: "bg-purple-400" },
                        { label: mode === "games" ? "Backlog" : mode === "movies" ? "Plan to Watch" : "Planned", val: plannedVal, color: "bg-blue-400" },
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
                              <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {stats.shareTags !== false && (
                    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Top Genre Tags</h3>
                        <p className="text-xs text-muted">Most populated categories</p>
                      </div>
                      {topTags.length === 0 ? (
                        <p className="text-xs text-muted text-center py-6">No tags assigned yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {topTags.map((tag) => (
                            <div key={tag.id} className="flex justify-between items-center bg-slate-950/20 rounded-xl p-3 border border-border/10">
                              <div className="flex items-center gap-2">
                                <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ backgroundColor: tag.color }} />
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
                  )}
                </div>

                {/* Recent Activity */}
                {stats.shareActivity !== false && (
                  <div className="lg:col-span-5">
                    <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5 sticky top-[100px]">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Recent Activity Feed</h3>
                        <p className="text-xs text-muted">Latest breakdowns logged</p>
                      </div>
                      {recentActivity.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
                          <span className="text-4xl mb-3">✍️</span>
                          <p className="text-xs">No entries cataloged yet.</p>
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
                              <p className="text-[10px] text-muted leading-relaxed">
                                {mode === "games" ? "Game" : mode === "movies" ? "Movie" : "Series"}: <span className="text-foreground font-semibold">{activity.anime.title}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── TAB 2: LIBRARY VIEW ─── */}
      {tab === "library" && (
        <>
          {allPrivate ? (
            <div className="glass-panel rounded-2xl py-20 text-center border-border/40 shadow-lg">
              <span className="text-5xl">🔒</span>
              <h3 className="mt-4 text-base font-bold text-foreground">All logs are private</h3>
              <p className="mt-2 text-xs text-muted max-w-sm mx-auto leading-relaxed">
                The owner of this dashboard has configured all library indexes to be private.
              </p>
            </div>
          ) : (
            <>
              {loadingLibrary ? (
                <div className="py-32 text-center text-muted">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
                  <p className="mt-4 text-sm font-semibold tracking-wide text-muted">Scanning Shared Library...</p>
                </div>
              ) : libraryItems.length === 0 ? (
                <div className="glass-panel rounded-2xl py-20 text-center shadow-lg border border-border/50">
                  <span className="text-5xl">{mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "🎌"}</span>
                  <p className="mt-4 text-lg font-bold text-muted">No {mode === "games" ? "game" : mode === "movies" ? "movie" : "anime"} entries shared yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {libraryItems.map((item) => {
                    const statusInfo = statusLabels[item.status] || { label: item.status, className: "bg-slate-500/10 text-slate-400 border border-slate-500/20" };
                    const countVal = item._count.episodes !== undefined ? item._count.episodes : item._count.chapters !== undefined ? item._count.chapters : item._count.parts || 0;
                    const countUnit = mode === "games" ? "chapter" : mode === "movies" ? "part" : "episode";
                    return (
                      <div
                        key={item.id}
                        onClick={() => openDetails(item.id)}
                        className="block cursor-pointer group"
                      >
                        <div className="glass-panel group overflow-hidden rounded-xl h-full flex flex-col border border-border/40 hover:border-accent/30 transition-all duration-300">
                          {/* Cover Image */}
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-accent/10 to-accent-light/10">
                            {item.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-4xl text-accent/30">
                                {mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📺"}
                              </div>
                            )}
                            <span
                              className={`absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="p-4 flex flex-col flex-1">
                            <h3 className="text-xs font-bold leading-snug text-foreground line-clamp-1 group-hover:text-accent transition-colors duration-300">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="mt-1 text-[10px] text-muted line-clamp-2 leading-relaxed flex-1">{item.description}</p>
                            )}
                            <p className="mt-2 text-[9px] font-bold text-accent uppercase tracking-wider">
                              {countVal} {countUnit}{countVal !== 1 ? "s" : ""} logged
                            </p>
                            {item.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold"
                                    style={{ backgroundColor: tag.color + "15", color: tag.color, border: `1px solid ${tag.color}30` }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                                {item.tags.length > 2 && (
                                  <span className="text-[8px] text-muted self-center ml-1 font-semibold">+{item.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── DYNAMIC ITEM DETAILS MODAL ─── */}
      {(selectedItem || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-border/40 z-10 flex flex-col gap-6">
            
            {loadingDetails ? (
              <div className="py-20 text-center text-muted flex-1 flex flex-col items-center justify-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
                <p className="mt-4 text-xs font-semibold">Retrieving journal logs...</p>
              </div>
            ) : selectedItem ? (
              <>
                {/* Modal Header details */}
                <div className="flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-border/40">
                  <div className="relative aspect-[3/4] w-32 md:w-40 rounded-2xl overflow-hidden bg-slate-900 border border-border/40 shrink-0">
                    {selectedItem.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedItem.coverImage}
                        alt={selectedItem.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-accent/30">
                        {mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📺"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <h2 className="text-xl font-extrabold text-foreground">{selectedItem.title}</h2>
                      <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        (statusLabels[selectedItem.status] || { className: "" }).className
                      }`}>
                        {(statusLabels[selectedItem.status] || { label: selectedItem.status }).label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted font-medium">
                      {selectedItem.year && <span>📅 Release Year: <strong className="text-foreground">{selectedItem.year}</strong></span>}
                      {selectedItem.format && <span>🏷️ Format: <strong className="text-foreground">{selectedItem.format}</strong></span>}
                    </div>

                    {selectedItem.description && (
                      <p className="text-xs text-muted leading-relaxed max-w-2xl">{selectedItem.description}</p>
                    )}

                    {selectedItem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedItem.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold"
                            style={{ backgroundColor: tag.color + "15", color: tag.color, border: `1px solid ${tag.color}30` }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 text-muted hover:text-foreground text-lg cursor-pointer"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* Episode/Chapter breakdown logs */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-widest">
                    Detailed Journal Breakdown
                  </h3>
                  
                  {/* Logs mapping */}
                  {(() => {
                    const logs = selectedItem.episodes || selectedItem.chapters || selectedItem.parts || [];
                    const logUnitName = mode === "games" ? "Chapter" : mode === "movies" ? "Part" : "Episode";

                    if (logs.length === 0) {
                      return <p className="text-xs text-muted italic">No progress logs cataloged for this entry yet.</p>;
                    }

                    return (
                      <div className="space-y-6">
                        {logs.map((log) => (
                          <div key={log.id} className="bg-slate-950/40 rounded-2xl p-5 border border-border/30 space-y-4">
                            <div className="border-b border-border/20 pb-2.5">
                              <h4 className="text-xs font-bold text-foreground">
                                {logUnitName} {log.number}: &ldquo;{log.title}&rdquo;
                              </h4>
                            </div>
                            
                            <p className="text-xs text-muted-light leading-relaxed whitespace-pre-wrap">{log.story}</p>
                            
                            {/* Media attachment gallery */}
                            {log.media && log.media.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                {log.media.map((med) => (
                                  <div key={med.id} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-border/20">
                                    {med.type === "image" ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={med.url}
                                        alt={med.caption || "Journal clip"}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                      />
                                    ) : (
                                      <video
                                        src={med.url}
                                        controls
                                        className="h-full w-full object-cover"
                                      />
                                    )}
                                    {med.caption && (
                                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-1.5 text-[8px] font-medium text-muted truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {med.caption}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
}
