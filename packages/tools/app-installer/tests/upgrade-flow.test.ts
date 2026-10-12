import {
  existsSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };
import type { Suggestion } from '../src/lib/errors.ts';
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

const database = () =>
  readFileSync(path.join(root, 'storage/shop/database/main.sqlite'), 'utf8');
interface Recorded {
  id: string;
  version: string;
  builtAt: string;
  installedAt: string;
  buildTarget: { nodeMajor: number };
}
const state = () =>
  JSON.parse(readFileSync(path.join(root, 'installer.json'), 'utf8')) as {
    current: string;
    registry: string;
    pending?: Record<string, unknown>;
    releases: Recorded[];
    history: Record<string, unknown>[];
  };
const writeState = (next: ReturnType<typeof state>) =>
  writeFileSync(
    path.join(root, 'installer.json'),
    JSON.stringify(next, null, 2),
  );
/** The newest build of a version on record. */
const releaseOf = (version: string): Recorded =>
  state()
    .releases.filter((record) => record.version === version)
    .sort((a, b) => b.builtAt.localeCompare(a.builtAt))[0];
const idOf = (version: string) => releaseOf(version).id;
const releasePath = (id: string) => path.join(root, 'releases', id, 'app');
/** The release `current` points at, as an id. */
const linked = () =>
  readlinkSync(path.join(root, 'current')).split(path.sep)[1];
const linkedVersion = () => linked().split('_')[0];
const currentVersion = () => state().current.split('_')[0];

/** The next archive of `version`, carrying the PostgreSQL driver so either dialect can install it. */
const archive = (version: string) =>
  archiveFor(world, temp.dir, version, { drivers: ['@nocobase/db-postgres'] });

async function installOld(extra: string[] = []) {
  const result = await installer(world, [
    'install',
    root,
    '--archive',
    archive('1.0.0'),
    '--port',
    String(await freePort()),
    ...extra,
  ]);
  expect(result.code).toBe(0);
}

/** Upgrades to a new archive of `version`, 1.1.0 unless named. */
const upgrade = (version = '1.1.0', extra: string[] = []) =>
  installer(world, [
    'upgrade',
    '--dir',
    root,
    '--archive',
    archive(version),
    '--yes',
    ...extra,
  ]);

beforeEach(() => {
  temp = tempDir('app-installer-upgrade-');
  root = path.join(temp.dir, 'shop');
  world = createWorld({ pendingTasks: { '1.1.0': 2 } });
});

afterEach(() => {
  temp.remove();
});

describe('upgrade', () => {
  it('backs up, switches, migrates and starts the new release', async () => {
    await installOld();
    const from = state().current;
    const result = await upgrade();

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      from,
      to: idOf('1.1.0'),
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      migrations: 2,
    });
    expect(linked()).toBe(idOf('1.1.0'));
    expect(database()).toBe('schema of 1.1.0');
    const backup = String(result.json.result?.backup);
    expect(
      readFileSync(path.join(root, backup, 'sqlite/main/main.sqlite'), 'utf8'),
    ).toBe('schema of 1.0.0');
    expect(state().current).toBe(idOf('1.1.0'));
    expect(state().pending).toBeUndefined();
  });

  it('rolls itself back, restoring the database, when the new release does not start (exit 3)', async () => {
    await installOld();
    const from = state().current;
    world.startQueue = ['errored'];
    const result = await upgrade();

    expect(result.code).toBe(3);
    expect(result.json.error?.code).toBe('UPGRADE_ROLLED_BACK');
    expect(linked()).toBe(from);
    expect(database()).toBe('schema of 1.0.0');
    expect(state().current).toBe(from);
    expect(state().pending).toBeUndefined();
    // Built by this upgrade and rolled back cleanly: nothing to keep.
    expect(readdirSync(path.join(root, 'releases'))).toEqual([from]);
  });

  it('keeps the new release and the pending state when the old one does not come back either (exit 4)', async () => {
    await installOld();
    const from = state().current;
    world.startQueue = ['errored', 'errored'];
    const result = await upgrade();

    expect(result.code).toBe(4);
    expect(
      result.json.error!.suggestions.map((suggestion) => suggestion.run),
    ).toContainEqual({
      command: 'npx',
      args: [
        '--yes',
        `--registry=${state().registry}`,
        `@nocobase/app-installer@${packageMetadata.version}`,
        'rollback',
        '--dir',
        root,
      ],
    });
    expect(existsSync(releasePath(idOf('1.1.0')))).toBe(true);
    expect(state().pending).toMatchObject({
      action: 'upgrade',
      switched: true,
    });

    // Once the cause is gone, a plain rollback finishes the job, restoring the database.
    const recovered = await installer(world, [
      'rollback',
      '--dir',
      root,
      '--yes',
    ]);
    expect(recovered.code).toBe(0);
    expect(recovered.json.result).toMatchObject({
      to: from,
      databaseRestored: true,
    });
    expect(database()).toBe('schema of 1.0.0');
    expect(state().pending).toBeUndefined();
  });

  it('says where the pre-upgrade databases are when the failed rollback did not restore them (exit 4)', async () => {
    // Nothing to migrate, so the automatic rollback leaves the database alone before failing to start.
    world.pendingTasks = {};
    await installOld();
    world.startQueue = ['errored', 'errored'];
    const result = await upgrade();

    expect(result.code).toBe(4);
    const error = result.json.error as unknown as {
      details: { backup: string; databaseRestored: boolean };
      suggestions: Suggestion[];
    };
    expect(error.details.databaseRestored).toBe(false);
    const note = error.suggestions.find((suggestion) =>
      suggestion.message.includes(path.join(root, error.details.backup)),
    );
    expect(note?.run).toBeUndefined();
  });

  it('removes a half-written backup and restarts the old release when the database is missing', async () => {
    await installOld();
    rmSync(path.join(root, 'storage/shop/database/main.sqlite'));
    const result = await upgrade();

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('UPGRADE_ABORTED');
    expect(result.json.error?.message).toContain(
      path.join(root, 'storage/shop/database/main.sqlite'),
    );
    expect(readdirSync(path.join(root, 'backups'))).toEqual([]);
    expect(state().pending).toBeUndefined();
    expect(world.pm2.processes.get('nocobase-shop')?.status).toBe('online');
  });

  it('refuses to go to an older release, pointing at rollback', async () => {
    await installOld();
    await upgrade();
    const result = await upgrade('1.0.0');

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('DOWNGRADE');
  });

  it('installs a new build when a release directory is gone, and forgets the missing one', async () => {
    await installOld();
    await upgrade();
    await installer(world, ['rollback', '--dir', root, '--yes']);
    const before = idOf('1.1.0');
    rmSync(path.join(root, 'releases', before), { recursive: true });

    const result = await upgrade();
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({ reused: false });
    const after = state().releases.filter(
      (record) => record.version === '1.1.0',
    );
    expect(after.map((record) => record.id)).toEqual([result.json.result?.to]);
    expect(after[0].id).not.toBe(before);
  });

  it('refuses to touch a pm2 process of the same name that belongs to another directory', async () => {
    await installOld();
    world.pm2.processes.get('nocobase-shop')!.cwd = '/srv/other-shop';
    const result = await upgrade();

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('PM2_NAME_IN_USE');
    expect(world.pm2.calls.filter((call) => call.startsWith('stop'))).toEqual(
      [],
    );
  });
});

describe('rollback', () => {
  it('restores the database from before a migrating upgrade', async () => {
    await installOld();
    const from = state().current;
    await upgrade();
    const result = await installer(world, ['rollback', '--dir', root, '--yes']);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      to: from,
      databaseRestored: true,
    });
    expect(database()).toBe('schema of 1.0.0');
    expect(linked()).toBe(from);
    expect(state().current).toBe(from);
  });

  it('takes a version as well as a release id', async () => {
    await installOld();
    const from = state().current;
    await upgrade();
    const result = await installer(world, [
      'rollback',
      '--dir',
      root,
      '--to',
      '1.0.0',
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({ to: from });
  });

  it('on an external database, rolls back without trying to restore a database it never copied', async () => {
    await installOld(['--dialect', 'postgres']);
    writeFileSync(
      path.join(root, 'config.yml'),
      'database:\n  connections:\n    main: { dialect: postgres, host: db }\n',
    );
    const refused = await upgrade();
    expect(refused.json.error?.code).toBe('BACKUP_REQUIRED');
    const upgraded = await installer(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      archive('1.1.0'),
      '--yes',
      '--backup-done',
    ]);
    expect(upgraded.code).toBe(0);

    const result = await installer(world, ['rollback', '--dir', root, '--yes']);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      to: idOf('1.0.0'),
      databaseRestored: false,
    });
    expect(result.json.warnings.join('\n')).toContain(
      'Restore them from your own backup',
    );
  });

  it('changes nothing and keeps installer.json in step with the link when stopping fails', async () => {
    await installOld();
    await upgrade();
    world.pm2.stop = async () => {
      throw new Error('pm2 stop failed');
    };
    const result = await installer(world, ['rollback', '--dir', root, '--yes']);

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('ROLLBACK_ABORTED');
    expect(currentVersion()).toBe('1.1.0');
    expect(linkedVersion()).toBe('1.1.0');
    expect(state().pending).toBeUndefined();
    expect(database()).toBe('schema of 1.1.0');
  });

  it('stays pending when the target does not start, and finishes when run again', async () => {
    await installOld();
    const from = state().current;
    await upgrade();
    world.startQueue = ['errored'];
    const failed = await installer(world, ['rollback', '--dir', root, '--yes']);

    expect(failed.code).toBe(4);
    // Switched, so the link and installer.json both name the release returned to.
    expect(state().current).toBe(from);
    expect(linked()).toBe(from);
    expect(state().pending).toMatchObject({ action: 'rollback', to: from });

    const finished = await installer(world, [
      'rollback',
      '--dir',
      root,
      '--yes',
    ]);
    expect(finished.code).toBe(0);
    expect(finished.json.result).toMatchObject({
      databaseRestored: true,
      recovered: 'rollback',
    });
    expect(state().pending).toBeUndefined();
  });

  it('recovers an upgrade interrupted before the switch by starting the old release, without a restore', async () => {
    await installOld();
    const from = state().current;
    // As left by an upgrade killed while stopping the application: pending recorded, no backup, not switched.
    const interrupted = state();
    interrupted.pending = {
      action: 'upgrade',
      from,
      to: '1.1.0_20260101T010000Z',
      startedAt: new Date().toISOString(),
    };
    writeState(interrupted);
    world.pm2.processes.get('nocobase-shop')!.status = 'stopped';

    const result = await installer(world, ['rollback', '--dir', root, '--yes']);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      to: from,
      databaseRestored: false,
      recovered: 'upgrade',
    });
    expect(result.json.warnings).toEqual([]);
    expect(world.pm2.processes.get('nocobase-shop')?.status).toBe('online');
    expect(state().pending).toBeUndefined();
  });

  it('keeps the release upgraded from when pruning, so rollback stays possible', async () => {
    world.pendingTasks = {};
    await installOld();
    const first = state().current;
    await upgrade('1.1.0');
    const middle = idOf('1.1.0');
    const latest = archive('1.2.0');
    await installer(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      latest,
      '--yes',
    ]);
    // Back to 1.0.0 over two rollbacks, then straight to 1.2.0, which is reused with its old install time.
    await installer(world, ['rollback', '--dir', root, '--yes']);
    await installer(world, [
      'rollback',
      '--dir',
      root,
      '--to',
      '1.0.0',
      '--yes',
    ]);
    const result = await installer(world, [
      'upgrade',
      '--dir',
      root,
      '--archive',
      latest,
      '--keep',
      '2',
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      reused: true,
      pruned: [middle],
    });
    expect(existsSync(releasePath(first))).toBe(true);
    const back = await installer(world, ['rollback', '--dir', root, '--yes']);
    expect(back.json.result).toMatchObject({ to: first });
  });
});
