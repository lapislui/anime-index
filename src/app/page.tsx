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

    const res = await fetch(`/api/animes?${params}`);
    const data = await res.json();
    setAnimes(data);
    setLoading(false);
  }, [selectedTag, statusFilter, sortBy, search]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTags(data);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchAnimes(), 300);
    return () => clearTimeout(timer);
  }, [fetchAnimes]);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Anime Index</h1>
          <p className="mt-1 text-sm text-muted">
            Your personal anime story collection
          </p>
        </div>
        <Link
          href="/anime/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
        >
          + Add Anime
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search anime..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Recently Added</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">All Status</option>
            <option value="watching">Watching</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
            <option value="planned">Planned</option>
          </select>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <TagBadge
              name="All"
              color="#6366f1"
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
        <div className="py-20 text-center text-muted">Loading...</div>
      ) : animes.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-muted">No anime found</p>
          <Link
            href="/anime/new"
            className="mt-4 inline-block text-accent hover:underline"
          >
            Add your first anime
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {animes.map((anime) => (
            <AnimeCard key={anime.id} {...anime} />
          ))}
        </div>
      )}
    </div>
  );
}
