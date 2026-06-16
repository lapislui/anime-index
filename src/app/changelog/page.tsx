"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  category: "major" | "minor" | "patch";
  items: {
    type: "feat" | "fix" | "improved" | "refactor";
    text: string;
  }[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: "v1.4.0",
    date: "June 16, 2026",
    title: "Cinematic Motion & Fluid Navigation Update",
    description: "Introduced advanced page routing transitions, smooth-scroll dynamics, dynamic 3D visual card interactions, and an intelligent batch-processing engine for catalog management.",
    category: "major",
    items: [
      { type: "feat", text: "Interactive 3D Perspective Tilt on Media Cards (Anime, Games, Movies) with cursor-relative radial glow reflection overlays." },
      { type: "feat", text: "Integrated smooth scrolling using Lenis, delivering ultra-fluid page scrolling at high refresh rates." },
      { type: "feat", text: "Created global page entry transitions and modular loading boundary skeletons." },
      { type: "feat", text: "Built a fully functional Multi-Select & Bulk Actions Panel in the library catalog, allowing instant status updates and tag assignments in one click." },
      { type: "improved", text: "Redesigned Dashboard UI with customized gradients, real-time status distribution progress meters, and dynamic recent activity logs." },
      { type: "fix", text: "Resolved Prisma multi-to-multi connection queries for custom tags on SQLite databases." },
    ],
  },
  {
    version: "v1.3.0",
    date: "June 10, 2026",
    title: "Collaborative Collections & Friends Hub",
    description: "Bring your visual episode and chapter breakdowns to a joint feed. Work side-by-side with followers in real-time.",
    category: "major",
    items: [
      { type: "feat", text: "Shared Collections: Create catalogs where multiple invited friends can connect their personal log items." },
      { type: "feat", text: "Invitation System: Invite friends you follow to your collection via real-time invitations." },
      { type: "feat", text: "Followers & Following: Search, follow, and keep track of other users' libraries and shared profiles." },
      { type: "improved", text: "Enhanced SQLite indexing for faster loading of combined collection summaries." },
    ],
  },
  {
    version: "v1.2.0",
    date: "May 28, 2026",
    title: "Multi-Media Story Breakdowns",
    description: "Write episode-by-episode or chapter-by-chapter journals and upload screenshots and game clips directly.",
    category: "minor",
    items: [
      { type: "feat", text: "Supports full-length Markdown/HTML breakdown logs for each anime episode and game chapter." },
      { type: "feat", text: "Media Attachment Grid: Add high-quality image frames or video clips to support your breakdowns." },
      { type: "improved", text: "Lazy loading implemented on large media grids to drastically optimize bandwidth." },
    ],
  },
  {
    version: "v1.1.0",
    date: "May 15, 2026",
    title: "Personal Library & Tagging Engine",
    description: "First iteration of catalog sorting, multi-media filters, and custom tag color configurations.",
    category: "minor",
    items: [
      { type: "feat", text: "Fully configurable tagging engine with color pickers for customized dashboard classification." },
      { type: "feat", text: "Separated tabs for Games, Anime, and Movie entries." },
      { type: "improved", text: "Fuzzy search queries implemented on Library catalog fields." },
    ],
  },
];

export default function ChangelogPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "feat" | "fix" | "improved">("all");
  const [activeCategory, setActiveCategory] = useState<"all" | "major" | "minor">("all");

  useGSAP(() => {
    // Initial entrance animations
    gsap.fromTo(
      ".header-el",
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
    );

    gsap.fromTo(
      ".timeline-card",
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.7, stagger: 0.15, ease: "power2.out", delay: 0.2 }
    );
  }, { scope: containerRef, dependencies: [filter, activeCategory] });

  // Filter the items and cards
  const filteredData = changelogData
    .map((entry) => {
      const items = entry.items.filter((item) => {
        if (filter === "all") return true;
        return item.type === filter;
      });
      return { ...entry, items };
    })
    .filter((entry) => {
      if (entry.items.length === 0) return false;
      if (activeCategory === "all") return true;
      return entry.category === activeCategory;
    });

  const getBadgeColor = (type: "feat" | "fix" | "improved" | "refactor") => {
    switch (type) {
      case "feat":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "fix":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "improved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "refactor":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div ref={containerRef} className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="header-el mb-6 inline-flex items-center text-sm font-semibold text-muted hover:text-foreground transition-colors"
      >
        &larr; Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="header-el relative mb-12 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <div className="absolute top-0 right-0 h-40 w-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20">
          Changelog & Updates
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          What&apos;s New in Anime Index
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Follow our timeline of visual interface additions, collaborative mechanics, and core updates.
        </p>

        {/* Filters Panel */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="flex rounded-xl bg-slate-900/60 p-0.5 border border-border/60">
            {(["all", "major", "minor"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-accent text-slate-950 font-extrabold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {cat} Releases
              </button>
            ))}
          </div>

          <div className="flex rounded-xl bg-slate-900/60 p-0.5 border border-border/60">
            {(["all", "feat", "fix", "improved"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  filter === type
                    ? "bg-accent-light text-foreground font-extrabold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {type === "all" ? "All Changes" : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative border-l border-border/40 ml-4 md:ml-32 space-y-12">
        {filteredData.length === 0 ? (
          <div className="glass-panel rounded-2xl py-20 text-center text-muted">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 text-sm font-bold">No updates match your active filters</p>
            <button
              onClick={() => {
                setFilter("all");
                setActiveCategory("all");
              }}
              className="mt-4 text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredData.map((entry) => (
            <div key={entry.version} className="timeline-card relative pl-6 md:pl-8 group">
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-1.5 flex h-4 w-4 rounded-full bg-slate-950 border-2 border-accent group-hover:border-accent-light group-hover:scale-125 transition-all duration-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]" />

              {/* Date Column for larger viewports */}
              <div className="hidden md:block absolute -left-32 top-1 w-24 text-right">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  {entry.date}
                </span>
                <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${
                  entry.category === "major"
                    ? "bg-accent/10 border-accent/20 text-accent"
                    : "bg-slate-800 border-border text-muted"
                }`}>
                  {entry.category}
                </span>
              </div>

              {/* Timeline Glass Card */}
              <div className="glass-panel rounded-2xl p-6 border border-border/60 hover:border-accent/35 hover:shadow-[0_0_35px_rgba(0,229,255,0.05)] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-accent-light/5 rounded-full blur-3xl pointer-events-none" />

                {/* Mobile Date/Category */}
                <div className="md:hidden flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    {entry.date}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${
                    entry.category === "major"
                      ? "bg-accent/10 border-accent/20 text-accent"
                      : "bg-slate-800 border-border text-muted"
                  }`}>
                    {entry.category}
                  </span>
                </div>

                {/* Card Title & Version */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/20 pb-4 mb-4">
                  <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                    {entry.title}
                  </h2>
                  <span className="text-sm font-black text-accent bg-accent/5 px-2.5 py-1 rounded-lg border border-accent/15 self-start">
                    {entry.version}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-muted mb-6">
                  {entry.description}
                </p>

                {/* Entry Bullet Details */}
                <ul className="space-y-3">
                  {entry.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-xs text-foreground/90">
                      <span className={`mt-0.5 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md border shrink-0 ${getBadgeColor(item.type)}`}>
                        {item.type}
                      </span>
                      <span className="leading-relaxed">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
