"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  score: number | null;
  type: string;
  images: {
    jpg: {
      large_image_url: string;
    };
  };
  genres?: { name: string }[];
}

export default function DiscoverPage() {
  const [animes, setAnimes] = useState<JikanAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"top" | "seasonal" | "movies" | "search">("top");
  const [searchVal, setSearchVal] = useState("");
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  const fetchAnimeList = useCallback(async (url: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("API Limit reached or network error.");
      const result = await res.json();
      const list: JikanAnime[] = result.data || [];
      setAnimes(list);

      // Extract unique genres
      const genreSet = new Set<string>();
      list.forEach((anime) => {
        anime.genres?.forEach((g) => genreSet.add(g.name));
      });
      setAvailableGenres(Array.from(genreSet).sort().slice(0, 10));
      setActiveGenres([]); // Reset active filters on tab/query change
    } catch (e) {
      console.error(e);
      setError("Failed to fetch anime from MAL. Please wait and refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "top") {
      fetchAnimeList("https://api.jikan.moe/v4/top/anime");
    } else if (activeTab === "seasonal") {
      fetchAnimeList("https://api.jikan.moe/v4/seasons/now");
    } else if (activeTab === "movies") {
      fetchAnimeList("https://api.jikan.moe/v4/anime?type=movie");
    }
  }, [activeTab, fetchAnimeList]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    setActiveTab("search");
    fetchAnimeList(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchVal.trim())}`);
  };

  const toggleGenre = (genre: string) => {
    setActiveGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Filter animes locally based on selected genres
  const filteredAnimes = animes.filter((anime) =>
    activeGenres.every((genre) => anime.genres?.some((g) => g.name === genre))
  );

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20">
          Global database
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Discover Anime
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Browse through live ratings, current seasonal rollouts, or search directly from the global MyAnimeList encyclopedia.
        </p>
      </div>

      {/* Control Panel: Tabs and Search */}
      <div className="glass-panel mb-8 flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center md:justify-between shadow-xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "top", label: "★ Top Rated" },
            { id: "seasonal", label: "🌸 Seasonal" },
            { id: "movies", label: "🎬 Movies" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "top" | "seasonal" | "movies")}
              className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all border ${
                activeTab === tab.id
                  ? "bg-accent text-slate-950 border-accent shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                  : "bg-slate-900/50 text-muted border-border/60 hover:text-foreground hover:bg-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex max-w-md flex-1">
          <input
            type="text"
            placeholder="Search global database..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-slate-950/50 py-2.5 pl-4 pr-10 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-accent/15 px-3 py-1 text-xs font-bold text-accent border border-accent/20 hover:bg-accent hover:text-slate-950 transition-all"
          >
            Go
          </button>
        </form>
      </div>

      {/* Genre Tags Filters */}
      {availableGenres.length > 0 && (
        <div className="glass-panel mb-8 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Filter by Genre</h3>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map((genre) => {
              const isActive = activeGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                    isActive
                      ? "bg-accent/25 border-accent text-accent shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                      : "bg-slate-900/40 border-border/40 text-muted hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden rounded-xl animate-pulse">
              <div className="aspect-[3/4] w-full bg-slate-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded bg-slate-800 w-3/4" />
                <div className="h-3 rounded bg-slate-800 w-1/2" />
                <div className="h-8 rounded bg-slate-850 w-full pt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel rounded-2xl py-24 text-center border-rose-500/20">
          <span className="text-5xl">⚠️</span>
          <p className="mt-4 text-base font-bold text-rose-400">{error}</p>
        </div>
      ) : filteredAnimes.length === 0 ? (
        <div className="glass-panel rounded-2xl py-24 text-center">
          <span className="text-5xl">🔍</span>
          <p className="mt-4 text-base font-bold text-muted">No anime matches those filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredAnimes.map((anime) => {
            const title = anime.title_english || anime.title;
            const genresStr = anime.genres ? anime.genres.map((g) => g.name).join(", ") : "Anime";

            return (
              <div key={anime.mal_id} className="glass-card group overflow-hidden rounded-xl flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-accent/10 to-accent-light/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={anime.images.jpg.large_image_url}
                      alt={title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute right-2 top-2 rounded-lg bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 backdrop-blur-md">
                      ⭐ {anime.score || "N/A"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-1 group-hover:text-accent transition-colors duration-300">
                      {title}
                    </h3>
                    <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{genresStr}</p>
                    <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">{anime.synopsis || "No description available."}</p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    href={`/watch/${anime.mal_id}`}
                    className="glow-btn block w-full rounded-xl py-2 text-center text-xs font-extrabold uppercase tracking-wider"
                  >
                    Watch Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
