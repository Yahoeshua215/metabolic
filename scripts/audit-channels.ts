import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const TOPICS_PATH = path.join(process.cwd(), "content", "seeds", "topics.yaml");

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.error("Missing YOUTUBE_API_KEY");
  process.exit(1);
}

type Clip = { title: string; expert: string; source_url: string };
type Topic = { slug: string; clips?: Clip[] };

// Channel names that legitimately map to a doctor — either their own channel or aliases.
function isChannelMatch(channelTitle: string, expertSlug: string): boolean {
  const ct = channelTitle.toLowerCase();
  switch (expertSlug) {
    case "jason-fung":
      return ct.includes("fung");
    case "ben-bikman":
      return ct.includes("bikman") || ct.includes("insulin iq");
    case "peter-attia":
      return ct.includes("attia");
    case "glucose-goddess":
      return ct.includes("glucose goddess") || ct.includes("glucose revolution") || ct.includes("inchausp");
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

// For interview clips, the doctor's name should appear in the video TITLE (since they're a guest).
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

function videoIdFromUrl(url: string): string | null {
  const m = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

async function fetchSnippet(videoId: string): Promise<{ channelTitle: string; title: string } | null> {
  const u = new URL("https://www.googleapis.com/youtube/v3/videos");
  u.searchParams.set("part", "snippet");
  u.searchParams.set("id", videoId);
  u.searchParams.set("key", apiKey!);
  const res = await fetch(u);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { items?: Array<{ snippet?: { channelTitle?: string; title?: string } }> };
  const s = data.items?.[0]?.snippet;
  if (!s) return null;
  return { channelTitle: s.channelTitle ?? "", title: s.title ?? "" };
}

async function main() {
  const topics = yaml.load(fs.readFileSync(TOPICS_PATH, "utf8")) as Topic[];
  const mismatches: Array<{ topic: string; clip: string; expert: string; reason: string }> = [];
  let checked = 0;

  for (const topic of topics) {
    for (const clip of topic.clips ?? []) {
      const id = videoIdFromUrl(clip.source_url);
      if (!id) continue;
      checked += 1;
      const snippet = await fetchSnippet(id);
      if (!snippet) {
        mismatches.push({ topic: topic.slug, clip: clip.title, expert: clip.expert, reason: "video not found" });
        continue;
      }
      // Match logic mirrors findTopVideo: accept if channel matches OR doctor name in video title.
      const channelOk = isChannelMatch(snippet.channelTitle, clip.expert);
      const titleOk = isExpertInTitle(snippet.title, clip.expert);
      const ok = channelOk || titleOk;
      const tag = ok ? "✓" : "✗";
      console.log(`${tag} [${topic.slug}] ${clip.expert} → ch="${snippet.channelTitle}" vt="${snippet.title.slice(0, 60)}"`);
      if (!ok) {
        mismatches.push({
          topic: topic.slug,
          clip: clip.title,
          expert: clip.expert,
          reason: `channel="${snippet.channelTitle}" title="${snippet.title}"`,
        });
      }
    }
  }

  console.log(`\nChecked ${checked} clip(s). True mismatches: ${mismatches.length}`);
  for (const m of mismatches) {
    console.log(`  [${m.topic}] "${m.clip}" expert=${m.expert} ${m.reason}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
