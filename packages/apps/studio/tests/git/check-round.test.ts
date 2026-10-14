// @vitest-environment node
import { expect, it } from 'vitest';
import { checksFingerprint } from '../../server/git/flow.js';
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
  const key = checksFingerprint(original, ['preview']);
  expect(
    checksFingerprint(
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
    checksFingerprint(
      { ...original, checks: [{ ...check, executionId: '2' }] },
      ['preview'],
    ),
  ).not.toBe(key);
});
