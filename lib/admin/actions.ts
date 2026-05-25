"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publishTopic } from "@/lib/admin/publish";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/admin`,
    },
  });

  if (error) return { error: error.message };
  return { success: "Check your email for the magic link." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function publishTopicAction(topicId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await publishTopic(topicId);
  revalidatePath("/");
  revalidatePath("/topics");
  revalidatePath("/search");
  revalidatePath("/admin");
}

export async function updateTopicSectionAction(
  topicId: string,
  sectionKey: string,
  bodyMd: string,
) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");

  const { error } = await admin
    .from("topic_sections")
    .upsert(
      {
        topic_id: topicId,
        section_key: sectionKey,
        body_md: bodyMd,
        sort_order: ["overview", "why_it_matters", "consensus", "debate", "recommendations"].indexOf(
          sectionKey,
        ),
      },
      { onConflict: "topic_id,section_key" },
    );

  if (error) throw error;
  revalidatePath("/admin");
}
