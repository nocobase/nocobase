import { expect, it } from 'vitest';

import { disk } from './helpers/oss.js';

it.each([
  [undefined, 1800],
  [30, 30],
  [1.9, 1],
  ['30', 30],
  ['  30\t', 30],
  ['00030.9', 30],
  ['2000 ms', 2],
  ['30s', 30],
  ['30 SEC', 30],
  ['30 secs', 30],
  ['30 second', 30],
  ['30 seconds', 30],
  ['2m', 120],
  ['2 min', 120],
  ['2 mins', 120],
  ['2 minute', 120],
  ['2 minutes', 120],
  ['1.5h', 5400],
  ['1 hour', 3600],
  ['1 HOURS', 3600],
  ['1d', 86400],
  ['1 day', 86400],
  ['2 days', 172800],
  ['1w', 604800],
  ['1 week', 604800],
  ['2 weeks', 604800],
  [' \t2\n\r\tMINUTES\u00a0', 120],
] as const)(
  'preserves signed URL lifetime %j as %s seconds',
  async (expiresIn, expected) => {
    const storage = disk();
    for (const method of ['getSignedUrl', 'getSignedUploadUrl'] as const) {
      const url = new URL(await storage[method]('file', { expiresIn }));
      expect(url.searchParams.get('x-oss-expires')).toBe(String(expected));
    }
  },
);

it.each([
  '',
  ' \t ',
  '0',
  '0s',
  '0.0 minutes',
  '999 ms',
  '-1s',
  '.5h',
  '1 year',
  '1hr',
  '1 wk',
  '1 millisecond',
  '1e3',
  '1h 30m',
])('continues rejecting unsupported lifetime %j', async (expiresIn) => {
  const storage = disk().driver;
  for (const method of ['getSignedUrl', 'getSignedUploadUrl'] as const) {
    await expect(storage[method]('file', { expiresIn })).rejects.toThrow(
      'Invalid OSS signed URL lifetime.',
    );
  }
});
