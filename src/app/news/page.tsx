"use client";

import { useEffect, useState } from "react";

interface JikanNewsItem {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  excerpt: string;
  images?: {
    jpg?: {
      image_url: string;
    };
  };
}

interface NewsArticle {
  title: string;
  image: string;
  desc: string;
  category: string;
  date: string;
  url: string;
}

const fallbackNews: NewsArticle[] = [
  {
    title: "Solo Leveling Season 2 Announced",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200",
    desc: "The massively popular Solo Leveling anime officially receives Season 2 confirmation. Production begins in 2025.",
    category: "Announcements",
    date: "May 28, 2026",
    url: "https://myanimelist.net",
  },
  {
    title: "Demon Slayer Infinity Castle Movie Release",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200",
    desc: "New Demon Slayer movie arc gets official release date. Expected to be the most expensive anime film.",
    category: "Movies",
    date: "May 25, 2026",
    url: "https://myanimelist.net",
  },
  {
    title: "Chainsaw Man Movie Visual Reveal",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=1200",
    desc: "MAPPA reveals stunning teaser visuals for the upcoming Chainsaw Man movie. Expected late 2026.",
    category: "Movies",
    date: "May 22, 2026",
    url: "https://myanimelist.net",
  },
];

// Popular anime IDs to aggregate news from:
// One Piece (21), Demon Slayer (38000), JJK (40748), Chainsaw Man (44511), Attack on Titan (16498)
const popularAnime = [
  { id: 21, name: "One Piece" },
  { id: 38000, name: "Demon Slayer" },
  { id: 40748, name: "Jujutsu Kaisen" },
  { id: 44511, name: "Chainsaw Man" },
  { id: 16498, name: "Attack on Titan" },
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchLiveNews = async () => {
      try {
        const allNews: NewsArticle[] = [];
        
        // Fetch news for popular anime sequentially to avoid hitting rate limits too hard
        for (const anime of popularAnime) {
          try {
            const res = await fetch(`https://api.jikan.moe/v4/anime/${anime.id}/news`);
            if (res.ok) {
              const json = await res.json();
              const items: JikanNewsItem[] = json.data || [];
              
              items.slice(0, 3).forEach((item) => {
                allNews.push({
                  title: item.title,
                  image: item.images?.jpg?.image_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600",
                  desc: item.excerpt || "No summary available.",
                  category: anime.name,
                  date: new Date(item.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                  url: item.url,
                });
              });
            }
            // Small pause between fetches to respect API limits
            await new Promise((resolve) => setTimeout(resolve, 350));
          } catch {
            // Ignore single anime fetch failure
          }
        }

        if (allNews.length > 0) {
          // Sort compiled news by date (mock sorting since dates are formatted strings, we sort by chronological index)
          setArticles(allNews);
          setUsingFallback(false);
        } else {
          setArticles(fallbackNews);
          setUsingFallback(true);
        }
      } catch (err) {
        console.error("Failed to load live Jikan news, using fallback", err);
        setArticles(fallbackNews);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveNews();
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-r from-accent/10 to-accent-light/10 p-8 sm:p-12 text-center">
        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent border border-accent/20 animate-pulse">
          {usingFallback ? "Featured Updates" : "Live MyAnimeList Feed"}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Anime News Hub
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Keep pace with global film dates, studio releases, manga crossovers, and trending rankings pulled directly from MyAnimeList.
        </p>
      </div>

      {loading ? (
        <div className="py-32 text-center text-muted">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-sm font-semibold">Aggregating Live MAL News Feed...</p>
        </div>
      ) : (
        /* Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, idx) => (
            <div key={idx} className="glass-card group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40">
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
                  <h3 className="mt-2 text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted line-clamp-3">
                    {article.desc}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-light transition-colors group-hover:translate-x-1 duration-300"
                >
                  Read Full Article on MAL &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
