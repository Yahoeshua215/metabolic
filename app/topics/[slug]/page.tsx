import { notFound } from "next/navigation";
import { TopicTemplate } from "@/components/topics/topic-template";
import { getTopic, getTopics } from "@/lib/data";

export async function generateStaticParams() {
  const topics = await getTopics();
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) return { title: "Topic not found" };
  return {
    title: topic.title,
    description: topic.summary,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) notFound();
  return <TopicTemplate topic={topic} />;
}
