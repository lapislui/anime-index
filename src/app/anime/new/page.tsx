"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TagBadge from "@/components/TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function NewAnimePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("watching");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
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
  }, []);

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
    const res = await fetch("/api/animes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        coverImage: coverImage.trim() || null,
        status,
        tagIds: selectedTagIds,
      }),
    });

    const anime = await res.json();
    router.push(`/anime/${anime.id}`);
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Add New Anime</h1>

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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted"
            placeholder="e.g. Attack on Titan"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted"
            placeholder="Brief overview of the anime..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Cover Image URL
          </label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted"
            placeholder="https://example.com/cover.jpg"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
          >
            <option value="watching">Watching</option>
            <option value="completed">Completed</option>
            <option value="planned">Planned</option>
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
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-md border border-border"
            />
            <button
              type="button"
              onClick={createTag}
              className="rounded-md bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20"
            >
              Add Tag
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Anime"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
