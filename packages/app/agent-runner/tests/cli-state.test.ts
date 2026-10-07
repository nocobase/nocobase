// The person's own state of a run's CLI, which the run's policy keeps the agent away from.
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { cliStateDirs } from '../src/lib/home.ts';

describe("the person's CLI state", () => {
  it("is the CLI's default state directory and its credentials directory, in the real home", () => {
    expect(
      cliStateDirs(
        { name: 'acme', credential: { file: '.acme/run.json' } },
        '/home/a',
      ),
    ).toEqual([path.join('/home/a', '.acme')]);
    expect(
      cliStateDirs(
        { name: 'acme', credential: { file: '.acme-run/run.json' } },
        '/home/a',
      ),
    ).toEqual([
      path.join('/home/a', '.acme'),
      path.join('/home/a', '.acme-run'),
    ]);
    expect(
      cliStateDirs({ name: 'acme', credential: { file: 'run.json' } }, '/h'),
    ).toEqual([path.join('/h', '.acme')]);
  });
});
