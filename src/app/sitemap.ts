import type { MetadataRoute } from "next";

const BASE = "https://mohammedsayed.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: BASE, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/projects`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/apricot`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/ai-platform`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...["llm-gateway", "gpu-inference", "rag-eval"].map(slug => (
      { url: `${BASE}/ai-platform/${slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 }
    ))
  ];
}
