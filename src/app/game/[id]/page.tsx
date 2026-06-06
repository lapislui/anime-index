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

interface Chapter {
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

interface Game {
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
  chapters: Chapter[];
}

const statusLabels: Record<string, { label: string; className: string }> = {
  playing: { label: "Playing", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  played: { label: "Played", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  backlog: { label: "Backlog", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  cant_play: { label: "Can't Play", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
  planning: { label: "Planning", className: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
  installed: { label: "Installed", className: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
  completed: { label: "Completed", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  dropped: { label: "Dropped", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
};

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapNumber, setChapNumber] = useState(1);
  const [chapTitle, setChapTitle] = useState("");
  const [chapStory, setChapStory] = useState("");
  const [savingChap, setSavingChap] = useState(false);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/games/${params.id}`);
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setGame(data);
      setChapNumber((data.chapters?.length || 0) + 1);
      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push("/");
    }
  };

  useEffect(() => {
    fetchGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleDeleteGame = async () => {
    if (!confirm("Delete this game and all its chapters?")) return;
    await fetch(`/api/games/${params.id}`, { method: "DELETE" });
    router.push("/");
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapTitle.trim() || !chapStory.trim()) return;

    setSavingChap(true);
    try {
      await fetch(`/api/games/${params.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: chapNumber,
          title: chapTitle.trim(),
          story: chapStory.trim(),
        }),
      });

      setChapTitle("");
      setChapStory("");
      setShowChapterForm(false);
      setSavingChap(false);
      fetchGame();
    } catch (err) {
      console.error(err);
      alert("Failed to save chapter.");
      setSavingChap(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading Game Profile...
      </div>
    );
  }

  if (!game) return null;
  const statusInfo = statusLabels[game.status] || statusLabels.playing;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-muted hover:text-foreground"
      >
        &larr; Back to Library
      </Link>

      {/* Game Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row border-b border-border/20 pb-8">
        {/* Cover */}
        <div className="w-full shrink-0 overflow-hidden rounded-xl md:w-48">
          {game.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.coverImage}
              alt={game.title}
              className="aspect-[3/4] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-light/20 text-5xl text-accent/40">
              🎮
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-foreground">{game.title}</h1>
            <div className="flex gap-2">
              <Link
                href={`/game/${game.id}/edit`}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-white/5 transition-all"
              >
                Edit
              </Link>
              <button
                onClick={handleDeleteGame}
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
            {game.format && (
              <span className="rounded-full bg-slate-900 border border-border/80 px-3 py-1 text-xs text-muted">
                Platform: {game.format}
              </span>
            )}
            {game.year && (
              <span className="rounded-full bg-slate-900 border border-border/80 px-3 py-1 text-xs text-muted">
                Year: {game.year}
              </span>
            )}
          </div>

          {game.genres && (
            <p className="mt-3 text-xs text-accent">
              <strong>Genres:</strong> {game.genres}
            </p>
          )}

          {game.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {game.description}
            </p>
          )}

          {game.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {game.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}

          <p className="mt-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
            {game.chapters.length} chapter log{game.chapters.length !== 1 ? "s" : ""} &middot; Added{" "}
            {new Date(game.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Chapters Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Gaming Journal logs</h2>
        <button
          onClick={() => setShowChapterForm(!showChapterForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:scale-[1.02]"
        >
          {showChapterForm ? "Cancel" : "+ Add Journal Entry"}
        </button>
      </div>

      {/* New Chapter Form */}
      {showChapterForm && (
        <form
          onSubmit={handleAddChapter}
          className="mb-6 space-y-4 rounded-xl border border-border bg-slate-950/40 p-4"
        >
          <div className="flex gap-3">
            <div className="w-24">
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Chapter #
              </label>
              <input
                type="number"
                value={chapNumber}
                onChange={(e) => setChapNumber(Number(e.target.value))}
                min={1}
                className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Chapter Title
              </label>
              <input
                type="text"
                value={chapTitle}
                onChange={(e) => setChapTitle(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                placeholder="e.g. Defeating Margit / First Hours in Limgrave"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Journal / Story Breakdown
            </label>
            <textarea
              value={chapStory}
              onChange={(e) => setChapStory(e.target.value)}
              required
              rows={8}
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              placeholder="Write your walkthrough thoughts, boss strategies, story reactions, etc..."
            />
          </div>
          <button
            type="submit"
            disabled={savingChap}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50"
          >
            {savingChap ? "Saving..." : "Save Journal Entry"}
          </button>
        </form>
      )}

      {/* Chapters Feed */}
      {game.chapters.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No journal logs captured yet. Write your first game session report above!
        </p>
      ) : (
        <div className="space-y-4">
          {game.chapters.map((chap) => (
            <Link
              key={chap.id}
              href={`/game/${game.id}/chapter/${chap.id}`}
              className="block rounded-xl border border-border bg-slate-950/20 p-5 hover:border-accent/30 transition-all hover:bg-slate-950/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    CHAP {chap.number}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {chap.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  {chap.media?.length > 0 && (
                    <span>
                      {chap.media.filter((m) => m.type === "image").length} img
                      {chap.media.filter((m) => m.type === "clip").length > 0 &&
                        `, ${
                          chap.media.filter((m) => m.type === "clip").length
                        } clip`}
                    </span>
                  )}
                  <span>&rarr;</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">{chap.story}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
