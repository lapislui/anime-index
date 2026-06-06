"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TagBadge from "@/components/TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function NewGamePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("playing");
  const [year, setYear] = useState("");
  const [format, setFormat] = useState("");
  const [genres, setGenres] = useState("");
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  const [friends, setFriends] = useState<{ id: string; userId: string; email: string }[]>([]);
  const [playedWithId, setPlayedWithId] = useState("");

  useEffect(() => {
    fetch("/api/tags?type=game")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTags(data);
        } else {
          setTags([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setTags([]);
      });

    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.following)) {
          setFriends(data.following);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor, type: "game" }),
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
      const res = await fetch("/api/games", {
        method: "POST",
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
          playedWithId: playedWithId || null,
        }),
      });

      const game = await res.json();
      router.push(`/game/${game.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create game entry.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Add New Game Entry</h1>

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
            placeholder="e.g. Elden Ring"
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
            placeholder="Brief overview of the game, story hook, etc..."
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
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              placeholder="e.g. 2022"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Platform (Format)
            </label>
            <input
              type="text"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              placeholder="e.g. PC, PS5, Switch"
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
              className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              placeholder="e.g. RPG, Action"
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
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            placeholder="https://example.com/game-cover.jpg"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Gameplay Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="planning">Planning</option>
            <option value="playing">Playing</option>
            <option value="installed">Installed</option>
            <option value="completed">Completed</option>
            <option value="backlog">Backlog</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Played With (Collaborator)
          </label>
          <select
            value={playedWithId}
            onChange={(e) => setPlayedWithId(e.target.value)}
            className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-foreground focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="">Single Player (None)</option>
            {friends.map((f) => (
              <option key={f.userId} value={f.userId}>
                {f.email}
              </option>
            ))}
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
            {saving ? "Creating..." : "Create Game Entry"}
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
