import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format";
import type { SearchResult } from "@/lib/types";
import { YouTubeEmbed } from "./youtube-embed";

const CLIP_LIMIT = 10;

export function SearchResults({ results, query }: { results: SearchResult[]; query: string }) {
  if (!query.trim()) {
    return (
      <p className="text-muted-foreground">
        Try searches like &quot;coffee during fasting&quot;, &quot;berberine&quot;, or &quot;walking after meals&quot;.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-muted-foreground">
        No results for <span className="font-medium text-foreground">&quot;{query}&quot;</span>. Try a broader metabolic-health term.
      </p>
    );
  }

  const clips = results.filter((r) => r.entity_type === "clip").slice(0, CLIP_LIMIT);
  const other = results.filter((r) => r.entity_type !== "clip");
  const groupedByExpert = groupBy(clips, (c) => c.expert_name?.trim() || "Unattributed");

  return (
    <div className="space-y-12">
      {clips.length > 0 ? (
        <section className="space-y-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Top {clips.length} clip{clips.length === 1 ? "" : "s"}, grouped by doctor
          </h2>
          {Array.from(groupedByExpert.entries()).map(([expert, expertClips]) => (
            <ExpertGroup key={expert} expert={expert} clips={expertClips} />
          ))}
        </section>
      ) : null}

      {other.length > 0 ? (
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Related reading
          </h2>
          <div className="grid gap-3">
            {other.map((result) => (
              <Link
                key={`${result.entity_type}-${result.slug}`}
                href={result.url}
                className="rounded-lg border border-border/70 bg-card/60 p-4 transition hover:border-foreground/30"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {result.entity_type}
                  </Badge>
                </div>
                <p className="font-medium">{result.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.snippet}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ExpertGroup({ expert, clips }: { expert: string; clips: SearchResult[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
          {initials(expert)}
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{expert}</h3>
        <span className="text-xs text-muted-foreground">
          {clips.length} clip{clips.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {clips.map((clip) => (
          <ClipCard key={`${clip.slug}-${clip.timestamp_start_sec ?? 0}`} clip={clip} />
        ))}
      </div>
    </div>
  );
}

function ClipCard({ clip }: { clip: SearchResult }) {
  return (
    <Card className="overflow-hidden bg-card/60">
      <YouTubeEmbed
        url={clip.url}
        startSec={clip.timestamp_start_sec}
        title={clip.title}
      />
      <CardHeader className="gap-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {clip.timestamp_start_sec != null ? (
            <Badge variant="outline">{formatTimestamp(clip.timestamp_start_sec)}</Badge>
          ) : null}
        </div>
        <CardTitle className="text-base leading-snug">{clip.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{clip.snippet}</p>
      </CardContent>
    </Card>
  );
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const existing = map.get(k);
    if (existing) existing.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
