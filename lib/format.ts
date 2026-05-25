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
