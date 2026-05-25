import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { updateTopicSectionAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hasSupabaseEnv } from "@/lib/supabase/server";

const sections = [
  "overview",
  "why_it_matters",
  "consensus",
  "debate",
  "recommendations",
] as const;

export default async function AdminTopicEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!hasSupabaseEnv()) redirect("/admin");

  const { slug } = await params;
  const { user, isEditor, supabase } = await getAdminSession();
  if (!user) redirect("/admin/login");
  if (!isEditor || !supabase) redirect("/admin");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, title, topic_sections(section_key, body_md)")
    .eq("slug", slug)
    .single();

  if (!topic) notFound();

  const sectionMap = new Map(
    (topic.topic_sections ?? []).map((section: { section_key: string; body_md: string }) => [
      section.section_key,
      section.body_md,
    ]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{topic.title}</h2>
        <p className="text-sm text-muted-foreground">{topic.slug}</p>
      </div>

      {sections.map((sectionKey) => (
        <Card key={sectionKey} className="bg-card/60">
          <CardHeader>
            <CardTitle className="capitalize">{sectionKey.replaceAll("_", " ")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                const body = String(formData.get("body_md") ?? "");
                await updateTopicSectionAction(topic.id, sectionKey, body);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor={sectionKey}>Markdown</Label>
                <Textarea
                  id={sectionKey}
                  name="body_md"
                  defaultValue={sectionMap.get(sectionKey) ?? ""}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <Button type="submit" size="sm">
                Save section
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
