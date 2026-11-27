import type { ApiKeyView, KeyPermissions } from '../../shared/scopes.js';

const DAY = 86_400_000;

/** Whole days until `expiresAt`, rounded up; null for a key that never expires, 0 or less once expired. */
export function daysLeft(
  expiresAt: string | null,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / DAY);
}

/** Whole days since a key was last used, or since it was made when it never was. */
export function idleDays(key: ApiKeyView, now: Date = new Date()): number {
  const since = new Date(key.lastUsedAt ?? key.createdAt).getTime();
  return Math.floor((now.getTime() - since) / DAY);
}

/** How long ago `value` was, as the language says it: "2 hours ago", "yesterday". */
export function relativeTime(
  value: string,
  locale: string,
  now: Date = new Date(),
): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round(
    (new Date(value).getTime() - now.getTime()) / 1000,
  );
  const steps: readonly [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12],
    ['year', Number.POSITIVE_INFINITY],
  ];
  let amount = seconds;
  for (const [unit, size] of steps) {
    if (Math.abs(amount) < size) return format.format(amount, unit);
    amount = Math.round(amount / size);
  }
  return format.format(amount, 'year');
}

export function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

/** How many actions a key's permissions give, on how many resources, and how many records they are limited to. */
export function permissionCounts(permissions: KeyPermissions): {
  readonly actions: number;
  readonly resources: number;
  readonly records: number | null;
} {
  const objects = Object.values(permissions.objects ?? {});
  return {
    actions: permissions.grants.reduce(
      (total, grant) => total + grant.actions.length,
      0,
    ),
    resources: permissions.grants.length,
    records: objects.length
      ? objects.reduce((total, ids) => total + ids.length, 0)
      : null,
  };
}

/** A key unused for this many days is called out, so it can be revoked. */
export const IDLE_REMINDER_DAYS = 90;
