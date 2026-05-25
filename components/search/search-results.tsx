import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format";
import type { SearchResult } from "@/lib/types";

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

  return (
    <div className="grid gap-4">
      {results.map((result) => (
        <Card key={`${result.entity_type}-${result.slug}`} className="border-border/70 bg-card/60">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {result.entity_type}
              </Badge>
              {result.expert_name ? (
                <Badge variant="outline">{result.expert_name}</Badge>
              ) : null}
              {result.timestamp_start_sec != null ? (
                <Badge variant="outline">{formatTimestamp(result.timestamp_start_sec)}</Badge>
              ) : null}
            </div>
            <CardTitle className="text-xl">
              <Link href={result.url} className="hover:underline">
                {result.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{result.snippet}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
