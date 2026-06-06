"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AppMode = "anime" | "games" | "movies";

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("appMode") as AppMode;
      if (saved === "anime" || saved === "games" || saved === "movies") return saved;
    }
    return "anime";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (mode === "games") {
      document.documentElement.style.setProperty("--accent", "#ff007f"); // Pink/Rose for games
      document.documentElement.style.setProperty("--accent-light", "#ec4899"); // Fuchsia/Pink
    } else if (mode === "movies") {
      document.documentElement.style.setProperty("--accent", "#eab308"); // Neon Gold/Amber for movies
      document.documentElement.style.setProperty("--accent-light", "#ca8a04"); // Gold
    } else {
      document.documentElement.style.setProperty("--accent", "#00e5ff"); // Cyan for anime
      document.documentElement.style.setProperty("--accent-light", "#8b5cf6"); // Purple/Indigo
    }
  }, [mode, mounted]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem("appMode", newMode);
    // Dispatch custom event to notify other components in case they are not in the react tree
    window.dispatchEvent(new Event("appModeChanged"));
  };

  const toggleMode = () => {
    setMode(mode === "anime" ? "games" : mode === "games" ? "movies" : "anime");
  };

  // Avoid hydration mismatch by waiting until mounted
  return (
    <ModeContext.Provider value={{ mode: mounted ? mode : "anime", setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
