/** Publication visibility and partner provenance are independent filters. */
export function matchesContentFilters(
  item: { status?: unknown; slug?: unknown },
  status: string,
  source = "all",
) {
  const partner = /^mms-hub-\d+$/.test(String(item.slug ?? ""));
  return (status === "all" || item.status === status) &&
    (source === "all" || partner === (source === "mms"));
}
