import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { getSeedData } from "../lib/seed-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMBEDDING_MODEL = "text-embedding-3-small";

async function embed(text: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return response.data[0]?.embedding ?? null;
}

async function main() {
  const { tags, experts, topics, protocols } = getSeedData();

  for (const [index, tag] of tags.entries()) {
    const { error } = await supabase.from("taxonomy_tags").upsert(
      { slug: tag.slug, label: tag.label, sort_order: index },
      { onConflict: "slug" },
    );
    if (error) throw error;
  }

  const tagRows = await supabase.from("taxonomy_tags").select("id, slug");
  const tagIdBySlug = new Map((tagRows.data ?? []).map((row) => [row.slug, row.id]));

  for (const expert of experts) {
    const { error } = await supabase.from("experts").upsert(
      {
        slug: expert.slug,
        name: expert.name,
        title: expert.title,
        philosophy_summary_md: expert.philosophy_summary_md,
        major_themes: expert.major_themes,
        fasting_position_md: expert.fasting_position_md,
        supplement_position_md: expert.supplement_position_md,
        is_featured: expert.is_featured,
      },
      { onConflict: "slug" },
    );
    if (error) throw error;
  }

  const expertRows = await supabase.from("experts").select("id, slug");
  const expertIdBySlug = new Map((expertRows.data ?? []).map((row) => [row.slug, row.id]));

  for (const topic of topics) {
    const searchDocument = [
      topic.title,
      topic.summary,
      topic.consensus_md,
      topic.practical_takeaway_md,
      ...topic.sections.map((section) => section.body_md),
      ...topic.positions.map((position) => `${position.stance_summary} ${position.stance_detail_md}`),
    ].join("\n");

    const embedding = await embed(searchDocument);

    const { data: topicRow, error: topicError } = await supabase
      .from("topics")
      .upsert(
        {
          slug: topic.slug,
          title: topic.title,
          status: "published",
          summary: topic.summary,
          search_document: searchDocument,
          embedding,
          embedding_model: embedding ? EMBEDDING_MODEL : null,
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (topicError || !topicRow) throw topicError ?? new Error(`Failed seeding topic ${topic.slug}`);

    await supabase.from("topic_consensus").upsert(
      {
        topic_id: topicRow.id,
        general_consensus_md: topic.consensus_md,
        practical_takeaway_md: topic.practical_takeaway_md,
        evidence_level: topic.evidence_level,
      },
      { onConflict: "topic_id" },
    );

    for (const section of topic.sections) {
      await supabase.from("topic_sections").upsert(
        {
          topic_id: topicRow.id,
          section_key: section.section_key,
          body_md: section.body_md,
          sort_order: section.sort_order,
        },
        { onConflict: "topic_id,section_key" },
      );
    }

    await supabase.from("topic_tags").delete().eq("topic_id", topicRow.id);
    for (const tag of topic.tags) {
      const tagId = tagIdBySlug.get(tag.slug);
      if (!tagId) continue;
      await supabase.from("topic_tags").insert({ topic_id: topicRow.id, tag_id: tagId });
    }

    await supabase.from("expert_positions").delete().eq("topic_id", topicRow.id);
    for (const position of topic.positions) {
      const expertId = expertIdBySlug.get(position.expert_slug);
      if (!expertId) continue;
      await supabase.from("expert_positions").insert({
        expert_id: expertId,
        topic_id: topicRow.id,
        stance_summary: position.stance_summary,
        stance_detail_md: position.stance_detail_md,
        confidence: position.confidence,
      });
    }

    const existingClipLinks = await supabase
      .from("clip_topics")
      .select("clip_id")
      .eq("topic_id", topicRow.id);
    const clipIds = (existingClipLinks.data ?? []).map((row) => row.clip_id);
    if (clipIds.length > 0) {
      await supabase.from("clip_topics").delete().eq("topic_id", topicRow.id);
      await supabase.from("clips").delete().in("id", clipIds);
    }

    for (const clip of topic.clips) {
      const sourceSlug = `${topic.slug}-${clip.source_title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const { data: sourceRow, error: sourceError } = await supabase
        .from("sources")
        .upsert(
          {
            slug: sourceSlug,
            title: clip.source_title,
            type: clip.source_type,
            url: clip.url,
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single();

      if (sourceError || !sourceRow) throw sourceError ?? new Error("Source upsert failed");

      const expertId = clip.expert_slug ? expertIdBySlug.get(clip.expert_slug) : null;
      const clipEmbedding = await embed(`${clip.title}\n${clip.transcript_excerpt}`);

      const { data: clipRow, error: clipError } = await supabase
        .from("clips")
        .insert({
          source_id: sourceRow.id,
          expert_id: expertId,
          title: clip.title,
          url: clip.url,
          timestamp_start_sec: clip.timestamp_start_sec,
          timestamp_end_sec: clip.timestamp_end_sec ?? null,
          transcript_excerpt: clip.transcript_excerpt,
          status: "published",
          embedding: clipEmbedding,
          embedding_model: clipEmbedding ? EMBEDDING_MODEL : null,
        })
        .select("id")
        .single();

      if (clipError || !clipRow) throw clipError ?? new Error("Clip insert failed");

      await supabase.from("clip_topics").insert({
        clip_id: clipRow.id,
        topic_id: topicRow.id,
        relevance: 1,
      });
    }
  }

  for (const protocol of protocols) {
    const searchDocument = [
      protocol.title,
      protocol.summary,
      protocol.body_md,
      ...protocol.steps.map((step) => `${step.title} ${step.body_md}`),
    ].join("\n");

    const { data: protocolRow, error } = await supabase
      .from("protocols")
      .upsert(
        {
          slug: protocol.slug,
          title: protocol.title,
          audience: protocol.audience,
          difficulty: protocol.difficulty,
          summary: protocol.summary,
          body_md: protocol.body_md,
          status: protocol.status,
          search_document: searchDocument,
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !protocolRow) throw error ?? new Error(`Failed seeding protocol ${protocol.slug}`);

    await supabase.from("protocol_steps").delete().eq("protocol_id", protocolRow.id);
    for (const step of protocol.steps) {
      await supabase.from("protocol_steps").insert({
        protocol_id: protocolRow.id,
        step_order: step.step_order,
        title: step.title,
        body_md: step.body_md,
      });
    }

    await supabase.from("protocol_topic_links").delete().eq("protocol_id", protocolRow.id);
    const topicRows = await supabase.from("topics").select("id, slug");
    const topicIdBySlug = new Map((topicRows.data ?? []).map((row) => [row.slug, row.id]));
    for (const topic of protocol.topics) {
      const topicId = topicIdBySlug.get(topic.slug);
      if (!topicId) continue;
      await supabase.from("protocol_topic_links").insert({
        protocol_id: protocolRow.id,
        topic_id: topicId,
      });
    }
  }

  console.log(
    `Seeded ${tags.length} tags, ${experts.length} experts, ${topics.length} topics, ${protocols.length} protocols.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
