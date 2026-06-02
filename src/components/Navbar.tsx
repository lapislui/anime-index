"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Library", icon: "📚" },
    { href: "/discover", label: "Discover", icon: "🔍" },
    { href: "/organize", label: "Organize", icon: "🏷️" },
    { href: "/news", label: "News", icon: "📰" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
            ✦
          </span>
          <span className="font-sans text-lg font-extrabold tracking-wider text-foreground uppercase group-hover:text-accent transition-colors duration-300">
            Animeverse
          </span>
        </Link>

        {/* Links */}
        <div className="flex gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 border border-transparent ${
                  isActive
                    ? "text-accent bg-accent/5 border-accent/15 shadow-[0_0_15px_rgba(0,229,255,0.05)]"
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
