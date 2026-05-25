import { ExpertCard } from "@/components/experts/expert-card";
import { getExperts } from "@/lib/data";

export default async function ExpertsPage() {
  const experts = await getExperts();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Experts</h1>
        <p className="max-w-2xl text-muted-foreground">
          Secondary profiles linked from topics. The product is organized around topics, not creator hubs.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {experts.map((expert) => (
          <ExpertCard key={expert.slug} expert={expert} />
        ))}
      </div>
    </div>
  );
}
