import type { MetadataRoute } from "next";

const BASE = "https://mohammedsayed.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: BASE, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/projects`, lastModified, changeFrequency: "monthly", priority: 0.8 }
  ];
}
