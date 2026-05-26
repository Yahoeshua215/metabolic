import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { YoutubeTranscript } from "youtube-transcript";

type Clip = {
  title: string;
  expert: string;
  source_title: string;
  source_type: string;
  source_url: string;
  timestamp_start_sec: number;
  timestamp_end_sec?: number;
  transcript_excerpt: string;
};

type Position = {
  expert: string;
  confidence?: string;
  stance_summary?: string;
  stance_detail?: string;
};

type Topic = {
  slug: string;
  title: string;
  clips: Clip[];
  positions?: Position[];
  [key: string]: unknown;
};

type Expert = { slug: string; name: string; [key: string]: unknown };

const TOPICS_PATH = path.join(process.cwd(), "content", "seeds", "topics.yaml");
const EXPERTS_PATH = path.join(process.cwd(), "content", "seeds", "experts.yaml");

const args = parseArgs(process.argv.slice(2));
const limit = args.limit ?? 1;
const dryRun = args.dryRun;
const expand = args.expand;

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.error("Missing YOUTUBE_API_KEY (load via: tsx --env-file=.env.local scripts/backfill-clips.ts)");
  process.exit(1);
}

async function main() {
  const raw = fs.readFileSync(TOPICS_PATH, "utf8");
  const topics = yaml.load(raw) as Topic[];

  if (expand) {
    await runExpand(topics);
    return;
  }

  if (args.refreshBroken) {
    await runRefreshBroken(topics);
    return;
  }

  if (args.addInterviews) {
    await runAddInterviews(topics);
    return;
  }

  let edited = raw;

  let processed = 0;
  let updated = 0;

  for (const topic of topics) {
    for (const clip of topic.clips ?? []) {
      if (processed >= limit) break;

      const query = extractSearchQuery(clip.source_url);
      if (!query) continue;

      processed += 1;
      console.log(`\n[${topic.slug}] clip "${clip.title}"`);
      console.log(`  query: ${query}`);

      try {
        const videoId = await findTopVideo(query);
        if (!videoId) {
          console.log("  no video found, skipping");
          continue;
        }
        console.log(`  videoId: ${videoId}`);

        const segments = await YoutubeTranscript.fetchTranscript(videoId);
        console.log(`  transcript: ${segments.length} segments`);

        const match = findBestSegment(segments, clip.transcript_excerpt);
        // youtube-transcript returns offset in milliseconds; convert to seconds for YouTube embed.
        const offset = match ? Math.floor(match.offset / 1000) : 0;
        if (!match) {
          console.log("  no transcript match, using offset 0");
        } else {
          console.log(`  matched offset ${offset}s (score ${match.score})`);
          console.log(`  matched text: ${match.text.slice(0, 120)}...`);
        }

        edited = replaceClipFields(edited, clip.source_url, clip.timestamp_start_sec, {
          newUrl: `https://www.youtube.com/watch?v=${videoId}`,
          newOffset: offset,
        });
        updated += 1;
      } catch (err) {
        console.log(`  error: ${(err as Error).message}`);
      }
    }
    if (processed >= limit) break;
  }

  console.log(`\nProcessed ${processed} clip(s), updated ${updated}.`);
  if (dryRun) {
    console.log("--dry-run: skipping write");
    return;
  }
  if (updated > 0) {
    fs.writeFileSync(TOPICS_PATH, edited);
    console.log(`Wrote ${TOPICS_PATH}`);
  }
}

function replaceClipFields(
  source: string,
  oldUrl: string,
  oldOffset: number,
  { newUrl, newOffset }: { newUrl: string; newOffset: number },
): string {
  // Match the unique source_url line, then the next timestamp_start_sec line below it.
  // YAML structure for each clip:
  //       source_url: <oldUrl>
  //       timestamp_start_sec: <oldOffset>
  const urlPattern = new RegExp(
    `(\\bsource_url:\\s*)${escapeRegex(oldUrl)}([\\s\\S]*?\\btimestamp_start_sec:\\s*)${oldOffset}\\b`,
  );
  const replaced = source.replace(urlPattern, (_match, before, between) => `${before}${newUrl}${between}${newOffset}`);
  if (replaced === source) {
    throw new Error(`Failed to replace clip block for url=${oldUrl}`);
  }
  return replaced;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function runAddInterviews(topics: Topic[]) {
  const experts = yaml.load(fs.readFileSync(EXPERTS_PATH, "utf8")) as Expert[];
  const nameBySlug = new Map(experts.map((e) => [e.slug, e.name]));

  let attempted = 0;
  let added = 0;

  for (const topic of topics) {
    if (attempted >= limit) break;

    const clipsByExpert = new Map<string, Clip[]>();
    for (const c of topic.clips ?? []) {
      const arr = clipsByExpert.get(c.expert) ?? [];
      arr.push(c);
      clipsByExpert.set(c.expert, arr);
    }

    for (const [expertSlug, clips] of clipsByExpert) {
      if (attempted >= limit) break;
      if (clips.length >= 2) continue; // already has a second clip (treat as interview added)

      const expertName = nameBySlug.get(expertSlug) ?? expertSlug;
      const query = `${expertName} ${topic.title} interview`;
      attempted += 1;

      console.log(`\n[${topic.slug}] + ${expertName} (interview)`);
      console.log(`  query: ${query}`);

      try {
        const videoId = await findTopVideo(query, videoIdsInTopic(topic), expertSlug);
        if (!videoId) {
          console.log("  no new embeddable, on-channel, non-duplicate video found");
          continue;
        }
        console.log(`  videoId: ${videoId}`);

        const segments = await YoutubeTranscript.fetchTranscript(videoId);
        const matchTarget = clips[0]?.transcript_excerpt || topic.title;
        const match = findBestSegment(segments, matchTarget);
        const offset = match ? Math.floor(match.offset / 1000) : 0;
        if (match) {
          console.log(`  matched offset ${offset}s (score ${match.score})`);
        } else {
          console.log("  no match, offset 0");
        }

        topic.clips = topic.clips ?? [];
        topic.clips.push({
          title: `${expertName} on ${topic.title} (interview)`,
          expert: expertSlug,
          source_title: `${expertName} interview`,
          source_type: "youtube",
          source_url: `https://www.youtube.com/watch?v=${videoId}`,
          timestamp_start_sec: offset,
          transcript_excerpt: matchTarget,
        });
        added += 1;
      } catch (err) {
        console.log(`  error: ${(err as Error).message}`);
      }
    }
  }

  console.log(`\nAttempted ${attempted} pair(s), added ${added} interview clip(s).`);
  if (dryRun) {
    console.log("--dry-run: skipping write");
    return;
  }
  if (added > 0) {
    fs.writeFileSync(TOPICS_PATH, yaml.dump(topics, { lineWidth: 120, noRefs: true }));
    console.log(`Wrote ${TOPICS_PATH}`);
  }
}

async function runRefreshBroken(topics: Topic[]) {
  const experts = yaml.load(fs.readFileSync(EXPERTS_PATH, "utf8")) as Expert[];
  const nameBySlug = new Map(experts.map((e) => [e.slug, e.name]));

  let checked = 0;
  let refreshed = 0;

  for (const topic of topics) {
    // Track which video IDs are seen first-wins per topic; later occurrences are dupes to refresh.
    const seenIds = new Set<string>();
    for (const clip of topic.clips ?? []) {
      if (checked >= limit) break;
      if (!clip.source_url.includes("watch?v=")) continue;
      checked += 1;

      const currentId = videoIdFromUrl(clip.source_url);
      const isDupe = currentId !== null && seenIds.has(currentId);
      const ok = !isDupe && (await isEmbeddable(clip.source_url));
      if (ok) {
        if (currentId) seenIds.add(currentId);
        continue;
      }

      console.log(`\n[${topic.slug}] ${isDupe ? "duplicate" : "broken"}: ${clip.title}`);
      const expertName = nameBySlug.get(clip.expert) ?? clip.expert;
      const query = `${expertName} ${topic.title}`;
      console.log(`  query: ${query}`);

      const excluded = videoIdsInTopic(topic);

      try {
        const videoId = await findTopVideo(query, excluded, clip.expert);
        if (!videoId) {
          console.log("  no embeddable, on-channel, non-duplicate alternative found");
          continue;
        }
        console.log(`  new videoId: ${videoId}`);
        const segments = await YoutubeTranscript.fetchTranscript(videoId);
        const match = findBestSegment(segments, clip.transcript_excerpt);
        clip.source_url = `https://www.youtube.com/watch?v=${videoId}`;
        clip.timestamp_start_sec = match ? Math.floor(match.offset / 1000) : 0;
        console.log(`  offset ${clip.timestamp_start_sec}s`);
        refreshed += 1;
      } catch (err) {
        console.log(`  error: ${(err as Error).message}`);
      }
    }
    if (checked >= limit) break;
  }

  console.log(`\nChecked ${checked} clip(s), refreshed ${refreshed}.`);
  if (dryRun) {
    console.log("--dry-run: skipping write");
    return;
  }
  if (refreshed > 0) {
    fs.writeFileSync(TOPICS_PATH, yaml.dump(topics, { lineWidth: 120, noRefs: true }));
    console.log(`Wrote ${TOPICS_PATH}`);
  }
}

async function runExpand(topics: Topic[]) {
  const experts = yaml.load(fs.readFileSync(EXPERTS_PATH, "utf8")) as Expert[];
  const nameBySlug = new Map(experts.map((e) => [e.slug, e.name]));

  let added = 0;
  let attempted = 0;

  for (const topic of topics) {
    const haveExpert = new Set((topic.clips ?? []).map((c) => c.expert));
    for (const position of topic.positions ?? []) {
      if (attempted >= limit) break;
      if (haveExpert.has(position.expert)) continue;

      const expertName = nameBySlug.get(position.expert) ?? position.expert;
      const query = `${expertName} ${topic.title}`;
      attempted += 1;

      console.log(`\n[${topic.slug}] + ${expertName}`);
      console.log(`  query: ${query}`);

      try {
        const videoId = await findTopVideo(query, videoIdsInTopic(topic), position.expert);
        if (!videoId) {
          console.log("  no embeddable, on-channel, non-duplicate video found, skipping");
          continue;
        }
        console.log(`  videoId: ${videoId}`);

        const segments = await YoutubeTranscript.fetchTranscript(videoId);
        console.log(`  transcript: ${segments.length} segments`);

        const matchTarget = position.stance_detail || position.stance_summary || topic.title;
        const match = findBestSegment(segments, matchTarget);
        const offset = match ? Math.floor(match.offset / 1000) : 0;
        if (match) {
          console.log(`  matched offset ${offset}s (score ${match.score})`);
        } else {
          console.log("  no match, offset 0");
        }

        topic.clips = topic.clips ?? [];
        topic.clips.push({
          title: `${expertName} on ${topic.title}`,
          expert: position.expert,
          source_title: `${expertName} discussion`,
          source_type: "youtube",
          source_url: `https://www.youtube.com/watch?v=${videoId}`,
          timestamp_start_sec: offset,
          transcript_excerpt: matchTarget,
        });
        added += 1;
      } catch (err) {
        console.log(`  error: ${(err as Error).message}`);
      }
    }
    if (attempted >= limit) break;
  }

  console.log(`\nAttempted ${attempted} pair(s), added ${added} clip(s).`);
  if (dryRun) {
    console.log("--dry-run: skipping write");
    return;
  }
  if (added > 0) {
    fs.writeFileSync(TOPICS_PATH, yaml.dump(topics, { lineWidth: 120, noRefs: true }));
    console.log(`Wrote ${TOPICS_PATH} (reformatted by js-yaml)`);
  }
}

function extractSearchQuery(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("youtube.com") && u.pathname === "/results") {
      return u.searchParams.get("search_query");
    }
    return null;
  } catch {
    return null;
  }
}

let lastSearchAt = 0;
const SEARCH_MIN_INTERVAL_MS = 6_500; // YouTube allows 10 searches/min — stay under that

async function findTopVideo(
  query: string,
  excludeVideoIds: Set<string> = new Set(),
  expectedExpertSlug?: string,
): Promise<string | null> {
  const elapsed = Date.now() - lastSearchAt;
  if (lastSearchAt && elapsed < SEARCH_MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, SEARCH_MIN_INTERVAL_MS - elapsed));
  }
  lastSearchAt = Date.now();

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey!);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    items?: Array<{ id?: { videoId?: string }; snippet?: { channelTitle?: string; title?: string } }>;
  };
  for (const item of data.items ?? []) {
    const id = item.id?.videoId;
    if (!id || excludeVideoIds.has(id)) continue;
    const channelTitle = item.snippet?.channelTitle ?? "";
    const videoTitle = item.snippet?.title ?? "";
    if (
      expectedExpertSlug &&
      !isChannelMatch(channelTitle, expectedExpertSlug) &&
      !isExpertInTitle(videoTitle, expectedExpertSlug)
    ) {
      console.log(`    skip ${id}: "${channelTitle}" / "${videoTitle}"`);
      continue;
    }
    if (await isEmbeddable(`https://www.youtube.com/watch?v=${id}`)) return id;
  }
  return null;
}

function isExpertInTitle(videoTitle: string, expertSlug: string): boolean {
  const t = videoTitle.toLowerCase();
  const patterns: Record<string, string[]> = {
    "jason-fung": ["jason fung", "fung"],
    "ben-bikman": ["ben bikman", "bikman"],
    "peter-attia": ["peter attia", "attia"],
    "glucose-goddess": ["glucose goddess", "inchausp", "jessie"],
    "mark-hyman": ["mark hyman", "hyman"],
    "pradip-jamnadas": ["jamnadas"],
    "sten-ekberg": ["sten ekberg", "ekberg"],
    "eric-berg": ["eric berg", "dr. berg"],
  };
  return (patterns[expertSlug] ?? []).some((p) => t.includes(p));
}

// Substring check of channelTitle against a known per-expert pattern. Disambiguates
// look-alike creators (e.g. Sten Ekberg vs. Eric Berg) where YouTube search alone is unreliable.
function isChannelMatch(channelTitle: string, expertSlug: string): boolean {
  const ct = channelTitle.toLowerCase();
  switch (expertSlug) {
    case "jason-fung":
      return ct.includes("fung");
    case "ben-bikman":
      return ct.includes("bikman");
    case "peter-attia":
      return ct.includes("attia");
    case "glucose-goddess":
      return ct.includes("glucose goddess") || ct.includes("inchausp");
    case "mark-hyman":
      return ct.includes("hyman");
    case "pradip-jamnadas":
      return ct.includes("jamnadas");
    case "sten-ekberg":
      return ct.includes("ekberg");
    case "eric-berg":
      return (ct.includes("dr. berg") || ct.includes("eric berg")) && !ct.includes("ekberg");
    default:
      return true;
  }
}

function videoIdFromUrl(url: string): string | null {
  const match = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function videoIdsInTopic(topic: Topic): Set<string> {
  const set = new Set<string>();
  for (const c of topic.clips ?? []) {
    const id = videoIdFromUrl(c.source_url);
    if (id) set.add(id);
  }
  return set;
}

async function isEmbeddable(watchUrl: string): Promise<boolean> {
  const u = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
  try {
    const res = await fetch(u);
    return res.status === 200;
  } catch {
    return false;
  }
}

function findBestSegment(
  segments: Array<{ text: string; offset: number; duration: number }>,
  excerpt: string,
): { text: string; offset: number; score: number } | null {
  const tokens = tokenize(excerpt);
  if (tokens.length === 0 || segments.length === 0) return null;

  const WINDOW_MS = 30_000;
  let best: { text: string; offset: number; score: number } | null = null;

  for (let i = 0; i < segments.length; i++) {
    const start = segments[i].offset;
    const windowText: string[] = [];
    for (let j = i; j < segments.length; j++) {
      if (segments[j].offset - start > WINDOW_MS) break;
      windowText.push(segments[j].text);
    }
    const windowTokens = new Set(tokenize(windowText.join(" ")));
    const score = tokens.reduce((acc, t) => acc + (windowTokens.has(t) ? 1 : 0), 0);
    if (!best || score > best.score) {
      best = { text: windowText.join(" "), offset: start, score };
    }
  }
  return best && best.score > 0 ? best : null;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);
}

function parseArgs(argv: string[]): {
  limit?: number;
  dryRun: boolean;
  expand: boolean;
  refreshBroken: boolean;
  addInterviews: boolean;
} {
  let limit: number | undefined;
  let dryRun = false;
  let expand = false;
  let refreshBroken = false;
  let addInterviews = false;
  for (const arg of argv) {
    if (arg.startsWith("--limit=")) limit = parseInt(arg.slice("--limit=".length), 10);
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--expand") expand = true;
    else if (arg === "--refresh-broken") refreshBroken = true;
    else if (arg === "--add-interviews") addInterviews = true;
  }
  return { limit, dryRun, expand, refreshBroken, addInterviews };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
