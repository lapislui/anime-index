"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TagBadge from "@/components/TagBadge";

interface Media {
  id: string;
  url: string;
  type: string;
  caption: string | null;
}

interface MoviePart {
  id: string;
  number: number;
  title: string;
  story: string;
  media: Media[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Movie {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  year: number | null;
  format: string | null;
  genres: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  parts: MoviePart[];
}

const statusLabels: Record<string, { label: string; className: string }> = {
  watching: { label: "Watching", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  completed: { label: "Watched", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  dropped: { label: "Dropped", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
  planned: { label: "Plan to Watch", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
};

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPartForm, setShowPartForm] = useState(false);
  const [partNumber, setPartNumber] = useState(1);
  const [partTitle, setPartTitle] = useState("");
  const [partStory, setPartStory] = useState("");
  const [savingPart, setSavingPart] = useState(false);

  const fetchMovie = async () => {
    try {
      const res = await fetch(`/api/movies/${params.id}`);
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setMovie(data);
      setPartNumber((data.parts?.length || 0) + 1);
      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push("/");
    }
  };

  useEffect(() => {
    fetchMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleDeleteMovie = async () => {
    if (!confirm("Delete this movie and all its logged parts?")) return;
    await fetch(`/api/movies/${params.id}`, { method: "DELETE" });
    router.push("/");
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partTitle.trim() || !partStory.trim()) return;

    setSavingPart(true);
    try {
      await fetch(`/api/movies/${params.id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: partNumber,
          title: partTitle.trim(),
          story: partStory.trim(),
        }),
      });

      setPartTitle("");
      setPartStory("");
      setShowPartForm(false);
      setSavingPart(false);
      fetchMovie();
    } catch (err) {
      console.error(err);
      alert("Failed to save movie part.");
      setSavingPart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading Movie Profile...
      </div>
    );
  }

  if (!movie) return null;
  const statusInfo = statusLabels[movie.status] || statusLabels.watching;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-muted hover:text-foreground"
      >
        &larr; Back to Library
      </Link>

      {/* Movie Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row border-b border-border/20 pb-8">
        {/* Cover */}
        <div className="w-full shrink-0 overflow-hidden rounded-xl md:w-48">
          {movie.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.coverImage}
              alt={movie.title}
              className="aspect-[3/4] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-light/20 text-5xl text-accent/40">
              🎬
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-foreground">{movie.title}</h1>
            <div className="flex gap-2">
              <Link
                href={`/movie/${movie.id}/edit`}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-white/5 transition-all"
              >
                Edit
              </Link>
              <button
                onClick={handleDeleteMovie}
                className="rounded-md border border-red-500/20 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/5 transition-all"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
            {movie.format && (
              <span className="rounded-full bg-slate-900 border border-border/80 px-3 py-1 text-xs text-muted">
                Format: {movie.format}
              </span>
            )}
            {movie.year && (
              <span className="rounded-full bg-slate-900 border border-border/80 px-3 py-1 text-xs text-muted">
                Year: {movie.year}
              </span>
            )}
          </div>

          {movie.genres && (
            <p className="mt-3 text-xs text-accent">
              <strong>Genres:</strong> {movie.genres}
            </p>
          )}

          {movie.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {movie.description}
            </p>
          )}

          {movie.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {movie.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}

          <p className="mt-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
            {movie.parts.length} part log{movie.parts.length !== 1 ? "s" : ""} &middot; Added{" "}
            {new Date(movie.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Parts Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Movie Breakdown Logs</h2>
        <button
          onClick={() => setShowPartForm(!showPartForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:scale-[1.02]"
        >
          {showPartForm ? "Cancel" : "+ Add Part Breakdown"}
        </button>
      </div>

      {/* New Part Form */}
      {showPartForm && (
        <form
          onSubmit={handleAddPart}
          className="mb-6 space-y-4 rounded-xl border border-border bg-slate-950/40 p-4"
        >
          <div className="flex gap-3">
            <div className="w-24">
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Part #
              </label>
              <input
                type="number"
                value={partNumber}
                onChange={(e) => setPartNumber(Number(e.target.value))}
                min={1}
                className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Part / Scene Title
              </label>
              <input
                type="text"
                value={partTitle}
                onChange={(e) => setPartTitle(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                placeholder="e.g. Introduction / Climax Scene / The Twists"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Story Breakdown & Reflections
            </label>
            <textarea
              value={partStory}
              onChange={(e) => setPartStory(e.target.value)}
              required
              rows={8}
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              placeholder="Write your story breakdowns, scene visual analysis, soundtrack reactions, etc..."
            />
          </div>
          <button
            type="submit"
            disabled={savingPart}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50"
          >
            {savingPart ? "Saving..." : "Save Part Breakdown"}
          </button>
        </form>
      )}

      {/* Parts Feed */}
      {movie.parts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No story breakdown logs captured yet. Write your first part reaction report above!
        </p>
      ) : (
        <div className="space-y-4">
          {movie.parts.map((part) => (
            <Link
              key={part.id}
              href={`/movie/${movie.id}/part/${part.id}`}
              className="block rounded-xl border border-border bg-slate-950/20 p-5 hover:border-accent/30 transition-all hover:bg-slate-950/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    PART {part.number}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {part.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  {part.media?.length > 0 && (
                    <span>
                      {part.media.filter((m) => m.type === "image").length} img
                      {part.media.filter((m) => m.type === "clip").length > 0 &&
                        `, ${
                          part.media.filter((m) => m.type === "clip").length
                        } clip`}
                    </span>
                  )}
                  <span>&rarr;</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">{part.story}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
