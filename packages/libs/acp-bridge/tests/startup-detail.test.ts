import { expect, it } from 'vitest';
import { startupDetail } from '../src/startup-detail.js';

it('keeps the command, quotes arguments and preserves the tail of a long failure', () => {
  const detail = startupDetail(
    '/path with spaces/node',
    ['entry.js', 'two words'],
    new Error(`${'x'.repeat(5000)}\nlast stderr line`),
  );
  expect(detail).toHaveLength(2000);
  expect(detail).toMatch(
    /^Command: "\/path with spaces\/node" entry.js "two words"\n…/u,
  );
  expect(detail).toMatch(/\nlast stderr line$/u);
  expect(
    startupDetail('node', ['a'.repeat(4000)], 'tail').length,
  ).toBeLessThanOrEqual(2000);
});
