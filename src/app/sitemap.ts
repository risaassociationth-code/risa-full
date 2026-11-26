import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL === "1" ? "https://risa-association.com" : "http://localhost:3000");

/** Content changes through the admin console, so the sitemap cannot be frozen at build time. */
export const revalidate = 3600;

/** Every page that exists without a database row behind it. An empty path is the home page. */
const STATIC_ROUTES = [
  "", "/news", "/activities", "/team",
] as const;

type SlugRow = { slug: string; updated_at: Date };

function localised(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = { th: BASE + "/th" + path, en: BASE + "/en" + path };
  return [
    { url: languages.th, lastModified, alternates: { languages } },
    { url: languages.en, lastModified, alternates: { languages } },
  ];
}

function parseBuildRows(input: string): [SlugRow[], SlugRow[]] {
  const parsed: unknown = JSON.parse(input);
  if (!Array.isArray(parsed) || parsed.length !== 2) throw new Error("Invalid build sitemap data");
  const convert = (rows: unknown): SlugRow[] => {
    if (!Array.isArray(rows) || rows.length > 1000) throw new Error("Invalid sitemap rows");
    return rows.map((row) => {
      if (!row || typeof row.slug !== "string" || !row.slug ||
          /[\/?#%\u0000-\u0020\u007f]/u.test(row.slug) || row.slug === "." || row.slug === ".." ||
          typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at))) {
        throw new Error("Invalid published sitemap row");
      }
      return { slug: row.slug, updated_at: new Date(row.updated_at) };
    });
  };
  return [convert(parsed[0]), convert(parsed[1])];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixedRoutes = STATIC_ROUTES.flatMap((path) => localised(path));
  const buildRows = process.env.RISA_BUILD_SITEMAP_ROWS;
  try {
    const [news, activities] = buildRows ? parseBuildRows(buildRows) : await Promise.all([
      sql<SlugRow[]>`select slug, updated_at from news where status = 'published'`,
      sql<SlugRow[]>`select slug, updated_at from activities where status = 'published'`,
    ]);
    return [
      ...fixedRoutes,
      ...news.flatMap((row) => localised("/news/" + row.slug, row.updated_at)),
      ...activities.flatMap((row) => localised("/activities/" + row.slug, row.updated_at)),
    ];
  } catch (error) {
    if (buildRows) throw error;
    // A transient database delay must not make an otherwise healthy release fail.
    console.error("Sitemap dynamic entries unavailable during generation", error);
    return fixedRoutes;
  }
}
