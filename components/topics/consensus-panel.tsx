import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/lib/markdown";
import { formatEvidence } from "@/lib/format";
import type { EvidenceLevel } from "@/lib/types";

export function ConsensusPanel({
  consensusMd,
  practicalTakeawayMd,
  evidenceLevel,
}: {
  consensusMd: string;
  practicalTakeawayMd: string;
  evidenceLevel: EvidenceLevel;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Consensus</CardTitle>
          <Badge>{formatEvidence(evidenceLevel)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            General agreement
          </h3>
          <Markdown>{consensusMd}</Markdown>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/60 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Practical takeaway
          </h3>
          <Markdown>{practicalTakeawayMd}</Markdown>
        </div>
      </CardContent>
    </Card>
  );
}
