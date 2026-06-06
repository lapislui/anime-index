"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Friend {
  id: string; // Follow ID
  userId: string; // Target User ID
  email: string;
  shareDashboard: boolean;
  shareToken: string;
}

interface Follower {
  id: string; // Follow ID
  userId: string; // Follower User ID
  email: string;
}

interface Profile {
  email: string;
  shareDashboard: boolean;
  shareToken: string;
}

export default function FriendsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [following, setFollowing] = useState<Friend[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [targetFriend, setTargetFriend] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Alert/Notif States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const loadFriendsData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch user profile
      const profRes = await fetch("/api/auth/logout");
      const profData = await profRes.json();
      if (profData.user) {
        setProfile({
          email: profData.user.email,
          shareDashboard: profData.user.shareDashboard,
          shareToken: profData.user.shareToken,
        });
      }

      // 2. Fetch following and followers
      const friendsRes = await fetch("/api/friends");
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFollowing(friendsData.following || []);
        setFollowers(friendsData.followers || []);
      }
    } catch (err) {
      console.error(err);
      setError("Error loading connection data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  // Follow a new user
  async function handleFollow(e: React.FormEvent) {
    e.preventDefault();
    if (!targetFriend.trim()) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetFriend }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to follow user");
      }

      setSuccess("Successfully followed user!");
      setTargetFriend("");
      loadFriendsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error following user");
    } finally {
      setActionLoading(false);
    }
  }

  // Unfollow a user
  async function handleUnfollow(followingId: string) {
    if (!confirm("Are you sure you want to unfollow this user?")) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`/api/friends?followingId=${followingId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unfollow user");
      }

      setSuccess("Successfully unfollowed user.");
      loadFriendsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error unfollowing user");
    } finally {
      setActionLoading(false);
    }
  }

  // Toggle dashboard public status
  async function toggleSharing() {
    if (!profile) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch("/api/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareDashboard: !profile.shareDashboard }),
      });
      
      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, shareDashboard: !prev.shareDashboard } : prev);
        setSuccess(`Sharing status updated to ${!profile.shareDashboard ? "Public" : "Private"}.`);
      } else {
        throw new Error("Failed to update sharing status.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating sharing configuration");
    } finally {
      setActionLoading(false);
    }
  }

  // Copy user share link
  function copyShareLink() {
    if (!profile?.shareToken) return;
    const url = `${window.location.origin}/shared/${profile.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-32 text-center text-muted sm:px-6 lg:px-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm font-semibold tracking-wide">Syncing Friend Network...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20 animate-pulse">
          Social Cataloging
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Friend Network
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Connect with friends to see their shared anime, game, and movie logs, compare stats, and share your own libraries.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400 flex items-start gap-2">
          <span className="mt-0.5">⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-start gap-2">
          <span className="mt-0.5">✅</span> {success}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Follow Actions & Sharing (col-span-4) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Follow Friend Card */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Follow a Friend</h3>
              <p className="text-xs text-muted mt-1">
                Enter your friend&apos;s email address or unique sharing token to start following them.
              </p>
            </div>
            <form onSubmit={handleFollow} className="space-y-3">
              <input
                type="text"
                required
                value={targetFriend}
                onChange={(e) => setTargetFriend(e.target.value)}
                placeholder="friend@example.com or token..."
                className="w-full rounded-xl bg-slate-950/60 border border-border/40 px-4 py-2.5 text-xs text-foreground placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
              />
              <button
                type="submit"
                disabled={actionLoading || !targetFriend.trim()}
                className="glow-btn w-full rounded-xl py-2.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Connecting…" : "👥 Follow Friend"}
              </button>
            </form>
          </div>

          {/* User's Share Settings Card */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">My Share Settings</h3>
                <p className="text-xs text-muted mt-1">
                  Enable public sharing so friends can view your catalog and stats.
                </p>
              </div>
              <button
                onClick={toggleSharing}
                disabled={actionLoading}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                  profile?.shareDashboard ? "border-accent bg-accent/20" : "border-border/40 bg-slate-950/60"
                }`}
                aria-label="Toggle profile sharing"
              >
                <span
                  className={`inline-block h-5 w-5 translate-x-0.5 translate-y-0.5 transform rounded-full shadow transition-transform duration-200 ${
                    profile?.shareDashboard ? "translate-x-5 bg-accent" : "bg-muted"
                  }`}
                />
              </button>
            </div>

            {profile?.shareDashboard && (
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-widest">My Share Link</label>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 rounded-xl bg-slate-950/60 border border-border/40 px-3 py-2 text-[10px] font-mono text-muted truncate select-all flex items-center">
                    {typeof window !== "undefined" ? `${window.location.origin}/shared/${profile.shareToken}` : `/shared/${profile.shareToken}`}
                  </div>
                  <button
                    onClick={copyShareLink}
                    className={`glow-btn rounded-xl px-4 py-2 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      copySuccess ? "!bg-emerald-500 shadow-emerald-500/30" : ""
                    }`}
                  >
                    {copySuccess ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Connections (col-span-8) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Following Card */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Following ({following.length})</h3>
              <p className="text-xs text-muted mt-1">Users whose libraries and journals you follow.</p>
            </div>

            {following.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted border border-dashed border-border/30 rounded-2xl">
                <span className="text-3xl mb-2">🔭</span>
                <p className="text-xs">You aren&apos;t following anyone yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {following.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/30 rounded-xl p-4 border border-border/40 transition-all duration-300 hover:border-accent/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{friend.email}</h4>
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-semibold mt-1 px-2 py-0.5 rounded-full ${
                            friend.shareDashboard
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          <span className={`h-1 w-1 rounded-full ${friend.shareDashboard ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                          {friend.shareDashboard ? "Shared Dashboard" : "Private Dashboard"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {friend.shareDashboard ? (
                        <>
                          <Link
                            href={`/shared/${friend.shareToken}?mode=anime`}
                            className="rounded-lg bg-slate-900 border border-border hover:border-accent/40 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-slate-800 transition-all flex items-center gap-1"
                          >
                            📊 View
                          </Link>
                        </>
                      ) : (
                        <button
                          disabled
                          className="rounded-lg bg-slate-950/40 border border-border/20 px-3 py-1.5 text-xs font-bold text-muted cursor-not-allowed"
                        >
                          🔒 Private
                        </button>
                      )}
                      <button
                        onClick={() => handleUnfollow(friend.userId)}
                        disabled={actionLoading}
                        className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Followers Card */}
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Followers ({followers.length})</h3>
              <p className="text-xs text-muted mt-1">Users following your public catalog.</p>
            </div>

            {followers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted border border-dashed border-border/30 rounded-2xl">
                <span className="text-3xl mb-2">🔔</span>
                <p className="text-xs">No one is following you yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between gap-4 bg-slate-950/20 rounded-xl p-4 border border-border/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">👤</span>
                      <h4 className="text-xs font-bold text-foreground">{follower.email}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
