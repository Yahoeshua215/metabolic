import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clipUrlWithTimestamp, formatTimestamp } from "@/lib/format";
import type { Clip } from "@/lib/types";

export function ClipCard({ clip }: { clip: Clip }) {
  const href = clipUrlWithTimestamp(clip.url, clip.timestamp_start_sec);

  return (
    <Card className="bg-card/50">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{clip.source_type}</Badge>
          {clip.expert_name ? <Badge variant="outline">{clip.expert_name}</Badge> : null}
          <Badge variant="outline">{formatTimestamp(clip.timestamp_start_sec)}</Badge>
        </div>
        <CardTitle className="text-lg">{clip.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{clip.source_title}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <blockquote className="border-l-2 border-primary/40 pl-4 text-sm italic leading-7 text-muted-foreground">
          {clip.transcript_excerpt}
        </blockquote>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Open source at timestamp
          <ExternalLink className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
