import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";
import { searchKnowledge } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const results = query ? await searchKnowledge(query) : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <SearchBar variant="hero" defaultValue={query} />
      <p className="mt-3 text-sm text-muted-foreground">
        {query ? (
          <>Showing answers for <span className="font-medium text-foreground">&quot;{query}&quot;</span></>
        ) : (
          <>Ask anything about fasting, insulin, or metabolic health.</>
        )}
      </p>
      <div className="mt-8">
        <SearchResults results={results} query={query} />
      </div>
    </div>
  );
}
