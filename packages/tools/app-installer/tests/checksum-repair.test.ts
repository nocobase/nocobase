import { describe, expect, it } from 'vitest';
import {
  checksumRepairs,
  previewChecksumRepair,
} from '../src/lib/checksum-repair.ts';

const record = {
  packageName: 'shop',
  name: '001_create',
  recordedChecksum: 'old',
  sourceChecksum: 'new',
};
const entry = {
  connection: 'main',
  kind: 'migrations',
  status: 'completed',
  repaired: [record],
};

describe('target CLI checksum results', () => {
  it.each([
    undefined,
    {},
    { results: [] },
    { dryRun: true, results: [{ ...entry, repaired: undefined }] },
    { dryRun: true, results: [{ ...entry, status: 'not-run' }] },
    {
      dryRun: true,
      results: [
        { ...entry, repaired: [{ ...record, recordedChecksum: null }] },
      ],
    },
  ])('rejects incomplete or unsupported previews: %j', (result) => {
    expect(() => checksumRepairs(result)).toThrow(/must support db repair/iu);
  });

  it('includes seeds and secondary connections, ignoring explicitly skipped tasks', () => {
    expect(
      checksumRepairs({
        dryRun: true,
        results: [
          entry,
          { ...entry, connection: 'audit', kind: 'seeds' },
          {
            connection: 'external',
            kind: 'migrations',
            status: 'skipped',
            reason: 'external',
          },
        ],
      }),
    ).toEqual([
      { connection: 'audit', kind: 'seeds', ...record },
      { connection: 'main', kind: 'migrations', ...record },
    ]);
  });

  it('binds approval to the installation and exact differences, independent of result ordering or rebuild path', async () => {
    const results = [entry, { ...entry, connection: 'audit', kind: 'seeds' }];
    const cli = {
      releaseDir: '/srv/app/releases/target/app',
      cwd: '/srv/app',
      env: {},
      run: async () => ({
        stdout: JSON.stringify({ ok: true, result: { dryRun: true, results } }),
        stderr: '',
      }),
    };
    const identity = { appName: 'shop', from: 'old-release', version: '1.1.0' };
    const plan = await previewChecksumRepair(cli, identity);
    results.reverse();
    expect(
      (
        await previewChecksumRepair(
          { ...cli, releaseDir: '/srv/app/releases/rebuilt/app' },
          identity,
        )
      ).token,
    ).toBe(plan.token);
    expect(
      (await previewChecksumRepair({ ...cli, cwd: '/srv/other' }, identity))
        .token,
    ).not.toBe(plan.token);
    expect(
      (
        await previewChecksumRepair(cli, {
          ...identity,
          from: 'another-release',
        })
      ).token,
    ).not.toBe(plan.token);
    expect(
      (await previewChecksumRepair(cli, { ...identity, version: '2.0.0' }))
        .token,
    ).not.toBe(plan.token);
    results[0] = {
      ...entry,
      repaired: [{ ...record, sourceChecksum: 'changed' }],
    };
    expect((await previewChecksumRepair(cli, identity)).token).not.toBe(
      plan.token,
    );
  });
});
