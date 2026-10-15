// db-test-portability: sqlite-only — verifies the installer's SQLite backup restores real migration checksums
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDatabaseManager,
  createMigrator,
  loadMigrations,
  type Migrator,
} from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import * as backup from '../src/lib/backup.ts';
import type { InstallerState } from '../src/lib/state.ts';
import type { ChecksumRepairPlan } from '../src/lib/checksum-repair.ts';
import {
  archiveFor,
  createWorld,
  freePort,
  installer,
  tempDir,
  type FakeWorld,
} from './harness.ts';

let temp: ReturnType<typeof tempDir>;
let root: string;
let world: FakeWorld;
let target: string;
let pendingAtRepair: InstallerState | undefined;
let failAfterRepair: boolean;
const calls: string[] = [];

const state = (): InstallerState =>
  JSON.parse(readFileSync(path.join(root, 'installer.json'), 'utf8'));
const sources = (version: string) => path.join(temp.dir, 'sources', version);
const databaseFile = () => path.join(root, 'storage/shop/database/main.sqlite');
const dbImport = new URL('../../../libs/db/src/index.ts', import.meta.url).href;
const creation = `import { defineMigration } from ${JSON.stringify(dbImport)};
export default defineMigration({ name: '001_create', async up({ builder }) { await builder.createCollection('items', c => c.increments('id')); }, async down({ builder }) { await builder.dropCollection('items'); } });
`;

async function withMigrator<T>(
  version: string,
  fn: (migrator: Migrator) => Promise<T>,
): Promise<T> {
  mkdirSync(path.dirname(databaseFile()), { recursive: true });
  const database = createDatabaseManager({
    default: 'main',
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: databaseFile() } },
  });
  try {
    return await fn(
      createMigrator({
        database,
        directory: sources(version),
        packageName: 'shop',
        onChecksumMismatch: 'error',
      }),
    );
  } finally {
    await database.destroy();
  }
}

const upgrade = (extra: string[] = []) =>
  installer(world, ['upgrade', '--dir', root, '--archive', target, ...extra]);
async function approved(): Promise<string[]> {
  const result = await upgrade();
  expect(result.json.error?.code).toBe('CHECKSUM_REPAIR_REQUIRED');
  const plan = result.json.error!.details!.checksumRepair as ChecksumRepairPlan;
  expect(plan.changes).toHaveLength(1);
  return ['--yes', '--repair-checksums', plan.token];
}

beforeEach(async () => {
  temp = tempDir('app-installer-checksum-');
  root = path.join(temp.dir, 'shop');
  world = createWorld();
  pendingAtRepair = undefined;
  failAfterRepair = false;
  calls.length = 0;
  for (const version of ['1.0.0', '1.1.0']) {
    mkdirSync(sources(version), { recursive: true });
    writeFileSync(
      path.join(sources(version), '001_create.mjs'),
      creation +
        (version === '1.1.0' ? '// Published source correction\n' : ''),
    );
  }
  const fallback = world.run;
  world.run = async (command, args, options) => {
    if (
      command !== process.execPath ||
      !args[0]?.endsWith('dist/cli/index.js') ||
      args[1] !== 'db'
    )
      return fallback(command, args, options);
    const version = args[0]
      .split(path.sep)
      [args[0].split(path.sep).lastIndexOf('releases') + 1].split('_')[0];
    const operation = args[2];
    const dryRun = args.includes('--dry-run');
    calls.push(`${operation}${dryRun ? ' preview' : ''}`);
    try {
      const result = await withMigrator(version, async (migrator) => {
        if (operation === 'repair') {
          const repair = await migrator.repair({ dryRun });
          if (!dryRun) {
            pendingAtRepair = state();
            if (failAfterRepair)
              throw new Error('Repair interrupted after writing history');
          }
          return {
            ...(dryRun ? { dryRun: true } : {}),
            results: [
              {
                connection: 'main',
                kind: 'migrations',
                status: 'completed',
                ...repair,
              },
            ],
          };
        }
        if (dryRun) {
          const applied = new Set(
            (await migrator.history()).map((record) => record.name),
          );
          const tasks = (
            await loadMigrations({
              directory: sources(version),
              packageName: 'shop',
            })
          )
            .filter((migration) => !applied.has(migration.name))
            .map((migration) => migration.name);
          return {
            dryRun: true,
            plan: [{ connection: 'main', kind: 'migrations', tasks }],
          };
        }
        return await migrator.latest();
      });
      return { stdout: JSON.stringify({ ok: true, result }), stderr: '' };
    } catch (error) {
      return {
        stdout: JSON.stringify({
          ok: false,
          error: { code: 'DATABASE_TASK_FAILED', message: String(error) },
        }),
        stderr: '',
      };
    }
  };
  const start = world.pm2.start;
  world.pm2.start = async (file, cwd) => {
    // Real strict startup: an incompatible restored history prevents the old runtime from coming back.
    const version = readlinkSync(path.join(root, 'current'))
      .split(path.sep)[1]
      .split('_')[0];
    await withMigrator(version, (migrator) => migrator.latest());
    await start(file, cwd);
  };
  const installed = await installer(world, [
    'install',
    root,
    '--archive',
    archiveFor(world, temp.dir, '1.0.0'),
    '--port',
    String(await freePort()),
  ]);
  if (installed.code !== 0) throw new Error(JSON.stringify(installed.json));
  target = archiveFor(world, temp.dir, '1.1.0');
  calls.length = 0;
  world.pm2.calls.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  temp.remove();
});

describe('reviewed checksum repair during upgrade', () => {
  it('previews without stopping or repairing, even with --yes', async () => {
    const result = await upgrade(['--yes']);
    expect(result.json.error?.code).toBe('CHECKSUM_REPAIR_REQUIRED');
    expect(calls).toEqual(['apply preview', 'repair preview']);
    expect(world.pm2.calls.some((call) => call.startsWith('stop '))).toBe(
      false,
    );
    await expect(
      withMigrator('1.0.0', (migrator) => migrator.latest()),
    ).resolves.toBeDefined();
    expect(state().pending).toBeUndefined();
  });

  it('backs up original history, repairs, migrates and supports a later explicit rollback with no new migrations', async () => {
    const flags = await approved();
    calls.length = 0;
    const result = await upgrade(flags);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      migrations: 0,
      checksumRepairs: 1,
    });
    expect(calls).toEqual([
      'apply preview',
      'repair preview',
      'repair preview',
      'repair',
      'apply',
    ]);
    expect(pendingAtRepair?.pending).toMatchObject({
      switched: true,
      backup: result.json.result!.backup,
    });
    expect(pendingAtRepair?.schemaVersion).toBe(2);
    await expect(
      withMigrator('1.0.0', (migrator) => migrator.latest()),
    ).rejects.toThrow(/checksum/iu);
    const rolledBack = await installer(world, [
      'rollback',
      '--dir',
      root,
      '--yes',
    ]);
    expect(rolledBack.code).toBe(0);
    expect(rolledBack.json.result?.databaseRestored).toBe(true);
    await expect(
      withMigrator('1.0.0', (migrator) => migrator.latest()),
    ).resolves.toBeDefined();
  });

  it.each(['repair', 'migration', 'startup'])(
    'restores original checksums after %s fails',
    async (failure) => {
      if (failure === 'migration') {
        writeFileSync(
          path.join(sources('1.1.0'), '002_pending.mjs'),
          `import { defineMigration } from ${JSON.stringify(dbImport)}; export default defineMigration({ name: '002_pending', irreversible: true, async up() { throw Error('Data prerequisite failed'); } });`,
        );
      }
      const flags = await approved();
      if (failure === 'repair') failAfterRepair = true;
      if (failure === 'startup') world.startQueue = ['errored'];
      const result = await upgrade(flags);
      expect(result.code).toBe(3);
      expect(result.json.error).toMatchObject({
        code: 'UPGRADE_ROLLED_BACK',
        details: { databaseRestored: true },
      });
      expect(state().pending).toBeUndefined();
      await expect(
        withMigrator('1.0.0', (migrator) => migrator.latest()),
      ).resolves.toBeDefined();
    },
  );

  it('does not repair if backup fails', async () => {
    const flags = await approved();
    vi.spyOn(backup, 'backupForUpgrade').mockRejectedValueOnce(
      new Error('Backup disk full'),
    );
    const result = await upgrade(flags);
    expect(result.json.error?.code).toBe('UPGRADE_ABORTED');
    expect(calls).not.toContain('repair');
    await expect(
      withMigrator('1.0.0', (migrator) => migrator.latest()),
    ).resolves.toBeDefined();
  });

  it('rejects a stale approval before stopping the application', async () => {
    const flags = await approved();
    appendFileSync(
      path.join(sources('1.1.0'), '001_create.mjs'),
      '// Another change\n',
    );
    const result = await upgrade(flags);
    expect(result.json.error?.code).toBe('CHECKSUM_REPAIR_REQUIRED');
    expect(world.pm2.calls.some((call) => call.startsWith('stop '))).toBe(
      false,
    );
    expect(calls).not.toContain('repair');
  });

  it('rechecks approval after stopping writers', async () => {
    const flags = await approved();
    const stop = world.pm2.stop;
    world.pm2.stop = async (name) => {
      await stop(name);
      appendFileSync(
        path.join(sources('1.1.0'), '001_create.mjs'),
        '// Drift discovered after preflight\n',
      );
    };
    const result = await upgrade(flags);
    expect(result.code).toBe(3);
    expect(result.json.error?.message).toContain('plan changed');
    expect(calls).not.toContain('repair');
    await expect(
      withMigrator('1.0.0', (migrator) => migrator.latest()),
    ).resolves.toBeDefined();
  });

  it('recovers the persisted state of an interruption immediately after repair', async () => {
    const result = await upgrade(await approved());
    expect(result.code).toBe(0);
    expect(pendingAtRepair?.pending?.switched).toBe(true);
    // Recreate a killed process from the state persisted before the first database write.
    writeFileSync(
      path.join(root, 'installer.json'),
      JSON.stringify(pendingAtRepair),
    );
    world.pm2.processes.get('nocobase-shop')!.status = 'stopped';
    const recovered = await installer(world, [
      'rollback',
      '--dir',
      root,
      '--yes',
    ]);
    expect(recovered.code).toBe(0);
    expect(recovered.json.result).toMatchObject({
      recovered: 'upgrade',
      databaseRestored: true,
    });
    await expect(
      withMigrator('1.0.0', (migrator) => migrator.latest()),
    ).resolves.toBeDefined();
  });

  it('skips actual repair when no checksums differ', async () => {
    writeFileSync(path.join(sources('1.1.0'), '001_create.mjs'), creation);
    const confirmation = await upgrade();
    expect(confirmation.json.error?.code).toBe('CONFIRMATION_REQUIRED');
    const result = await upgrade(['--yes']);
    expect(result.code).toBe(0);
    expect(result.json.result?.checksumRepairs).toBe(0);
    expect(state().schemaVersion).toBe(1);
    expect(calls).not.toContain('repair');
  });
});
