"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnimeCard from "@/components/AnimeCard";
import GameCard from "@/components/GameCard";
import MovieCard from "@/components/MovieCard";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface UserSummary {
  id: string;
  email: string;
}

interface AnimeItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  tags: Tag[];
  user: UserSummary;
  _count: { episodes: number };
}

interface GameItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  tags: Tag[];
  user: UserSummary;
  _count: { chapters: number };
}

interface MovieItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  tags: Tag[];
  user: UserSummary;
  _count: { parts: number };
}

interface CollectionMember {
  id: string;
  role: string;
  user: UserSummary;
}

interface CollectionInvitation {
  id: string;
  invitee: UserSummary;
}

interface CollectionDetails {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creator: UserSummary;
  members: CollectionMember[];
  animes: AnimeItem[];
  games: GameItem[];
  movies: MovieItem[];
  invitations: CollectionInvitation[];
}

interface Friend {
  userId: string;
  email: string;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"anime" | "game" | "movie">("anime");
  
  // Followed Friends (for inviting)
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [invitingFriend, setInvitingFriend] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  // Leave/Delete transitions
  const [isPending, startTransition] = useTransition();

  // Import Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<{ id: string; title: string; coverImage: string | null }[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [importSearch, setImportSearch] = useState("");
  const [importing, setImporting] = useState(false);

  // Fetch all collection details & user profile
  const fetchCollectionDetails = async () => {
    try {
      const userRes = await fetch("/api/auth/logout");
      const userData = await userRes.json();
      if (userData?.user) {
        setCurrentUser(userData.user);
      } else {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/collections/${collectionId}`);
      if (!res.ok) {
        router.push("/collections");
        return;
      }
      const data = await res.json();
      setCollection(data);
    } catch (error) {
      console.error("Error loading collection details:", error);
      router.push("/collections");
    } finally {
      setLoading(false);
    }
  };

  // Fetch followed friends
  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.following || []);
      }
    } catch (e) {
      console.error("Error loading friends list:", e);
    }
  };

  useEffect(() => {
    fetchCollectionDetails();
    fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  // Load user's library items when opening the Import Modal
  const loadLibraryItems = async () => {
    setLibraryLoading(true);
    setSelectedLibraryIds([]);
    setImportSearch("");
    try {
      const endpoint =
        activeTab === "game"
          ? "/api/games"
          : activeTab === "movie"
          ? "/api/movies"
          : "/api/animes";
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter out items that are already in the collection
          const existingIds = new Set(
            activeTab === "game"
              ? collection?.games.map((i) => i.id)
              : activeTab === "movie"
              ? collection?.movies.map((i) => i.id)
              : collection?.animes.map((i) => i.id)
          );
          const filterData = data.filter((item) => !existingIds.has(item.id));
          setLibraryItems(filterData);
        }
      }
    } catch (error) {
      console.error("Error loading library items:", error);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    if (isImportModalOpen) {
      loadLibraryItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImportModalOpen, activeTab]);

  const handleInviteFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendId) return;
    setInvitingFriend(true);
    setInviteSuccess("");
    setInviteError("");

    try {
      const res = await fetch(`/api/collections/${collectionId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId: selectedFriendId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setInviteSuccess(`Invitation sent successfully to ${data.invitee.email}!`);
      setSelectedFriendId("");
      fetchCollectionDetails(); // Refresh list of pending invites
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Error sending invitation");
    } finally {
      setInvitingFriend(false);
    }
  };

  const handleImportItems = async () => {
    if (selectedLibraryIds.length === 0) return;
    setImporting(true);

    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          itemIds: selectedLibraryIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import items");
      }

      setIsImportModalOpen(false);
      fetchCollectionDetails(); // Refresh details
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error importing items");
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from the collection?")) return;

    try {
      const res = await fetch(
        `/api/collections/${collectionId}/items?type=${activeTab}&itemId=${itemId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove item");
      }

      fetchCollectionDetails();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error removing item");
    }
  };

  const handleLeaveOrDelete = () => {
    const isCreator = collection?.creatorId === currentUser?.id;
    const msg = isCreator
      ? "Are you sure you want to DELETE this entire collection? This action cannot be undone."
      : "Are you sure you want to LEAVE this collection?";

    if (!confirm(msg)) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/collections/${collectionId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.push("/collections");
        } else {
          const data = await res.json();
          alert(data.error || "Operation failed");
        }
      } catch (err) {
        console.error(err);
        alert("Operation failed");
      }
    });
  };

  const toggleSelectLibraryId = (id: string) => {
    setSelectedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading || !collection || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-32 text-center text-muted">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-muted">Loading collection details...</p>
      </div>
    );
  }

  const isCreator = collection.creatorId === currentUser.id;

  // Filtered friends: Only those who are NOT already members and have NO pending invites
  const inviteableFriends = friends.filter(
    (friend) =>
      !collection.members.some((m) => m.user.id === friend.userId) &&
      !collection.invitations.some((i) => i.invitee.id === friend.userId)
  );

  // Search filtered library items
  const filteredLibraryItems = libraryItems.filter((item) =>
    item.title.toLowerCase().includes(importSearch.toLowerCase())
  );

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/collections"
        className="mb-6 inline-flex items-center text-sm font-semibold text-muted hover:text-foreground transition-colors"
      >
        &larr; Back to Collections
      </Link>

      {/* Hero Header */}
      <div className="glass-panel mb-8 rounded-2xl p-6 sm:p-8 border border-border/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-sm leading-relaxed text-muted">{collection.description}</p>
            )}
            <p className="text-[11px] text-muted-light">
              Created by <span className="text-accent font-semibold">{collection.creator.email}</span> &middot; Opened on {new Date(collection.createdAt).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={handleLeaveOrDelete}
            disabled={isPending}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold border transition-all duration-300 cursor-pointer disabled:opacity-50 ${
              isCreator
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-slate-950"
                : "bg-slate-900/40 text-muted hover:text-rose-400 hover:border-rose-500/30 border-border"
            }`}
          >
            {isPending
              ? "Loading..."
              : isCreator
              ? "🗑️ Delete Collection"
              : "🚪 Leave Collection"}
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Column (Content Items), Right Column (Collaborators & Invitations) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Shared Items Tabs & Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Tabs Navigation */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
            
            {/* Active Mode selector */}
            <div className="flex rounded-xl bg-slate-900/60 p-0.5 border border-border/60 w-fit">
              <button
                onClick={() => setActiveTab("anime")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeTab === "anime"
                    ? "bg-accent text-slate-950 font-extrabold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                🎌 Anime
              </button>
              <button
                onClick={() => setActiveTab("game")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeTab === "game"
                    ? "bg-accent text-slate-950 font-extrabold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                🎮 Games
              </button>
              <button
                onClick={() => setActiveTab("movie")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeTab === "movie"
                    ? "bg-accent text-slate-950 font-extrabold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                🎬 Movies
              </button>
            </div>

            {/* Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="glow-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
            >
              📥 Import from Library
            </button>
          </div>

          {/* Grid Render */}
          {activeTab === "anime" && (
            collection.animes.length === 0 ? (
              <div className="glass-panel rounded-2xl py-20 text-center text-muted">
                <span className="text-4xl">🎌</span>
                <p className="mt-3 text-sm font-bold">No anime items in this collection yet</p>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-4 text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Import your first anime log
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {collection.animes.map((item) => (
                  <div key={item.id} className="flex flex-col h-full bg-slate-950/20 rounded-xl p-0.5 border border-transparent hover:border-accent/10 transition-all">
                    <div className="flex-1">
                      <AnimeCard
                        id={item.id}
                        title={item.title}
                        description={item.description}
                        coverImage={item.coverImage}
                        status={item.status}
                        tags={item.tags}
                        _count={{ episodes: item._count.episodes || 0 }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between px-2 pb-2 text-[10px]">
                      <span className="text-muted truncate max-w-[120px]" title={item.user.email}>
                        👤 {item.user.email.split("@")[0]}
                      </span>
                      {(isCreator || item.user.id === currentUser.id) && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "game" && (
            collection.games.length === 0 ? (
              <div className="glass-panel rounded-2xl py-20 text-center text-muted">
                <span className="text-4xl">🎮</span>
                <p className="mt-3 text-sm font-bold">No gaming items in this collection yet</p>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-4 text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Import your first gaming log
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {collection.games.map((item) => (
                  <div key={item.id} className="flex flex-col h-full bg-slate-950/20 rounded-xl p-0.5 border border-transparent hover:border-accent/10 transition-all">
                    <div className="flex-1">
                      <GameCard
                        id={item.id}
                        title={item.title}
                        description={item.description}
                        coverImage={item.coverImage}
                        status={item.status}
                        tags={item.tags}
                        _count={{ chapters: item._count.chapters || 0 }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between px-2 pb-2 text-[10px]">
                      <span className="text-muted truncate max-w-[120px]" title={item.user.email}>
                        👤 {item.user.email.split("@")[0]}
                      </span>
                      {(isCreator || item.user.id === currentUser.id) && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "movie" && (
            collection.movies.length === 0 ? (
              <div className="glass-panel rounded-2xl py-20 text-center text-muted">
                <span className="text-4xl">🎬</span>
                <p className="mt-3 text-sm font-bold">No movie items in this collection yet</p>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-4 text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Import your first movie log
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {collection.movies.map((item) => (
                  <div key={item.id} className="flex flex-col h-full bg-slate-950/20 rounded-xl p-0.5 border border-transparent hover:border-accent/10 transition-all">
                    <div className="flex-1">
                      <MovieCard
                        id={item.id}
                        title={item.title}
                        description={item.description}
                        coverImage={item.coverImage}
                        status={item.status}
                        tags={item.tags}
                        _count={{ parts: item._count.parts || 0 }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between px-2 pb-2 text-[10px]">
                      <span className="text-muted truncate max-w-[120px]" title={item.user.email}>
                        👤 {item.user.email.split("@")[0]}
                      </span>
                      {(isCreator || item.user.id === currentUser.id) && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>

        {/* Right Column: Collaborators Panel & Invitations */}
        <div className="space-y-6">
          
          {/* Members Panel */}
          <div className="glass-panel rounded-2xl p-5 border border-border/60 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Collaborators ({collection.members.length})
            </h2>
            <div className="divide-y divide-border/20 max-h-60 overflow-y-auto pr-1">
              {collection.members.map((member) => {
                const isMemberCreator = member.user.id === collection.creatorId;
                const isMe = member.user.id === currentUser.id;
                return (
                  <div key={member.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate" title={member.user.email}>
                        {member.user.email} {isMe && <span className="text-accent">(You)</span>}
                      </p>
                      <p className="text-[10px] text-muted capitalize">{member.role}</p>
                    </div>
                    <span className="text-xs">
                      {isMemberCreator ? "👑" : "👤"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invitation Form */}
          <div className="glass-panel rounded-2xl p-5 border border-border/60 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Invite Friend
            </h2>

            {inviteableFriends.length === 0 ? (
              <p className="text-xs text-muted leading-relaxed">
                No new friends available to invite. (You can only invite friends you are following on your Friends tab).
              </p>
            ) : (
              <form onSubmit={handleInviteFriend} className="space-y-3">
                <div>
                  <select
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-slate-950/60 py-2.5 px-3 text-xs text-foreground focus:border-accent focus:outline-none cursor-pointer"
                  >
                    <option value="">Select a friend...</option>
                    {inviteableFriends.map((friend) => (
                      <option key={friend.userId} value={friend.userId}>
                        {friend.email}
                      </option>
                    ))}
                  </select>
                </div>

                {inviteSuccess && (
                  <p className="text-[10px] text-emerald-400 font-medium">{inviteSuccess}</p>
                )}
                {inviteError && (
                  <p className="text-[10px] text-rose-400 font-medium">{inviteError}</p>
                )}

                <button
                  type="submit"
                  disabled={invitingFriend || !selectedFriendId}
                  className="glow-btn w-full rounded-xl py-2 text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {invitingFriend ? "Inviting..." : "Send Invite"}
                </button>
              </form>
            )}

            {/* Pending Invites List */}
            {collection.invitations.length > 0 && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                  Pending Invites
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {collection.invitations.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between text-[11px] py-1">
                      <span className="text-muted-light truncate max-w-[150px]" title={invite.invitee.email}>
                        {invite.invitee.email}
                      </span>
                      <span className="text-[9px] rounded bg-slate-800 text-muted px-1.5 py-0.5 border border-border">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-border shadow-2xl relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            
            {/* Close */}
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-foreground text-sm cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent mb-2">
              Import from Library ({activeTab === "game" ? "Games" : activeTab === "movie" ? "Movies" : "Anime"})
            </h2>
            <p className="text-xs text-muted mb-4">
              Select items from your personal catalog to share inside this collaborative collection.
            </p>

            {/* Search Input */}
            <div className="mb-4 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
              <input
                type="text"
                placeholder={`Search your library ${activeTab}...`}
                value={importSearch}
                onChange={(e) => setImportSearch(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-slate-950/50 py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {/* Library list scrollable area */}
            <div className="flex-1 overflow-y-auto pr-1 border border-border/20 rounded-xl bg-slate-950/30 p-2 min-h-[200px]">
              {libraryLoading ? (
                <div className="py-12 text-center text-xs text-muted font-medium">
                  Scanning your library...
                </div>
              ) : filteredLibraryItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-light">
                  {importSearch ? "No items match your search" : "No new items in your library to import."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredLibraryItems.map((item) => {
                    const isSelected = selectedLibraryIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelectLibraryId(item.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-accent/5 border-accent/35"
                            : "bg-slate-900/30 border-border/40 hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Mini Cover */}
                          <div className="h-10 w-8 shrink-0 overflow-hidden rounded bg-slate-800">
                            {item.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                                🖼️
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-foreground truncate pr-2">
                            {item.title}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by click on container
                          className="h-4 w-4 rounded border-border bg-slate-950 text-accent focus:ring-accent cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-border/20">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-xl border border-border bg-slate-900/40 px-4 py-2.5 text-xs font-bold hover:bg-white/5 transition-all duration-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportItems}
                disabled={importing || selectedLibraryIds.length === 0}
                className="glow-btn rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {importing ? "Importing..." : `Import Selected (${selectedLibraryIds.length})`}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
