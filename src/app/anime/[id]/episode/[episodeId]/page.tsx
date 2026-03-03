"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MediaGallery from "@/components/MediaGallery";
import MediaUpload from "@/components/MediaUpload";

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
  anime: { id: string; title: string };
}

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStory, setEditStory] = useState("");
  const [editNumber, setEditNumber] = useState(1);

  const fetchEpisode = async () => {
    const res = await fetch(`/api/episodes/${params.episodeId}`);
    if (!res.ok) {
      router.push(`/anime/${params.id}`);
      return;
    }
    const data = await res.json();
    setEpisode(data);
    setEditTitle(data.title);
    setEditStory(data.story);
    setEditNumber(data.number);
    setLoading(false);
  };

  useEffect(() => {
    fetchEpisode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.episodeId]);

  const handleSave = async () => {
    await fetch(`/api/episodes/${params.episodeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: editNumber,
        title: editTitle.trim(),
        story: editStory.trim(),
      }),
    });
    setEditing(false);
    fetchEpisode();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this episode?")) return;
    await fetch(`/api/episodes/${params.episodeId}`, { method: "DELETE" });
    router.push(`/anime/${params.id}`);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
    fetchEpisode();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  if (!episode) return null;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <Link
        href={`/anime/${params.id}`}
        className="mb-6 inline-flex items-center text-sm text-muted hover:text-foreground"
      >
        &larr; Back to {episode.anime.title}
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <span className="text-sm font-semibold text-accent">
            Episode {episode.number}
          </span>
          {editing ? (
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                value={editNumber}
                onChange={(e) => setEditNumber(Number(e.target.value))}
                className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                min={1}
              />
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1 text-lg font-bold text-foreground"
              />
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-foreground">
              {episode.title}
            </h1>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-light"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Story */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Story
        </h2>
        {editing ? (
          <textarea
            value={editStory}
            onChange={(e) => setEditStory(e.target.value)}
            rows={15}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground"
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {episode.story}
          </div>
        )}
      </div>

      {/* Media Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Media ({episode.media.length})
        </h2>

        <MediaGallery
          media={episode.media}
          onDelete={handleDeleteMedia}
        />

        <MediaUpload episodeId={episode.id} onUploaded={fetchEpisode} />
      </div>
    </div>
  );
}
