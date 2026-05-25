import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/lib/markdown";
import { formatConfidence } from "@/lib/format";
import type { ExpertPosition } from "@/lib/types";

export function DebateMatrix({ positions }: { positions: ExpertPosition[] }) {
  if (positions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Expert disagreement notes are being curated for this topic.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {positions.map((position) => (
        <Card key={position.expert_slug} className="bg-card/60">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">
                <Link href={`/experts/${position.expert_slug}`} className="hover:underline">
                  {position.expert_name}
                </Link>
              </CardTitle>
              <Badge variant="outline">{formatConfidence(position.confidence)}</Badge>
            </div>
            <p className="text-sm font-medium text-foreground">{position.stance_summary}</p>
          </CardHeader>
          <CardContent>
            <Markdown>{position.stance_detail_md}</Markdown>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
