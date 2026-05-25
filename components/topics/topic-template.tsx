import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConsensusPanel } from "@/components/topics/consensus-panel";
import { DebateMatrix } from "@/components/topics/debate-matrix";
import { ClipCard } from "@/components/topics/clip-card";
import { Markdown } from "@/lib/markdown";
import type { Topic, TopicSectionKey } from "@/lib/types";

const sectionLabels: Record<TopicSectionKey, string> = {
  overview: "Overview",
  why_it_matters: "Why it matters",
  consensus: "Consensus",
  debate: "Points of debate",
  recommendations: "Practical recommendations",
};

const navSections: TopicSectionKey[] = [
  "overview",
  "why_it_matters",
  "consensus",
  "debate",
  "recommendations",
];

export function TopicTemplate({ topic }: { topic: Topic }) {
  const debateSection = topic.sections.find((section) => section.section_key === "debate");
  const recommendationSection = topic.sections.find(
    (section) => section.section_key === "recommendations",
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 md:grid-cols-[220px_1fr] md:px-6">
      <aside className="md:sticky md:top-8 md:self-start">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          On this page
        </p>
        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
          {navSections.map((key) => (
            <a key={key} href={`#${key}`} className="hover:text-foreground">
              {sectionLabels[key]}
            </a>
          ))}
          <a href="#clips" className="hover:text-foreground">
            Related experts &amp; clips
          </a>
        </nav>
      </aside>

      <article className="space-y-10">
        <header className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {topic.tags.map((tag) => (
              <Badge key={tag.slug} variant="secondary">
                <Link href={`/topics?tag=${tag.slug}`}>{tag.label}</Link>
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">{topic.title}</h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{topic.summary}</p>
        </header>

        <ConsensusPanel
          consensusMd={topic.consensus_md}
          practicalTakeawayMd={topic.practical_takeaway_md}
          evidenceLevel={topic.evidence_level}
        />

        {navSections.map((key) => {
          const section = topic.sections.find((item) => item.section_key === key);
          if (!section) return null;

          if (key === "consensus") {
            return (
              <section key={key} id={key} className="scroll-mt-24 space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">{sectionLabels[key]}</h2>
                <Markdown>{section.body_md}</Markdown>
              </section>
            );
          }

          if (key === "debate") {
            return (
              <section key={key} id={key} className="scroll-mt-24 space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">{sectionLabels[key]}</h2>
                <Markdown>{section.body_md}</Markdown>
                <DebateMatrix positions={topic.positions} />
                {topic.clips.length === 0 ? (
                  <Badge variant="outline">Editor summary — clips being added</Badge>
                ) : null}
              </section>
            );
          }

          if (key === "recommendations") {
            return (
              <section key={key} id={key} className="scroll-mt-24 space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">{sectionLabels[key]}</h2>
                <Markdown>{section.body_md}</Markdown>
              </section>
            );
          }

          return (
            <section key={key} id={key} className="scroll-mt-24 space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">{sectionLabels[key]}</h2>
              <Markdown>{section.body_md}</Markdown>
            </section>
          );
        })}

        <Separator />

        <section id="clips" className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Related experts &amp; clips</h2>
          <p className="text-sm text-muted-foreground">
            Every insight links back to original sources with timestamps where available.
          </p>
          <div className="grid gap-4">
            {topic.clips.map((clip) => (
              <ClipCard key={clip.id ?? clip.title} clip={clip} />
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
