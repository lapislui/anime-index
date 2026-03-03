"use client";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  caption: string | null;
}

interface MediaGalleryProps {
  media: MediaItem[];
  onDelete?: (id: string) => void;
}

export default function MediaGallery({ media, onDelete }: MediaGalleryProps) {
  if (media.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {media.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-lg border border-border"
        >
          {item.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.caption || "Episode media"}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <video
              src={item.url}
              controls
              className="aspect-video w-full object-cover"
            />
          )}
          {item.caption && (
            <p className="bg-card/90 px-2 py-1 text-xs text-muted">
              {item.caption}
            </p>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="absolute right-1 top-1 hidden rounded-full bg-red-500 px-2 py-0.5 text-xs text-white opacity-90 transition-opacity hover:opacity-100 group-hover:block"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
