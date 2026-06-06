"use client";

import { useState, useRef, useEffect } from "react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface FilterPanelProps {
  mode: "anime" | "games" | "movies";
  tags: Tag[];
  availableGenres: string[];
  availableYears: number[];
  availableFormats: string[];
  
  selectedGenres: string[];
  setSelectedGenres: (genres: string[]) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
}

export default function FilterPanel({
  mode,
  tags,
  availableGenres,
  availableYears,
  availableFormats,
  selectedGenres,
  setSelectedGenres,
  selectedTags,
  setSelectedTags,
  selectedYear,
  setSelectedYear,
  selectedStatus,
  setSelectedStatus,
  selectedFormat,
  setSelectedFormat,
}: FilterPanelProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const statusOptions = mode === "games" 
    ? [
        { value: "planning", label: "Planning" },
        { value: "playing", label: "Playing" },
        { value: "installed", label: "Installed" },
        { value: "completed", label: "Completed" },
        { value: "backlog", label: "Backlog" },
        { value: "dropped", label: "Dropped" },
        { value: "played", label: "Played" },
        { value: "cant_play", label: "Can't Play" },
      ]
    : mode === "movies"
    ? [
        { value: "watching", label: "Watching" },
        { value: "completed", label: "Watched" },
        { value: "planned", label: "Plan to Watch" },
        { value: "dropped", label: "Dropped" },
      ]
    : [
        { value: "watching", label: "Watching" },
        { value: "completed", label: "Completed" },
        { value: "planned", label: "Planned" },
        { value: "dropped", label: "Dropped" },
      ];

  const formatOptions = mode === "games"
    ? availableFormats.length > 0 ? availableFormats : ["PC", "PlayStation", "Xbox", "Switch", "Mobile", "Retro"]
    : mode === "movies"
    ? availableFormats.length > 0 ? availableFormats : ["Theatrical", "Streaming", "Blu-Ray", "DVD", "Special"]
    : availableFormats.length > 0 ? availableFormats : ["TV", "Movie", "OVA", "ONA", "Special", "Music"];

  return (
    <div ref={dropdownRef} className="glass-panel rounded-2xl p-5 shadow-xl space-y-4 border border-border/40">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
        
        {/* Genres Dropdown */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Genres</label>
          <button
            onClick={() => toggleDropdown("genres")}
            className="flex items-center justify-between w-full rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-xs text-foreground focus:border-accent hover:border-accent/40 focus:outline-none transition-all duration-300 cursor-pointer"
          >
            <span className="truncate">
              {selectedGenres.length === 0 
                ? "Select Genres" 
                : `${selectedGenres.length} Selected`}
            </span>
            <span className={`text-[10px] ml-1 transition-transform ${activeDropdown === "genres" ? "rotate-180" : ""}`}>▼</span>
          </button>
          
          {activeDropdown === "genres" && (
            <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-slate-950 p-2 shadow-2xl">
              {availableGenres.length === 0 ? (
                <p className="text-[10px] text-muted text-center py-2">No genres available</p>
              ) : (
                availableGenres.map((genre) => (
                  <label
                    key={genre}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5 cursor-pointer text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => handleGenreToggle(genre)}
                      className="rounded border-border text-accent focus:ring-accent/20 bg-slate-900 cursor-pointer"
                    />
                    <span>{genre}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tags Dropdown */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Tags</label>
          <button
            onClick={() => toggleDropdown("tags")}
            className="flex items-center justify-between w-full rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-xs text-foreground focus:border-accent hover:border-accent/40 focus:outline-none transition-all duration-300 cursor-pointer"
          >
            <span className="truncate">
              {selectedTags.length === 0 
                ? "Select Tags" 
                : `${selectedTags.length} Selected`}
            </span>
            <span className={`text-[10px] ml-1 transition-transform ${activeDropdown === "tags" ? "rotate-180" : ""}`}>▼</span>
          </button>
          
          {activeDropdown === "tags" && (
            <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-slate-950 p-2 shadow-2xl">
              {tags.length === 0 ? (
                <p className="text-[10px] text-muted text-center py-2">No tags available</p>
              ) : (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5 cursor-pointer text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.name)}
                      onChange={() => handleTagToggle(tag.name)}
                      className="rounded border-border text-accent focus:ring-accent/20 bg-slate-900 cursor-pointer"
                    />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span>{tag.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Year Dropdown */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Year</label>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("year")}
              className="flex items-center justify-between w-full rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-xs text-foreground focus:border-accent hover:border-accent/40 focus:outline-none transition-all duration-300 cursor-pointer"
            >
              <span className="truncate">{selectedYear || "Any year"}</span>
              <span className={`text-[10px] ml-1 transition-transform ${activeDropdown === "year" ? "rotate-180" : ""}`}>▼</span>
            </button>
            {selectedYear && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedYear("");
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                ×
              </button>
            )}
          </div>
          
          {activeDropdown === "year" && (
            <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-slate-950 p-1 shadow-2xl">
              <button
                onClick={() => {
                  setSelectedYear("");
                  setActiveDropdown(null);
                }}
                className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-white/5 text-muted hover:text-foreground"
              >
                Any year
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year.toString());
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-white/5 text-foreground ${
                    selectedYear === year.toString() ? "bg-accent/10 text-accent font-semibold" : ""
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Status</label>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("status")}
              className="flex items-center justify-between w-full rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-xs text-foreground focus:border-accent hover:border-accent/40 focus:outline-none transition-all duration-300 cursor-pointer"
            >
              <span className="truncate">
                {statusOptions.find((opt) => opt.value === selectedStatus)?.label || "Any Status"}
              </span>
              <span className={`text-[10px] ml-1 transition-transform ${activeDropdown === "status" ? "rotate-180" : ""}`}>▼</span>
            </button>
            {selectedStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStatus("");
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                ×
              </button>
            )}
          </div>
          
          {activeDropdown === "status" && (
            <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-border bg-slate-950 p-1 shadow-2xl">
              <button
                onClick={() => {
                  setSelectedStatus("");
                  setActiveDropdown(null);
                }}
                className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-white/5 text-muted hover:text-foreground"
              >
                Any Status
              </button>
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedStatus(opt.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-white/5 text-foreground ${
                    selectedStatus === opt.value ? "bg-accent/10 text-accent font-semibold" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Format Dropdown */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
            {mode === "games" ? "Platform" : "Format"}
          </label>
          <div className="relative">
            <button
              onClick={() => toggleDropdown("format")}
              className="flex items-center justify-between w-full rounded-xl border border-border/80 bg-slate-950/50 px-4 py-2.5 text-xs text-foreground focus:border-accent hover:border-accent/40 focus:outline-none transition-all duration-300 cursor-pointer"
            >
              <span className="truncate">{selectedFormat || (mode === "games" ? "Any Platform" : "Any Format")}</span>
              <span className={`text-[10px] ml-1 transition-transform ${activeDropdown === "format" ? "rotate-180" : ""}`}>▼</span>
            </button>
            {selectedFormat && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFormat("");
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                ×
              </button>
            )}
          </div>
          
          {activeDropdown === "format" && (
            <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-slate-950 p-1 shadow-2xl">
              <button
                onClick={() => {
                  setSelectedFormat("");
                  setActiveDropdown(null);
                }}
                className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-white/5 text-muted hover:text-foreground"
              >
                {mode === "games" ? "Any Platform" : "Any Format"}
              </button>
              {formatOptions.map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    setSelectedFormat(format);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-white/5 text-foreground ${
                    selectedFormat === format ? "bg-accent/10 text-accent font-semibold" : ""
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
