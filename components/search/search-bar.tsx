"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({
  defaultValue = "",
  compact = false,
}: {
  defaultValue?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

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
