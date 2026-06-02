"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface JikanAnimeFull {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  score: number | null;
  type: string;
  episodes: number | null;
  year: number | null;
  status: string;
  images: {
    jpg: {
      large_image_url: string;
    };
  };
  genres?: { name: string }[];
}

interface DBTag {
  id: string;
  name: string;
  color: string;
}

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const animeId = Number(id);

  const [anime, setAnime] = useState<JikanAnimeFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [currentServer, setCurrentServer] = useState(1);
  const [watchlistStatus, setWatchlistStatus] = useState("watching");
  const [dbTags, setDbTags] = useState<DBTag[]>([]);
  const [savingToWatchlist, setSavingToWatchlist] = useState(false);

  const fetchAnimeDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/full`);
      if (!res.ok) throw new Error("Could not retrieve anime information from MAL.");
      const result = await res.json();
      if (!result.data) throw new Error("Anime not found.");
      setAnime(result.data);
    } catch (e: unknown) {
      console.error(e);
      const errMsg = e instanceof Error ? e.message : "Failed loading data.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [animeId]);

  // Fetch db tags so we can check if category/status tags exist
  const fetchDbTags = async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setDbTags(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (animeId) {
      fetchAnimeDetails();
      fetchDbTags();
    }
  }, [animeId, fetchAnimeDetails]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
          <p className="mt-4 text-sm font-semibold text-muted">Loading Player...</p>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <span className="text-5xl">⚠️</span>
        <h2 className="mt-4 text-xl font-bold text-rose-400">Error Loading Player</h2>
        <p className="mt-2 text-sm text-muted">{error || "Anime could not be found."}</p>
        <Link href="/discover" className="mt-6 inline-block text-accent underline text-sm font-bold">
          Back to Discover
        </Link>
      </div>
    );
  }

  const isMovie = anime.type === "Movie";
  const totalEpisodes = anime.episodes || 1;

  // Determine standard embed URLs based on server index and current episode
  let embedUrl = "";
  if (isMovie) {
    if (currentServer === 1) {
      embedUrl = `https://dropfile.cc/player/movie/mal-${animeId}/1?audio=sub&lang=en`;
    } else if (currentServer === 2) {
      embedUrl = `https://vidsrc.me/embed/anime?mal=${animeId}`;
    } else {
      embedUrl = `https://embed.su/embed/anime/${animeId}/1`;
    }
  } else {
    if (currentServer === 1) {
      embedUrl = `https://dropfile.cc/player/tv/mal-${animeId}/${currentEpisode}/1?audio=sub&lang=en`;
    } else if (currentServer === 2) {
      embedUrl = `https://vidsrc.me/embed/anime?mal=${animeId}&episode=${currentEpisode}`;
    } else {
      embedUrl = `https://embed.su/embed/anime/${animeId}/${currentEpisode}`;
    }
  }

  const saveToDatabase = async () => {
    setSavingToWatchlist(true);
    try {
      // Find or create tags corresponding to watchlist status and genres
      const genresToSync = anime.genres ? anime.genres.map((g) => g.name) : [];
      const tagsToMatch = [watchlistStatus, ...genresToSync];

      const tagIds: string[] = [];

      for (const name of tagsToMatch) {
        const found = dbTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (found) {
          tagIds.push(found.id);
        } else {
          // Create the tag on the fly
          const color = name === "watching" ? "#10b981" : name === "completed" ? "#06b6d4" : name === "planned" ? "#f59e0b" : "#8b5cf6";
          const res = await fetch("/api/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color }),
          });
          if (res.ok) {
            const newTag = await res.json();
            tagIds.push(newTag.id);
          }
        }
      }

      // Save the anime card details into the SQLite database
      const res = await fetch("/api/animes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: anime.title_english || anime.title,
          description: anime.synopsis,
          coverImage: anime.images.jpg.large_image_url,
          status: watchlistStatus,
          tagIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`"${data.title}" successfully added to your SQLite database under status: ${watchlistStatus}!`);
        router.push("/");
      } else {
        alert("Failed to add anime to library. Maybe it already exists?");
      }
    } catch (err) {
      console.error(err);
      alert("Error linking database watchlist entries.");
    } finally {
      setSavingToWatchlist(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Grid wrapper */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Player, Meta Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Iframe Theater Container */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-none"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>

          {/* Player controls bar */}
          <div className="glass-panel flex flex-col justify-between gap-4 rounded-xl p-4 sm:flex-row sm:items-center shadow-lg">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted mr-2">Servers:</span>
              {[1, 2, 3].map((serverNum) => (
                <button
                  key={serverNum}
                  onClick={() => setCurrentServer(serverNum)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                    currentServer === serverNum
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-slate-900/50 border-border/60 text-muted hover:text-foreground"
                  }`}
                >
                  Server {serverNum}
                </button>
              ))}
            </div>

            {!isMovie && (
              <div className="flex gap-2">
                <button
                  disabled={currentEpisode === 1}
                  onClick={() => setCurrentEpisode((prev) => Math.max(1, prev - 1))}
                  className="rounded-lg bg-slate-900 border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-accent disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  ← Prev Episode
                </button>
                <button
                  disabled={currentEpisode === totalEpisodes}
                  onClick={() => setCurrentEpisode((prev) => Math.min(totalEpisodes, prev + 1))}
                  className="rounded-lg bg-slate-900 border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-accent disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  Next Episode →
                </button>
              </div>
            )}
          </div>

          {/* Details segment */}
          <div className="glass-panel grid grid-cols-1 gap-6 rounded-2xl p-6 md:grid-cols-4 shadow-xl">
            <div className="md:col-span-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={anime.images.jpg.large_image_url}
                alt={anime.title}
                className="w-full rounded-xl border border-border object-cover"
              />
            </div>
            <div className="md:col-span-3 space-y-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {anime.title_english || anime.title}
                </h1>
                <p className="mt-1 text-xs font-bold text-accent">
                  {anime.genres ? anime.genres.map((g) => g.name).join(", ") : "Anime"}
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: "Score", value: anime.score ? `⭐ ${anime.score}` : "N/A" },
                  { label: "Episodes", value: anime.episodes || "Unknown" },
                  { label: "Year", value: anime.year || "N/A" },
                  { label: "Type", value: anime.type },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-slate-900/80 border border-border px-3 py-1.5 text-xs">
                    <span className="text-muted mr-1">{stat.label}:</span>
                    <strong className="text-foreground">{stat.value}</strong>
                  </div>
                ))}
              </div>

              <p className="text-xs leading-relaxed text-muted">{anime.synopsis || "No description available."}</p>

              {/* Watchlist interactive syncing */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/30">
                <select
                  value={watchlistStatus}
                  onChange={(e) => setWatchlistStatus(e.target.value)}
                  className="rounded-xl border border-border bg-slate-950/80 px-4 py-2.5 text-xs font-bold text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="planned">Plan to Watch</option>
                  <option value="dropped">Dropped</option>
                </select>
                <button
                  onClick={saveToDatabase}
                  disabled={savingToWatchlist}
                  className="glow-btn rounded-xl px-5 py-2.5 text-xs font-bold uppercase transition-all duration-300 disabled:opacity-50"
                >
                  {savingToWatchlist ? "Syncing..." : "Add to Library Watchlist"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Episodes selector panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel flex flex-col rounded-2xl p-6 shadow-xl h-[600px] border border-border/60">
            <h3 className="text-lg font-extrabold text-foreground border-b border-border/30 pb-3 mb-4 flex items-center gap-2">
              <span>🎬</span> {isMovie ? "Movie Player" : "Episodes Selector"}
            </h3>

            <div className="flex-1 overflow-y-auto pr-1">
              {isMovie ? (
                <button className="glow-btn w-full rounded-xl py-3 text-sm font-bold">
                  Play Movie
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: totalEpisodes }).map((_, idx) => {
                    const epNum = idx + 1;
                    const isActive = epNum === currentEpisode;
                    return (
                      <button
                        key={epNum}
                        onClick={() => setCurrentEpisode(epNum)}
                        className={`rounded-lg py-2.5 text-xs font-bold border transition-all ${
                          isActive
                            ? "bg-accent border-accent text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                            : "bg-slate-900/50 border-border/60 text-muted hover:border-accent/40 hover:text-foreground"
                        }`}
                      >
                        {epNum}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
