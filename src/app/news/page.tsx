"use client";

import { useState } from "react";

interface NewsArticle {
  title: string;
  image: string;
  desc: string;
  category: string;
  date: string;
}

const newsData: NewsArticle[] = [
  {
    title: "Solo Leveling Season 2 Announced",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200",
    desc: "The massively popular Solo Leveling anime officially receives Season 2 confirmation. Production begins in 2025.",
    category: "Announcements",
    date: "May 28, 2026",
  },
  {
    title: "Demon Slayer Infinity Castle Movie Release",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200",
    desc: "New Demon Slayer movie arc gets official release date. Expected to be the most expensive anime film.",
    category: "Movies",
    date: "May 25, 2026",
  },
  {
    title: "Chainsaw Man Movie Visual Reveal",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=1200",
    desc: "MAPPA reveals stunning teaser visuals for the upcoming Chainsaw Man movie. Expected late 2026.",
    category: "Movies",
    date: "May 22, 2026",
  },
  {
    title: "MyAnimeList Rankings Updated",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200",
    desc: "Latest MyAnimeList and AniList rankings are now available. See what topped the charts this season.",
    category: "Rankings",
    date: "May 20, 2026",
  },
  {
    title: "New Studio Founded by Former Bones Directors",
    image: "https://images.unsplash.com/photo-1535016120754-fd58615ccbfd?q=80&w=1200",
    desc: "A new animation studio is founded with legendary directors from Bones. First project announced.",
    category: "Industry",
    date: "May 18, 2026",
  },
  {
    title: "Anime Collaboration Crossover Event",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200",
    desc: "Major anime franchises collaborate for limited-time crossover. Exclusive merchandise and content coming.",
    category: "Events",
    date: "May 15, 2026",
  },
];

export default function NewsPage() {
  const [articles] = useState<NewsArticle[]>(newsData);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20">
          Industry updates
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Anime News Hub
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Keep pace with global film dates, studio releases, manga crossovers, and trending rankings.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, idx) => (
          <div key={idx} className="glass-card group flex flex-col justify-between overflow-hidden rounded-2xl">
            <div>
              <div className="relative h-48 overflow-hidden bg-slate-900 border-b border-border/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image}
                  alt={article.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
                <span className="absolute left-3 top-3 rounded-lg bg-accent-light/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
                  {article.category}
                </span>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{article.date}</p>
                <h3 className="mt-2 text-lg font-bold text-foreground leading-snug group-hover:text-accent transition-colors duration-300">
                  {article.title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {article.desc}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`"${article.title}" is currently a mocked news item. Stay tuned!`);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-light transition-colors group-hover:translate-x-1 duration-300"
              >
                Read Full Article &rarr;
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
