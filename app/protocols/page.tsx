import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProtocols } from "@/lib/data";

export default async function ProtocolsPage() {
  const protocols = await getProtocols();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Protocols</h1>
        <p className="max-w-2xl text-muted-foreground">
          Practical, non-extreme guides supported by curated expert consensus.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {protocols.map((protocol) => (
          <Card key={protocol.slug} className="bg-card/60">
            <CardHeader className="gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{protocol.difficulty}</Badge>
                <Badge variant="secondary">{protocol.audience}</Badge>
              </div>
              <CardTitle className="text-xl">
                <Link href={`/protocols/${protocol.slug}`} className="hover:underline">
                  {protocol.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">{protocol.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
