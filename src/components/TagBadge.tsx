"use client";

interface TagBadgeProps {
  name: string;
  color: string;
  onClick?: () => void;
  active?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

export default function TagBadge({
  name,
  color,
  onClick,
  active,
  removable,
  onRemove,
}: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${active ? "ring-2 ring-offset-1 ring-accent" : ""}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: color,
        border: `1px solid ${color}40`,
      }}
      onClick={onClick}
    >
      {name}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-60"
        >
          ×
        </button>
      )}
    </span>
  );
}
