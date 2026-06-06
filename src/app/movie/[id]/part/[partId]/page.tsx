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

interface MoviePart {
  id: string;
  number: number;
  title: string;
  story: string;
  media: Media[];
  movie: { id: string; title: string };
}

export default function MoviePartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [part, setPart] = useState<MoviePart | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStory, setEditStory] = useState("");
  const [editNumber, setEditNumber] = useState(1);

  const fetchPart = async () => {
    try {
      const res = await fetch(`/api/movieparts/${params.partId}`);
      if (!res.ok) {
        router.push(`/movie/${params.id}`);
        return;
      }
      const data = await res.json();
      setPart(data);
      setEditTitle(data.title);
      setEditStory(data.story);
      setEditNumber(data.number);
      setLoading(false);
    } catch (err) {
      console.error(err);
      router.push(`/movie/${params.id}`);
    }
  };

  useEffect(() => {
    fetchPart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.partId]);

  const handleSave = async () => {
    try {
      await fetch(`/api/movieparts/${params.partId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: editNumber,
          title: editTitle.trim(),
          story: editStory.trim(),
        }),
      });
      setEditing(false);
      fetchPart();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this movie part?")) return;
    try {
      await fetch(`/api/movieparts/${params.partId}`, { method: "DELETE" });
      router.push(`/movie/${params.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete movie part.");
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      fetchPart();
    } catch (err) {
      console.error(err);
      alert("Failed to delete media.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading Part logs...
      </div>
    );
  }

  if (!part) return null;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <Link
        href={`/movie/${params.id}`}
        className="mb-6 inline-flex items-center text-sm text-muted hover:text-foreground"
      >
        &larr; Back to {part.movie.title}
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <span className="text-sm font-semibold text-accent">
            Part {part.number}
          </span>
          {editing ? (
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                value={editNumber}
                onChange={(e) => setEditNumber(Number(e.target.value))}
                className="w-20 rounded-md border border-border bg-slate-950/50 px-2 py-1 text-sm text-foreground focus:outline-none focus:border-accent"
                min={1}
              />
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 rounded-md border border-border bg-slate-950/50 px-3 py-1 text-lg font-bold text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-foreground">
              {part.title}
            </h1>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-slate-950 hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-white/5"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-white/5"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md border border-red-500/20 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/5"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Story Walkthrough */}
      <div className="mb-8 rounded-xl border border-border bg-slate-950/20 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Story Breakdown & Analysis
        </h2>
        {editing ? (
          <textarea
            value={editStory}
            onChange={(e) => setEditStory(e.target.value)}
            rows={15}
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus:border-accent"
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {part.story}
          </div>
        )}
      </div>

      {/* Media Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Media ({part.media.length})
        </h2>

        <MediaGallery
          media={part.media}
          onDelete={handleDeleteMedia}
        />

        <MediaUpload moviePartId={part.id} onUploaded={fetchPart} />
      </div>
    </div>
  );
}
