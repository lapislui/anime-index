"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TagBadge from "@/components/TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function EditMoviePage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("watching");
  const [year, setYear] = useState("");
  const [format, setFormat] = useState("");
  const [genres, setGenres] = useState("");
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/movies/${params.id}`).then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ]).then(([movie, allTags]) => {
      setTitle(movie.title);
      setDescription(movie.description || "");
      setCoverImage(movie.coverImage || "");
      setStatus(movie.status);
      setYear(movie.year ? movie.year.toString() : "");
      setFormat(movie.format || "");
      setGenres(movie.genres || "");
      setSelectedTagIds(movie.tags.map((t: Tag) => t.id));
      setTags(allTags);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      router.push("/");
    });
  }, [params.id, router]);

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });
      if (res.ok) {
        const tag = await res.json();
        setTags([...tags, tag]);
        setSelectedTagIds([...selectedTagIds, tag.id]);
        setNewTagName("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await fetch(`/api/movies/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          coverImage: coverImage.trim() || null,
          status,
          year: year ? parseInt(year, 10) : null,
          format: format.trim() || null,
          genres: genres.trim() || null,
          tagIds: selectedTagIds,
        }),
      });

      router.push(`/movie/${params.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading Movie Profile Details...
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Movie Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Release Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Format (e.g. Theatrical, Blu-Ray)
            </label>
            <input
              type="text"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Genres
            </label>
            <input
              type="text"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Cover Image URL
          </label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Watched Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="watching">Watching</option>
            <option value="completed">Watched</option>
            <option value="planned">Plan to Watch</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Tags
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagBadge
                key={tag.id}
                name={tag.name}
                color={tag.color}
                active={selectedTagIds.includes(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              className="flex-1 rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <button
              type="button"
              onClick={createTag}
              className="rounded-md bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-all border border-accent/20"
            >
              Add Tag
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
