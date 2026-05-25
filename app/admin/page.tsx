import Link from "next/link";
import { signOut } from "@/lib/admin/actions";
import { getAdminSession } from "@/lib/admin/auth";
import { publishTopicAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import { getSeedData } from "@/lib/seed-data";

export default async function AdminDashboardPage() {
  const configured = hasSupabaseEnv();
  const { user, isEditor, supabase } = await getAdminSession();

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supabase not configured</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Copy <code>.env.example</code> to <code>.env.local</code> and add your Supabase + OpenAI keys.</p>
          <p>Until then, the public site runs from curated YAML seeds in <code>content/seeds/</code>.</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!isEditor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Editor access required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Signed in as {user.email}, but this account is not an editor.</p>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const { data: topics } = await supabase!
    .from("topics")
    .select("id, slug, title, status")
    .order("title");

  const seed = getSeedData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Seed content</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Run <code className="text-foreground">npm run seed</code> after migrations to load{" "}
          {seed.tags.length} tags, {seed.experts.length} experts, {seed.topics.length} topics, and{" "}
          {seed.protocols.length} protocols.
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {(topics ?? []).map((topic) => (
          <Card key={topic.id} className="bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{topic.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{topic.slug}</p>
              </div>
              <Badge variant={topic.status === "published" ? "default" : "outline"}>
                {topic.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/topics/${topic.slug}`}>Edit sections</Link>
              </Button>
              {topic.status !== "published" ? (
                <form
                  action={async () => {
                    "use server";
                    await publishTopicAction(topic.id);
                  }}
                >
                  <Button type="submit" size="sm">
                    Publish
                  </Button>
                </form>
              ) : (
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/topics/${topic.slug}`}>View live</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
