import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Expert, Protocol, TaxonomyTag, Topic, TopicSection } from "./types";

const seedPath = (...parts: string[]) => path.join(process.cwd(), "content", "seeds", ...parts);

function readYaml<T>(file: string): T {
  return yaml.load(fs.readFileSync(file, "utf8")) as T;
}

type RawTopic = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  evidence_level: Topic["evidence_level"];
  consensus: string;
  practical_takeaway: string;
  sections: Record<string, string>;
  positions: Array<{
    expert: string;
    confidence: Topic["positions"][number]["confidence"];
    stance_summary: string;
    stance_detail: string;
  }>;
  clips: Array<{
    title: string;
    expert: string;
    source_title: string;
    source_type: Topic["clips"][number]["source_type"];
    source_url: string;
    timestamp_start_sec: number;
    timestamp_end_sec?: number;
    transcript_excerpt: string;
  }>;
};

type RawProtocol = {
  slug: string;
  title: string;
  audience: string;
  difficulty: string;
  summary: string;
  body_md: string;
  status: Protocol["status"];
  topics: string[];
  steps: Array<{ title: string; body_md: string }>;
};

const sectionOrder: TopicSection["section_key"][] = [
  "overview",
  "why_it_matters",
  "consensus",
  "debate",
  "recommendations",
];

let cache: { tags: TaxonomyTag[]; experts: Expert[]; topics: Topic[]; protocols: Protocol[] } | null = null;

export function getSeedData() {
  if (cache) return cache;

  const tags = readYaml<TaxonomyTag[]>(seedPath("taxonomy.yaml"));
  const experts = readYaml<Expert[]>(seedPath("experts.yaml"));
  const rawTopics = readYaml<RawTopic[]>(seedPath("topics.yaml"));

  const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));
  const expertBySlug = new Map(experts.map((expert) => [expert.slug, expert]));

  const topics: Topic[] = rawTopics.map((topic) => ({
    slug: topic.slug,
    title: topic.title,
    status: "published",
    summary: topic.summary,
    tags: topic.tags.map((slug) => tagBySlug.get(slug)).filter(Boolean) as TaxonomyTag[],
    evidence_level: topic.evidence_level,
    consensus_md: topic.consensus,
    practical_takeaway_md: topic.practical_takeaway,
    sections: sectionOrder.map((section_key, index) => ({
      section_key,
      body_md: topic.sections[section_key] ?? "",
      sort_order: index,
    })),
    positions: topic.positions.map((position) => {
      const expert = expertBySlug.get(position.expert);
      return {
        expert_slug: position.expert,
        expert_name: expert?.name ?? position.expert,
        confidence: position.confidence,
        stance_summary: position.stance_summary,
        stance_detail_md: position.stance_detail,
      };
    }),
    clips: topic.clips.map((clip, index) => {
      const expert = expertBySlug.get(clip.expert);
      return {
        id: `${topic.slug}-${index}`,
        title: clip.title,
        url: clip.source_url,
        source_title: clip.source_title,
        source_type: clip.source_type,
        expert_slug: clip.expert,
        expert_name: expert?.name,
        timestamp_start_sec: clip.timestamp_start_sec,
        timestamp_end_sec: clip.timestamp_end_sec,
        transcript_excerpt: clip.transcript_excerpt,
      };
    }),
  }));

  const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  const rawProtocols = readYaml<RawProtocol[]>(seedPath("protocols.yaml"));
  const protocols: Protocol[] = rawProtocols.map((protocol) => ({
    slug: protocol.slug,
    title: protocol.title,
    audience: protocol.audience,
    difficulty: protocol.difficulty,
    summary: protocol.summary,
    body_md: protocol.body_md,
    status: protocol.status,
    topics: protocol.topics
      .map((slug) => topicBySlug.get(slug))
      .filter(Boolean)
      .map((topic) => ({ slug: topic!.slug, title: topic!.title, summary: topic!.summary })),
    steps: protocol.steps.map((step, index) => ({ ...step, step_order: index + 1 })),
  }));

  cache = { tags, experts, topics, protocols };
  return cache;
}
