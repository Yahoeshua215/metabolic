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
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Unified results across topics, clips, and protocols.
        </p>
      </div>
      <div className="mt-6">
        <SearchBar defaultValue={query} />
      </div>
      <div className="mt-8">
        <SearchResults results={results} query={query} />
      </div>
    </div>
  );
}
