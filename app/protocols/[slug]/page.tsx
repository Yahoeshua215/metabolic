import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/lib/markdown";
import { getProtocol, getProtocols } from "@/lib/data";

export async function generateStaticParams() {
  const protocols = await getProtocols();
  return protocols.map((protocol) => ({ slug: protocol.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const protocol = await getProtocol(slug);
  if (!protocol) return { title: "Protocol not found" };
  return { title: protocol.title, description: protocol.summary };
}

export default async function ProtocolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const protocol = await getProtocol(slug);
  if (!protocol) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 md:px-6">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{protocol.difficulty}</Badge>
          <Badge variant="secondary">{protocol.audience}</Badge>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">{protocol.title}</h1>
        <p className="text-lg leading-8 text-muted-foreground">{protocol.summary}</p>
      </header>

      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Markdown>{protocol.body_md}</Markdown>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Steps</h2>
        {protocol.steps.map((step) => (
          <Card key={step.step_order} className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">
                {step.step_order}. {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Markdown>{step.body_md}</Markdown>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Supported topics</h2>
        <div className="flex flex-wrap gap-2">
          {protocol.topics.map((topic) => (
            <Badge key={topic.slug} variant="outline">
              <Link href={`/topics/${topic.slug}`}>{topic.title}</Link>
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
