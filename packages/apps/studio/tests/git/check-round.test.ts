// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { checkConclusionKey } from '../../server/git/flow.js';
import type { GitCheck } from '../../shared/git.js';

it('ignores polling and reference noise but detects completed reruns between polls', () => {
  const check: GitCheck = {
    kind: 'check',
    name: 'test',
    executionId: '1',
    status: 'completed',
    conclusion: 'success',
    url: 'https://example.com/one',
  };
  const original = {
    headSha: 'head',
    ciState: 'success' as const,
    checks: [check],
  };
  const key = checkConclusionKey(original, ['preview']);
  expect(
    checkConclusionKey(
      {
        ...original,
        checks: [
          { ...check, url: 'https://example.com/two' },
          { ...check, name: 'preview', conclusion: 'failure' },
        ],
      },
      ['preview'],
    ),
  ).toBe(key);
  expect(
    checkConclusionKey(
      { ...original, checks: [{ ...check, executionId: '2' }] },
      ['preview'],
    ),
  ).not.toBe(key);
});

it('keeps the same round when host collation and incoming check order differ', () => {
  const check: GitCheck = {
    kind: 'check',
    name: 'Alpha',
    status: 'completed',
    conclusion: 'success',
    url: null,
  };
  const snapshot = {
    headSha: 'head',
    ciState: 'success' as const,
    checks: [check, { ...check, name: 'zeta' }],
  };
  const expected = checkConclusionKey(snapshot, []);
  const collation = vi
    .spyOn(String.prototype, 'localeCompare')
    .mockReturnValue(-1);
  try {
    expect(checkConclusionKey(snapshot, [])).toBe(expected);
    expect(
      checkConclusionKey(
        { ...snapshot, checks: [...snapshot.checks].reverse() },
        [],
      ),
    ).toBe(expected);
  } finally {
    collation.mockRestore();
  }
});
