const DEMO_SEED_STORAGE_PREFIX = 'nocobase.mail-example.seeded.v1';

export function hasDemoSeed(scope: string, userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(seedStorageKey(scope, userId)) === '1';
  } catch {
    return false;
  }
}

export function markDemoSeeded(scope: string, userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(seedStorageKey(scope, userId), '1');
  } catch {
    // Demo records still load when storage is unavailable; only reset behavior changes.
  }
}

function seedStorageKey(scope: string, userId: string): string {
  return `${DEMO_SEED_STORAGE_PREFIX}:${scope}:${userId}`;
}
