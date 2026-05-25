create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.content_status as enum ('draft', 'published');
create type public.evidence_level as enum ('high', 'moderate', 'limited', 'mixed');
create type public.section_key as enum ('overview', 'why_it_matters', 'consensus', 'debate', 'recommendations');
create type public.expert_confidence as enum ('agrees', 'cautious', 'disagrees', 'context_dependent');
create type public.source_type as enum ('podcast', 'youtube', 'book', 'article');
create type public.search_entity_type as enum ('topic', 'clip', 'protocol');

create table public.taxonomy_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  parent_id uuid references public.taxonomy_tags(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status public.content_status not null default 'draft',
  summary text not null default '',
  search_document text not null default '',
  search_vector tsvector generated always as (to_tsvector('english', coalesce(search_document, ''))) stored,
  embedding extensions.vector(1536),
  embedding_model text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topic_tags (
  topic_id uuid not null references public.topics(id) on delete cascade,
  tag_id uuid not null references public.taxonomy_tags(id) on delete cascade,
  primary key (topic_id, tag_id)
);

create table public.topic_sections (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  section_key public.section_key not null,
  body_md text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, section_key)
);

create table public.topic_consensus (
  topic_id uuid primary key references public.topics(id) on delete cascade,
  general_consensus_md text not null default '',
  practical_takeaway_md text not null default '',
  evidence_level public.evidence_level not null default 'limited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  title text not null default '',
  photo_url text,
  philosophy_summary_md text not null default '',
  major_themes text[] not null default '{}',
  fasting_position_md text not null default '',
  supplement_position_md text not null default '',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expert_positions (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  stance_summary text not null default '',
  stance_detail_md text not null default '',
  confidence public.expert_confidence not null default 'context_dependent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expert_id, topic_id)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type public.source_type not null,
  url text not null,
  publisher text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  expert_id uuid references public.experts(id) on delete set null,
  title text not null,
  url text not null,
  timestamp_start_sec integer not null default 0,
  timestamp_end_sec integer,
  transcript_excerpt text not null default '',
  status public.content_status not null default 'draft',
  search_vector tsvector generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(transcript_excerpt, ''))) stored,
  embedding extensions.vector(1536),
  embedding_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clip_topics (
  clip_id uuid not null references public.clips(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  relevance numeric(3,2) not null default 1.0 check (relevance >= 0 and relevance <= 1),
  primary key (clip_id, topic_id)
);

create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  audience text not null default '',
  difficulty text not null default 'beginner',
  summary text not null default '',
  body_md text not null default '',
  status public.content_status not null default 'draft',
  search_document text not null default '',
  search_vector tsvector generated always as (to_tsvector('english', coalesce(search_document, ''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.protocol_steps (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  step_order integer not null,
  title text not null,
  body_md text not null default '',
  unique (protocol_id, step_order)
);

create table public.protocol_topic_links (
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (protocol_id, topic_id)
);

create table public.search_events (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  result_count integer not null default 0,
  clicked_slug text,
  created_at timestamptz not null default now()
);

create index taxonomy_tags_slug_idx on public.taxonomy_tags(slug);
create index topics_status_slug_idx on public.topics(status, slug);
create index topics_search_vector_idx on public.topics using gin(search_vector);
create index topics_embedding_idx on public.topics using hnsw (embedding extensions.vector_cosine_ops);
create index topic_sections_topic_sort_idx on public.topic_sections(topic_id, sort_order);
create index expert_positions_topic_idx on public.expert_positions(topic_id);
create index clips_status_idx on public.clips(status);
create index clips_search_vector_idx on public.clips using gin(search_vector);
create index clips_embedding_idx on public.clips using hnsw (embedding extensions.vector_cosine_ops);
create index protocols_status_slug_idx on public.protocols(status, slug);
create index protocols_search_vector_idx on public.protocols using gin(search_vector);

create table public.editor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'editor', false)
    or exists (
      select 1
      from public.editor_profiles ep
      where ep.user_id = auth.uid()
    );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger taxonomy_tags_touch before update on public.taxonomy_tags for each row execute function public.touch_updated_at();
create trigger topics_touch before update on public.topics for each row execute function public.touch_updated_at();
create trigger topic_sections_touch before update on public.topic_sections for each row execute function public.touch_updated_at();
create trigger topic_consensus_touch before update on public.topic_consensus for each row execute function public.touch_updated_at();
create trigger experts_touch before update on public.experts for each row execute function public.touch_updated_at();
create trigger expert_positions_touch before update on public.expert_positions for each row execute function public.touch_updated_at();
create trigger sources_touch before update on public.sources for each row execute function public.touch_updated_at();
create trigger clips_touch before update on public.clips for each row execute function public.touch_updated_at();
create trigger protocols_touch before update on public.protocols for each row execute function public.touch_updated_at();

create or replace function public.rebuild_topic_search_document(p_topic_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  doc text;
begin
  select concat_ws(' ', t.title, t.summary, tc.general_consensus_md, tc.practical_takeaway_md, string_agg(ts.body_md, ' '), string_agg(ep.stance_summary || ' ' || ep.stance_detail_md, ' '))
    into doc
  from topics t
  left join topic_consensus tc on tc.topic_id = t.id
  left join topic_sections ts on ts.topic_id = t.id
  left join expert_positions ep on ep.topic_id = t.id
  where t.id = p_topic_id
  group by t.id, tc.general_consensus_md, tc.practical_takeaway_md;

  update topics set search_document = coalesce(doc, '') where id = p_topic_id;
end;
$$;

create or replace function public.search_knowledge(
  p_query text,
  p_embedding extensions.vector(1536) default null,
  p_limit integer default 12
)
returns table (
  entity_type public.search_entity_type,
  slug text,
  title text,
  snippet text,
  url text,
  expert_name text,
  timestamp_start_sec integer,
  score double precision
)
language sql
stable
as $$
  with q as (
    select websearch_to_tsquery('english', coalesce(nullif(trim(p_query), ''), 'metabolic health')) as tsq
  ), topic_hits as (
    select
      'topic'::public.search_entity_type as entity_type,
      t.slug,
      t.title,
      t.summary as snippet,
      '/topics/' || t.slug as url,
      null::text as expert_name,
      null::integer as timestamp_start_sec,
      (
        0.6 * ts_rank(t.search_vector, q.tsq) +
        case when p_embedding is null or t.embedding is null then 0 else 0.4 * (1 - (t.embedding <=> p_embedding)) end
      )::double precision as score
    from topics t, q
    where t.status = 'published' and (t.search_vector @@ q.tsq or p_embedding is not null)
    order by score desc
    limit p_limit
  ), clip_hits as (
    select
      'clip'::public.search_entity_type as entity_type,
      c.id::text as slug,
      c.title,
      c.transcript_excerpt as snippet,
      c.url,
      e.name as expert_name,
      c.timestamp_start_sec,
      (
        0.6 * ts_rank(c.search_vector, q.tsq) +
        case when p_embedding is null or c.embedding is null then 0 else 0.4 * (1 - (c.embedding <=> p_embedding)) end
      )::double precision as score
    from clips c
    join q on true
    left join experts e on e.id = c.expert_id
    where c.status = 'published' and (c.search_vector @@ q.tsq or p_embedding is not null)
    order by score desc
    limit p_limit
  ), protocol_hits as (
    select
      'protocol'::public.search_entity_type as entity_type,
      p.slug,
      p.title,
      p.summary as snippet,
      '/protocols/' || p.slug as url,
      null::text as expert_name,
      null::integer as timestamp_start_sec,
      ts_rank(p.search_vector, q.tsq)::double precision as score
    from protocols p, q
    where p.status = 'published' and p.search_vector @@ q.tsq
    order by score desc
    limit p_limit
  )
  select * from (
    select * from topic_hits
    union all select * from clip_hits
    union all select * from protocol_hits
  ) hits
  order by score desc
  limit p_limit;
$$;

alter table public.taxonomy_tags enable row level security;
alter table public.topics enable row level security;
alter table public.topic_tags enable row level security;
alter table public.topic_sections enable row level security;
alter table public.topic_consensus enable row level security;
alter table public.experts enable row level security;
alter table public.expert_positions enable row level security;
alter table public.sources enable row level security;
alter table public.clips enable row level security;
alter table public.clip_topics enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_steps enable row level security;
alter table public.protocol_topic_links enable row level security;
alter table public.search_events enable row level security;
alter table public.editor_profiles enable row level security;

create policy "Public can read taxonomy" on public.taxonomy_tags for select using (true);
create policy "Public can read published topics" on public.topics for select using (status = 'published' or public.is_editor());
create policy "Public can read topic tags" on public.topic_tags for select using (exists (select 1 from public.topics t where t.id = topic_id and (t.status = 'published' or public.is_editor())));
create policy "Public can read published topic sections" on public.topic_sections for select using (exists (select 1 from public.topics t where t.id = topic_id and (t.status = 'published' or public.is_editor())));
create policy "Public can read published consensus" on public.topic_consensus for select using (exists (select 1 from public.topics t where t.id = topic_id and (t.status = 'published' or public.is_editor())));
create policy "Public can read experts" on public.experts for select using (true);
create policy "Public can read published expert positions" on public.expert_positions for select using (exists (select 1 from public.topics t where t.id = topic_id and (t.status = 'published' or public.is_editor())));
create policy "Public can read sources" on public.sources for select using (true);
create policy "Public can read published clips" on public.clips for select using (status = 'published' or public.is_editor());
create policy "Public can read clip topics" on public.clip_topics for select using (exists (select 1 from public.clips c where c.id = clip_id and (c.status = 'published' or public.is_editor())));
create policy "Public can read published protocols" on public.protocols for select using (status = 'published' or public.is_editor());
create policy "Public can read protocol steps" on public.protocol_steps for select using (exists (select 1 from public.protocols p where p.id = protocol_id and (p.status = 'published' or public.is_editor())));
create policy "Public can read protocol topic links" on public.protocol_topic_links for select using (exists (select 1 from public.protocols p where p.id = protocol_id and (p.status = 'published' or public.is_editor())));

create policy "Anyone can log search events" on public.search_events for insert with check (true);
create policy "Editors can read search events" on public.search_events for select using (public.is_editor());
create policy "Editors manage taxonomy" on public.taxonomy_tags for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage topics" on public.topics for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage topic tags" on public.topic_tags for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage sections" on public.topic_sections for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage consensus" on public.topic_consensus for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage experts" on public.experts for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage positions" on public.expert_positions for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage sources" on public.sources for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage clips" on public.clips for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage clip topics" on public.clip_topics for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage protocols" on public.protocols for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage protocol steps" on public.protocol_steps for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors manage protocol links" on public.protocol_topic_links for all using (public.is_editor()) with check (public.is_editor());
create policy "Editors can read editor profiles" on public.editor_profiles for select using (public.is_editor());
