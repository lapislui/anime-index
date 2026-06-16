"use client";

import Link from "next/link";
import TagBadge from "./TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface GameCardProps {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  tags: Tag[];
  _count: { chapters: number };
  playedWith?: { email: string } | null;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  playing: { label: "Playing", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  played: { label: "Played", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  backlog: { label: "Backlog", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  cant_play: { label: "Can't Play", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
  planning: { label: "Planning", className: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
  installed: { label: "Installed", className: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
  completed: { label: "Completed", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  dropped: { label: "Dropped", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
};

export default function GameCard({
  id,
  title,
  description,
  coverImage,
  status,
  tags,
  _count,
  playedWith,
  selectable,
  selected,
  onSelect,
}: GameCardProps) {
  const statusInfo = statusLabels[status] || statusLabels.playing;

  const handleClick = (e: React.MouseEvent) => {
    if (selectable) {
      e.preventDefault();
      onSelect?.(id, !selected);
    }
  };

  return (
    <Link href={selectable ? "#" : `/game/${id}`} onClick={handleClick} className="block">
      <div className={`glass-card group overflow-hidden rounded-xl h-full flex flex-col ${selected ? 'border-accent ring-1 ring-accent/30' : ''}`}>
        {/* Cover Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-accent/10 to-accent-light/10">
          {selectable && (
            <div className="absolute left-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect?.(id, e.target.checked)}
                className="h-5 w-5 rounded border-border bg-slate-900 text-accent focus:ring-accent accent-accent cursor-pointer"
              />
            </div>
          )}
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-accent/30">
              🎮
            </div>
          )}
          <span
            className={`absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-1 group-hover:text-accent transition-colors duration-300">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed flex-1">{description}</p>
          )}
          <div className="mt-2 flex flex-col gap-0.5">
            <p className="text-[10px] font-medium text-accent">
              {_count.chapters} journal log{_count.chapters !== 1 ? "s" : ""}
            </p>
            {playedWith && (
              <p className="text-[10px] text-muted-light flex items-center gap-1">
                <span>👥 Co-op:</span>
                <span className="text-accent-light font-bold truncate">{playedWith.email.split("@")[0]}</span>
              </p>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] text-muted self-center ml-1">+{tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
