import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/lib/markdown";
import { getExpert, getExperts } from "@/lib/data";

export async function generateStaticParams() {
  const experts = await getExperts();
  return experts.map((expert) => ({ slug: expert.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expert = await getExpert(slug);
  if (!expert) return { title: "Expert not found" };
  return { title: expert.name, description: expert.title };
}

export default async function ExpertPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expert = await getExpert(slug);
  if (!expert) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 md:px-6">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{expert.name}</h1>
        <p className="text-lg text-muted-foreground">{expert.title}</p>
        <div className="flex flex-wrap gap-2">
          {expert.major_themes.map((theme) => (
            <Badge key={theme} variant="secondary">
              {theme}
            </Badge>
          ))}
        </div>
      </header>

      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <Markdown>{expert.philosophy_summary_md}</Markdown>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Fasting position</CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown>{expert.fasting_position_md}</Markdown>
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Supplement position</CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown>{expert.supplement_position_md}</Markdown>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
