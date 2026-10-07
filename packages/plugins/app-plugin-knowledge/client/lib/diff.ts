/**
 * A line diff (longest common subsequence) between two versions, with runs of unchanged lines folded to the three
 * around each change. Past `MAX_CELLS` comparisons it gives up on alignment and shows everything removed, then added.
 */
export interface DiffLine {
  readonly kind: 'same' | 'added' | 'removed';
  readonly text: string;
}

/** A shown line, or a fold of unchanged lines; `at` is its first line's position in the diff, a stable key. */
export type DiffRow =
  | (DiffLine & { readonly at: number })
  | { readonly kind: 'fold'; readonly count: number; readonly at: number };

const MAX_CELLS = 2_000_000;
export const CONTEXT = 3;

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === '' ? [] : before.split('\n');
  const b = after === '' ? [] : after.split('\n');
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
  const result: DiffLine[] = a
    .slice(0, start)
    .map((text) => ({ kind: 'same', text }));
  if ((midA.length + 1) * (midB.length + 1) > MAX_CELLS) {
    result.push(
      ...midA.map((text) => ({ kind: 'removed' as const, text })),
      ...midB.map((text) => ({ kind: 'added' as const, text })),
    );
  } else {
    const cols = midB.length + 1;
    const table = new Uint32Array((midA.length + 1) * cols);
    for (let i = midA.length - 1; i >= 0; i -= 1)
      for (let j = midB.length - 1; j >= 0; j -= 1)
        table[i * cols + j] =
          midA[i] === midB[j]
            ? (table[(i + 1) * cols + j + 1] ?? 0) + 1
            : Math.max(
                table[(i + 1) * cols + j] ?? 0,
                table[i * cols + j + 1] ?? 0,
              );
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
  }
  for (const text of a.slice(endA)) result.push({ kind: 'same', text });
  return result;
}

/** The lines to show: every change with `context` unchanged lines around it, the rest folded. */
export function foldDiff(
  lines: readonly DiffLine[],
  context: number = CONTEXT,
): DiffRow[] {
  const near = new Set<number>();
  lines.forEach((line, index) => {
    if (line.kind === 'same') return;
    for (let k = index - context; k <= index + context; k += 1) near.add(k);
  });
  const rows: DiffRow[] = [];
  let folded = 0;
  lines.forEach((line, index) => {
    if (line.kind !== 'same' || near.has(index)) {
      if (folded > 0)
        rows.push({ kind: 'fold', count: folded, at: index - folded });
      folded = 0;
      rows.push({ ...line, at: index });
    } else folded += 1;
  });
  if (folded > 0)
    rows.push({ kind: 'fold', count: folded, at: lines.length - folded });
  return rows;
}

/** One row of a side-by-side diff: the line before on the left, after on the right, or a fold across both. */
export type SplitRow =
  | {
      readonly kind: 'pair';
      readonly at: number;
      readonly left: DiffLine | null;
      readonly right: DiffLine | null;
    }
  | { readonly kind: 'fold'; readonly count: number; readonly at: number };

/** The rows side by side: unchanged lines on both sides, each run of removed lines beside the added lines after it. */
export function splitRows(rows: readonly DiffRow[]): SplitRow[] {
  const result: SplitRow[] = [];
  let index = 0;
  while (index < rows.length) {
    const row = rows[index];
    if (row.kind === 'fold') {
      result.push(row);
      index += 1;
    } else if (row.kind === 'same') {
      result.push({ kind: 'pair', at: row.at, left: row, right: row });
      index += 1;
    } else {
      const removed: (DiffLine & { readonly at: number })[] = [];
      const added: (DiffLine & { readonly at: number })[] = [];
      while (index < rows.length && rows[index].kind === 'removed')
        removed.push(rows[index++] as DiffLine & { readonly at: number });
      while (index < rows.length && rows[index].kind === 'added')
        added.push(rows[index++] as DiffLine & { readonly at: number });
      for (let k = 0; k < Math.max(removed.length, added.length); k += 1)
        result.push({
          kind: 'pair',
          at: (removed[k] ?? added[k]).at,
          left: removed[k] ?? null,
          right: added[k] ?? null,
        });
    }
  }
  return result;
}

/** Whether a row is a change: an added or removed line, or a pair holding one. */
export function isChange(row: DiffRow | SplitRow): boolean {
  if (row.kind === 'added' || row.kind === 'removed') return true;
  if (row.kind !== 'pair') return false;
  return row.left?.kind !== 'same' || row.right?.kind !== 'same';
}

/** The index of each row that starts a run of changes, in order: where "next change" goes. */
export function changeStarts(rows: readonly (DiffRow | SplitRow)[]): number[] {
  const starts: number[] = [];
  rows.forEach((row, index) => {
    if (isChange(row) && (index === 0 || !isChange(rows[index - 1])))
      starts.push(index);
  });
  return starts;
}
