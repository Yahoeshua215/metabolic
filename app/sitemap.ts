import type { MetadataRoute } from "next";
import { getExperts, getProtocols, getTopics } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [topics, protocols, experts] = await Promise.all([
    getTopics(),
    getProtocols(),
    getExperts(),
  ]);

  const staticRoutes = ["", "/topics", "/protocols", "/experts", "/search"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...topics.map((topic) => ({
      url: `${baseUrl}/topics/${topic.slug}`,
      lastModified: new Date(),
    })),
    ...protocols.map((protocol) => ({
      url: `${baseUrl}/protocols/${protocol.slug}`,
      lastModified: new Date(),
    })),
    ...experts.map((expert) => ({
      url: `${baseUrl}/experts/${expert.slug}`,
      lastModified: new Date(),
    })),
  ];
}
