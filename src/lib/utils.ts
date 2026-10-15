import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import sanitize from "sanitize-html";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `item-${Date.now().toString(36)}`
  );
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatGalleries(html: string): string {
  const withoutNotice = html
    .replace(/<div[^>]*class="[^"]*mms-source-notice[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<p[^>]*>(?:(?!<\/p>)[\s\S])*(?:MMS[-\s]*Hub|เนื้อหาจากเครือข่าย|Partner content|Reproduced from MMS|ไม่ใช่ประกาศหรือผลงานของ RISA)(?:(?!<\/p>)[\s\S])*<\/p>/gi, "")
    .replace(/alt="ภาพประกอบจาก MMS Hub"/gi, 'alt="ภาพประกอบกิจกรรม"');
  const galleryBlockRegex =
    /(?:<h3[^>]*>\s*ประมวลภาพกิจกรรม\s*\/\s*Photo Gallery\s*<\/h3>\s*)?(?:<p[^>]*>(?:\s*<img[^>]+>\s*)+<\/p>\s*)+/gi;
  const withGalleries = withoutNotice.replace(galleryBlockRegex, (match, offset, fullStr) => {
    const imgRegex = /<img[^>]+>/gi;
    const imgs = match.match(imgRegex) || [];
    const hasHeading = /ประมวลภาพกิจกรรม\s*\/\s*Photo Gallery/i.test(match);
    const isTrailingBlock = offset > 0 && offset + match.length >= String(fullStr).trim().length;
    if (imgs.length < 2 && !hasHeading && !isTrailingBlock) return match;
    const cards = imgs.map((img) => `<div class="mms-photo-card">${img}</div>`).join("");
    return `<div class="mms-photo-gallery not-prose"><h3 class="mms-photo-gallery-title">ประมวลภาพกิจกรรม / Photo Gallery</h3><div class="mms-photo-grid">${cards}</div></div>`;
  });
  return withGalleries.replace(/\/images\/mms-hub\/([^"'>\s?]+)(?:\?v=\d+)?/g, "/images/mms-hub/$1?v=4");
}

/** Shared parser-based policy for saved content, public output and previews. */
export function sanitizeHtml(html: string): string {
  const sanitized = sanitize(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "hr", "a", "img", "figure", "figcaption", "div", "span", "table", "thead", "tbody", "tfoot", "tr", "th", "td"],
    allowedAttributes: {
      "*": ["lang", "dir", "class"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      ol: ["start"], th: ["colspan", "rowspan", "scope"], td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, target: attributes.target === "_blank" ? "_blank" : "_self", rel: "noopener noreferrer" },
      }),
    },
  });
  return formatGalleries(sanitized);
}

