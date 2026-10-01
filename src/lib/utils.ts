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

/** Shared parser-based policy for saved content, public output and previews. */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "hr", "a", "img", "figure", "figcaption", "div", "span", "table", "thead", "tbody", "tfoot", "tr", "th", "td"],
    allowedAttributes: {
      "*": ["lang", "dir"],
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
}
