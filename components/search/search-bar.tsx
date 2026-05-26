"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({
  defaultValue = "",
  variant = "default",
}: {
  defaultValue?: string;
  variant?: "default" | "compact" | "hero";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(query);
  }

  if (variant === "hero") {
    return (
      <form onSubmit={onSubmit} className="relative w-full">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask about fasting, insulin resistance, berberine, walking after meals..."
          className="h-16 rounded-2xl border-2 bg-card pl-6 pr-16 text-base shadow-sm focus-visible:ring-2"
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-xl"
          aria-label="Search"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>
    );
  }

  const compact = variant === "compact";
  return (
    <form onSubmit={onSubmit} className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search topics, protocols, clips..."
        className="bg-card"
      />
      <Button type="submit" className={compact ? "" : "sm:w-auto"}>
        Search
      </Button>
    </form>
  );
}

export function SearchSuggestions({ suggestions }: { suggestions: string[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
          className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
