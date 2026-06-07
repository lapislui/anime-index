"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creator: {
    id: string;
    email: string;
  };
  members: {
    id: string;
    role: string;
    user: {
      id: string;
      email: string;
    };
  }[];
  _count: {
    animes: number;
    games: number;
    movies: number;
  };
}

interface Invitation {
  id: string;
  createdAt: string;
  collection: {
    id: string;
    name: string;
    description: string | null;
    creator: {
      email: string;
    };
  };
  inviter: {
    email: string;
  };
}

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [modalError, setModalError] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch current user & data
  const fetchData = async () => {
    try {
      const userRes = await fetch("/api/auth/logout"); // GET returns logged-in user
      const userData = await userRes.json();
      if (userData?.user) {
        setCurrentUser(userData.user);
      } else {
        router.push("/login");
        return;
      }

      const [colsRes, invRes] = await Promise.all([
        fetch("/api/collections"),
        fetch("/api/collections/invitations"),
      ]);

      if (colsRes.ok) {
        const colsData = await colsRes.json();
        setCollections(colsData);
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvitations(invData);
      }
    } catch (error) {
      console.error("Error fetching collections data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) {
      setModalError("Collection name is required");
      return;
    }

    setCreating(true);
    setModalError("");

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newColName.trim(),
          description: newColDesc.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create collection");
      }

      setNewColName("");
      setNewColDesc("");
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Error creating collection");
    } finally {
      setCreating(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/collections/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process invitation");
      }

      fetchData(); // Refresh everything
    } catch (error) {
      console.error("Error responding to invitation:", error);
      alert(error instanceof Error ? error.message : "Error responding to invitation");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-32 text-center text-muted">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-muted">Loading your collections...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent sm:text-4xl">
            Collaborative Collections
          </h1>
          <p className="mt-2 text-sm text-muted">
            Create groups, invite friends, and share your anime, movie, and gaming logs in one unified catalog.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="glow-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-105 cursor-pointer"
        >
          📂 New Collection
        </button>
      </div>

      {/* Invitations Section */}
      {invitations.length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="mb-4 text-lg font-bold text-accent flex items-center gap-2">
            <span>✉️</span> Received Invitations ({invitations.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="glass-panel rounded-xl border border-accent/20 bg-slate-950/40 p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {inv.collection.name}
                  </h3>
                  {inv.collection.description && (
                    <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                      {inv.collection.description}
                    </p>
                  )}
                  <p className="mt-3 text-[10px] text-muted-light">
                    Invited by <span className="text-accent font-semibold">{inv.inviter.email}</span>
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleInvitationResponse(inv.id, "accept")}
                    className="flex-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all duration-300"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleInvitationResponse(inv.id, "decline")}
                    className="flex-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 py-2 text-xs font-bold hover:bg-rose-500 hover:text-foreground transition-all duration-300"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Collections Section */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-foreground">
          My Shared Collections ({collections.length})
        </h2>
        {collections.length === 0 ? (
          <div className="glass-panel rounded-2xl py-20 text-center shadow-lg border border-border/50">
            <span className="text-5xl">📂</span>
            <p className="mt-4 text-lg font-bold text-muted">No collaborative collections yet</p>
            <p className="mt-1 text-xs text-muted-light max-w-md mx-auto">
              Create a collection, invite friends, and begin importing your visual breakdowns together.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent/10 px-5 py-2.5 text-xs font-bold text-accent border border-accent/20 hover:bg-accent hover:text-slate-950 transition-all duration-300"
            >
              + Create Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => {
              const isCreator = col.creatorId === currentUser?.id;
              return (
                <Link key={col.id} href={`/collections/${col.id}`} className="group">
                  <div className="glass-card flex flex-col justify-between rounded-2xl p-6 h-full border border-border/60 hover:border-accent/30 transition-all duration-300">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-accent transition-colors duration-300 line-clamp-1">
                          {col.name}
                        </h3>
                        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isCreator 
                            ? "bg-accent/10 text-accent border border-accent/20" 
                            : "bg-accent-light/10 text-accent-light border border-accent-light/20"
                        }`}>
                          {isCreator ? "Creator" : "Member"}
                        </span>
                      </div>
                      {col.description && (
                        <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">
                          {col.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                      {/* Item Stats */}
                      <div className="flex gap-3 text-[10px] font-bold text-muted">
                        <span title="Anime count" className="flex items-center gap-1">
                          🎌 {col._count.animes}
                        </span>
                        <span title="Game count" className="flex items-center gap-1">
                          🎮 {col._count.games}
                        </span>
                        <span title="Movie count" className="flex items-center gap-1">
                          🎬 {col._count.movies}
                        </span>
                      </div>

                      {/* Collaborator Count */}
                      <div className="flex items-center gap-1 text-[10px] text-accent-light font-bold">
                        👥 {col.members.length} member{col.members.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-border shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-foreground text-sm cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent mb-4">
              Create Collection
            </h2>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Collection Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g., Summer Anime Club, Master Backlog"
                  className="w-full rounded-xl border border-border bg-slate-950/60 py-2.5 px-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Description
                </label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Optional description of what this collection catalogs..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-slate-950/60 py-2.5 px-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all duration-300"
                />
              </div>

              {modalError && (
                <p className="text-xs text-rose-400 font-medium">{modalError}</p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border bg-slate-900/40 px-4 py-2.5 text-xs font-bold hover:bg-white/5 transition-all duration-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="glow-btn rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
