"use client";

import Link from "next/link";
import TagBadge from "./TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface MovieCardProps {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  tags: Tag[];
  _count: { parts: number };
}

const statusLabels: Record<string, { label: string; className: string }> = {
  watching: { label: "Watching", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  completed: { label: "Watched", className: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  dropped: { label: "Dropped", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
  planned: { label: "Plan to Watch", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
};

export default function MovieCard({
  id,
  title,
  description,
  coverImage,
  status,
  tags,
  _count,
}: MovieCardProps) {
  const statusInfo = statusLabels[status] || statusLabels.watching;

  return (
    <Link href={`/movie/${id}`} className="block">
      <div className="glass-card group overflow-hidden rounded-xl h-full flex flex-col">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-accent/10 to-accent-light/10">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-accent/30">
              🎬
            </div>
          )}
          <span
            className="absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border"
            style={{
              backgroundColor: statusInfo.className.includes("bg-emerald-500")
                ? "rgba(16, 185, 129, 0.1)"
                : statusInfo.className.includes("bg-cyan-500")
                ? "rgba(6, 182, 212, 0.1)"
                : statusInfo.className.includes("bg-rose-500")
                ? "rgba(244, 63, 94, 0.1)"
                : "rgba(245, 158, 11, 0.1)",
              borderColor: statusInfo.className.includes("bg-emerald-500")
                ? "rgba(16, 185, 129, 0.2)"
                : statusInfo.className.includes("bg-cyan-500")
                ? "rgba(6, 182, 212, 0.2)"
                : statusInfo.className.includes("bg-rose-500")
                ? "rgba(244, 63, 94, 0.2)"
                : "rgba(245, 158, 11, 0.2)",
              color: statusInfo.className.includes("bg-emerald-500")
                ? "rgb(52, 211, 153)"
                : statusInfo.className.includes("bg-cyan-500")
                ? "rgb(34, 211, 238)"
                : statusInfo.className.includes("bg-rose-500")
                ? "rgb(251, 113, 133)"
                : "rgb(251, 191, 36)",
            }}
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
          <p className="mt-2 text-[10px] font-medium text-accent">
            {_count.parts} part{_count.parts !== 1 ? "s" : ""} logged
          </p>
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
