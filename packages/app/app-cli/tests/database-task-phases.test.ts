// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabasePhasesFixture } from './database-phases-fixture.ts';

const fixtures: Awaited<ReturnType<typeof createDatabasePhasesFixture>>[] = [];
afterEach(async () => {
  for (const fixture of fixtures.splice(0)) await fixture.close();
});
async function fixture() {
  const value = await createDatabasePhasesFixture();
  fixtures.push(value);
  return value;
}

describe('database phases through the CLI executable', () => {
  it('applies and resets default, named and all connections using registration-only hooks', async () => {
    const f = await fixture();
    f.sources('main');
    f.sources('named');
    for (const selection of [[], ['--connection', 'named'], ['--all']]) {
      for (const command of ['apply', 'reset']) {
        const run = await f.run([
          'db',
          command,
          ...selection,
          ...(command === 'reset' ? ['--force'] : []),
        ]);
        if (run.exitCode !== 0) throw new Error(run.stdout + run.stderr);
        expect(run.exitCode).toBe(0);
        expect(run.document).toMatchObject({ schemaVersion: 1, ok: true });
        if (!run.document.ok) throw new Error(run.document.error.message);
        expect(Object.keys(run.document.result).sort()).toEqual(['results']);
        const names = selection.includes('--all')
          ? ['main', 'named']
          : selection.includes('named')
            ? ['named']
            : ['main'];
        expect(
          run.events.filter((event) => event.startsWith('prepare:')),
        ).toEqual(names.map((name) => `prepare:${name}`));
        expect(run.events.filter((event) => event.startsWith('hook:'))).toEqual(
          [`hook:${command === 'reset' ? names.join(',') : ''}`],
        );
        expect(run.events.filter((event) => event === 'later')).toHaveLength(1);
        if (command === 'reset') {
          expect(run.events.slice(0, names.length * 2)).toEqual([
            ...names.map((name) => `prepare:${name}`),
            ...names.map((name) => `reset:${name}`),
          ]);
          expect(
            run.document.result.results
              .filter(
                (task) => task.kind === 'seeds' && task.status === 'completed',
              )
              .every((task) => task.freshInstall),
          ).toBe(true);
        }
        expect(run.events.at(-1)).toBe('shutdown:resources');
      }
    }
  }, 60_000);

  it('uses the same all-target reset phase without hooks and retains every reset after a business failure', async () => {
    const f = await fixture();
    f.sources('main', { fail: true });
    f.sources('named');
    const run = await f.run(['db', 'reset', '--all', '--force'], {
      FIXTURE_HOOKS: 'off',
    });
    expect(run.exitCode).toBe(1);
    expect(run.events).toEqual([
      'prepare:main',
      'prepare:named',
      'reset:main',
      'reset:named',
      'migration:main',
      'shutdown:resources',
    ]);
    expect(run.document).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'DATABASE_TASK_FAILED',
        details: {
          resetConnections: ['main', 'named'],
          results: [
            { status: 'failed' },
            { status: 'not-run' },
            { status: 'skipped', reason: 'external' },
            { status: 'skipped', reason: 'external' },
            { status: 'not-run' },
            { status: 'not-run' },
          ],
        },
      },
    });
    expect(await f.inspect('named')).not.toContain('business');
  }, 30_000);

  it('reports partial reset uncertainty instead of blaming the first migration', async () => {
    const f = await fixture();
    f.sources('main');
    f.sources('named');
    const run = await f.run(['db', 'reset', '--all', '--force'], {
      FIXTURE_RESET_FAIL: 'named',
    });
    expect(run.exitCode).toBe(1);
    expect(run.events).toEqual([
      'prepare:main',
      'prepare:named',
      'reset:main',
      'reset:named',
      'shutdown:resources',
    ]);
    expect(run.document).toMatchObject({
      ok: false,
      error: {
        code: 'DATABASE_TASK_FAILED',
        message: expect.stringContaining(
          'may also have been partially modified',
        ),
        details: {
          preparation: { phase: 'reset', connection: 'named' },
          resetConnections: ['main'],
        },
      },
    });
    if (run.document.ok) throw new Error('expected reset failure');
    expect(run.document.error.details).not.toHaveProperty('kind');
    expect(run.document.error.details).not.toHaveProperty('connection');
  }, 30_000);

  it('reports hook failures, including private lock contention, as preparation failures and stops later hooks', async () => {
    const f = await fixture();
    f.sources('main');
    for (const failure of ['refused', 'lock']) {
      const run = await f.run(['db', 'reset', '--force'], {
        FIXTURE_HOOK_FAIL: failure,
      });
      expect(run.exitCode).toBe(1);
      expect(run.document).toMatchObject({
        ok: false,
        error: {
          code: 'DATABASE_TASK_FAILED',
          details: {
            preparation: { phase: 'beforeTasks', hook: 'fixtureResources' },
            resetConnections: ['main'],
            results: [{ status: 'not-run' }, { status: 'not-run' }],
          },
        },
      });
      expect(run.events).toEqual([
        'prepare:main',
        'reset:main',
        'hook:main',
        'shutdown:resources',
      ]);
    }
  }, 30_000);

  it('finishes a fresh empty directory as real work without adding fields to success JSON', async () => {
    const f = await fixture();
    const run = await f.run(['db', 'reset', '--force']);
    expect(run.exitCode).toBe(0);
    expect(run.document).toMatchObject({
      ok: true,
      status: 'success',
      result: {
        results: [
          {
            connection: 'main',
            kind: 'migrations',
            status: 'completed',
            batch: 0,
            fresh: true,
            executed: [],
          },
          { kind: 'seeds', status: 'skipped' },
        ],
      },
    });
    expect(run.events).toEqual([
      'prepare:main',
      'reset:main',
      'hook:main',
      'later',
      'shutdown:resources',
    ]);
  }, 30_000);

  it('previews existing storage and requires confirmation without any preparation or hooks', async () => {
    const f = await fixture();
    f.sources('main');
    const apply = await f.run(['db', 'apply']);
    expect(apply.exitCode).toBe(0);
    for (const args of [
      ['db', 'apply', '--dry-run'],
      ['db', 'reset', '--dry-run'],
      ['db', 'reset'],
    ]) {
      const run = await f.run(args);
      expect(run.events).toEqual(['shutdown:resources']);
      expect(run.exitCode).toBe(args.includes('--dry-run') ? 0 : 2);
      expect(run.document).toMatchObject(
        args.includes('--dry-run')
          ? { ok: true, status: 'success-noop' }
          : { ok: false, error: { code: 'FORCE_REQUIRED' } },
      );
    }
    expect(await f.inspect('main')).toContain('business');
  }, 30_000);
});
