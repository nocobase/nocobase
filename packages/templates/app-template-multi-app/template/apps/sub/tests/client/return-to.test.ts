import { expect, it } from 'vitest';
import { safeReturnTo } from '../../client/lib/return-to.js';
it('accepts application-relative state and rejects external or ambiguous destinations', () => {
  expect(safeReturnTo('/settings/processes/loan?q=review&page=2#node')).toBe(
    '/settings/processes/loan?q=review&page=2#node',
  );
  for (const value of [
    null,
    '',
    'https://outside.test',
    '//outside.test',
    '/a/..//outside.test',
    '/\\outside.test',
    '/\n/outside.test',
    'javascript:alert(1)',
    'settings/users',
  ])
    expect(safeReturnTo(value)).toBeUndefined();
});
