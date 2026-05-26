import { youtubeEmbedUrl, youtubeVideoId } from "@/lib/format";

export function YouTubeEmbed({
  url,
  startSec,
  title,
}: {
  url: string;
  startSec?: number | null;
  title?: string;
}) {
  const videoId = youtubeVideoId(url);
  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-sm text-primary hover:underline"
      >
        Watch on YouTube →
      </a>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-border/70 bg-card">
      <iframe
        className="aspect-video w-full"
        src={youtubeEmbedUrl(videoId, startSec)}
        title={title ?? "YouTube clip"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
