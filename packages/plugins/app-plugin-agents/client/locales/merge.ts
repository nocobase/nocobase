/**
 * The panel's wording (`panel.<locale>.ts`, the UI Library's `agent-chat` block's own resources before it moved here)
 * shares the `chat` group with the wording of the chat hooks (`chat.<locale>.ts`). A key both define has one wording
 * (a test holds them equal), so the order only decides which nesting wins.
 */
type Tree = { readonly [key: string]: string | Tree };

export function mergeLocale<T extends object>(base: T, extra: object): T {
  const merged: Record<string, unknown> = { ...(base as object) };
  for (const [key, value] of Object.entries(extra)) {
    const current = merged[key];
    merged[key] =
      typeof value === 'object' &&
      value !== null &&
      typeof current === 'object' &&
      current !== null
        ? mergeLocale(current as Tree, value as Tree)
        : value;
  }
  return merged as T;
}
