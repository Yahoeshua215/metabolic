import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProtocols, getTags, getTopics } from "@/lib/data";

export default async function HomePage() {
  const [topics, protocols, tags] = await Promise.all([getTopics(), getProtocols(), getTags()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
      <section className="mx-auto max-w-3xl space-y-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Trusted guidance for metabolic health
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          A curated intelligence platform for fasting, nutrition, and metabolic health.
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Search structured topics, compare expert consensus and disagreement, and follow practical protocols — without noise, tribes, or AI slop.
        </p>
        <div className="pt-2">
          <SearchBar />
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-3xl">{topics.length}</CardTitle>
            <p className="text-sm text-muted-foreground">Published topics</p>
          </CardHeader>
        </Card>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-3xl">{protocols.length}</CardTitle>
            <p className="text-sm text-muted-foreground">Structured protocols</p>
          </CardHeader>
        </Card>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-3xl">{tags.length}</CardTitle>
            <p className="text-sm text-muted-foreground">Taxonomy tags</p>
          </CardHeader>
        </Card>
      </section>

      <section className="mt-14 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Featured topics</h2>
          <Link href="/topics" className="text-sm text-primary hover:underline">
            Browse all topics
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {topics.slice(0, 6).map((topic) => (
            <Card key={topic.slug} className="bg-card/60">
              <CardHeader>
                <CardTitle className="text-xl">
                  <Link href={`/topics/${topic.slug}`} className="hover:underline">
                    {topic.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-muted-foreground">{topic.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
