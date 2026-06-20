"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import AnimeCard from "@/components/AnimeCard";
import GameCard from "@/components/GameCard";
import MovieCard from "@/components/MovieCard";
import FilterPanel from "@/components/FilterPanel";
import { useMode } from "@/context/ModeContext";

interface Tag {
  id: string;
  name: string;
  type: string;
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
  playedWith?: { id: string; email: string } | null;
}

type SortField = "updatedAt" | "title" | "createdAt";
type BulkActionPayload = string | string[];

export default function LibraryPage() {
  const { mode } = useMode();
  
  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Bulk Actions states
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkTagAction, setBulkTagAction] = useState<"add_tags" | "remove_tags" >("add_tags");
  const [selectedBulkTags, setSelectedBulkTags] = useState<string[]>([]);
  
  // Filter States
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("updatedAt");
  const [loading, setLoading] = useState(true);

  // Collaborator filtering states
  const [friends, setFriends] = useState<{ id: string; userId: string; email: string }[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>("");

  // Reset filters when switching modes
  useEffect(() => {
    setSelectedGenres([]);
    setSelectedTags([]);
    setSelectedYear("");
    setSelectedStatus("");
    setSelectedFormat("");
    setSelectedCollaborator("");
    setSearch("");
    setIsBulkMode(false);
    setSelectedIds([]);
    setBulkStatus("");
    setSelectedBulkTags([]);
  }, [mode]);

  const handleBulkAction = async (action: "delete" | "status" | "add_tags" | "remove_tags", payload?: BulkActionPayload) => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Are you sure you want to delete these ${selectedIds.length} items?`)) {
      return;
    }

    try {
      const res = await fetch("/api/library/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          mode,
          action,
          payload,
        }),
      });

      if (!res.ok) throw new Error("Failed to execute bulk action");
      
      setSelectedIds([]);
      setIsBulkMode(false);
      setBulkStatus("");
      setSelectedBulkTags([]);
      fetchItems();
    } catch (error) {
      console.error(error);
      alert("Something went wrong executing bulk action.");
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(item => item.id));
    }
  };

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.following)) {
          setFriends(data.following);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedFormat) params.set("format", selectedFormat);
    if (selectedYear) params.set("year", selectedYear);
    if (sortBy) params.set("sort", sortBy);
    if (search) params.set("search", search);
    if (selectedCollaborator) params.set("collaborator", selectedCollaborator);

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
  }, [mode, selectedStatus, selectedFormat, selectedYear, sortBy, search, selectedCollaborator]);

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

  // Entrance animations for title/filters on initial mount
  useGSAP(() => {
    gsap.fromTo(".library-header", 
      { opacity: 0, y: -20 }, 
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
    );
  }, { scope: containerRef });

  // Whenever items list updates or stops loading, stagger the grid items
  useGSAP(() => {
    if (!loading && filteredItems.length > 0) {
      gsap.fromTo(".library-grid > *", 
        { opacity: 0, y: 30, scale: 0.95 }, 
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.5, 
          stagger: 0.04, 
          ease: "power2.out" 
        }
      );
    }
  }, { dependencies: [loading, filteredItems.length, mode], scope: containerRef });

  return (
    <div ref={containerRef} className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="library-header mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
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
        <div className="flex flex-wrap items-center gap-3">
          {mode === "games" && (
            <>
              <a
                href="https://www.nexusgamelauncher.com/#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-slate-950/30 hover:bg-slate-900/50 px-4 py-2.5 text-xs font-bold text-muted hover:text-foreground transition-all duration-300 shadow-sm hover:border-accent/20 hover:scale-105"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.nexusgamelauncher.com/assets/img/nexus-logo-32.png"
                  alt="Nexus"
                  className="w-4 h-4 object-contain rounded"
                />
                Nexus Launcher
              </a>
              <Link
                href="/library/import"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-slate-950/50 hover:bg-slate-900/50 px-5 py-2.5 text-sm font-bold text-foreground transition-all duration-300 shadow-md hover:border-accent/30 hover:scale-105"
              >
                📥 Import from Nexus
              </Link>
              <Link
                href="/pc-spec-report"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-slate-950/50 hover:bg-slate-900/50 px-5 py-2.5 text-sm font-bold text-foreground transition-all duration-300 shadow-md hover:border-accent/30 hover:scale-105"
              >
                🖥️ PC Spec Report
              </Link>
            </>
          )}
          <button
            onClick={() => {
              setIsBulkMode(!isBulkMode);
              setSelectedIds([]);
            }}
            className={`inline-flex items-center gap-2 rounded-xl border border-border bg-slate-950/50 hover:bg-slate-900/50 px-5 py-2.5 text-sm font-bold transition-all duration-300 shadow-md hover:scale-105 ${isBulkMode ? 'border-accent text-accent' : 'text-foreground hover:border-accent/30'}`}
          >
            {isBulkMode ? "Cancel Selection" : "Bulk Actions"}
          </button>
          <Link
            href={mode === "games" ? "/game/new" : mode === "movies" ? "/movie/new" : "/anime/new"}
            className="glow-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-105"
          >
            + Add {mode === "games" ? "Game" : mode === "movies" ? "Movie" : "Anime"} Entry
          </Link>
        </div>
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
          selectedCollaborator={selectedCollaborator}
          setSelectedCollaborator={setSelectedCollaborator}
          friends={friends}
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
        <div className="library-grid grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
                playedWith={item.playedWith}
                selectable={isBulkMode}
                selected={selectedIds.includes(item.id)}
                onSelect={handleSelect}
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
                selectable={isBulkMode}
                selected={selectedIds.includes(item.id)}
                onSelect={handleSelect}
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
                selectable={isBulkMode}
                selected={selectedIds.includes(item.id)}
                onSelect={handleSelect}
              />
            )
          ))}
        </div>
      )}

      {/* Bulk Action Panel */}
      {isBulkMode && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 px-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
          <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4 shadow-2xl border-accent/20 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {selectedIds.length} Selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-slate-850 border border-border/60 transition-all cursor-pointer"
                >
                  {selectedIds.length === filteredItems.length ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Update */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="rounded-lg border border-border/80 bg-slate-950 px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Update Status...</option>
                  {mode === "games" ? (
                    <>
                      <option value="playing">Playing</option>
                      <option value="played">Played</option>
                      <option value="backlog">Backlog</option>
                      <option value="cant_play">Can&apos;t Play</option>
                    </>
                  ) : mode === "movies" ? (
                    <>
                      <option value="watching">Watching</option>
                      <option value="completed">Watched</option>
                      <option value="dropped">Dropped</option>
                      <option value="planned">Plan to Watch</option>
                    </>
                  ) : (
                    <>
                      <option value="watching">Watching</option>
                      <option value="completed">Completed</option>
                      <option value="dropped">Dropped</option>
                      <option value="planned">Planned</option>
                    </>
                  )}
                </select>
                <button
                  disabled={!bulkStatus || selectedIds.length === 0}
                  onClick={() => handleBulkAction("status", bulkStatus)}
                  className="rounded-lg bg-accent/20 border border-accent/30 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-slate-950 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  Apply
                </button>
              </div>

              <div className="h-6 w-px bg-border/40 hidden md:block" />

              {/* Tag Action */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkTagAction}
                  onChange={(e) => setBulkTagAction(e.target.value as "add_tags" | "remove_tags")}
                  className="rounded-lg border border-border/80 bg-slate-950 px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none transition-all cursor-pointer"
                >
                  <option value="add_tags">Add Tags</option>
                  <option value="remove_tags">Remove Tags</option>
                </select>
                <select
                  multiple
                  value={selectedBulkTags}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedBulkTags(values);
                  }}
                  className="max-h-[34px] rounded-lg border border-border/80 bg-slate-950 px-3 py-1 text-xs text-foreground focus:border-accent focus:outline-none transition-all cursor-pointer overflow-y-auto"
                >
                  {tags.filter(t => t.type === (mode === "games" ? "game" : mode === "movies" ? "movie" : "anime")).map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
                <button
                  disabled={selectedBulkTags.length === 0 || selectedIds.length === 0}
                  onClick={() => handleBulkAction(bulkTagAction, selectedBulkTags)}
                  className="rounded-lg bg-accent/20 border border-accent/30 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-slate-950 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  Apply
                </button>
              </div>

              <div className="h-6 w-px bg-border/40 hidden md:block" />

              {/* Delete */}
              <button
                disabled={selectedIds.length === 0}
                onClick={() => handleBulkAction("delete")}
                className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
