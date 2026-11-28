let last = 0;

/**
 * A sortable version for an icon badge count, taken before the count is read: milliseconds times 1000 plus a counter,
 * so it never repeats or goes back within a process, even for reads in the same millisecond. Pages and pushes that
 * carry counts compare these versions, and the newer count wins. Across processes it orders by their clocks.
 */
export function nextBadgeVersion(): number {
  last = Math.max(last + 1, Date.now() * 1000);
  return last;
}
