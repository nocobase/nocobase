// How close a mistyped name is to the names that exist, for "Did you mean" suggestions.
//
// Internal to this package. The threshold is deliberately tight: a suggestion an agent may act on has to be the name
// that was meant, so a short name tolerates one slip and a longer one two, and anything further suggests nothing.

/**
 * The optimal string alignment distance between `a` and `b`, ignoring case: inserting, deleting or substituting a
 * character costs one, and so does swapping two adjacent ones, which is the typo `--froce` makes.
 */
export function editDistance(a: string, b: string): number {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;
  // Three rows of the dynamic programming table are enough: the current one, the one above, and the one above that
  // for transpositions.
  let beforePrevious: number[] = [];
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      let distance = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
      if (
        i > 1 &&
        j > 1 &&
        left[i - 1] === right[j - 2] &&
        left[i - 2] === right[j - 1]
      ) {
        distance = Math.min(distance, (beforePrevious[j - 2] ?? 0) + 1);
      }
      current.push(distance);
    }
    beforePrevious = previous;
    previous = current;
  }
  return previous[right.length] ?? 0;
}

/** How many edits `input` may be away from a name for that name to count as what was meant. */
export function typoAllowance(input: string): number {
  return input.length <= 5 ? 1 : 2;
}

/**
 * How far `candidate` is from `input`, or `undefined` when it is too far to suggest. A candidate that starts with an
 * input of three or more characters is always close enough, so `--dry` finds `--dry-run`.
 */
export function matchDistance(
  input: string,
  candidate: string,
): number | undefined {
  const distance = editDistance(input, candidate);
  if (distance <= typoAllowance(input)) return distance;
  if (
    input.length >= 3 &&
    candidate.toLowerCase().startsWith(input.toLowerCase())
  ) {
    return distance;
  }
  return undefined;
}

/** A candidate and how far it is from what was typed. */
export interface ScoredMatch {
  readonly candidate: string;
  readonly distance: number;
}

/** The closest of `matches`, nearest first and alphabetically among equals, at most `limit` of them. */
export function nearest(
  matches: Iterable<ScoredMatch>,
  limit: number = 3,
): string[] {
  const unique = new Map<string, number>();
  for (const { candidate, distance } of matches) {
    const known = unique.get(candidate);
    if (known === undefined || distance < known) {
      unique.set(candidate, distance);
    }
  }
  return [...unique]
    .sort(([a, left], [b, right]) => left - right || a.localeCompare(b))
    .slice(0, limit)
    .map(([candidate]) => candidate);
}

/** The `candidates` close enough to `input` to be what was meant, nearest first, at most `limit` of them. */
export function closestMatches(
  input: string,
  candidates: Iterable<string>,
  limit: number = 3,
): string[] {
  const scored: ScoredMatch[] = [];
  for (const candidate of candidates) {
    const distance = matchDistance(input, candidate);
    if (distance !== undefined) scored.push({ candidate, distance });
  }
  return nearest(scored, limit);
}
