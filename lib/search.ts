import OpenAI from "openai";
import { getProtocols, getTopics } from "./data";
import { createSupabaseServerClient } from "./supabase/server";
import type { SearchResult } from "./types";

export async function searchKnowledge(query: string, limit = 20): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    try {
      const embedding = await embedQuery(trimmed);
      const { data, error } = await supabase.rpc("search_knowledge", {
        p_query: trimmed,
        p_embedding: embedding,
        p_limit: limit,
      });
      if (!error && data) {
        await supabase.from("search_events").insert({ query: trimmed, result_count: data.length });
        return data as SearchResult[];
      }
    } catch {
      // Fall back to curated seed search when env or remote search is unavailable.
    }
  }

  return localSearch(trimmed, limit);
}

async function embedQuery(query: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({ model: "text-embedding-3-small", input: query });
  return response.data[0]?.embedding ?? null;
}

async function localSearch(query: string, limit: number): Promise<SearchResult[]> {
  const [topics, protocols] = await Promise.all([getTopics(), getProtocols()]);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scoreText = (text: string) => terms.reduce((score, term) => score + (text.toLowerCase().includes(term) ? 1 : 0), 0);

  const topicResults = topics.map((topic) => {
    const haystack = [topic.title, topic.summary, topic.consensus_md, topic.practical_takeaway_md, topic.sections.map((section) => section.body_md).join(" "), topic.tags.map((tag) => tag.label).join(" ")].join(" ");
    return {
      entity_type: "topic" as const,
      slug: topic.slug,
      title: topic.title,
      snippet: topic.summary,
      url: `/topics/${topic.slug}`,
      expert_name: null,
      timestamp_start_sec: null,
      score: scoreText(haystack),
    };
  });

  const clipResults = topics.flatMap((topic) =>
    topic.clips.map((clip) => ({
      entity_type: "clip" as const,
      slug: clip.id ?? clip.title,
      title: clip.title,
      snippet: clip.transcript_excerpt,
      url: clip.url,
      expert_name: clip.expert_name,
      timestamp_start_sec: clip.timestamp_start_sec,
      score: scoreText([clip.title, clip.transcript_excerpt, clip.expert_name ?? "", topic.title].join(" ")),
    })),
  );

  const protocolResults = protocols.map((protocol) => ({
    entity_type: "protocol" as const,
    slug: protocol.slug,
    title: protocol.title,
    snippet: protocol.summary,
    url: `/protocols/${protocol.slug}`,
    expert_name: null,
    timestamp_start_sec: null,
    score: scoreText([protocol.title, protocol.summary, protocol.body_md, protocol.steps.map((step) => step.body_md).join(" ")].join(" ")),
  }));

  return [...topicResults, ...clipResults, ...protocolResults]
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
