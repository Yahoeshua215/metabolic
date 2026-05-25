import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTags, getTopics } from "@/lib/data";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const params = await searchParams;
  const [topics, tags] = await Promise.all([getTopics(), getTags()]);
  const filtered = params.tag
    ? topics.filter((topic) => topic.tags.some((tag) => tag.slug === params.tag))
    : topics;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Topics</h1>
        <p className="max-w-2xl text-muted-foreground">
          Organized around problems and metabolic questions — not personalities.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Badge variant={!params.tag ? "default" : "outline"}>
          <Link href="/topics">All</Link>
        </Badge>
        {tags.map((tag) => (
          <Badge key={tag.slug} variant={params.tag === tag.slug ? "default" : "outline"}>
            <Link href={`/topics?tag=${tag.slug}`}>{tag.label}</Link>
          </Badge>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {filtered.map((topic) => (
          <Card key={topic.slug} className="bg-card/60">
            <CardHeader>
              <CardTitle className="text-xl">
                <Link href={`/topics/${topic.slug}`} className="hover:underline">
                  {topic.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">{topic.summary}</p>
              <div className="flex flex-wrap gap-2">
                {topic.tags.map((tag) => (
                  <Badge key={tag.slug} variant="secondary">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
