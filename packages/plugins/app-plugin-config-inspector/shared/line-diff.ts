export interface DiffLine {
  readonly kind: 'same' | 'added' | 'removed';
  readonly text: string;
  /** The line's number in the new text; absent for a removed line. */
  readonly line?: number;
}

/** Beyond this many line pairs the table would take too much memory in a browser. */
export const MAX_DIFF_CELLS = 4_000_000;

/**
 * A line diff of two texts by their longest common subsequence, removals before additions; `undefined` when the
 * texts are too long to compare, see {@link MAX_DIFF_CELLS}.
 */
export function diffLines(
  before: string,
  after: string,
): DiffLine[] | undefined {
  const a = before.replace(/\n$/u, '').split('\n');
  const b = after.replace(/\n$/u, '').split('\n');
  if ((a.length + 1) * (b.length + 1) > MAX_DIFF_CELLS) return undefined;
  const lengths = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i -= 1)
    for (let j = b.length - 1; j >= 0; j -= 1)
      lengths[i][j] =
        a[i] === b[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: 'same', text: b[j], line: j + 1 });
      i += 1;
      j += 1;
    } else if (
      j >= b.length ||
      (i < a.length && lengths[i + 1][j] >= lengths[i][j + 1])
    ) {
      lines.push({ kind: 'removed', text: a[i] });
      i += 1;
    } else {
      lines.push({ kind: 'added', text: b[j], line: j + 1 });
      j += 1;
    }
  }
  return lines;
}

export type DiffRow =
  DiffLine | { readonly kind: 'skipped'; readonly count: number };

/** A diff with each run of unchanged lines longer than twice the context folded into one row. */
export function foldUnchanged(
  lines: readonly DiffLine[],
  context = 3,
): DiffRow[] {
  const rows: DiffRow[] = [];
  let index = 0;
  while (index < lines.length) {
    if (lines[index].kind !== 'same') {
      rows.push(lines[index]);
      index += 1;
      continue;
    }
    let end = index;
    while (end < lines.length && lines[end].kind === 'same') end += 1;
    const head = index === 0 ? 0 : context;
    const tail = end === lines.length ? 0 : context;
    if (end - index > head + tail + 1) {
      rows.push(...lines.slice(index, index + head));
      rows.push({ kind: 'skipped', count: end - index - head - tail });
      rows.push(...lines.slice(end - tail, end));
    } else rows.push(...lines.slice(index, end));
    index = end;
  }
  return rows;
}
