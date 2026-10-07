import { describe, expect, it } from 'vitest';

import { extractGlobalFlags } from '../src/lib/globals.ts';

describe('global flags', () => {
  it('come off the line wherever they are, and stop at --', () => {
    expect(
      extractGlobalFlags([
        'issue',
        '--profile',
        'staging',
        'get',
        'PM-1',
        '-y',
        '--dry-run',
        '-q',
        '--no-color',
        '--json',
        '--',
        '--yes',
      ]),
    ).toEqual({
      argv: ['issue', 'get', 'PM-1', '--json', '--', '--yes'],
      flags: {
        profile: 'staging',
        yes: true,
        dryRun: true,
        quiet: true,
        noColor: true,
      },
    });
    expect(extractGlobalFlags(['whoami', '--profile=ci']).flags.profile).toBe(
      'ci',
    );
  });

  it('refuse --profile without a name', () => {
    expect(() => extractGlobalFlags(['whoami', '--profile'])).toThrow(
      '--profile needs a profile name.',
    );
  });
});
