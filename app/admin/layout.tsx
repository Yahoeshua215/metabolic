import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Internal</p>
          <h1 className="text-2xl font-semibold">Editor CMS</h1>
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin/login" className="hover:text-foreground">
            Login
          </Link>
          <Link href="/" className="hover:text-foreground">
            View site
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
