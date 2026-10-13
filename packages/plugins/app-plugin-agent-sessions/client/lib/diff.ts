export interface DiffLine {
  /** Unique within the diff: the side and the line number there. */
  readonly key: string;
  readonly type: 'same' | 'removed' | 'added';
  readonly text: string;
}

/**
 * The lines an edit changed, with a few unchanged lines around them: the common start and end of both texts are kept
 * as context and the rest is shown as removed, then added. Enough for the small edits agents make, without a diff
 * algorithm's cost on large files.
 */
export function lineDiff(
  oldText: string | null,
  newText: string,
  context = 3,
): DiffLine[] {
  const before = oldText === null || oldText === '' ? [] : oldText.split('\n');
  const after = newText.split('\n');
  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  )
    start += 1;
  let end = 0;
  while (
    end < before.length - start &&
    end < after.length - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end += 1;
  }
  const lines = (
    type: DiffLine['type'],
    side: readonly string[],
    from: number,
    to: number,
    prefix: string,
  ): DiffLine[] =>
    side.slice(from, to).map((text, offset) => ({
      key: `${prefix}${from + offset}`,
      type,
      text,
    }));
  return [
    ...lines('same', before, Math.max(0, start - context), start, 'b'),
    ...lines('removed', before, start, before.length - end, 'b'),
    ...lines('added', after, start, after.length - end, 'a'),
    ...lines(
      'same',
      after,
      after.length - end,
      after.length - end + context,
      'a',
    ),
  ];
}
