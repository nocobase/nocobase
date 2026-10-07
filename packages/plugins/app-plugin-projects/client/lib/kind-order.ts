/** Ordering and built-in checks for kinds (`shared/kinds.ts`), without hooks; `lib/kinds.ts` adds the hooks. */
import { BUILTIN_KINDS, SYSTEM_KIND, USER_KIND } from '../../shared/kinds.js';

/** People first, other registered kinds next, the system last. */
export function orderKinds(keys: Iterable<string>): string[] {
  const rank = (key: string) =>
    key === USER_KIND ? 0 : key === SYSTEM_KIND ? 2 : 1;
  return [...new Set(keys)].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
}

export function isBuiltInKind(key: string): boolean {
  return BUILTIN_KINDS.includes(key);
}
