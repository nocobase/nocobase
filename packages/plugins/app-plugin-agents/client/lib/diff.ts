/** A line diff (longest common subsequence), for comparing skill versions. */

export interface DiffLine {
  readonly kind: 'same' | 'added' | 'removed';
  readonly text: string;
}

/** The lines that turn `before` into `after`. Quadratic; skills are small (≤ 200 KB). */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === '' ? [] : before.split('\n');
  const b = after === '' ? [] : after.split('\n');
  // Trim the common head and tail first: most edits touch a few lines.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start])
    start += 1;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1;
    endB -= 1;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const rows = midA.length + 1;
  const cols = midB.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = midA.length - 1; i >= 0; i -= 1)
    for (let j = midB.length - 1; j >= 0; j -= 1)
      table[i * cols + j] =
        midA[i] === midB[j]
          ? (table[(i + 1) * cols + j + 1] ?? 0) + 1
          : Math.max(
              table[(i + 1) * cols + j] ?? 0,
              table[i * cols + j + 1] ?? 0,
            );
  const result: DiffLine[] = a
    .slice(0, start)
    .map((text) => ({ kind: 'same', text }));
  let i = 0;
  let j = 0;
  while (i < midA.length && j < midB.length) {
    if (midA[i] === midB[j]) {
      result.push({ kind: 'same', text: midA[i] ?? '' });
      i += 1;
      j += 1;
    } else if (
      (table[(i + 1) * cols + j] ?? 0) >= (table[i * cols + j + 1] ?? 0)
    ) {
      result.push({ kind: 'removed', text: midA[i] ?? '' });
      i += 1;
    } else {
      result.push({ kind: 'added', text: midB[j] ?? '' });
      j += 1;
    }
  }
  for (; i < midA.length; i += 1)
    result.push({ kind: 'removed', text: midA[i] ?? '' });
  for (; j < midB.length; j += 1)
    result.push({ kind: 'added', text: midB[j] ?? '' });
  for (const text of a.slice(endA)) result.push({ kind: 'same', text });
  return result;
}
