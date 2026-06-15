"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TagBadge from "@/components/TagBadge";

interface NexusGame {
  id?: string;
  name?: string;
  title?: string;
  source?: string | null;
  format?: string | null;
  description?: string | null;
  releaseDate?: string | null;
  year?: string | number | null;
  coverUrl?: string | null;
  coverImage?: string | null;
  genres?: string | null;
  status?: string | null;
  completed?: boolean;
  totalPlayTime?: number | null;
  playTimeS?: number | null;
}

interface MappedGame {
  id: string; // original id
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  year: number | null;
  format: string | null;
  genres: string | null;
  playTimeSeconds: number | null;
  isDuplicate: boolean;
  selected: boolean;
}

const formatPlatform = (source: string | null): string | null => {
  if (!source) return null;
  const lower = source.toLowerCase();
  if (lower === "standalone") return "PC (Standalone)";
  if (lower === "steam") return "Steam";
  if (lower === "epic") return "Epic Games";
  if (lower === "gog") return "GOG";
  if (lower === "ubisoft") return "Ubisoft Connect";
  if (lower === "battlenet") return "Battle.net";
  if (lower === "origin" || lower === "ea") return "EA App";
  if (lower === "amazon") return "Amazon Games";
  if (lower === "xbox") return "Xbox";
  return source.charAt(0).toUpperCase() + source.slice(1);
};

const mapGameStatus = (status: string | null, completed: boolean): string => {
  if (completed) return "completed";
  if (!status) return "backlog";
  const lower = status.toLowerCase();
  if (lower === "playing") return "playing";
  if (lower === "backlog") return "backlog";
  if (lower === "dropped") return "dropped";
  if (lower === "planning") return "planning";
  if (lower === "installed") return "installed";
  return "backlog";
};

const getPlayTimeStr = (totalSeconds: number | null): string | null => {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const hours = totalSeconds / 3600;
  if (hours >= 1) {
    return `${hours.toFixed(1)}h`;
  }
  const mins = Math.round(totalSeconds / 60);
  return `${mins}m`;
};

export default function ImportPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingGames, setExistingGames] = useState<{ title: string }[]>([]);
  const [importedGames, setImportedGames] = useState<MappedGame[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [importStatus, setImportStatus] = useState<{
    importing: boolean;
    success: boolean;
    importedCount: number;
    updatedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's existing games to identify duplicates
  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setExistingGames(data);
        }
      })
      .catch((err) => console.error("Error fetching existing games:", err));
  }, []);

  const handleGamesParse = useCallback((gamesList: NexusGame[]) => {
    try {
      const existingTitles = new Set(
        existingGames.map((g) => g.title.toLowerCase().trim())
      );

      const mapped: MappedGame[] = gamesList.map((g: NexusGame) => {
        const title = g.name || g.title || "Unknown Game";
        const isDuplicate = existingTitles.has(title.toLowerCase().trim());
        const year = g.releaseDate
          ? parseInt(g.releaseDate.slice(0, 4), 10)
          : g.year
          ? parseInt(String(g.year), 10)
          : null;

        return {
          id: g.id || Math.random().toString(),
          title,
          description: g.description || null,
          coverImage: g.coverUrl || g.coverImage || null,
          status: mapGameStatus(g.status || null, !!g.completed),
          year: !isNaN(Number(year)) ? year : null,
          format: formatPlatform(g.source || g.format || null),
          genres: g.genres || null,
          playTimeSeconds: g.totalPlayTime || g.playTimeS || null,
          isDuplicate,
          selected: !isDuplicate, // Default to unchecked for duplicates, checked for new ones
        };
      });

      setImportedGames(mapped);
      setErrorMessage("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not parse the game list. Please check the file format.");
    }
  }, [existingGames]);

  // Read JSON content
  const handleJSONContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      const gamesList = Array.isArray(parsed)
        ? parsed
        : parsed.games
        ? parsed.games
        : parsed.playedGames?.games
        ? parsed.playedGames.games
        : null;

      if (!gamesList || !Array.isArray(gamesList)) {
        setErrorMessage("Invalid library format. Expected an array of games.");
        return;
      }

      handleGamesParse(gamesList);
    } catch {
      setErrorMessage("Invalid JSON format. Please upload a valid .json file.");
    }
  };

  // Preload from Workspace
  const handlePreloadDefault = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/games/import");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      if (data.games && Array.isArray(data.games)) {
        handleGamesParse(data.games);
      } else {
        setErrorMessage("Workspace file could not be parsed as a list of games.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load library";
      setErrorMessage(
        message || "Failed to load nexus-library.json from workspace root."
      );
    } finally {
      setLoading(false);
    }
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleJSONContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleJSONContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Quick Selection Helpers
  const selectAll = (excludeDuplicates = false) => {
    setImportedGames((prev) =>
      prev.map((g) => ({
        ...g,
        selected: excludeDuplicates ? !g.isDuplicate : true,
      }))
    );
  };

  const selectNone = () => {
    setImportedGames((prev) => prev.map((g) => ({ ...g, selected: false })));
  };

  const toggleGameSelection = (id: string) => {
    setImportedGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, selected: !g.selected } : g))
    );
  };

  // Submit Import
  const handleImportSubmit = async () => {
    const selectedGames = importedGames.filter((g) => g.selected);
    if (selectedGames.length === 0) return;

    setImportStatus({
      importing: true,
      success: false,
      importedCount: 0,
      updatedCount: 0,
    });

    try {
      const res = await fetch("/api/games/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          games: selectedGames.map((g) => ({
            title: g.title,
            description: g.description,
            coverImage: g.coverImage,
            status: g.status,
            year: g.year,
            format: g.format,
            genres: g.genres,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Bulk import failed on the server.");
      }

      const data = await res.json();
      setImportStatus({
        importing: false,
        success: true,
        importedCount: data.importedCount || 0,
        updatedCount: data.updatedCount || 0,
      });
    } catch (err) {
      console.error(err);
      alert("Error importing library items. Please check server logs.");
      setImportStatus(null);
    }
  };

  const selectedCount = importedGames.filter((g) => g.selected).length;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-border/40 pb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/library"
            className="text-xs font-bold uppercase tracking-wider text-accent hover:text-accent-light transition-colors flex items-center gap-1 mb-2"
          >
            ← Back to Library
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent sm:text-4xl">
            Import Launcher Games
          </h1>
          <p className="mt-2 text-sm text-muted">
            Add games to your personal backlog, playing list, or completed journal by uploading your Nexus Launcher data.
          </p>
        </div>
        <a
          href="https://www.nexusgamelauncher.com/#"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-slate-950/30 hover:bg-slate-900/50 px-4 py-2.5 text-xs font-bold text-muted hover:text-foreground transition-all duration-300 shadow-sm hover:border-accent/20 hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.nexusgamelauncher.com/assets/img/nexus-logo-32.png"
            alt="Nexus"
            className="w-4 h-4 object-contain rounded"
          />
          Nexus Launcher Website
        </a>
      </div>

      {importedGames.length === 0 ? (
        <div className="space-y-6">
          {/* File Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`glass-panel border-2 border-dashed rounded-3xl py-16 px-6 text-center shadow-lg transition-all duration-300 ${
              dragActive
                ? "border-accent bg-accent/5 scale-[0.99] shadow-[0_0_25px_rgba(0,229,255,0.1)]"
                : "border-border/60 hover:border-accent/40"
            }`}
          >
            <span className="text-6xl inline-block mb-4 animate-bounce">🎮</span>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Drag and drop your Nexus Library JSON file here
            </h3>
            <p className="text-xs text-muted mb-6 max-w-sm mx-auto">
              Supports standard game launcher exports containing lists of games, platforms, play time, and status.{" "}
              <a
                href="https://www.nexusgamelauncher.com/#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-bold inline-flex items-center gap-1.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.nexusgamelauncher.com/assets/img/nexus-logo-32.png"
                  alt="Nexus"
                  className="w-3.5 h-3.5 object-contain rounded"
                />
                Visit Nexus Launcher
              </a>{" "}
              to build your library data.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="glow-btn px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105"
              >
                Browse Files
              </button>

              <button
                onClick={handlePreloadDefault}
                disabled={loading}
                className="px-6 py-3 rounded-xl text-sm font-bold border border-border/80 bg-slate-950/40 hover:bg-slate-900/40 transition-all text-muted-light hover:text-foreground disabled:opacity-50"
              >
                {loading ? "Preloading..." : "Preload Default (nexus-library.json)"}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="glass-panel border border-rose-500/20 bg-rose-950/10 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-rose-400">⚠️ {errorMessage}</p>
            </div>
          )}
        </div>
      ) : (
        /* Preview Grid */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="glass-panel rounded-2xl p-5 border border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">
                Detected <span className="text-accent">{importedGames.length}</span> games in file.
              </p>
              <p className="text-xs text-muted">
                Selected <span className="text-accent-light font-bold">{selectedCount}</span> for import.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectAll(true)}
                className="rounded-lg border border-border/80 bg-slate-950/50 hover:bg-slate-900/50 px-3 py-1.5 text-xs font-bold text-foreground transition-all"
              >
                Select All (Skip Duplicates)
              </button>
              <button
                onClick={() => selectAll(false)}
                className="rounded-lg border border-border/80 bg-slate-950/50 hover:bg-slate-900/50 px-3 py-1.5 text-xs font-bold text-foreground transition-all"
              >
                Select All
              </button>
              <button
                onClick={selectNone}
                className="rounded-lg border border-border/80 bg-slate-950/50 hover:bg-slate-900/50 px-3 py-1.5 text-xs font-bold text-foreground transition-all"
              >
                Clear All
              </button>
              <button
                onClick={() => setImportedGames([])}
                className="rounded-lg border border-rose-500/20 bg-rose-950/10 text-rose-400 hover:bg-rose-900/10 px-3 py-1.5 text-xs font-bold transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* List of Mapped Games */}
          <div className="glass-panel rounded-3xl border border-border/50 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-slate-950/40 text-xs font-bold tracking-wider text-muted uppercase">
                    <th className="py-4 px-6 w-12 text-center">Import</th>
                    <th className="py-4 px-6">Game</th>
                    <th className="py-4 px-6">Release Year</th>
                    <th className="py-4 px-6">Platform / Format</th>
                    <th className="py-4 px-6">Genres</th>
                    <th className="py-4 px-6">Play Time</th>
                    <th className="py-4 px-6">Launch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {importedGames.map((game) => (
                    <tr
                      key={game.id}
                      className={`hover:bg-slate-900/20 transition-colors ${
                        game.isDuplicate ? "bg-amber-950/5" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={game.selected}
                          onChange={() => toggleGameSelection(game.id)}
                          className="h-4.5 w-4.5 rounded border-border bg-slate-950 text-accent focus:ring-accent cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-accent/10 to-accent-light/10 border border-border/40">
                            {game.coverImage ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={game.coverImage}
                                alt={game.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-lg text-accent/30 font-bold bg-slate-950/50">
                                {game.title.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              {game.title}
                              {game.isDuplicate && (
                                <span className="rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 font-bold uppercase">
                                  Already In Library
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-light max-w-sm line-clamp-1 mt-0.5">
                              {game.description || "No description provided."}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle text-sm text-foreground">
                        {game.year || "—"}
                      </td>
                      <td className="py-4 px-6 align-middle text-sm text-accent-light font-semibold">
                        {game.format || "—"}
                      </td>
                      <td className="py-4 px-6 align-middle">
                        {game.genres ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {game.genres.split(",").slice(0, 3).map((g) => (
                              <TagBadge key={g} name={g.trim()} color="#38bdf8" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 align-middle text-sm text-foreground font-semibold">
                        {getPlayTimeStr(game.playTimeSeconds) || "—"}
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md inline-block ${
                            game.status === "completed"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : game.status === "playing"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {game.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky Actions Bar */}
          <div className="glass-panel sticky bottom-4 rounded-2xl p-4 border border-accent/20 bg-slate-950/90 shadow-2xl backdrop-blur-md flex items-center justify-between z-45">
            <div className="text-xs sm:text-sm text-muted">
              Ready to import <span className="text-accent font-bold">{selectedCount}</span> game{selectedCount !== 1 ? "s" : ""}.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setImportedGames([])}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={selectedCount === 0}
                className="glow-btn rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none"
              >
                Import Selected Games
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success / Status Modal Overlay */}
      {importStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full border border-border/80 rounded-3xl p-8 text-center shadow-2xl animate-in scale-in duration-300">
            {importStatus.importing ? (
              <div className="py-6 space-y-4">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
                <h3 className="text-lg font-bold text-foreground">Importing Games...</h3>
                <p className="text-xs text-muted">Adding records to database. Please do not close this window.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <span className="text-5xl inline-block">🎉</span>
                <h3 className="text-xl font-bold text-foreground">Import Complete!</h3>
                <div className="glass-panel bg-slate-950/50 rounded-2xl p-4 text-left text-sm space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-muted">New games imported:</span>
                    <span className="text-accent font-bold">{importStatus.importedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Existing games updated:</span>
                    <span className="text-accent-light font-bold">{importStatus.updatedCount}</span>
                  </div>
                  <div className="border-t border-border/40 pt-2 flex justify-between font-bold">
                    <span>Total processed:</span>
                    <span>{importStatus.importedCount + importStatus.updatedCount}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImportStatus(null);
                    router.push("/library");
                  }}
                  className="glow-btn block w-full rounded-xl py-3 text-sm font-bold shadow-lg transition-transform hover:scale-102"
                >
                  Go to Library
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
