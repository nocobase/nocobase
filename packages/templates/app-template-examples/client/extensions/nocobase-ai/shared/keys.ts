/**
 * Pairs each item with a render key taken from a stable discriminator rather
 * than its position in the array, so a list that is appended to while a
 * response streams keeps the identity of what is already rendered. Items that
 * share a discriminator are numbered in order of appearance.
 */
export function withStableKeys<T>(
  items: readonly T[],
  identify: (item: T) => string,
): { key: string; item: T }[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = identify(item);
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return { key: occurrence ? `${base}#${occurrence}` : base, item };
  });
}
