// @vitest-environment node
/** The version diff: lines aligned by their longest common subsequence, unchanged runs folded around each change. */
import { describe, expect, it } from 'vitest';

import {
  changeStarts,
  diffLines,
  foldDiff,
  splitRows,
} from '../client/lib/diff.js';

describe('the knowledge diff', () => {
  it('aligns lines and folds what did not change, three lines around each change', () => {
    const before = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join(
      '\n',
    );
    const after = before
      .replace('line 6', 'line six')
      .replace('line 12', 'line 12\nline 13');
    const rows = foldDiff(diffLines(before, after));
    expect(
      rows.map((row) =>
        row.kind === 'fold' ? `…${row.count}` : `${row.kind[0]} ${row.text}`,
      ),
    ).toEqual([
      '…2',
      's line 3',
      's line 4',
      's line 5',
      'r line 6',
      'a line six',
      's line 7',
      's line 8',
      's line 9',
      's line 10',
      's line 11',
      's line 12',
      'a line 13',
    ]);
    expect(foldDiff(diffLines('same', 'same'))).toEqual([
      { kind: 'fold', count: 1, at: 0 },
    ]);
    expect(diffLines('', 'new')).toEqual([{ kind: 'added', text: 'new' }]);
  });
});

describe('a diff side by side', () => {
  it('pairs each run of removed lines with the added lines after it, and finds where each run of changes starts', () => {
    const rows = foldDiff(diffLines('a\nb\nc\nd', 'a\nB\nc\nd\ne'), 1);
    const split = splitRows(rows);
    expect(
      split.map((row) =>
        row.kind === 'fold'
          ? `fold ${row.count}`
          : `${row.left?.text ?? '·'}|${row.right?.text ?? '·'}`,
      ),
    ).toEqual(['a|a', 'b|B', 'c|c', 'd|d', '·|e']);
    expect(changeStarts(split)).toEqual([1, 4]);
    expect(changeStarts(rows)).toEqual([1, 5]);
  });
});
