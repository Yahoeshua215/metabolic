import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const TOPICS_PATH = path.join(process.cwd(), "content", "seeds", "topics.yaml");

// One-off cleanup: YouTube search returned Eric Berg / Dr. Boz / Nutrition Made Simple
// videos for "Sten Ekberg" queries. Map each affected videoId to an action.
const ACTIONS: Record<string, "relabel-eric-berg" | "drop"> = {
  "0dC07AKODsk": "relabel-eric-berg", // Dr. Eric Berg DC - coffee
  "2fI7cpv4FCg": "drop", // Dr. Boz - berberine
  "8qJzaHuhsX4": "relabel-eric-berg", // Dr. Berg Shorts - berberine (interview)
  IFGvs1Qe7cA: "drop", // Nutrition Made Simple - sweeteners (interview)
  QMsItnMlhuo: "relabel-eric-berg", // Eric Berg - coffee (interview)
  zMuu68luxgg: "relabel-eric-berg", // Eric Berg - sweeteners
};

type Clip = {
  title: string;
  expert: string;
  source_title: string;
  source_url: string;
  [key: string]: unknown;
};

type Topic = { slug: string; clips?: Clip[]; [key: string]: unknown };

const raw = fs.readFileSync(TOPICS_PATH, "utf8");
const topics = yaml.load(raw) as Topic[];

let relabeled = 0;
let dropped = 0;

for (const topic of topics) {
  topic.clips = (topic.clips ?? []).filter((clip) => {
    const m = clip.source_url?.match(/v=([A-Za-z0-9_-]+)/);
    const id = m?.[1];
    if (!id || !(id in ACTIONS)) return true;
    const action = ACTIONS[id];
    if (action === "drop") {
      console.log(`[${topic.slug}] drop: ${clip.title} (${id})`);
      dropped += 1;
      return false;
    }
    const isInterview = /\(interview\)/i.test(clip.title);
    clip.expert = "eric-berg";
    clip.title = clip.title.replace(/^Sten Ekberg\b/, "Eric Berg");
    clip.source_title = isInterview ? "Eric Berg interview" : "Eric Berg discussion";
    console.log(`[${topic.slug}] relabel: ${clip.title} (${id})`);
    relabeled += 1;
    return true;
  });
}

fs.writeFileSync(TOPICS_PATH, yaml.dump(topics, { lineWidth: 120, noRefs: true }));
console.log(`\nRelabeled ${relabeled}, dropped ${dropped}.`);
