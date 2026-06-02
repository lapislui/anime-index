import { notFound } from "next/navigation";
import Link from "next/link";

interface TagStat {
  id: string;
  name: string;
  color: string;
  _count: { animes: number };
}

interface Activity {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  anime: { id: string; title: string };
}

interface SharedStats {
  ownerEmail: string;
  totalAnime: number;
  totalEpisodes: number;
  statusCounts: { watching: number; completed: number; planned: number; dropped: number };
  topTags: TagStat[];
  recentActivity: Activity[];
}

async function getSharedStats(token: string): Promise<SharedStats | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_ORIGIN ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/stats/shared/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharedDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const stats = await getSharedStats(token);

  if (!stats) notFound();

  const { ownerEmail, totalAnime, totalEpisodes, statusCounts, topTags, recentActivity } = stats;
  const totalStatusCount =
    statusCounts.watching + statusCounts.completed + statusCounts.planned + statusCounts.dropped || 1;
  const getPercent = (count: number) => Math.round((count / totalStatusCount) * 100);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20">
          Shared Library
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {ownerEmail.split("@")[0]}&apos;s Anime Metrics
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Publicly shared anime library stats from{" "}
          <span className="text-foreground font-semibold">{ownerEmail}</span>.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950/40 border border-border/30 px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Read-only public view
        </div>
      </div>

      {/* Metric Cards */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Series", val: totalAnime, icon: "📺", grad: "from-blue-600/10 to-blue-400/5" },
          { label: "Episodes Logged", val: totalEpisodes, icon: "📝", grad: "from-emerald-600/10 to-emerald-400/5" },
          { label: "Completed", val: statusCounts.completed, icon: "🏆", grad: "from-amber-600/10 to-amber-400/5" },
          { label: "In Progress", val: statusCounts.watching, icon: "⏳", grad: "from-purple-600/10 to-purple-400/5" },
        ].map((c, i) => (
          <div
            key={i}
            className={`glass-panel rounded-2xl p-6 bg-gradient-to-br ${c.grad} border border-border/40 shadow-md`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted">{c.label}</p>
                <h3 className="text-3xl font-extrabold mt-2 text-foreground">{c.val}</h3>
              </div>
              <span className="text-2xl">{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Status Distribution + Tags */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Status Distribution</h3>
              <p className="text-xs text-muted">Ratios based on total series added to library</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Completed", val: statusCounts.completed, color: "bg-amber-400" },
                { label: "Watching", val: statusCounts.watching, color: "bg-purple-400" },
                { label: "Planned", val: statusCounts.planned, color: "bg-blue-400" },
                { label: "Dropped", val: statusCounts.dropped, color: "bg-rose-400" },
              ].map((s, idx) => {
                const pct = getPercent(s.val);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{s.label} ({s.val})</span>
                      <span className="text-muted">{pct}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950/80 rounded-full overflow-hidden border border-border/20">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Top Genre Tags</h3>
              <p className="text-xs text-muted">Most populated categories</p>
            </div>
            {topTags.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No tags assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {topTags.map((tag) => (
                  <div key={tag.id} className="flex justify-between items-center bg-slate-950/20 rounded-xl p-3 border border-border/10">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-xs font-bold text-foreground">{tag.name}</span>
                    </div>
                    <span className="text-xs font-semibold bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-muted">
                      {tag._count.animes} series
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-5">
          <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5 sticky top-[100px]">
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Activity Feed</h3>
              <p className="text-xs text-muted">Latest episode breakdown updates</p>
            </div>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
                <span className="text-4xl mb-3">✍️</span>
                <p className="text-xs">No episode breakdowns cataloged yet.</p>
              </div>
            ) : (
              <div className="relative border-l border-border/30 pl-4 space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="relative space-y-1">
                    <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-accent ring-4 ring-slate-950" />
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <h4 className="text-xs font-bold text-foreground leading-snug">
                      Logged Episode {activity.number}: &ldquo;{activity.title}&rdquo;
                    </h4>
                    <p className="text-[10px] text-muted leading-relaxed">
                      Series: <span className="text-foreground font-semibold">{activity.anime.title}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-12 text-center">
        <p className="text-xs text-muted">Want to track your own anime library?</p>
        <Link
          href="/login"
          className="mt-3 inline-block glow-btn rounded-xl px-6 py-2.5 text-sm font-bold"
        >
          Create Your Anime Index →
        </Link>
      </div>
    </div>
  );
}
