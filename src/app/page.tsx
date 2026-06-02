"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AnimeCard from "@/components/AnimeCard";
import TagBadge from "@/components/TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { animes: number };
}

interface Anime {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  tags: { id: string; name: string; color: string }[];
  _count: { episodes: number };
}

type SortField = "updatedAt" | "title" | "createdAt";
type StatusFilter = "" | "watching" | "completed" | "dropped" | "planned";

export default function Home() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [sortBy, setSortBy] = useState<SortField>("updatedAt");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAnimes = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedTag) params.set("tag", selectedTag);
    if (statusFilter) params.set("status", statusFilter);
    if (sortBy) params.set("sort", sortBy);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/animes?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnimes(data);
      } else {
        console.error("API returned non-array: ", data);
        setAnimes([]);
      }
    } catch (error) {
      console.error(error);
      setAnimes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTag, statusFilter, sortBy, search]);

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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchAnimes(), 300);
    return () => clearTimeout(timer);
  }, [fetchAnimes]);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent sm:text-4xl">
            Anime Index
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage and reflect on your curated personal story journal
          </p>
        </div>
        <Link
          href="/anime/new"
          className="glow-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-105"
        >
          + Add Anime Entry
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-panel mb-8 space-y-4 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300 cursor-pointer"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="createdAt">Recently Added</option>
              <option value="title">Title (A-Z)</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="planned">Planned</option>
            </select>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
            <TagBadge
              name="All"
              color="#00e5ff"
              active={selectedTag === ""}
              onClick={() => setSelectedTag("")}
            />
            {tags.map((tag) => (
              <TagBadge
                key={tag.id}
                name={`${tag.name} (${tag._count.animes})`}
                color={tag.color}
                active={selectedTag === tag.name}
                onClick={() =>
                  setSelectedTag(selectedTag === tag.name ? "" : tag.name)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Anime Grid */}
      {loading ? (
        <div className="py-32 text-center text-muted">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm font-semibold tracking-wide text-muted">Scanning Database...</p>
        </div>
      ) : animes.length === 0 ? (
        <div className="glass-panel rounded-2xl py-20 text-center shadow-lg border border-border/50">
          <span className="text-5xl">🎌</span>
          <p className="mt-4 text-lg font-bold text-muted">No anime entries cataloged yet</p>
          <Link
            href="/anime/new"
            className="mt-4 inline-block text-sm font-bold text-accent hover:text-accent-light underline transition-colors"
          >
            Create your first entry
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {animes.map((anime) => (
            <AnimeCard key={anime.id} {...anime} />
          ))}
        </div>
      )}
    </div>
  );
}
