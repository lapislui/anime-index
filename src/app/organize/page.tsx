"use client";

import { useState, useEffect, useCallback } from "react";
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
  images?: {
    jpg?: {
      large_image_url?: string;
    };
  };
  genres?: { name: string }[];
}

import { useMode } from "@/context/ModeContext";

type SearchResultItem = MALAnimeResult | GameCatalogItem;

interface GameCatalogItem {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  score: number | null;
  type: string; // Used for platform/format
  episodes: number | null; // Null for games
  year: number | null;
  genres: string;
  coverImage: string;
}

const POPULAR_GAMES: GameCatalogItem[] = [
  {
    mal_id: 1001,
    title: "Elden Ring",
    title_english: "Elden Ring",
    synopsis: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between. A challenging action RPG set in a vast open world.",
    score: 9.6,
    type: "PS5, PC, Xbox",
    episodes: null,
    year: 2022,
    genres: "Action, RPG, Dark Fantasy",
    coverImage: "https://images.unsplash.com/photo-1655821888788-6107699e173b?auto=format&fit=crop&q=80&w=400",
  },
  {
    mal_id: 1002,
    title: "The Witcher 3: Wild Hunt",
    title_english: "The Witcher 3",
    synopsis: "Geralt of Rivia, a monster slayer for hire, embarks on an epic journey to find the child of prophecy, Ciri, in a war-torn world filled with beasts and complex choices.",
    score: 9.7,
    type: "PC, PS4, Xbox, Switch",
    episodes: null,
    year: 2015,
    genres: "RPG, Open World, Story Rich",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400",
  },
  {
    mal_id: 1003,
    title: "Cyberpunk 2077",
    title_english: "Cyberpunk 2077",
    synopsis: "An open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification. Play as V, a mercenary outlaw seeking a unique implant.",
    score: 8.8,
    type: "PC, PS5, Xbox Series X",
    episodes: null,
    year: 2020,
    genres: "Action, Sci-Fi, Cyberpunk",
    coverImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400",
  },
  {
    mal_id: 1004,
    title: "Red Dead Redemption 2",
    title_english: "RDR 2",
    synopsis: "Arthur Morgan and the Van der Linde gang are outlaws on the run. With federal agents and the best bounty hunters massing on their heels, the gang must rob, steal and fight their way across America.",
    score: 9.8,
    type: "PS4, PC, Xbox One",
    episodes: null,
    year: 2018,
    genres: "Action, Adventure, Western",
    coverImage: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=400",
  },
  {
    mal_id: 1005,
    title: "Hades",
    title_english: "Hades",
    synopsis: "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion and Transistor.",
    score: 9.3,
    type: "PC, Switch, PlayStation, Xbox",
    episodes: null,
    year: 2020,
    genres: "Rogue-like, Action, Indie",
    coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400",
  },
  {
    mal_id: 1006,
    title: "Baldur's Gate 3",
    title_english: "Baldur's Gate 3",
    synopsis: "Gather your party, and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power. Powered by D&D rules.",
    score: 9.6,
    type: "PC, PS5, Xbox Series X/S",
    episodes: null,
    year: 2023,
    genres: "RPG, Turn-Based, Fantasy",
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400",
  },
  {
    mal_id: 1007,
    title: "Grand Theft Auto V",
    title_english: "GTA V",
    synopsis: "When a young street hustler, a retired bank robber and a terrifying psychopath land themselves in trouble, they must pull off a series of dangerous heists to survive.",
    score: 9.2,
    type: "PC, PS5, Xbox Series X",
    episodes: null,
    year: 2013,
    genres: "Action, Open World, Multiplayer",
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400",
  },
  {
    mal_id: 1008,
    title: "Minecraft",
    title_english: "Minecraft",
    synopsis: "Explore infinite worlds and build everything from the simplest of homes to the grandest of castles. Play in creative mode with unlimited resources or mine deep in survival.",
    score: 9.0,
    type: "PC, Console, Mobile",
    episodes: null,
    year: 2011,
    genres: "Sandbox, Survival, Crafting",
    coverImage: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&q=80&w=400",
  }
];

export default function OrganizePage() {
  const router = useRouter();
  const { mode } = useMode();

  // DB tags list
  const [tags, setTags] = useState<DBTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#8b5cf6");

  // Search states
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);

  // Dropped / Assigned tags
  const [assignedTags, setAssignedTags] = useState<DBTag[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch db tags
  const fetchTags = useCallback(async () => {
    try {
      const tagType = mode === "games" ? "game" : mode === "movies" ? "movie" : "anime";
      const res = await fetch(`/api/tags?type=${tagType}`);
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
  }, [mode]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Clear selected item on mode switch
  useEffect(() => {
    setSelectedItem(null);
    setSearchVal("");
    setSearchResults([]);
    setAssignedTags([]);
  }, [mode]);

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
          type: mode === "games" ? "game" : mode === "movies" ? "movie" : "anime",
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
      fetchTags();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;

    setSearching(true);
    if (mode === "games") {
      // Search from local popular games catalog
      const q = searchVal.trim().toLowerCase();
      const results = POPULAR_GAMES.filter(
        (g) => g.title.toLowerCase().includes(q) || g.genres.toLowerCase().includes(q)
      );
      
      // Add a custom option if no exact match or just as fallback
      const exactMatch = results.some((r) => r.title.toLowerCase() === q);
      if (!exactMatch) {
        results.push({
          mal_id: Date.now(),
          title: searchVal.trim(),
          title_english: searchVal.trim(),
          synopsis: "Custom Game entry added via Organizer search.",
          score: null,
          type: "PC",
          episodes: null,
          year: new Date().getFullYear(),
          genres: "Custom",
          coverImage: "",
        });
      }
      
      setSearchResults(results);
      setSearching(false);
    } else if (mode === "movies") {
      // Movie Mode: Search Jikan with &type=movie
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchVal.trim())}&type=movie&limit=10`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    } else {
      // Anime Mode: Search Jikan
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchVal.trim())}&limit=10`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
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
    if (!selectedItem) {
      alert(`Please search and select a ${mode === "games" ? "game" : mode === "movies" ? "movie" : "anime"} first.`);
      return;
    }
    if (assignedTags.length === 0) {
      alert("Please assign at least one tag to drag and drop before saving.");
      return;
    }

    setSaving(true);
    try {
      const isGame = mode === "games";
      const isMovie = mode === "movies";
      const endpoint = isGame ? "/api/games" : isMovie ? "/api/movies" : "/api/animes";
      
      const payload: {
        title: string;
        description: string | null;
        coverImage: string | null | undefined;
        status: string;
        tagIds: string[];
        year?: number | null;
        format?: string | null;
        genres?: string | null;
      } = {
        title: selectedItem.title_english || selectedItem.title,
        description: selectedItem.synopsis,
        coverImage: isGame 
          ? (selectedItem as GameCatalogItem).coverImage 
          : (selectedItem as MALAnimeResult).images?.jpg?.large_image_url,
        status: isGame ? "playing" : "watching",
        tagIds: assignedTags.map((t) => t.id),
      };

      if (isGame) {
        const gameItem = selectedItem as GameCatalogItem;
        payload.year = gameItem.year;
        payload.format = gameItem.type;
        payload.genres = gameItem.genres;
      } else {
        const animeItem = selectedItem as MALAnimeResult;
        payload.year = animeItem.year || null;
        payload.format = animeItem.type || null;
        payload.genres = animeItem.genres ? animeItem.genres.map((g) => g.name).join(", ") : null;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully imported "${data.title}" into library with your assigned tags!`);
        setSelectedItem(null);
        setAssignedTags([]);
        setSearchVal("");
        setSearchResults([]);
        router.push("/");
      } else {
        alert("Could not import entry. Check if it already exists in your library.");
      }
    } catch (err) {
      console.error(err);
      alert(`Error saving imported ${mode === "games" ? "game" : mode === "movies" ? "movie" : "anime"}.`);
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
          {mode === "games" ? "Organize & Tag Games" : mode === "movies" ? "Organize & Tag Movies" : "Organize & Tag Anime"}
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
                  placeholder="e.g. Action, Cyberpunk"
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
              🔍 {mode === "games" ? "Search Games Database" : mode === "movies" ? "Search Movie Database" : "Search Global Anime Database"}
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder={mode === "games" ? "Search GTA, Elden Ring, RPG..." : mode === "movies" ? "Search movies: Your Name, Spirited Away..." : "Type anime title..."}
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
                {searchResults.map((item) => (
                  <div key={item.mal_id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-all">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{item.title_english || item.title}</h4>
                      <p className="text-[10px] text-muted">
                        {mode === "games"
                          ? `⭐ ${item.score || "N/A"} | Platform: ${item.type}`
                          : mode === "movies"
                          ? `⭐ ${item.score || "N/A"} | Movie`
                          : `⭐ ${item.score || "N/A"} | ${item.episodes || "?"} eps`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
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
              {selectedItem ? (
                <div>
                  <p className="text-xs font-bold text-accent">Selected: {selectedItem.title_english || selectedItem.title}</p>
                  <p className="text-[10px] mt-1">Drop tags here to categorise it...</p>
                </div>
              ) : (
                <p className="text-xs">Select a {mode === "games" ? "game" : mode === "movies" ? "movie" : "anime"} from the list first, then drop tags here.</p>
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

            {selectedItem && (
              <div className="pt-4 border-t border-border/30">
                <button
                  onClick={handleSaveToLibrary}
                  disabled={saving}
                  className="glow-btn w-full rounded-xl py-3 text-xs font-extrabold uppercase transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? "Importing..." : `Save Selected ${mode === "games" ? "Game" : mode === "movies" ? "Movie" : "Anime"} to Library`}
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

            {selectedItem ? (
              <div className="space-y-4">
                {('coverImage' in selectedItem ? (selectedItem as GameCatalogItem).coverImage : (selectedItem as MALAnimeResult).images?.jpg?.large_image_url) ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mode === "games" ? (selectedItem as GameCatalogItem).coverImage : (selectedItem as MALAnimeResult).images?.jpg?.large_image_url}
                      alt={selectedItem.title}
                      className="w-full rounded-xl border border-border/80 object-cover aspect-[3/4]"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-light/20 aspect-[3/4] text-5xl">
                    {mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📺"}
                  </div>
                )}
                <h4 className="text-sm font-bold text-foreground leading-snug">{selectedItem.title_english || selectedItem.title}</h4>
                <div className="text-[11px] divide-y divide-border/20 text-muted">
                  <div className="flex justify-between py-1.5"><span>Score</span><strong className="text-accent">{selectedItem.score || "N/A"}</strong></div>
                  {mode !== "games" && mode !== "movies" && <div className="flex justify-between py-1.5"><span>Episodes</span><strong>{selectedItem.episodes || "N/A"}</strong></div>}
                  <div className="flex justify-between py-1.5"><span>{mode === "games" ? "Platform" : "Type"}</span><strong>{selectedItem.type}</strong></div>
                  <div className="flex justify-between py-1.5"><span>Year</span><strong>{selectedItem.year || "N/A"}</strong></div>
                  {mode === "games" && <div className="flex justify-between py-1.5"><span>Genres</span><strong>{(selectedItem as GameCatalogItem).genres || "N/A"}</strong></div>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
                <span className="text-4xl mb-3">{mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📺"}</span>
                <p className="text-xs">No active selection to preview details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
