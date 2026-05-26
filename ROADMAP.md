# Metabolic Intelligence — Product Roadmap

## Vision

Ask-first interface for metabolic health and fasting questions. Answers are evidence — embedded YouTube clips cued to the exact moment a trusted doctor makes the point — not AI prose.

## Phase 1 — Prompt-first search with embedded clip results

Reuse the existing data model (`Clip` already has expert, YouTube URL, `timestamp_start_sec`, `transcript_excerpt`) and the existing Supabase `search_knowledge` RPC.

Changes:
- Replace small `SearchBar` on `/` with a large prompt-style input as the hero.
- Rewrite `/search` results page to:
  - Return top 10 clip-type results (deprioritize topic/protocol cards for now).
  - Group by expert (one section per doctor, doctor name + photo as the header).
  - Embed YouTube clips inline using `https://www.youtube.com/embed/<id>?start=<sec>` instead of text snippets.
  - Keep the transcript excerpt as the caption under each video.
- Tune the RPC ranking so clip results bubble to the top.

**Clip data backfill (decided)**: every seed `source_url` today is a YouTube *search* link, not a watch URL. Backfill plan: write a one-off `scripts/fetch-youtube-ids.ts` that extracts the search query from each URL, calls YouTube Data API v3 `search.list` (top result, video only), and rewrites `content/seeds/topics.yaml` with real `watch?v=<id>` URLs. Requires `YOUTUBE_API_KEY` env var. Caveat: existing `timestamp_start_sec` values were written against the *intended* video, so they may not align with the auto-picked one — accept noise for Phase 1, curate the worst offenders manually after we see the live UX.

## Phase 2 — LLM-synthesized answer above the evidence

Layer on top of Phase 1. Keep the clip grid; add a short synthesized answer above it.

Changes:
- New API route that takes the query + top-K clip transcripts, calls a model (start: Vercel AI Gateway with a low-cost model), and returns a 2–3 sentence answer with inline citations pointing at the clip cards below.
- Guardrails: prompt the model to only cite the provided clips, refuse to answer if evidence is thin, keep tone clinical (no "AI slop" — the home page literally promises this).
- Cost controls: cache answers by normalized query + clip-set hash via the Vercel Runtime Cache.

Deferred until after Phase 1 ships: streaming the answer, follow-up questions, conversation history.

## Out of scope for now

- Personalization, user accounts on the search side (admin login stays).
- Protocols and Topics pages as primary surfaces — they remain accessible but the home page leads with search.
- Multi-modal (audio summaries, transcripts beyond excerpts).
