import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://app.zxaigc.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    "/",
    "/help",
    "/pricing",
    "/faq",
    "/templates",
    "/release-notes",
    "/guides",
    "/quote-generator",
    "/contract-generator",
    "/word-vs-quote-generator",
    "/seo-checklist",
    "/terms",
    "/privacy",
    "/refund",
    "/contact",
    "/login",
    "/register",
    "/forgot-password",
  ];
  const base: MetadataRoute.Sitemap = pages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
  const guidePosts: MetadataRoute.Sitemap = GUIDES.map((p) => ({
    url: `${siteUrl}/guides/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...base, ...guidePosts];
}

