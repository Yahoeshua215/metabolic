import { createSupabaseAnonClient } from "./supabase/server";
import { getSeedData } from "./seed-data";
import type { Expert, Protocol, TaxonomyTag, Topic } from "./types";

export async function getTopics(): Promise<Topic[]> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return getSeedData().topics;

  const { data, error } = await supabase
    .from("topics")
    .select(`
      slug,title,status,summary,
      topic_tags(taxonomy_tags(slug,label)),
      topic_consensus(general_consensus_md,practical_takeaway_md,evidence_level),
      topic_sections(section_key,body_md,sort_order),
      expert_positions(confidence,stance_summary,stance_detail_md,experts(slug,name)),
      clip_topics(clips(id,title,url,timestamp_start_sec,timestamp_end_sec,transcript_excerpt,sources(title,type,url),experts(slug,name)))
    `)
    .eq("status", "published")
    .order("title");

  if (error || !data) return getSeedData().topics;
  return data.map(mapTopicFromSupabase);
}

export async function getTopic(slug: string): Promise<Topic | null> {
  const topics = await getTopics();
  return topics.find((topic) => topic.slug === slug) ?? null;
}

export async function getExperts(): Promise<Expert[]> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return getSeedData().experts;

  const { data, error } = await supabase.from("experts").select("*").order("is_featured", { ascending: false }).order("name");
  if (error || !data) return getSeedData().experts;
  return data as Expert[];
}

export async function getExpert(slug: string): Promise<Expert | null> {
  const experts = await getExperts();
  return experts.find((expert) => expert.slug === slug) ?? null;
}

export async function getProtocols(): Promise<Protocol[]> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return getSeedData().protocols;

  const { data, error } = await supabase
    .from("protocols")
    .select(`
      slug,title,audience,difficulty,summary,body_md,status,
      protocol_steps(title,body_md,step_order),
      protocol_topic_links(topics(slug,title,summary))
    `)
    .eq("status", "published")
    .order("title");

  if (error || !data) return getSeedData().protocols;
  return data.map((protocol: any) => ({
    slug: protocol.slug,
    title: protocol.title,
    audience: protocol.audience,
    difficulty: protocol.difficulty,
    summary: protocol.summary,
    body_md: protocol.body_md,
    status: protocol.status,
    steps: [...(protocol.protocol_steps ?? [])].sort((a, b) => a.step_order - b.step_order),
    topics: (protocol.protocol_topic_links ?? []).map((link: any) => link.topics).filter(Boolean),
  }));
}

export async function getProtocol(slug: string): Promise<Protocol | null> {
  const protocols = await getProtocols();
  return protocols.find((protocol) => protocol.slug === slug) ?? null;
}

export async function getTags(): Promise<TaxonomyTag[]> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return getSeedData().tags;

  const { data, error } = await supabase.from("taxonomy_tags").select("slug,label").order("sort_order");
  if (error || !data) return getSeedData().tags;
  return data as TaxonomyTag[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTopicFromSupabase(row: any): Topic {
  const rawConsensus = row.topic_consensus;
  const consensus = Array.isArray(rawConsensus)
    ? rawConsensus[0]
    : rawConsensus ?? {};
  return {
    slug: row.slug as string,
    title: row.title as string,
    status: row.status as Topic["status"],
    summary: row.summary as string,
    tags: (row.topic_tags ?? []).map((entry: any) => entry.taxonomy_tags).filter(Boolean),
    evidence_level: (consensus.evidence_level ?? "limited") as Topic["evidence_level"],
    consensus_md: (consensus.general_consensus_md ?? "") as string,
    practical_takeaway_md: (consensus.practical_takeaway_md ?? "") as string,
    sections: [...(row.topic_sections ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
    positions: (row.expert_positions ?? []).map((position: any) => ({
      expert_slug: position.experts?.slug ?? "",
      expert_name: position.experts?.name ?? "Unknown expert",
      confidence: position.confidence,
      stance_summary: position.stance_summary,
      stance_detail_md: position.stance_detail_md,
    })),
    clips: (row.clip_topics ?? [])
      .map((link: any) => link.clips)
      .filter(Boolean)
      .map((clip: any) => ({
        id: clip.id,
        title: clip.title,
        url: clip.url || clip.sources?.url,
        source_title: clip.sources?.title ?? "Source",
        source_type: clip.sources?.type ?? "youtube",
        expert_slug: clip.experts?.slug,
        expert_name: clip.experts?.name,
        timestamp_start_sec: clip.timestamp_start_sec,
        timestamp_end_sec: clip.timestamp_end_sec,
        transcript_excerpt: clip.transcript_excerpt,
      })),
  };
}
