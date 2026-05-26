import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const TOPICS_PATH = path.join(process.cwd(), "content", "seeds", "topics.yaml");

// True mismatches confirmed by audit-channels: doctor not in channel nor video title.
const DROP_VIDEO_IDS = new Set([
  "kmSkE5jqbsQ", // walking-after-meals / ben-bikman → FastingWell, no Bikman in title
]);

type Clip = { title: string; source_url: string; [k: string]: unknown };
type Topic = { slug: string; clips?: Clip[]; [k: string]: unknown };

const topics = yaml.load(fs.readFileSync(TOPICS_PATH, "utf8")) as Topic[];
let dropped = 0;
for (const topic of topics) {
  topic.clips = (topic.clips ?? []).filter((clip) => {
    const m = clip.source_url?.match(/v=([A-Za-z0-9_-]+)/);
    const id = m?.[1] ?? "";
    if (DROP_VIDEO_IDS.has(id)) {
      console.log(`[${topic.slug}] drop: ${clip.title} (${id})`);
      dropped += 1;
      return false;
    }
    return true;
  });
}
fs.writeFileSync(TOPICS_PATH, yaml.dump(topics, { lineWidth: 120, noRefs: true }));
console.log(`\nDropped ${dropped} clip(s).`);
