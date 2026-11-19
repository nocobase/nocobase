/**
 * Examples-only: settings pages that lived outside `/settings` before `defineSettingsRoutes()` mounted them there.
 * Each former prefix keeps working for bookmarks and links, with the rest of the path, the query and the hash. Route
 * definitions reject wildcards, so the redirects are plain router entries; the destination's own guards still apply.
 */
export const SETTINGS_REDIRECTS: readonly (readonly [string, string])[] = [
  ['/users', '/settings/users'],
  ['/roles', '/settings/roles'],
  ['/default-access', '/settings/default-access'],
  ['/workflows', '/settings/workflows'],
  ['/knowledge/indexing', '/settings/knowledge/indexing'],
];

/** Where a former settings URL lives now, or `undefined` when it is not one. */
export function settingsRedirectTarget(pathname: string): string | undefined {
  for (const [from, to] of SETTINGS_REDIRECTS) {
    if (pathname === from || pathname.startsWith(`${from}/`))
      return `${to}${pathname.slice(from.length)}`;
  }
  return undefined;
}
