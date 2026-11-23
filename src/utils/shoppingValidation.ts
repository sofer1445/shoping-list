export const normalizeItemName = (name: string) =>
  name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("he");

export const isValidQuantity = (quantity: number) =>
  Number.isSafeInteger(quantity) && quantity >= 1;

export const mergeAddedItem = <T extends { id: string }>(items: T[], added: T): T[] =>
  items.some((item) => item.id === added.id)
    ? items.map((item) => item.id === added.id ? { ...item, ...added } : item)
    : [...items, added];

export const hasDuplicateItem = (
  items: { id?: string; name: string }[], name: string, excludingId?: string
) => items.some((item) => (!excludingId || item.id !== excludingId) && normalizeItemName(item.name) === normalizeItemName(name));

export const parseBulkItems = (text: string, existing: { name: string }[]) => {
  const seen = new Set(existing.map((item) => normalizeItemName(item.name)));
  const entries: { name: string; quantity: number }[] = [];
  let duplicates = 0;
  let invalid = 0;
  const invalidLines: string[] = [];
  for (const line of text.split("\n").map((value) => value.trim()).filter(Boolean)) {
    const match = line.match(/^(.+?)\s+(-?\d+(?:\.\d+)?)$/);
    const name = normalizeItemName(match ? match[1] : line);
    const quantity = match ? Number(match[2]) : 1;
    if (!name || !isValidQuantity(quantity)) { invalid++; invalidLines.push(line); continue; }
    if (seen.has(name)) { duplicates++; continue; }
    seen.add(name);
    entries.push({ name: (match ? match[1] : line).trim().replace(/\s+/g, " "), quantity });
  }
  return { entries, duplicates, invalid, invalidLines };
};