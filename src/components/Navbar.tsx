"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMode } from "@/context/ModeContext";

export default function Navbar() {
  const pathname = usePathname();
  const { mode, setMode } = useMode();

  const links = [
    { href: "/", label: "Library", icon: mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📚" },
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/discover", label: "Discover", icon: "🔍" },
    { href: "/organize", label: "Organize", icon: "🏷️" },
    { href: "/news", label: "News", icon: "📰" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 py-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        {/* Logo and Mode Switcher */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              ✦
            </span>
            <span className="font-sans text-lg font-extrabold tracking-wider text-foreground uppercase group-hover:text-accent transition-colors duration-300">
              {mode === "games" ? "Gameverse" : mode === "movies" ? "Cineverse" : "Animeverse"}
            </span>
          </Link>

          {/* Mode Switcher Selector */}
          <div className="relative flex rounded-xl bg-slate-900/60 p-0.5 border border-border/60">
            <button
              onClick={() => setMode("anime")}
              className={`relative z-10 flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                mode === "anime" ? "text-slate-950 font-extrabold" : "text-muted hover:text-foreground"
              }`}
            >
              Anime
            </button>
            <button
              onClick={() => setMode("games")}
              className={`relative z-10 flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                mode === "games" ? "text-slate-950 font-extrabold" : "text-muted hover:text-foreground"
              }`}
            >
              Games
            </button>
            <button
              onClick={() => setMode("movies")}
              className={`relative z-10 flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                mode === "movies" ? "text-slate-950 font-extrabold" : "text-muted hover:text-foreground"
              }`}
            >
              Movies
            </button>
            <div
              className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-lg bg-accent transition-all duration-300`}
              style={{
                width: "calc(33.333% - 0.333rem)",
                transform:
                  mode === "games"
                    ? "translateX(calc(100% + 0.25rem))"
                    : mode === "movies"
                    ? "translateX(calc(200% + 0.5rem))"
                    : "translateX(0%)",
              }}
            />
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-1 sm:gap-2 justify-end">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 border border-transparent ${
                  isActive
                    ? "text-accent bg-accent/5 border-accent/15 shadow-[0_0_15px_rgba(var(--accent-rgb,0,229,255),0.05)]"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                <span>{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

