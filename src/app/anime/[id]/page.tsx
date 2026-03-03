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

interface Episode {
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

interface Anime {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  episodes: Episode[];
}

const statusLabels: Record<string, string> = {
  watching: "Watching",
  completed: "Completed",
  dropped: "Dropped",
  planned: "Planned",
};

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [epNumber, setEpNumber] = useState(1);
  const [epTitle, setEpTitle] = useState("");
  const [epStory, setEpStory] = useState("");
  const [savingEp, setSavingEp] = useState(false);

  const fetchAnime = async () => {
    const res = await fetch(`/api/animes/${params.id}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setAnime(data);
    setEpNumber((data.episodes?.length || 0) + 1);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleDeleteAnime = async () => {
    if (!confirm("Delete this anime and all its episodes?")) return;
    await fetch(`/api/animes/${params.id}`, { method: "DELETE" });
    router.push("/");
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epTitle.trim() || !epStory.trim()) return;

    setSavingEp(true);
    await fetch(`/api/animes/${params.id}/episodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: epNumber,
        title: epTitle.trim(),
        story: epStory.trim(),
      }),
    });

    setEpTitle("");
    setEpStory("");
    setShowEpisodeForm(false);
    setSavingEp(false);
    fetchAnime();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  if (!anime) return null;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-muted hover:text-foreground"
      >
        &larr; Back to Index
      </Link>

      {/* Anime Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row">
        {/* Cover */}
        <div className="w-full shrink-0 overflow-hidden rounded-xl md:w-48">
          {anime.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={anime.coverImage}
              alt={anime.title}
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
            <h1 className="text-3xl font-bold text-foreground">{anime.title}</h1>
            <div className="flex gap-2">
              <Link
                href={`/anime/${anime.id}/edit`}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background"
              >
                Edit
              </Link>
              <button
                onClick={handleDeleteAnime}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {statusLabels[anime.status] || anime.status}
          </span>

          {anime.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {anime.description}
            </p>
          )}

          {anime.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {anime.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-muted">
            {anime.episodes.length} episode
            {anime.episodes.length !== 1 ? "s" : ""} &middot; Added{" "}
            {new Date(anime.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Episodes</h2>
        <button
          onClick={() => setShowEpisodeForm(!showEpisodeForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
        >
          {showEpisodeForm ? "Cancel" : "+ Add Episode"}
        </button>
      </div>

      {/* New Episode Form */}
      {showEpisodeForm && (
        <form
          onSubmit={handleAddEpisode}
          className="mb-6 space-y-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex gap-3">
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Episode #
              </label>
              <input
                type="number"
                value={epNumber}
                onChange={(e) => setEpNumber(Number(e.target.value))}
                min={1}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Title
              </label>
              <input
                type="text"
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
                placeholder="Episode title"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Story
            </label>
            <textarea
              value={epStory}
              onChange={(e) => setEpStory(e.target.value)}
              required
              rows={8}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
              placeholder="Write the episode story here..."
            />
          </div>
          <button
            type="submit"
            disabled={savingEp}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-50"
          >
            {savingEp ? "Saving..." : "Save Episode"}
          </button>
        </form>
      )}

      {/* Episode List */}
      {anime.episodes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No episodes yet. Add your first episode above.
        </p>
      ) : (
        <div className="space-y-3">
          {anime.episodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/anime/${anime.id}/episode/${ep.id}`}
              className="block rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm hover:border-accent/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-accent">
                    EP {ep.number}
                  </span>
                  <h3 className="text-sm font-medium text-foreground">
                    {ep.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  {ep.media.length > 0 && (
                    <span>
                      {ep.media.filter((m) => m.type === "image").length} img
                      {ep.media.filter((m) => m.type === "clip").length > 0 &&
                        `, ${
                          ep.media.filter((m) => m.type === "clip").length
                        } clip`}
                    </span>
                  )}
                  <span>&rarr;</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted line-clamp-2">{ep.story}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
