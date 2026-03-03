"use client";

import { useState, useRef } from "react";

interface MediaUploadProps {
  episodeId: string;
  onUploaded: () => void;
}

export default function MediaUpload({ episodeId, onUploaded }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<"image" | "clip">("image");
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("episodeId", episodeId);
    formData.append("type", type);
    if (caption) formData.append("caption", caption);

    await fetch("/api/upload", { method: "POST", body: formData });

    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
    onUploaded();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="mb-3 text-sm font-semibold text-foreground">Upload Media</h4>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("image")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              type === "image"
                ? "bg-accent text-white"
                : "bg-background text-muted border border-border"
            }`}
          >
            Image
          </button>
          <button
            type="button"
            onClick={() => setType("clip")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              type === "clip"
                ? "bg-accent text-white"
                : "bg-background text-muted border border-border"
            }`}
          >
            Video Clip
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={type === "image" ? "image/*" : "video/*"}
          className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/20"
        />
        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
