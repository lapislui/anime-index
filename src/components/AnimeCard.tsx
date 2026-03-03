"use client";

import Link from "next/link";
import TagBadge from "./TagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface AnimeCardProps {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  tags: Tag[];
  _count: { episodes: number };
}

const statusLabels: Record<string, { label: string; className: string }> = {
  watching: { label: "Watching", className: "bg-green-100 text-green-700" },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-700" },
  dropped: { label: "Dropped", className: "bg-red-100 text-red-700" },
  planned: { label: "Planned", className: "bg-yellow-100 text-yellow-700" },
};

export default function AnimeCard({
  id,
  title,
  description,
  coverImage,
  status,
  tags,
  _count,
}: AnimeCardProps) {
  const statusInfo = statusLabels[status] || statusLabels.watching;

  return (
    <Link href={`/anime/${id}`}>
      <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-accent/20 to-accent-light/20">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-accent/40">
              🎬
            </div>
          )}
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-1">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{description}</p>
          )}
          <p className="mt-2 text-xs text-muted">
            {_count.episodes} episode{_count.episodes !== 1 ? "s" : ""}
          </p>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-muted">+{tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
