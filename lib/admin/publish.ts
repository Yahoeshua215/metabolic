import OpenAI from "openai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const EMBEDDING_MODEL = "text-embedding-3-small";

export async function rebuildTopicSearchDocument(topicId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin.rpc("rebuild_topic_search_document", { p_topic_id: topicId });
}

export async function embedTopic(topicId: string, text: string) {
  const admin = createSupabaseAdminClient();
  if (!admin || !process.env.OPENAI_API_KEY) return null;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) return null;

  await admin
    .from("topics")
    .update({ embedding, embedding_model: EMBEDDING_MODEL })
    .eq("id", topicId);

  return embedding;
}

export async function publishTopic(topicId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable");

  const { data: topic, error } = await admin
    .from("topics")
    .select("id, title, summary, search_document")
    .eq("id", topicId)
    .single();

  if (error || !topic) throw error ?? new Error("Topic not found");

  await rebuildTopicSearchDocument(topicId);

  const { data: refreshed } = await admin
    .from("topics")
    .select("search_document, title, summary")
    .eq("id", topicId)
    .single();

  const embedText = [refreshed?.title, refreshed?.summary, refreshed?.search_document]
    .filter(Boolean)
    .join("\n");

  await embedTopic(topicId, embedText);

  await admin
    .from("topics")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", topicId);
}
