import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { sql } from "./db";
import type { Locale } from "./i18n";
import { PUBLIC_DATA_CACHE_TAG } from "./cache";

export type ContentBlock = {
  key: string;
  page: string;
  section: string;
  label: string;
  type: "text" | "richtext" | "image" | "url" | "number" | "icon";
  value_th: string;
  value_en: string;
  sort: number;
};

/** All content blocks, shared across requests and refreshed after an admin save. */
const getContentBlocks = unstable_cache(async (): Promise<ContentBlock[]> => {
  const rows = await sql<ContentBlock[]>`
    select key, page, section, label, type, value_th, value_en, sort from content_blocks`;
  return rows;
}, ["content-blocks"], { tags: [PUBLIC_DATA_CACHE_TAG], revalidate: 3600 });

export const getContentMap = cache(async (): Promise<Map<string, ContentBlock>> =>
  new Map((await getContentBlocks()).map((r) => [r.key, r])));

export function blockValue(block: ContentBlock | undefined, locale: Locale): string {
  if (!block) return "";
  const primary = locale === "th" ? block.value_th : block.value_en;
  if (primary && primary.trim() !== "") return primary;
  return (locale === "th" ? block.value_en : block.value_th) ?? "";
}

/** Read a single content value on the server. */
export async function content(key: string, locale: Locale): Promise<string> {
  return blockValue((await getContentMap()).get(key), locale);
}

export type SiteSettings = {
  org_name_th: string; org_name_en: string; org_short: string;
  tagline_th: string; tagline_en: string;
  logo_url: string; favicon_url: string;
  color_accent: string; color_ink: string; radius: string;
  address_th: string; address_en: string;
  phone: string; email: string; line_id: string;
  facebook_url: string; x_url: string; youtube_url: string; linkedin_url: string;
  map_lat: number; map_lng: number; map_zoom: number;
  ga_id: string;
};

const loadSettings = unstable_cache(async (): Promise<SiteSettings> => {
  const rows = await sql<SiteSettings[]>`select * from settings where id = true limit 1`;
  return rows[0];
}, ["settings"], { tags: [PUBLIC_DATA_CACHE_TAG], revalidate: 3600 });

export const getSettings = cache(loadSettings);

export type NavItem = {
  id: string; label_th: string; label_en: string; href: string;
  parent_id: string | null; new_tab: boolean; sort: number;
  children: NavItem[];
};

const loadNav = unstable_cache(async (): Promise<NavItem[]> => {
  const rows = await sql<Omit<NavItem, "children">[]>`
    select id, label_th, label_en, href, parent_id, new_tab, sort
    from nav_items where status = 'published' order by sort, created_at`;
  const byId = new Map<string, NavItem>(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots: NavItem[] = [];
  for (const item of byId.values()) {
    if (item.parent_id && byId.has(item.parent_id)) byId.get(item.parent_id)!.children.push(item);
    else roots.push(item);
  }
  return roots;
}, ["navigation"], { tags: [PUBLIC_DATA_CACHE_TAG], revalidate: 3600 });

export const getNav = cache(loadNav);

export type FooterLink = {
  id: string; column_key: string; label_th: string; label_en: string;
  href: string; new_tab: boolean; sort: number;
};

const loadFooterLinks = unstable_cache(async (): Promise<FooterLink[]> => {
  return sql<FooterLink[]>`
    select id, column_key, label_th, label_en, href, new_tab, sort
    from footer_links where status = 'published' order by column_key, sort`;
}, ["footer-links"], { tags: [PUBLIC_DATA_CACHE_TAG], revalidate: 3600 });

export const getFooterLinks = cache(loadFooterLinks);
