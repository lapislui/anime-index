"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMode } from "@/context/ModeContext";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useMode();

  useEffect(() => {
    // 1. Anime related pages
    const isAnimePage =
      pathname === "/" ||
      pathname === "/news" ||
      pathname.startsWith("/watch/") ||
      pathname.startsWith("/anime/");

    if (isAnimePage && mode !== "anime") {
      router.replace("/library");
      return;
    }

    // 2. Game related pages
    const isGamePage = pathname.startsWith("/game/") || pathname === "/game/new";
    if (isGamePage && mode !== "games") {
      router.replace("/library");
      return;
    }

    // 3. Movie related pages
    const isMoviePage = pathname.startsWith("/movie/") || pathname === "/movie/new";
    if (isMoviePage && mode !== "movies") {
      router.replace("/library");
      return;
    }
  }, [pathname, mode, router]);

  return <>{children}</>;
}
