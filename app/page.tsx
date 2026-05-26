import Link from "next/link";
import { SearchBar, SearchSuggestions } from "@/components/search/search-bar";
import { getExperts } from "@/lib/data";

const SUGGESTIONS = [
  "Does coffee break a fast?",
  "Berberine for insulin resistance",
  "Walking after meals",
  "Best fasting protocol for beginners",
  "Artificial sweeteners and metabolic health",
];

export default async function HomePage() {
  const experts = await getExperts();
  const featuredExperts = experts.filter((e) => e.is_featured).slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-20 md:px-6 md:py-28">
      <section className="space-y-8 text-center">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Trusted answers from the doctors who actually study this
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Ask anything about fasting or metabolic health.
          </h1>
          <p className="mx-auto max-w-xl text-balance text-lg leading-8 text-muted-foreground">
            Get the moment a real doctor answered your question — embedded, timestamped, with the transcript.
          </p>
        </div>

        <div className="mx-auto max-w-2xl pt-2">
          <SearchBar variant="hero" />
        </div>

        <div className="pt-2">
          <SearchSuggestions suggestions={SUGGESTIONS} />
        </div>
      </section>

      {featuredExperts.length > 0 ? (
        <section className="mt-24 space-y-4 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Curated voices
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {featuredExperts.map((expert) => (
              <Link
                key={expert.slug}
                href={`/experts/${expert.slug}`}
                className="hover:text-foreground hover:underline"
              >
                {expert.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
