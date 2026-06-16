"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMode } from "@/context/ModeContext";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, setMode } = useMode();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Initial header entrance animation
  useGSAP(() => {
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power4.out" }
    );
  }, { scope: navRef });

  // Animate profile dropdown
  useEffect(() => {
    if (dropdownOpen && dropdownMenuRef.current) {
      gsap.fromTo(
        dropdownMenuRef.current,
        { scale: 0.9, opacity: 0, y: -10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "back.out(1.5)" }
      );
    }
  }, [dropdownOpen]);

  // Animate mobile menu open/close
  useGSAP(() => {
    if (mobileMenuRef.current) {
      if (mobileMenuOpen) {
        gsap.fromTo(
          mobileMenuRef.current,
          { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" }
        );
        // Stagger mobile links
        gsap.fromTo(
          ".mobile-nav-link",
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out", delay: 0.1 }
        );
      } else {
        gsap.to(mobileMenuRef.current, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
      }
    }
  }, { scope: navRef, dependencies: [mobileMenuOpen] });

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

  // Click outside to close dropdown & mobile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const links = [
    { href: "/", label: "Discover", icon: "🔍" },
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/library", label: "Library", icon: mode === "games" ? "🎮" : mode === "movies" ? "🎬" : "📚" },
    { href: "/collections", label: "Collections", icon: "📂" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/organize", label: "Organize", icon: "🏷️" },
    { href: "/news", label: "News", icon: "📰" },
    { href: "/changelog", label: "Changelog", icon: "🚀" },
  ];

  const filteredLinks = links.filter((link) => {
    if (mode !== "anime" && (link.label === "Discover" || link.label === "News")) {
      return false;
    }
    if ((link.label === "Friends" || link.label === "Collections") && !user) {
      return false;
    }
    return true;
  });

  return (
    <nav ref={navRef} className="sticky top-0 z-50 w-full border-b border-border bg-slate-950/85 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between w-full gap-4">
          
          {/* Left Side: Logo, Mode Switcher, and Nav Links */}
          <div className="flex items-center gap-4 sm:gap-6 justify-start min-w-0 flex-1">
            <Link href={mode === "anime" ? "/" : "/library"} className="flex items-center gap-2 group shrink-0">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                ✦
              </span>
              <span className="font-sans text-sm sm:text-base font-extrabold tracking-wider text-foreground uppercase group-hover:text-accent transition-colors duration-300">
                {mode === "games" ? "Gameverse" : mode === "movies" ? "Cineverse" : "Animeverse"}
              </span>
            </Link>

            {/* Mode Switcher Selector */}
            <div className="relative flex rounded-xl bg-slate-900/60 p-0.5 border border-border/60 shrink-0">
              <button
                onClick={() => setMode("anime")}
                className={`relative z-10 flex items-center gap-1 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  mode === "anime" ? "text-slate-950 font-extrabold" : "text-muted hover:text-foreground"
                }`}
              >
                Anime
              </button>
              <button
                onClick={() => setMode("games")}
                className={`relative z-10 flex items-center gap-1 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  mode === "games" ? "text-slate-950 font-extrabold" : "text-muted hover:text-foreground"
                }`}
              >
                Games
              </button>
              <button
                onClick={() => setMode("movies")}
                className={`relative z-10 flex items-center gap-1 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  mode === "movies" ? "text-slate-950 font-extrabold" : "text-muted hover:text-foreground"
                }`}
              >
                Movies
              </button>
              <div
                className="absolute top-0.5 bottom-0.5 left-0.5 rounded-lg bg-accent transition-all duration-300"
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

            {/* Desktop Navigation Links */}
            <div className="hidden xl:flex items-center gap-1.5 min-w-0">
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-all duration-300 border border-transparent whitespace-nowrap ${
                      isActive
                        ? "text-accent bg-accent/5 border-accent/15 shadow-[0_0_15px_rgba(0,229,255,0.05)]"
                        : "text-muted hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side: Account & Mobile Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
            {/* Desktop Account Button */}
            <div className="hidden xl:block">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-foreground hover:bg-white/5 hover:border-accent/30 transition-all duration-300 cursor-pointer"
                  >
                    <span>👤</span>
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </button>
                  {dropdownOpen && (
                    <div ref={dropdownMenuRef} className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-slate-950/95 p-2 shadow-2xl backdrop-blur-md z-50">
                      <div className="px-3 py-2 text-xs text-muted border-b border-border/40 truncate">
                        {user.email}
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-white/5 transition-colors"
                      >
                        <span>⚙️</span> Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <span>🚪</span> Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-slate-950 hover:opacity-90 transition-all duration-300"
                >
                  <span>🔑</span> Login
                </Link>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex xl:hidden items-center gap-2">
              {user && (
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-slate-900/40 text-xs hover:border-accent/35 transition-colors"
                  title="Profile Settings"
                >
                  👤
                </Link>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-slate-900/40 text-foreground hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Toggle menu"
              >
                <span className="text-sm font-bold">{mobileMenuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      <div
        ref={mobileMenuRef}
        className="xl:hidden w-full overflow-hidden border-t border-border bg-slate-950/95 backdrop-blur-md"
        style={{ height: 0, opacity: 0 }}
      >
        <div className="px-4 py-4 space-y-2">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold border transition-all duration-300 ${
                  isActive
                    ? "text-accent bg-accent/5 border-accent/15 shadow-[0_0_15px_rgba(0,229,255,0.05)]"
                    : "text-muted border-transparent hover:text-foreground hover:bg-white/5"
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="h-px bg-border/40 my-3" />

          {user ? (
            <div className="space-y-2 pt-1">
              <div className="px-4 text-[10px] text-muted truncate">
                Logged in as <span className="font-semibold text-foreground">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="mobile-nav-link flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <span>🚪</span> Log Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="mobile-nav-link flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-bold text-slate-950 hover:opacity-90 transition-all duration-300"
            >
              <span>🔑</span> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
