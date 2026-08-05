import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://mohammedsayed.com/sitemap.xml",
    host: "https://mohammedsayed.com"
  };
}
