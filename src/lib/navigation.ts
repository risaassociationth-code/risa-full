/** Collapse repeated homepage entries without deleting editable navigation records.
 * Keep groups (and their children) intact, even when their landing URL is home.
 */
export function singleHomeLink<T extends { href: string; children: unknown[] }>(items: T[]): T[] {
  let foundHome = false;
  return items.filter((item) => {
    const home = /^\/(?:th|en)?\/?$/.test(item.href);
    if (!home || item.children.length > 0) return true;
    if (foundHome) return false;
    foundHome = true;
    return true;
  });
}
