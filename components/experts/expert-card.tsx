import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/lib/markdown";
import type { Expert } from "@/lib/types";

export function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle className="text-xl">
          <Link href={`/experts/${expert.slug}`} className="hover:underline">
            {expert.name}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{expert.title}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {expert.major_themes.slice(0, 4).map((theme) => (
            <Badge key={theme} variant="secondary">
              {theme}
            </Badge>
          ))}
        </div>
        <div className="line-clamp-4 text-sm text-muted-foreground">
          <Markdown>{expert.philosophy_summary_md}</Markdown>
        </div>
      </CardContent>
    </Card>
  );
}
