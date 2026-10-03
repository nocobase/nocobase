import { databaseManagerToken, TaskLockBusyError } from '@nocobase/db';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/db-testing';
// @vitest-environment node
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectionsRefreshAllowed,
  runDatabaseApplyCommand,
  runDatabaseRedoCommand,
  runDatabaseRepairCommand,
  runDatabaseRollbackCommand,
  runDatabaseUnlockCommand,
  toDatabaseCommandError,
  type DatabaseCommandResult,
  type DatabasePlanEntry,
} from '../src/database-command.ts';
import { CommandError } from '../src/command/errors.ts';
import AppDbApply from '../src/commands/db/apply.ts';
import AppDbRedo from '../src/commands/db/redo.ts';
import AppDbRepair from '../src/commands/db/repair.ts';
import AppDbReset from '../src/commands/db/reset.ts';
import AppDbRollback from '../src/commands/db/rollback.ts';
import AppDbUnlock from '../src/commands/db/unlock.ts';
import CollectionsDoctor from '../src/commands/collections/doctor.ts';
import AppCollectionsGenerate from '../src/commands/collections/generate.ts';
import { runAppCommand } from './command-output.ts';
import { setApplicationState } from '../src/runtime/command-store.ts';
import {
  databaseCommandFixture,
  removeFixtureRoots,
} from './database-command-fixture.ts';

const provisioned: ProvisionedTestDatabases[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  removeFixtureRoots();
  for (const databases of provisioned.splice(0)) await databases.drop();
});

/**
 * An application with three connections, each on a database of its own: `main`, the default; `analytics`, whose
 * migrations do not run on their own; and `erp`, whose schema the application does not manage.
 */
async function fixture({ configured = true }: { configured?: boolean } = {}) {
  if (!configured) return databaseCommandFixture();
  const databases = await provisionTestDatabases({
    connections: ['main', 'analytics', 'erp'],
  });
  provisioned.push(databases);
  return databaseCommandFixture({
    database: () => ({
      default: 'main',
      connections: {
        main: databases.connectionConfig('main'),
        analytics: {
          ...databases.connectionConfig('analytics'),
          migrations: { autoRun: false },
        },
        erp: {
          ...databases.connectionConfig('erp'),
          schemaManagement: 'external',
        },
      },
    }),
  });
}

/** The rejection of `promise`, which the test expects to fail. */
async function failure(promise: Promise<unknown>): Promise<CommandError> {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(CommandError);
  return error as CommandError;
}

it('reports both kinds per connection and honors manual selection', async () => {
  const { runtime, command, migration } = await fixture();
  migration('analytics');
  const result = await runDatabaseApplyCommand(
    command,
    { all: false, connection: 'analytics' },
    runtime,
  );
  expect(result).toEqual({
    results: [
      {
        connection: 'analytics',
        kind: 'migrations',
        status: 'completed',
        batch: 1,
        executed: ['001_create'],
        skipped: [],
        warnings: [],
      },
      {
        connection: 'analytics',
        kind: 'seeds',
        status: 'skipped',
        reason: 'missing-directory',
      },
    ],
  });
});

it('reports external skips across all connections', async () => {
  const { runtime, command } = await fixture();
  const result = await runDatabaseApplyCommand(command, { all: true }, runtime);
  expect(result.results).toEqual(
    expect.arrayContaining([
      {
        connection: 'erp',
        kind: 'seeds',
        status: 'skipped',
        reason: 'external',
      },
    ]),
  );
});

it('prints every planned task of a partial failure, then fails with them in its details', async () => {
  const { runtime, command, migration } = await fixture();
  migration('main');
  migration('analytics', true);
  const error = await failure(
    runDatabaseApplyCommand(command, { all: true }, runtime),
  );
  expect(error).toMatchObject({
    errorCode: 'DATABASE_TASK_FAILED',
    exitCode: 1,
    message: expect.stringMatching(
      /^Database migrations failed for connection "analytics": .*failed migration/,
    ),
    details: {
      connection: 'analytics',
      kind: 'migrations',
      results: [
        expect.objectContaining({
          connection: 'main',
          kind: 'migrations',
          status: 'completed',
        }),
        expect.objectContaining({ connection: 'main', kind: 'seeds' }),
        expect.objectContaining({
          connection: 'analytics',
          kind: 'migrations',
          status: 'failed',
        }),
        // Everything planned after the failure is reported, not silently dropped.
        expect.objectContaining({
          connection: 'analytics',
          kind: 'seeds',
          status: 'not-run',
        }),
        expect.objectContaining({ connection: 'erp', status: 'not-run' }),
        expect.objectContaining({ connection: 'erp', status: 'not-run' }),
      ],
    },
  });
  expect(command.log).toHaveBeenCalledWith(
    expect.stringMatching(/^\[analytics\] migrations: failed: /),
  );
  expect(command.log).toHaveBeenCalledWith(
    '[analytics] seeds: not-run (previous-task-failed)',
  );
});

it('reports an invalid selection with the connection it named', async () => {
  const { runtime, command } = await fixture();
  const error = await failure(
    runDatabaseApplyCommand(
      command,
      { all: false, connection: 'unknown' },
      runtime,
    ),
  );
  expect(error).toMatchObject({
    errorCode: 'DATABASE_COMMAND_FAILED',
    exitCode: 1,
    message: expect.stringContaining('Unknown'),
    details: { connection: 'unknown' },
  });
});

it('requires force for a reset in CI, as invalid usage', async () => {
  const { runtime, command } = await fixture();
  vi.stubEnv('CI', '1');
  const error = await failure(
    runDatabaseApplyCommand(command, { all: false, fresh: true }, runtime),
  );
  expect(error).toMatchObject({
    errorCode: 'FORCE_REQUIRED',
    exitCode: 2,
    message: 'Reset requires --force in CI or a non-interactive terminal.',
  });
  expect(command.log).not.toHaveBeenCalled();
});

it('applies migrations and seeds as one plan, and resets from empty', async () => {
  const { runtime, command, migration, seed } = await fixture();
  migration('main');
  seed('main');
  const applied = await runDatabaseApplyCommand(
    command,
    { all: false },
    runtime,
  );
  expect(applied.results.map((entry) => [entry.kind, entry.executed])).toEqual([
    ['migrations', ['001_create']],
    ['seeds', ['001_defaults']],
  ]);

  // Repeating it runs nothing; both halves report the task as skipped.
  const repeated = await runDatabaseApplyCommand(
    command,
    { all: false },
    runtime,
  );
  expect(repeated.results.flatMap((entry) => entry.executed)).toEqual([]);

  // A reset rebuilds the schema and reruns both, seeds included — which is
  // what `migrate --fresh` could not do.
  const reset = await runDatabaseApplyCommand(
    command,
    { all: false, fresh: true, force: true },
    runtime,
  );
  expect(reset.results.map((entry) => [entry.kind, entry.executed])).toEqual([
    ['migrations', ['001_create']],
    ['seeds', ['001_defaults']],
  ]);
});

it('uses and disposes the factory application and its scope without autoRun', async () => {
  const { runtime, command, migration } = await fixture();
  migration('main', true); // Would fail if autoRun were triggered while migrating analytics.
  migration('analytics');
  const load = runtime.loadRuntime;
  const create = runtime.createApp;
  const destroy = vi.fn();
  const shutdown = vi.fn();
  const register = vi.fn();
  let databaseDestroy = vi.fn();
  let databaseConnection = vi.fn();
  runtime.loadRuntime = async () => {
    const loaded = await load();
    loaded.scope.registerDisposer('test-scope', destroy);
    return loaded;
  };
  runtime.createApp = async (loaded) => {
    const app = await create(loaded);
    const original = app.registerProviders.bind(app);
    app.registerProviders = () => {
      register();
      original();
      const database = app.container.resolve(databaseManagerToken);
      databaseDestroy = vi.spyOn(database, 'destroy');
      databaseConnection = vi.spyOn(database, 'connection');
    };
    const dispose = app.shutdown.bind(app);
    app.shutdown = async () => {
      shutdown();
      await dispose();
    };
    return app;
  };
  await runDatabaseApplyCommand(
    command,
    { all: false, connection: 'analytics' },
    runtime,
  );
  expect(register).toHaveBeenCalledOnce();
  expect(shutdown).toHaveBeenCalledOnce();
  expect(destroy).toHaveBeenCalledOnce();
  expect(databaseDestroy).toHaveBeenCalledOnce();
  expect(databaseConnection).toHaveBeenCalledWith('analytics');
});

it('cleans partial assembly and retains the factory error when cleanup also fails', async () => {
  const { runtime, command } = await fixture();
  const create = runtime.createApp;
  const load = runtime.loadRuntime;
  const destroy = vi.fn();
  const shutdown = vi.fn(async () => {
    throw new Error('cleanup failure');
  });
  runtime.loadRuntime = async () => {
    const loaded = await load();
    loaded.scope.registerDisposer('test-scope', destroy);
    return loaded;
  };
  runtime.createApp = async (loaded) => {
    const app = await create(loaded);
    app.shutdown = shutdown;
    throw new Error('factory failure');
  };
  const error = await failure(
    runDatabaseApplyCommand(command, { all: false }, runtime),
  );
  expect(shutdown).toHaveBeenCalledOnce();
  expect(destroy).toHaveBeenCalledOnce();
  expect(error).toMatchObject({
    errorCode: 'DATABASE_COMMAND_FAILED',
    message: expect.stringContaining('factory failure'),
  });
});

it('uses migration sources contributed by the application factory', async () => {
  const { runtime, command, migration } = await fixture();
  migration('extra');
  const create = runtime.createApp;
  runtime.createApp = async (loaded) => {
    const app = await create(loaded);
    app.addServerPlugins({
      appPackageName: 'test-app',
      plugins: [
        {
          definition: {
            packageName: 'factory-plugin',
            baseDir: loaded.paths.rootDir,
            serviceProviders: [],
            routes: [],
          },
          metadata: {
            packageName: 'factory-plugin',
            version: '1.0.0',
            baseDir: loaded.paths.rootDir,
            rootDir: loaded.paths.rootDir,
            migrationsDirectory: loaded.paths.database('extra/migrations'),
            jobLocations: [],
          },
        },
      ],
    });
    return app;
  };
  const result = await runDatabaseApplyCommand(
    command,
    { all: false },
    runtime,
  );
  expect(result.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'migrations',
        executed: ['001_create'],
      }),
    ]),
  );
});

it('warns about checksum drift and repairs it across both task kinds', async () => {
  const { runtime, command, migration, seed, rewrite } = await fixture();
  migration('main');
  seed('main');
  await runDatabaseApplyCommand(command, { all: false }, runtime);
  rewrite('main');

  // The default policy reports the drift without stopping the run.
  command.log.mockClear();
  await runDatabaseApplyCommand(command, { all: false }, runtime);
  const drift = command.log.mock.calls.flat().join('\n');
  expect(drift).toContain(
    'WARNING: checksum changed since it was executed: 001_create',
  );
  // Both routes, because repair is only right when the schema already agrees
  // with the edited source.
  expect(drift).toContain('"nocobase db repair"');
  expect(drift).toContain('"nocobase db redo"');

  // A dry run reports both kinds and writes nothing.
  const preview = await runDatabaseRepairCommand(
    command,
    { all: false, dryRun: true },
    runtime,
  );
  expect(
    preview.results.map((entry) => [entry.kind, entry.repaired?.length]),
  ).toEqual([
    ['migrations', 1],
    ['seeds', 1],
  ]);
  expect(preview.results.every((entry) => entry.dryRun)).toBe(true);

  const repaired = await runDatabaseRepairCommand(
    command,
    { all: false, force: true },
    runtime,
  );
  expect(repaired.results.flatMap((entry) => entry.repaired)).toHaveLength(2);

  // Nothing is left to repair, and the run no longer warns.
  command.log.mockClear();
  await runDatabaseApplyCommand(command, { all: false }, runtime);
  expect(command.log.mock.calls.flat().join('\n')).not.toContain('WARNING');
  const clean = await runDatabaseRepairCommand(
    command,
    { all: false, force: true },
    runtime,
  );
  expect(clean.results.flatMap((entry) => entry.repaired)).toEqual([]);
});

it('rolls the latest batch back and lets it run again', async () => {
  const { runtime, command, migration } = await fixture();
  migration('main');
  await runDatabaseApplyCommand(command, { all: false }, runtime);

  const rolledBack = await runDatabaseRollbackCommand(
    command,
    { all: false, force: true },
    runtime,
  );
  expect(rolledBack.results).toEqual([
    expect.objectContaining({
      connection: 'main',
      kind: 'migrations',
      status: 'completed',
      batch: 1,
      rolledBack: ['001_create'],
      dryRun: false,
    }),
  ]);

  // The history record is gone, so the corrected migration runs again rather
  // than being skipped as already executed.
  const applied = await runDatabaseApplyCommand(
    command,
    { all: false },
    runtime,
  );
  expect(applied.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'migrations',
        executed: ['001_create'],
      }),
    ]),
  );
});

it('redoes the batch in one command, reporting both halves', async () => {
  const { runtime, command, migration } = await fixture();
  migration('main');
  await runDatabaseApplyCommand(command, { all: false }, runtime);

  const result = await runDatabaseRedoCommand(
    command,
    { all: false, force: true },
    runtime,
  );
  expect(result.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'migrations',
        rolledBack: ['001_create'],
      }),
      expect.objectContaining({
        kind: 'migrations',
        executed: ['001_create'],
      }),
    ]),
  );
});

it('reports an empty history as nothing to roll back', async () => {
  const { runtime, command, migration } = await fixture();
  migration('main');
  const result = await runDatabaseRollbackCommand(
    command,
    { all: false, force: true },
    runtime,
  );
  expect(result.results).toEqual([
    expect.objectContaining({
      status: 'completed',
      batch: 0,
      rolledBack: [],
      dryRun: true,
    }),
  ]);
  expect(command.log).toHaveBeenCalledWith('Nothing to roll back.');
});

it('requires --force where it cannot prompt', async () => {
  const { runtime, command, migration } = await fixture();
  migration('main');
  await runDatabaseApplyCommand(command, { all: false }, runtime);
  vi.stubEnv('CI', '1');

  for (const [run, message] of [
    [
      runDatabaseRollbackCommand,
      'A rollback requires --force in CI or a non-interactive terminal.',
    ],
    [
      runDatabaseRedoCommand,
      'A redo requires --force in CI or a non-interactive terminal.',
    ],
  ] as const) {
    const error = await failure(run(command, { all: false }, runtime));
    expect(error).toMatchObject({
      errorCode: 'FORCE_REQUIRED',
      exitCode: 2,
      message,
    });
  }

  // Nothing was rolled back: the batch is still recorded.
  const preview = await runDatabaseRollbackCommand(
    command,
    { all: false, force: true },
    runtime,
  );
  expect(preview.results[0]).toMatchObject({ rolledBack: ['001_create'] });
});

it('reports an unheld lock, refuses a live one and releases it with --force', async () => {
  const { runtime, command, migration, lockRow } = await fixture();
  migration('main');
  await runDatabaseApplyCommand(command, { all: false }, runtime);

  const unheld = await runDatabaseUnlockCommand(
    command,
    { all: false },
    runtime,
  );
  expect(unheld.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'migrations',
        released: false,
        lockReason: 'not-held',
      }),
    ]),
  );

  // A run that is still beating holds its lock; releasing it would let a
  // second run start beside the first.
  await lockRow('main', { lockedBy: 'live-run', beating: true });
  const live = await runDatabaseUnlockCommand(command, { all: false }, runtime);
  expect(live.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'migrations',
        released: false,
        lockReason: 'active',
      }),
    ]),
  );

  const forced = await runDatabaseUnlockCommand(
    command,
    { all: false, force: true },
    runtime,
  );
  expect(forced.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: 'migrations', released: true }),
    ]),
  );
});

it('releases a lock whose holder stopped beating without --force', async () => {
  const { runtime, command, migration, lockRow } = await fixture();
  migration('main');
  await runDatabaseApplyCommand(command, { all: false }, runtime);
  await lockRow('main', { lockedBy: 'killed-run', beating: false });

  const result = await runDatabaseUnlockCommand(
    command,
    { all: false },
    runtime,
  );
  expect(result.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'migrations',
        released: true,
        lock: expect.objectContaining({ lockedBy: 'killed-run' }),
      }),
    ]),
  );
});

describe('refreshing the Collection cache', () => {
  afterEach(() => {
    setApplicationState(undefined);
  });

  it('writes the cache after migrations run, and leaves it alone when nothing did', async () => {
    const { runtime, command, migration, paths } = await fixture();
    migration('main');
    const applied = await runDatabaseApplyCommand(
      command,
      { all: false, collections: true },
      runtime,
    );
    expect(applied.collections).toEqual([
      {
        connection: 'main',
        status: 'completed',
        written: [
          '_manifest.json',
          'rows/collection.json',
          'rows/metadata.json',
          'rows/schema.json',
        ],
        deleted: [],
      },
    ]);
    expect(
      existsSync(paths.database('main/collections/rows/schema.json')),
    ).toBe(true);
    expect(command.log).toHaveBeenCalledWith(
      '[main] collections: refreshed (4 written, 0 deleted)',
    );

    // Nothing is pending, so the schema did not change and nothing is refreshed.
    const repeated = await runDatabaseApplyCommand(
      command,
      { all: false, collections: true },
      runtime,
    );
    expect(repeated).not.toHaveProperty('collections');
  });

  it('writes nothing unless asked', async () => {
    const { runtime, command, migration, paths } = await fixture();
    migration('main');
    const result = await runDatabaseApplyCommand(
      command,
      { all: false },
      runtime,
    );
    expect(result).not.toHaveProperty('collections');
    expect(existsSync(paths.database('main/collections'))).toBe(false);
  });

  it('follows a rollback and a reset', async () => {
    const { runtime, command, migration, paths } = await fixture();
    migration('main');
    await runDatabaseApplyCommand(
      command,
      { all: false, collections: true },
      runtime,
    );

    const rolledBack = await runDatabaseRollbackCommand(
      command,
      { all: false, force: true, collections: true },
      runtime,
    );
    expect(rolledBack.collections).toEqual([
      expect.objectContaining({
        connection: 'main',
        status: 'completed',
        deleted: [
          'rows/collection.json',
          'rows/metadata.json',
          'rows/schema.json',
        ],
      }),
    ]);
    expect(existsSync(paths.database('main/collections/rows'))).toBe(false);

    const reset = await runDatabaseApplyCommand(
      command,
      { all: false, fresh: true, force: true, collections: true },
      runtime,
    );
    expect(reset.collections).toEqual([
      expect.objectContaining({ status: 'completed' }),
    ]);
    expect(existsSync(paths.database('main/collections/rows'))).toBe(true);
  });

  it('reports a failed refresh without failing the migrations it follows', async () => {
    const { runtime, command, migration, paths } = await fixture();
    migration('main');
    // An entry the generator does not own makes it refuse to write.
    mkdirSync(paths.database('main/collections'), { recursive: true });
    writeFileSync(paths.database('main/collections/notes.txt'), 'mine\n');

    const result = await runDatabaseApplyCommand(
      command,
      { all: false, collections: true },
      runtime,
    );
    expect(result.collections).toEqual([
      expect.objectContaining({ connection: 'main', status: 'failed' }),
    ]);
    expect(command.warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /Could not refresh the Collection cache of "main": .*notes\.txt.*nocobase collections generate --connection main/,
      ),
    );
    expect(command.log).toHaveBeenCalledWith('Executed: 001_create');
  });

  it('is not allowed in a built dist/', () => {
    const loadPlugins = async () => undefined;
    setApplicationState({
      location: { kind: 'deployment', root: '/srv/app' },
      loadPlugins,
    });
    expect(collectionsRefreshAllowed()).toBe(false);
    setApplicationState({
      location: { kind: 'source', root: '/srv/app' },
      loadPlugins,
    });
    expect(collectionsRefreshAllowed()).toBe(true);
  });
});

describe('the db commands', () => {
  it('answer --json with the task results as the result, and nothing else on stdout', async () => {
    const { root, bind, migration } = await fixture();
    migration('analytics');
    const run = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--connection', 'analytics', '--no-collections'],
      root,
    );
    expect(run.exitCode).toBeUndefined();
    const json = run.json();
    expect(json).toMatchObject({
      schemaVersion: 1,
      ok: true,
      status: 'success',
      warnings: [],
    });
    const result = json.result as DatabaseCommandResult;
    // `ok` and `status` belong to the envelope now.
    expect(Object.keys(result)).toEqual(['results']);
    expect(result.results).toEqual([
      expect.objectContaining({
        connection: 'analytics',
        kind: 'migrations',
        executed: ['001_create'],
      }),
      expect.objectContaining({ connection: 'analytics', kind: 'seeds' }),
    ]);
  });

  it('refresh the Collection cache by default, and leave it alone with --no-collections', async () => {
    const { root, bind, migration, paths } = await fixture();
    migration('main');
    const skipped = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(skipped.json().result).not.toHaveProperty('collections');
    expect(existsSync(paths.database('main/collections'))).toBe(false);

    const rolledBack = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--force'],
      root,
    );
    expect(rolledBack.json()).toMatchObject({
      ok: true,
      result: {
        results: [expect.objectContaining({ rolledBack: ['001_create'] })],
      },
    });

    const applied = await runAppCommand(bind(AppDbApply), ['--json'], root);
    expect(applied.json()).toMatchObject({
      ok: true,
      result: {
        collections: [
          expect.objectContaining({ connection: 'main', status: 'completed' }),
        ],
      },
    });
    expect(
      existsSync(paths.database('main/collections/rows/schema.json')),
    ).toBe(true);
  });

  it('print the same lines for people as before', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    const run = await runAppCommand(
      bind(AppDbApply),
      ['--no-collections'],
      root,
    );
    expect(run.error).toBeUndefined();
    expect(run.stdout).toBe(
      [
        '[main] migrations: completed',
        'Batch: 1',
        'Executed: 001_create',
        'Skipped: none',
        '[main] seeds: skipped (missing-directory)',
        '',
      ].join('\n'),
    );
  });

  it('fail --json with the per-connection results in error.details', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    migration('analytics', true);
    const run = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--all', '--no-collections'],
      root,
    );
    expect(run.exitCode).toBe(1);
    expect(run.json()).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'DATABASE_TASK_FAILED',
        message: expect.stringContaining(
          'Database migrations failed for connection "analytics"',
        ),
        details: {
          connection: 'analytics',
          kind: 'migrations',
          results: expect.arrayContaining([
            expect.objectContaining({
              connection: 'main',
              kind: 'migrations',
              status: 'completed',
            }),
            expect.objectContaining({
              connection: 'analytics',
              kind: 'migrations',
              status: 'failed',
            }),
          ]),
        },
      },
    });
  });

  it('print the entries before failing without --json', async () => {
    const { root, bind, migration } = await fixture();
    migration('main', true);
    const run = await runAppCommand(
      bind(AppDbApply),
      ['--no-collections'],
      root,
    );
    expect(run.error).toMatchObject({
      errorCode: 'DATABASE_TASK_FAILED',
      oclif: { exit: 1 },
    });
    expect(run.stdout).toMatch(/^\[main\] migrations: failed: /);
    expect(run.stdout).toContain(
      '[main] seeds: not-run (previous-task-failed)',
    );
  });

  it('refuse a destructive run without --force as invalid usage', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    await runAppCommand(bind(AppDbApply), ['--json'], root);
    vi.stubEnv('CI', '1');

    for (const [command, message] of [
      [
        AppDbReset,
        'Reset requires --force in CI or a non-interactive terminal.',
      ],
      [
        AppDbRollback,
        'A rollback requires --force in CI or a non-interactive terminal.',
      ],
      [
        AppDbRedo,
        'A redo requires --force in CI or a non-interactive terminal.',
      ],
    ] as const) {
      const run = await runAppCommand(bind(command), ['--json'], root);
      expect(run.exitCode).toBe(2);
      expect(run.json()).toMatchObject({
        ok: false,
        error: { code: 'FORCE_REQUIRED', message },
      });
    }
  });

  it('report repair and unlock results under --json', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    await runAppCommand(bind(AppDbApply), ['--json'], root);

    const repair = await runAppCommand(
      bind(AppDbRepair),
      ['--json', '--dry-run'],
      root,
    );
    // A dry run changes nothing, so it is a no-op like every other dry run.
    expect(repair.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: {
        dryRun: true,
        plan: [
          {
            connection: 'main',
            kind: 'migrations',
            action: 'repair',
            tasks: [],
          },
          {
            connection: 'main',
            kind: 'seeds',
            action: 'skip',
            reason: 'missing-directory',
            tasks: [],
          },
        ],
        results: [
          expect.objectContaining({ kind: 'migrations', dryRun: true }),
          expect.objectContaining({ kind: 'seeds' }),
        ],
      },
    });

    const unlock = await runAppCommand(bind(AppDbUnlock), ['--json'], root);
    expect(unlock.json()).toMatchObject({
      ok: true,
      result: {
        results: expect.arrayContaining([
          expect.objectContaining({ kind: 'migrations', released: false }),
        ]),
      },
    });
  });

  it('answer success-noop for a run that changed nothing, as for a dry run', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    const first = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(first.json()).toMatchObject({ ok: true, status: 'success' });

    const again = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(again.json()).toMatchObject({ ok: true, status: 'success-noop' });

    const unlock = await runAppCommand(bind(AppDbUnlock), ['--json'], root);
    expect(unlock.json()).toMatchObject({ ok: true, status: 'success-noop' });

    const rolledBack = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--force', '--no-collections'],
      root,
    );
    expect(rolledBack.json()).toMatchObject({ ok: true, status: 'success' });
    const nothingLeft = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--force', '--no-collections'],
      root,
    );
    expect(nothingLeft.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
    });
  });

  it('report a missing database as a no-op', async () => {
    const { root, bind } = await fixture({ configured: false });
    const run = await runAppCommand(bind(AppDbApply), ['--json'], root);
    expect(run.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: { state: 'not-configured', results: [] },
    });
  });
});

describe('previewing a database command with --dry-run', () => {
  it('plans every task for an empty database and runs none of them', async () => {
    const { root, bind, migration, seed, tables } = await fixture();
    migration('main');
    seed('main');
    expect(await tables('main')).toEqual([]);
    for (const [command, argv] of [
      [AppDbApply, []],
      [AppDbReset, []],
      [AppDbRollback, []],
      [AppDbRedo, []],
      [AppDbRepair, []],
    ] as const) {
      const run = await runAppCommand(
        bind(command),
        ['--json', '--dry-run', ...argv],
        root,
      );
      expect(run.json()).toMatchObject({ ok: true, status: 'success-noop' });
    }
    const apply = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--dry-run'],
      root,
    );
    expect(apply.json()).toMatchObject({
      result: {
        plan: [
          { kind: 'migrations', action: 'apply', tasks: ['001_create'] },
          { kind: 'seeds', action: 'apply', tasks: ['001_defaults'] },
        ],
      },
    });
    // Nothing ran and nothing was written: not even the history and lock tables a run would create.
    expect(await tables('main')).toEqual([]);
  });

  it('lists what apply would run, per connection and kind, and runs none of it', async () => {
    const { root, bind, migration, seed } = await fixture();
    migration('main');
    seed('main');
    const run = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--dry-run', '--all'],
      root,
    );
    expect(run.exitCode).toBeUndefined();
    const json = run.json();
    expect(json).toMatchObject({ ok: true, status: 'success-noop' });
    const result = json.result as DatabaseCommandResult;
    expect(Object.keys(result)).toEqual(['dryRun', 'plan', 'results']);
    expect(result.dryRun).toBe(true);
    expect(result.plan).toEqual([
      {
        connection: 'main',
        kind: 'migrations',
        action: 'apply',
        tasks: ['001_create'],
      },
      {
        connection: 'main',
        kind: 'seeds',
        action: 'apply',
        tasks: ['001_defaults'],
      },
      {
        connection: 'analytics',
        kind: 'migrations',
        action: 'skip',
        reason: 'missing-directory',
        tasks: [],
      },
      {
        connection: 'analytics',
        kind: 'seeds',
        action: 'skip',
        reason: 'missing-directory',
        tasks: [],
      },
      {
        connection: 'erp',
        kind: 'migrations',
        action: 'skip',
        reason: 'external',
        tasks: [],
      },
      {
        connection: 'erp',
        kind: 'seeds',
        action: 'skip',
        reason: 'external',
        tasks: [],
      },
    ]);
    expect(result.results[0]).toMatchObject({
      pending: ['001_create'],
      dryRun: true,
    });

    // Nothing ran, so the real run still has both to execute.
    const applied = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(
      (applied.json().result as DatabaseCommandResult).results.map(
        (entry) => entry.executed,
      ),
    ).toEqual([['001_create'], ['001_defaults']]);
  });

  it('prints the plan for people', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    const run = await runAppCommand(bind(AppDbApply), ['--dry-run'], root);
    expect(run.error).toBeUndefined();
    expect(run.stdout).toBe(
      [
        '[main] migrations: would apply 001_create',
        '[main] seeds: skipped (missing-directory)',
        'Dry run: nothing was changed.',
        '',
      ].join('\n'),
    );
  });

  it('shows which connections a reset would empty, without asking for --force or touching them', async () => {
    const { root, bind, runtime, command, migration, seed } = await fixture();
    migration('main');
    seed('main');
    await runDatabaseApplyCommand(command, { all: false }, runtime);
    vi.stubEnv('CI', '1');

    const run = await runAppCommand(
      bind(AppDbReset),
      ['--json', '--dry-run'],
      root,
    );
    expect(run.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: {
        dryRun: true,
        plan: [
          {
            connection: 'main',
            kind: 'migrations',
            action: 'reset',
            tasks: ['001_create'],
          },
          {
            connection: 'main',
            kind: 'seeds',
            action: 'apply',
            tasks: ['001_defaults'],
          },
        ],
      },
    });
    const human = await runAppCommand(bind(AppDbReset), ['--dry-run'], root);
    expect(human.stdout).toContain(
      '[main] migrations: would delete all managed schema objects, then apply 001_create',
    );

    // The schema was not dropped: nothing is pending.
    const again = await runDatabaseApplyCommand(
      command,
      { all: false, dryRun: true },
      runtime,
    );
    expect(again.plan?.map((entry) => entry.tasks)).toEqual([[], []]);
  });

  it('shows the batch a rollback would undo, and undoes nothing', async () => {
    const { root, bind, runtime, command, migration } = await fixture();
    migration('main');
    await runDatabaseApplyCommand(command, { all: false }, runtime);
    vi.stubEnv('CI', '1');

    const run = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--dry-run'],
      root,
    );
    expect(run.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
      result: {
        dryRun: true,
        plan: [
          {
            connection: 'main',
            kind: 'migrations',
            action: 'rollback',
            batch: 1,
            tasks: ['001_create'],
          },
        ],
        results: [
          expect.objectContaining({
            rolledBack: ['001_create'],
            records: [expect.objectContaining({ packageName: 'test-app' })],
            dryRun: true,
          }),
        ],
      },
    });
    const human = await runAppCommand(bind(AppDbRollback), ['--dry-run'], root);
    expect(human.stdout).toBe(
      [
        '[main] migrations: would roll back batch 1: 001_create',
        'Dry run: nothing was changed.',
        '',
      ].join('\n'),
    );

    const rolledBack = await runDatabaseRollbackCommand(
      command,
      { all: false, force: true },
      runtime,
    );
    expect(rolledBack.results[0]).toMatchObject({ rolledBack: ['001_create'] });
  });

  it('shows a redo as the rollback and the apply that follows it', async () => {
    const { root, bind, runtime, command, migration, seed, paths } =
      await fixture();
    migration('main');
    seed('main');
    await runDatabaseApplyCommand(command, { all: false }, runtime);
    // Pending before the redo, so it runs in the apply half with the batch.
    writeFileSync(
      path.join(paths.database('main/migrations'), '000_first.ts'),
      `import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '000_first', async up() {}, async down() {} });`,
    );

    const result = await runDatabaseRedoCommand(
      command,
      { all: false, dryRun: true },
      runtime,
    );
    expect(result).toMatchObject({ dryRun: true });
    expect(result.plan).toEqual([
      {
        connection: 'main',
        kind: 'migrations',
        action: 'rollback',
        batch: 1,
        tasks: ['001_create'],
      },
      {
        connection: 'main',
        kind: 'migrations',
        action: 'apply',
        tasks: ['000_first', '001_create'],
      },
      // Seeds are not rolled back, so the one that ran does not run again.
      { connection: 'main', kind: 'seeds', action: 'apply', tasks: [] },
    ]);

    // Nothing was rolled back or applied.
    const preview = await runDatabaseRollbackCommand(
      command,
      { all: false, dryRun: true },
      runtime,
    );
    expect(preview.plan?.[0]?.tasks).toEqual(['001_create']);

    const run = await runAppCommand(
      bind(AppDbRedo),
      ['--json', '--dry-run'],
      root,
    );
    expect(run.json()).toMatchObject({ ok: true, status: 'success-noop' });
  });

  it('plans nothing past the rollback when there is no batch to redo', async () => {
    const { runtime, command, migration } = await fixture();
    migration('main');
    const result = await runDatabaseRedoCommand(
      command,
      { all: false, dryRun: true },
      runtime,
    );
    expect(result.plan).toEqual([
      {
        connection: 'main',
        kind: 'migrations',
        action: 'rollback',
        batch: 0,
        tasks: [],
      },
    ]);
    expect(command.log).toHaveBeenCalledWith(
      '[main] migrations: nothing to roll back',
    );
  });

  it('lists the records a repair would rewrite and keeps its lines for people', async () => {
    const { runtime, command, migration, seed, rewrite } = await fixture();
    migration('main');
    seed('main');
    await runDatabaseApplyCommand(command, { all: false }, runtime);
    rewrite('main');
    command.log.mockClear();

    const result = await runDatabaseRepairCommand(
      command,
      { all: false, dryRun: true },
      runtime,
    );
    expect(result.plan).toEqual([
      {
        connection: 'main',
        kind: 'migrations',
        action: 'repair',
        tasks: ['001_create'],
      },
      {
        connection: 'main',
        kind: 'seeds',
        action: 'repair',
        tasks: ['001_defaults'],
      },
    ]);
    expect(command.log).toHaveBeenCalledWith('Would repair: 1');
    expect(command.log).not.toHaveBeenCalledWith(
      'Dry run: nothing was changed.',
    );
  });

  it('reports a missing database as an empty plan', async () => {
    const { root, bind } = await fixture({ configured: false });
    for (const command of [AppDbApply, AppDbReset, AppDbRollback, AppDbRedo]) {
      const run = await runAppCommand(
        bind(command),
        ['--json', '--dry-run'],
        root,
      );
      expect(run.json()).toMatchObject({
        ok: true,
        status: 'success-noop',
        result: {
          state: 'not-configured',
          dryRun: true,
          plan: [],
          results: [],
        },
      });
    }
  });
});

describe('refusing a destructive run without --force', () => {
  it('carries the plan --dry-run shows, and the two ways forward', async () => {
    const { root, bind, migration, seed, rewrite } = await fixture();
    migration('main');
    seed('main');
    await runAppCommand(bind(AppDbApply), ['--json', '--no-collections'], root);
    rewrite('main');
    vi.stubEnv('CI', '1');

    for (const [command, name, message] of [
      [
        AppDbReset,
        'reset',
        'Reset requires --force in CI or a non-interactive terminal.',
      ],
      [
        AppDbRollback,
        'rollback',
        'A rollback requires --force in CI or a non-interactive terminal.',
      ],
      [
        AppDbRedo,
        'redo',
        'A redo requires --force in CI or a non-interactive terminal.',
      ],
      [
        AppDbRepair,
        'repair',
        'Checksum repair requires --force in CI or a non-interactive terminal.',
      ],
    ] as const) {
      const preview = await runAppCommand(
        bind(command),
        ['--json', '--dry-run', '--connection', 'main'],
        root,
      );
      const plan = (preview.json().result as DatabaseCommandResult).plan;
      expect(plan?.length).toBeGreaterThan(0);

      const run = await runAppCommand(
        bind(command),
        ['--json', '--connection', 'main'],
        root,
      );
      expect(run.exitCode).toBe(2);
      expect(run.json()).toMatchObject({
        ok: false,
        status: 'failure',
        error: {
          code: 'FORCE_REQUIRED',
          message,
          details: { plan },
          suggestions: [
            {
              message:
                'Show the user this plan and rerun with --force only if they confirm.',
              run: {
                command: 'pnpm',
                args: [
                  'nocobase',
                  'db',
                  name,
                  '--connection',
                  'main',
                  '--force',
                ],
              },
            },
            {
              message: 'Preview the plan without changing anything:',
              run: {
                command: 'pnpm',
                args: [
                  'nocobase',
                  'db',
                  name,
                  '--connection',
                  'main',
                  '--dry-run',
                  '--json',
                ],
              },
            },
          ],
        },
      });
    }

    // Nothing was changed by any refusal: the batch and the drift are still there.
    const rollback = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--dry-run'],
      root,
    );
    expect(
      (rollback.json().result as DatabaseCommandResult).plan?.[0],
    ).toMatchObject({ tasks: ['001_create'] });
    const repair = await runAppCommand(
      bind(AppDbRepair),
      ['--json', '--dry-run'],
      root,
    );
    expect(
      (repair.json().result as DatabaseCommandResult).plan?.map(
        (entry: DatabasePlanEntry) => entry.tasks,
      ),
    ).toEqual([['001_create'], ['001_defaults']]);
  });

  it('repeats --all in the suggested commands', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    await runAppCommand(bind(AppDbApply), ['--json', '--no-collections'], root);
    vi.stubEnv('CI', '1');
    const run = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--all'],
      root,
    );
    const suggestions = (
      run.json().error as { suggestions: { run: { args: string[] } }[] }
    ).suggestions;
    expect(suggestions.map((suggestion) => suggestion.run.args)).toEqual([
      ['nocobase', 'db', 'rollback', '--all', '--force'],
      ['nocobase', 'db', 'rollback', '--all', '--dry-run', '--json'],
    ]);
  });
});

describe('a task lock held by another run', () => {
  const lockedAt = '2026-09-21T05:07:34.847Z';
  const heartbeatAt = '2026-09-21T05:08:04.847Z';

  /** A migration whose run fails the way a task that could not take its lock does. */
  function lockedMigration(
    paths: Awaited<ReturnType<typeof fixture>>['paths'],
    { expired }: { expired: boolean },
  ): void {
    const directory = paths.database('main/migrations');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, '001_create.ts'),
      `import { defineMigration, TaskLockBusyError } from '@nocobase/db';
export default defineMigration({ name: '001_create', transaction: false, async up() {
throw new TaskLockBusyError({
  label: 'Migration',
  connection: 'main',
  tableName: '__nocobase_migration_lock',
  lockedBy: '4242:1789967254830:abcdef',
  lockedAt: new Date('${lockedAt}'),
  heartbeatAt: new Date('${heartbeatAt}'),
  expired: ${String(expired)},
  waitedMs: 30000,
  inProcess: false,
});
}, async down() {} });`,
    );
  }

  it('fails with DATABASE_LOCKED, naming the holder, and suggests waiting before a forced unlock', async () => {
    const { root, bind, paths } = await fixture();
    lockedMigration(paths, { expired: false });
    const run = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(run.exitCode).toBe(1);
    expect(run.json()).toMatchObject({
      ok: false,
      status: 'failure',
      error: {
        code: 'DATABASE_LOCKED',
        message: expect.stringMatching(
          /^Database migrations failed for connection "main": Migration lock "__nocobase_migration_lock" is already held by "4242:1789967254830:abcdef"/,
        ),
        details: {
          connection: 'main',
          kind: 'migrations',
          table: '__nocobase_migration_lock',
          lockedBy: '4242:1789967254830:abcdef',
          lockedAt,
          heartbeatAt,
          expired: false,
          waitedMs: 30000,
          inProcess: false,
          results: [
            expect.objectContaining({ kind: 'migrations', status: 'failed' }),
            expect.objectContaining({ kind: 'seeds', status: 'not-run' }),
          ],
        },
        suggestions: [
          {
            message:
              'Another run holds the lock. Wait for it to finish, then run this command again.',
          },
          {
            message:
              'If the user confirms the other run is gone, release its lock. It was still sending heartbeats, so this needs --force:',
            run: {
              command: 'pnpm',
              args: [
                'nocobase',
                'db',
                'unlock',
                '--connection',
                'main',
                '--force',
              ],
            },
          },
        ],
      },
    });
  });

  it('suggests a plain unlock for a holder that stopped beating, and prints the entries first', async () => {
    const { root, bind, paths } = await fixture();
    lockedMigration(paths, { expired: true });
    const run = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(run.json()).toMatchObject({
      error: {
        code: 'DATABASE_LOCKED',
        details: { expired: true },
        suggestions: [
          expect.anything(),
          {
            message:
              'If the user confirms the other run is gone, release its lock:',
            run: {
              command: 'pnpm',
              args: ['nocobase', 'db', 'unlock', '--connection', 'main'],
            },
          },
        ],
      },
    });

    const human = await runAppCommand(
      bind(AppDbApply),
      ['--no-collections'],
      root,
    );
    expect(human.error).toMatchObject({
      errorCode: 'DATABASE_LOCKED',
      oclif: { exit: 1 },
    });
    expect(human.stdout).toMatch(
      /^\[main\] migrations: failed: Migration lock "__nocobase_migration_lock" is already held/,
    );
    expect(human.stdout).toContain(
      '[main] seeds: not-run (previous-task-failed)',
    );
  });

  it('maps a lock this process holds without suggesting an unlock', () => {
    const error = toDatabaseCommandError(
      new TaskLockBusyError({
        label: 'Seed',
        connection: 'main',
        tableName: '__nocobase_seed_lock',
        lockedBy: '4242:1789967254830:abcdef',
        lockedAt: undefined,
        heartbeatAt: undefined,
        expired: false,
        waitedMs: 0,
        inProcess: true,
      }),
      'main',
    );
    expect(error).toMatchObject({
      errorCode: 'DATABASE_LOCKED',
      exitCode: 1,
      message:
        'Seed lock "__nocobase_seed_lock" is already held for connection "main".',
      details: {
        connection: 'main',
        table: '__nocobase_seed_lock',
        inProcess: true,
      },
      commandSuggestions: [
        {
          message:
            'Another run holds the lock. Wait for it to finish, then run this command again.',
        },
      ],
    });
    expect((error as CommandError).details).not.toHaveProperty('lockedAt');
  });
});

describe('the collections commands', () => {
  it('check the artifacts, generate them, and find them up to date', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    await runAppCommand(bind(AppDbApply), ['--json', '--no-collections'], root);

    const stale = await runAppCommand(
      bind(AppCollectionsGenerate),
      ['--json', '--check'],
      root,
    );
    expect(stale.exitCode).toBe(1);
    expect(stale.json()).toMatchObject({
      ok: false,
      error: {
        code: 'COLLECTIONS_STALE',
        message: 'The Collection artifacts of "main" differ from the database.',
        suggestions: [
          {
            message: 'Run without --check to write them:',
            run: {
              command: 'pnpm',
              args: ['nocobase', 'collections', 'generate'],
            },
          },
        ],
        details: {
          connections: ['main'],
          check: true,
          results: [
            expect.objectContaining({
              connection: 'main',
              status: 'stale',
              directoryExists: false,
            }),
          ],
        },
      },
    });

    const generated = await runAppCommand(
      bind(AppCollectionsGenerate),
      ['--json'],
      root,
    );
    expect(generated.json()).toMatchObject({
      ok: true,
      status: 'success',
      result: {
        check: false,
        results: [
          expect.objectContaining({
            connection: 'main',
            status: 'completed',
            written: expect.arrayContaining(['rows/schema.json']),
          }),
        ],
      },
    });

    const checked = await runAppCommand(
      bind(AppCollectionsGenerate),
      ['--check'],
      root,
    );
    expect(checked.error).toBeUndefined();
    expect(checked.stdout).toContain('  Up to date.');
  });

  it('report orphaned metadata until --fix deletes it', async () => {
    const { root, bind, migration, dropTable } = await fixture();
    migration('main');
    await runAppCommand(bind(AppDbApply), ['--json', '--no-collections'], root);

    const healthy = await runAppCommand(
      bind(CollectionsDoctor),
      ['--json'],
      root,
    );
    expect(healthy.json()).toMatchObject({
      ok: true,
      status: 'success',
      result: {
        fix: false,
        results: [expect.objectContaining({ connection: 'main', issues: [] })],
      },
    });

    await dropTable('main', 'rows');
    const broken = await runAppCommand(
      bind(CollectionsDoctor),
      ['--json', '--connection', 'main'],
      root,
    );
    expect(broken.exitCode).toBe(1);
    expect(broken.json()).toMatchObject({
      ok: false,
      error: {
        code: 'COLLECTION_ISSUES_REMAIN',
        message: '1 Collection metadata record disagrees with the schema.',
        suggestions: [
          {
            message: 'Delete the records whose table is gone:',
            run: {
              command: 'pnpm',
              args: [
                'nocobase',
                'collections',
                'doctor',
                '--fix',
                '--connection',
                'main',
              ],
            },
          },
        ],
        details: {
          fix: false,
          results: [
            expect.objectContaining({
              connection: 'main',
              issues: [
                expect.objectContaining({
                  name: 'rows',
                  code: 'COLLECTION_TABLE_MISSING',
                  orphaned: true,
                }),
              ],
            }),
          ],
        },
      },
    });

    const fixed = await runAppCommand(bind(CollectionsDoctor), ['--fix'], root);
    expect(fixed.error).toBeUndefined();
    expect(fixed.stdout).toContain('Deleted: rows');
    expect(fixed.stdout).toContain('No issue remains.');
  });

  it('report a load failure with a stable code', async () => {
    const { root, bind } = await fixture();
    const run = await runAppCommand(
      bind(CollectionsDoctor),
      ['--json', '--connection', 'unknown'],
      root,
    );
    expect(run.exitCode).toBe(1);
    expect(run.json()).toMatchObject({
      ok: false,
      error: {
        code: 'DATABASE_COMMAND_FAILED',
        message: 'Unknown database connection "unknown".',
        details: { connection: 'unknown' },
      },
    });
  });

  it('answer success-noop for a run that changed nothing, as for a dry run', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    const first = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(first.json()).toMatchObject({ ok: true, status: 'success' });

    const again = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--no-collections'],
      root,
    );
    expect(again.json()).toMatchObject({ ok: true, status: 'success-noop' });

    const unlock = await runAppCommand(bind(AppDbUnlock), ['--json'], root);
    expect(unlock.json()).toMatchObject({ ok: true, status: 'success-noop' });

    const rolledBack = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--force', '--no-collections'],
      root,
    );
    expect(rolledBack.json()).toMatchObject({ ok: true, status: 'success' });
    const nothingLeft = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--force', '--no-collections'],
      root,
    );
    expect(nothingLeft.json()).toMatchObject({
      ok: true,
      status: 'success-noop',
    });
  });

  it('report a missing database as a no-op', async () => {
    const { root, bind } = await fixture({ configured: false });
    for (const command of [CollectionsDoctor, AppCollectionsGenerate]) {
      const run = await runAppCommand(bind(command), ['--json'], root);
      expect(run.json()).toMatchObject({
        ok: true,
        status: 'success-noop',
        result: { state: 'not-configured', results: [] },
      });
    }
  });
});

describe('confirming a destructive run at a terminal', () => {
  const restore: (() => void)[] = [];
  afterEach(() => {
    for (const undo of restore.splice(0).reverse()) undo();
  });

  /** Puts the command at a terminal where the person types `answer`. */
  function terminal(answer: string): void {
    vi.stubEnv('CI', '');
    const input = Object.assign(new PassThrough(), { isTTY: true });
    input.write(`${answer}\n`);
    const stdin = Object.getOwnPropertyDescriptor(process, 'stdin');
    Object.defineProperty(process, 'stdin', {
      value: input,
      configurable: true,
    });
    restore.push(() => {
      if (stdin) Object.defineProperty(process, 'stdin', stdin);
    });
    const tty = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    });
    restore.push(() => {
      if (tty) Object.defineProperty(process.stdout, 'isTTY', tty);
      else Reflect.deleteProperty(process.stdout, 'isTTY');
    });
  }

  it('asks on stderr under --json, so stdout stays the one document', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    await runAppCommand(bind(AppDbApply), ['--json', '--no-collections'], root);

    terminal('yes');
    const run = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--no-collections'],
      root,
    );
    expect(run.json()).toMatchObject({
      ok: true,
      result: {
        results: [expect.objectContaining({ rolledBack: ['001_create'] })],
      },
    });
    expect(run.stderr).toContain(
      'WARNING: this runs down() for every migration in main: batch 1:',
    );
    expect(run.stderr).toContain('  [main] test-app: 001_create');
    expect(run.stderr).toContain('Type "yes" to continue: ');
  });

  it('reports a declined confirmation as cancelled', async () => {
    const { root, bind, migration } = await fixture();
    migration('main');
    await runAppCommand(bind(AppDbApply), ['--json', '--no-collections'], root);

    terminal('no');
    const rollback = await runAppCommand(
      bind(AppDbRollback),
      ['--json', '--no-collections'],
      root,
    );
    expect(rollback.exitCode).toBe(1);
    expect(rollback.json()).toMatchObject({
      ok: false,
      error: { code: 'CANCELLED', message: 'Rollback cancelled.' },
    });

    terminal('no');
    const reset = await runAppCommand(
      bind(AppDbReset),
      ['--json', '--no-collections'],
      root,
    );
    expect(reset.exitCode).toBe(1);
    expect(reset.json()).toMatchObject({
      ok: false,
      error: { code: 'CANCELLED', message: 'Fresh migration cancelled.' },
    });
    expect(reset.stderr).toContain(
      'WARNING: this will delete all managed schema objects for: main.',
    );
  });
});
