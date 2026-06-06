"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import AnimeCard from "@/components/AnimeCard";
import GameCard from "@/components/GameCard";
import MovieCard from "@/components/MovieCard";
import FilterPanel from "@/components/FilterPanel";
import { useMode } from "@/context/ModeContext";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { animes: number; games?: number };
}

interface Item {
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

type SortField = "updatedAt" | "title" | "createdAt";

export default function Home() {
  const { mode } = useMode();
  
  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Filter States
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("updatedAt");
  const [loading, setLoading] = useState(true);

  // Reset filters when switching modes
  useEffect(() => {
    setSelectedGenres([]);
    setSelectedTags([]);
    setSelectedYear("");
    setSelectedStatus("");
    setSelectedFormat("");
    setSearch("");
  }, [mode]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedFormat) params.set("format", selectedFormat);
    if (selectedYear) params.set("year", selectedYear);
    if (sortBy) params.set("sort", sortBy);
    if (search) params.set("search", search);

    try {
      const endpoint = mode === "games" ? "/api/games" : mode === "movies" ? "/api/movies" : "/api/animes";
      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error("API returned non-array: ", data);
        setItems([]);
      }
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedStatus, selectedFormat, selectedYear, sortBy, search]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data)) {
            setTags(data);
          } else {
            setTags([]);
          }
        }
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setTags([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // Compute available filters from ALL fetched items to make them dynamic and clean
  const { availableGenres, availableYears, availableFormats } = useMemo(() => {
    const genresSet = new Set<string>();
    const yearsSet = new Set<number>();
    const formatsSet = new Set<string>();

    items.forEach((item) => {
      if (item.genres) {
        item.genres.split(",").forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) genresSet.add(trimmed);
        });
      }
      if (item.year) {
        yearsSet.add(item.year);
      }
      if (item.format) {
        formatsSet.add(item.format);
      }
    });

    return {
      availableGenres: Array.from(genresSet).sort(),
      availableYears: Array.from(yearsSet).sort((a, b) => b - a),
      availableFormats: Array.from(formatsSet).sort(),
    };
  }, [items]);

  // Client-side filtering for multi-select (genres and tags) to ensure perfect matching
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tags matching
      if (selectedTags.length > 0) {
        const matchesAllTags = selectedTags.every((t) =>
          item.tags.some((tag) => tag.name === t)
        );
        if (!matchesAllTags) return false;
      }

      // Genres matching
      if (selectedGenres.length > 0) {
        if (!item.genres) return false;
        const itemGenresList = item.genres.split(",").map((g) => g.trim().toLowerCase());
        const matchesAllGenres = selectedGenres.every((g) =>
          itemGenresList.includes(g.toLowerCase())
        );
        if (!matchesAllGenres) return false;
      }

      return true;
    });
  }, [items, selectedTags, selectedGenres]);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent sm:text-4xl">
            {mode === "games" ? "Game Index" : mode === "movies" ? "Movie Index" : "Anime Index"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "games" 
              ? "Manage and reflect on your gaming journal, chapter-by-chapter story progression, and platform stats." 
              : mode === "movies"
              ? "Manage and reflect on your movie journal, part-by-part story breakdown, and watched stats."
              : "Manage and reflect on your curated personal story journal, episode breakdowns, and seasonal stats."}
          </p>
        </div>
        <Link
          href={mode === "games" ? "/game/new" : mode === "movies" ? "/movie/new" : "/anime/new"}
          className="glow-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-105"
        >
          + Add {mode === "games" ? "Game" : mode === "movies" ? "Movie" : "Anime"} Entry
        </Link>
      </div>

      {/* Search and Sort Row */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder={mode === "games" ? "Search gaming catalog..." : mode === "movies" ? "Search movie library..." : "Search anime library..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-slate-950/50 py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300 cursor-pointer"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Recently Added</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="mb-8">
        <FilterPanel
          mode={mode}
          tags={tags}
          availableGenres={availableGenres}
          availableYears={availableYears}
          availableFormats={availableFormats}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
        />
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-32 text-center text-muted">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm font-semibold tracking-wide text-muted">Scanning Library...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center shadow-lg border border-border/50">
          <span className="text-5xl">{mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "🎌"}</span>
          <p className="mt-4 text-lg font-bold text-muted">No {mode === "games" ? "game" : mode === "movies" ? "movie" : "anime"} entries match your filters</p>
          <Link
            href={mode === "games" ? "/game/new" : mode === "movies" ? "/movie/new" : "/anime/new"}
            className="mt-4 inline-block text-sm font-bold text-accent hover:text-accent-light underline transition-colors"
          >
            Create a new entry
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredItems.map((item) => (
            mode === "games" ? (
              <GameCard 
                key={item.id} 
                id={item.id}
                title={item.title}
                description={item.description}
                coverImage={item.coverImage}
                status={item.status}
                tags={item.tags}
                _count={{ chapters: item._count.chapters || 0 }}
              />
            ) : mode === "movies" ? (
              <MovieCard 
                key={item.id} 
                id={item.id}
                title={item.title}
                description={item.description}
                coverImage={item.coverImage}
                status={item.status}
                tags={item.tags}
                _count={{ parts: item._count.parts || 0 }}
              />
            ) : (
              <AnimeCard 
                key={item.id} 
                id={item.id}
                title={item.title}
                description={item.description}
                coverImage={item.coverImage}
                status={item.status}
                tags={item.tags}
                _count={{ episodes: item._count.episodes || 0 }}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}
