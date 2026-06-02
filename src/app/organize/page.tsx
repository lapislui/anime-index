"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DBTag {
  id: string;
  name: string;
  color: string;
}

interface MALAnimeResult {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  score: number | null;
  type: string;
  episodes: number | null;
  year: number | null;
  images: {
    jpg: {
      large_image_url: string;
    };
  };
}

export default function OrganizePage() {
  const router = useRouter();

  // DB tags list
  const [tags, setTags] = useState<DBTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#8b5cf6");

  // Search MAL states
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<MALAnimeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<MALAnimeResult | null>(null);

  // Dropped / Assigned tags
  const [assignedTags, setAssignedTags] = useState<DBTag[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch db tags
  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTags(data);
        } else {
          setTags([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      if (res.ok) {
        setNewTagName("");
        fetchTags();
      } else {
        alert("Failed to create tag. It might already exist.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;
    try {
      await fetch(`/api/tags/${id}`, { method: "DELETE" });
      // If we don't have a direct delete endpoint, we can inform, but let's try calling it.
      // In prisma, standard CRUD endpoints exist, let's refresh the tags
      fetchTags();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchVal.trim())}&limit=10`);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, tag: DBTag) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(tag));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const rawData = e.dataTransfer.getData("text/plain");
      if (!rawData) return;
      const tag: DBTag = JSON.parse(rawData);

      // Avoid duplicates
      if (!assignedTags.some((t) => t.id === tag.id)) {
        setAssignedTags((prev) => [...prev, tag]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeAssignedTag = (tagId: string) => {
    setAssignedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleSaveToLibrary = async () => {
    if (!selectedAnime) {
      alert("Please search and select an anime first.");
      return;
    }
    if (assignedTags.length === 0) {
      alert("Please assign at least one tag to drag and drop before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/animes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedAnime.title_english || selectedAnime.title,
          description: selectedAnime.synopsis,
          coverImage: selectedAnime.images.jpg.large_image_url,
          status: "watching", // Default status
          tagIds: assignedTags.map((t) => t.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully imported "${data.title}" into library with your assigned tags!`);
        setSelectedAnime(null);
        setAssignedTags([]);
        setSearchVal("");
        setSearchResults([]);
        router.push("/");
      } else {
        alert("Could not import entry. Check if it already exists in your library.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving imported anime.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20">
          Organizer Workspace
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Organize & Tag Anime
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Design custom tags, link them to global databases using interactive drag-and-drop mechanics, and construct your library pipeline.
        </p>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Tag Creator (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/30 pb-2">
              🏷️ Tag Creator
            </h3>
            <form onSubmit={handleCreateTag} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">
                  Tag Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyberpunk, Isekai"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-950/50 px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">
                  Color Swatch
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-8 w-12 rounded border border-border bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-slate-950/50 px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="glow-btn w-full rounded-xl py-2 text-xs font-bold uppercase"
              >
                Create Tag
              </button>
            </form>
          </div>

          <div className="glass-panel rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/30 pb-2">
              Available Tags
            </h3>
            {tags.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No tags created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tag)}
                    style={{ borderColor: `${tag.color}40`, color: tag.color, background: `${tag.color}15` }}
                    className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing rounded-full border px-3 py-1 text-xs font-semibold select-none hover:scale-105 transition-transform"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id, tag.name)}
                      className="text-[10px] text-muted hover:text-rose-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted pt-2 text-center">
              💡 Drag tags and drop them on the center zone.
            </p>
          </div>
        </div>

        {/* Center Column: Workspace (col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Search Panel */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/30 pb-2">
              🔍 Search Global database
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Type anime title..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-slate-950/50 px-4 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="glow-btn rounded-xl px-5 text-xs font-bold uppercase"
              >
                Search
              </button>
            </form>

            {/* Results Scrollbox */}
            {searching ? (
              <p className="text-xs text-muted text-center py-6">Searching...</p>
            ) : searchResults.length > 0 ? (
              <div className="max-h-[220px] overflow-y-auto border border-border/50 rounded-xl divide-y divide-border/20 bg-slate-950/20">
                {searchResults.map((anime) => (
                  <div key={anime.mal_id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-all">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{anime.title_english || anime.title}</h4>
                      <p className="text-[10px] text-muted">⭐ {anime.score || "N/A"} | {anime.episodes || "?"} eps</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAnime(anime);
                        setAssignedTags([]);
                      }}
                      className="rounded-lg bg-accent/15 border border-accent/20 px-3 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-slate-950 transition-all"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              searchVal && <p className="text-xs text-muted text-center py-6">No search results displayable.</p>
            )}
          </div>

          {/* Interactive Drag & Drop canvas */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/30 pb-2">
              Drag & Drop Canvas
            </h3>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                isDragOver
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border/60 bg-slate-950/20 text-muted"
              }`}
            >
              {selectedAnime ? (
                <div>
                  <p className="text-xs font-bold text-accent">Selected: {selectedAnime.title_english || selectedAnime.title}</p>
                  <p className="text-[10px] mt-1">Drop tags here to categorise it...</p>
                </div>
              ) : (
                <p className="text-xs">Select an anime from the list first, then drop tags here.</p>
              )}
            </div>

            {/* Dropped tags display */}
            {assignedTags.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Assigned Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {assignedTags.map((tag) => (
                    <div
                      key={tag.id}
                      style={{ borderColor: `${tag.color}40`, color: tag.color, background: `${tag.color}15` }}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                    >
                      <span>{tag.name}</span>
                      <button
                        onClick={() => removeAssignedTag(tag.id)}
                        className="text-[10px] font-bold hover:text-rose-500 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAnime && (
              <div className="pt-4 border-t border-border/30">
                <button
                  onClick={handleSaveToLibrary}
                  disabled={saving}
                  className="glow-btn w-full rounded-xl py-3 text-xs font-extrabold uppercase transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? "Importing..." : "Save Selected Anime to Library"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview Pane (col-span-3) */}
        <div className="lg:col-span-3">
          <div className="glass-panel rounded-2xl p-5 shadow-lg min-h-[400px] border border-border/60 sticky top-[100px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/30 pb-2 mb-4">
              🎌 Selected Preview
            </h3>

            {selectedAnime ? (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAnime.images.jpg.large_image_url}
                  alt={selectedAnime.title}
                  className="w-full rounded-xl border border-border/80 object-cover aspect-[3/4]"
                />
                <h4 className="text-sm font-bold text-foreground leading-snug">{selectedAnime.title_english || selectedAnime.title}</h4>
                <div className="text-[11px] divide-y divide-border/20 text-muted">
                  <div className="flex justify-between py-1.5"><span>Score</span><strong className="text-accent">{selectedAnime.score || "N/A"}</strong></div>
                  <div className="flex justify-between py-1.5"><span>Episodes</span><strong>{selectedAnime.episodes || "N/A"}</strong></div>
                  <div className="flex justify-between py-1.5"><span>Type</span><strong>{selectedAnime.type}</strong></div>
                  <div className="flex justify-between py-1.5"><span>Year</span><strong>{selectedAnime.year || "N/A"}</strong></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
                <span className="text-4xl mb-3">📺</span>
                <p className="text-xs">No active selection to preview details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
