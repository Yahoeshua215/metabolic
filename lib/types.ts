export type EvidenceLevel = "high" | "moderate" | "limited" | "mixed";
export type ContentStatus = "draft" | "published";
export type ExpertConfidence = "agrees" | "cautious" | "disagrees" | "context_dependent";
export type SourceType = "podcast" | "youtube" | "book" | "article";
export type EntityType = "topic" | "clip" | "protocol";

export type TaxonomyTag = {
  slug: string;
  label: string;
};

export type Expert = {
  slug: string;
  name: string;
  title: string;
  photo_url?: string | null;
  philosophy_summary_md: string;
  major_themes: string[];
  fasting_position_md: string;
  supplement_position_md: string;
  is_featured: boolean;
};

export type TopicSectionKey = "overview" | "why_it_matters" | "consensus" | "debate" | "recommendations";

export type TopicSection = {
  section_key: TopicSectionKey;
  body_md: string;
  sort_order: number;
};

export type ExpertPosition = {
  expert_slug: string;
  expert_name: string;
  confidence: ExpertConfidence;
  stance_summary: string;
  stance_detail_md: string;
};

export type Clip = {
  id?: string;
  title: string;
  url: string;
  source_title: string;
  source_type: SourceType;
  expert_slug?: string;
  expert_name?: string;
  timestamp_start_sec: number;
  timestamp_end_sec?: number | null;
  transcript_excerpt: string;
};

export type Topic = {
  slug: string;
  title: string;
  status: ContentStatus;
  summary: string;
  tags: TaxonomyTag[];
  evidence_level: EvidenceLevel;
  consensus_md: string;
  practical_takeaway_md: string;
  sections: TopicSection[];
  positions: ExpertPosition[];
  clips: Clip[];
};

export type ProtocolStep = {
  title: string;
  body_md: string;
  step_order: number;
};

export type Protocol = {
  slug: string;
  title: string;
  audience: string;
  difficulty: string;
  summary: string;
  body_md: string;
  status: ContentStatus;
  topics: Pick<Topic, "slug" | "title" | "summary">[];
  steps: ProtocolStep[];
};

export type SearchResult = {
  entity_type: EntityType;
  slug: string;
  title: string;
  snippet: string;
  url: string;
  expert_name?: string | null;
  timestamp_start_sec?: number | null;
  score: number;
};
