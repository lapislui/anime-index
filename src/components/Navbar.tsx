"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMode } from "@/context/ModeContext";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, setMode } = useMode();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch logged-in user profile on load / pathname changes
  useEffect(() => {
    fetch("/api/auth/logout")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setDropdownOpen(false);
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const links = [
    { href: "/", label: "Discover", icon: "🔍" },
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/library", label: "Library", icon: mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📚" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/organize", label: "Organize", icon: "🏷️" },
    { href: "/news", label: "News", icon: "📰" },
  ];

  const filteredLinks = links.filter((link) => {
    if (mode !== "anime" && (link.label === "Discover" || link.label === "News")) {
      return false;
    }
    if (link.label === "Friends" && !user) {
      return false;
    }
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 py-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        {/* Logo and Mode Switcher */}
        <div className="flex items-center justify-between gap-4">
          <Link href={mode === "anime" ? "/" : "/library"} className="flex items-center gap-2 group">
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

        {/* Links & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 justify-end">
          <div className="flex gap-1 sm:gap-2">
            {filteredLinks.map((link) => {
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

          <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-slate-900/40 px-3 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-white/5 hover:border-accent/30 transition-all duration-300"
              >
                <span>👤</span>
                <span className="hidden md:inline max-w-[120px] truncate">{user.email}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-slate-950/95 p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in-50 slide-in-from-top-1">
                  <div className="px-3 py-2 text-xs text-muted border-b border-border/40 truncate">
                    {user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  >
                    <span>🚪</span> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:opacity-90 transition-all duration-300"
            >
              <span>🔑</span> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
