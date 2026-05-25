# Metabolic Intelligence Platform

A topic-first knowledge platform for metabolic health: curated experts, consensus summaries, searchable clips, and practical protocols.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui
- Supabase (Postgres, Auth, RLS, pgvector hybrid search)
- OpenAI embeddings (background only — no public chatbot)
- Vercel deployment

## Local development

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Fill in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (optional for semantic search; keyword search still works)
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

3. Apply database migrations (Supabase CLI linked to your project):

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

4. Seed curated content:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

Without Supabase configured, the app serves curated YAML seeds from `content/seeds/` so you can preview the MVP immediately.

## Editor access

1. Create a user in Supabase Auth (magic link via `/admin/login`).
2. Set `app_metadata.role` to `editor` in the Supabase dashboard, **or** insert into `editor_profiles`.
3. Use `/admin` to edit topic sections and publish (rebuilds FTS + embeddings).

## Vercel deployment

```bash
vercel link
vercel env pull .env.local
git push && vercel deploy
```

Add the same env vars in the Vercel project settings for Production and Preview.

## Content model

- **Topics** — canonical pages with fixed sections (overview, why it matters, consensus, debate, recommendations, clips)
- **Experts** — secondary profiles linked from topics
- **Protocols** — step-by-step guides linked to supporting topics
- **Search** — hybrid Postgres FTS + pgvector via `search_knowledge` RPC

Seed files live in `content/seeds/*.yaml` and are loaded by `npm run seed`.
