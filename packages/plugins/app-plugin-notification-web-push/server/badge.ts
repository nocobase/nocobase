/** The part of the application's caching counter badge versions use; shared between instances when the cache is. */
export interface BadgeCounter {
  increment(key: string, amount?: number, ttl?: number): Promise<number>;
}

/** Versions in one millisecond count up to this many per person before the next millisecond's start. */
const PER_MILLISECOND = 1000;
/** A millisecond's sequence is only needed while reads in that millisecond can still be compared. */
const SEQUENCE_TTL_MS = 10_000;

let last = 0;

/**
 * A process-local badge version: milliseconds times 1000 plus a counter, so it never repeats or goes back within this
 * process. Payloads built without a version use it; versions compared across instances come from `createBadgeVersions`.
 */
export function nextBadgeVersion(): number {
  last = Math.max(last + 1, Date.now() * PER_MILLISECOND);
  return last;
}

/**
 * Sortable versions for one person's icon badge count, taken before the count is read: milliseconds times 1000 plus
 * that person's sequence in the millisecond, from the shared counter. Reads in the same millisecond on different
 * instances get distinct versions, in the order their sequence was taken; reads in different milliseconds order by the
 * clock, which instances on different machines keep in sync. Pages and pushes that carry counts compare these
 * versions, and the newer count wins. Without a counter the versions are process-local, as `nextBadgeVersion()`.
 */
export function createBadgeVersions(
  counter?: BadgeCounter,
): (userId: string) => Promise<number> {
  if (!counter) return async () => nextBadgeVersion();
  return async (userId) => {
    const now = Date.now();
    const sequence = await counter.increment(
      `${userId}:${now}`,
      1,
      SEQUENCE_TTL_MS,
    );
    // The first read in a millisecond takes its start, as process-local versions do, so the two kinds compare.
    return now * PER_MILLISECOND + Math.min(sequence - 1, PER_MILLISECOND - 1);
  };
}
