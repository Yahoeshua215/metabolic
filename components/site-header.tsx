import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";

export function SiteHeader({ showSearch = true }: { showSearch?: boolean }) {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Metabolic
            </p>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Intelligence Platform
            </p>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link href="/topics" className="hover:text-foreground">
              Topics
            </Link>
            <Link href="/protocols" className="hover:text-foreground">
              Protocols
            </Link>
            <Link href="/experts" className="hover:text-foreground">
              Experts
            </Link>
          </nav>
        </div>
        {showSearch ? (
          <div className="w-full md:max-w-md">
            <SearchBar />
          </div>
        ) : null}
      </div>
    </header>
  );
}
