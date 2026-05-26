import type { EvidenceLevel, ExpertConfidence } from "./types";

export function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatEvidence(level: EvidenceLevel) {
  const labels: Record<EvidenceLevel, string> = {
    high: "High evidence",
    moderate: "Moderate evidence",
    limited: "Limited evidence",
    mixed: "Mixed evidence",
  };
  return labels[level];
}

export function formatConfidence(confidence: ExpertConfidence) {
  const labels: Record<ExpertConfidence, string> = {
    agrees: "Generally agrees",
    cautious: "More cautious",
    disagrees: "Disagrees",
    context_dependent: "Context-dependent",
  };
  return labels[confidence];
}

export function clipUrlWithTimestamp(url: string, timestampStartSec: number) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${timestampStartSec}`;
  }
  return url;
}

export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/v/")) return u.pathname.split("/")[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(videoId: string, startSec?: number | null) {
  const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
  return startSec ? `${base}?start=${Math.floor(startSec)}` : base;
}
