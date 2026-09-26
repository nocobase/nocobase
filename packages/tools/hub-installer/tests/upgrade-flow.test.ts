import {
  existsSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };
import {
  createWorld,
  freePort,
  hub,
  tempDir,
  type FakeWorld,
} from './harness.ts';

let temp: ReturnType<typeof tempDir>;
let root: string;
let world: FakeWorld;

const database = () =>
  readFileSync(path.join(root, 'storage/hub/database/main.sqlite'), 'utf8');
const state = () =>
  JSON.parse(readFileSync(path.join(root, 'installer.json'), 'utf8')) as {
    current: string;
    pending?: Record<string, unknown>;
    releases: {
      version: string;
      installedAt: string;
      buildTarget: { nodeMajor: number };
    }[];
    history: Record<string, unknown>[];
  };
const writeState = (next: ReturnType<typeof state>) =>
  writeFileSync(
    path.join(root, 'installer.json'),
    JSON.stringify(next, null, 2),
  );
const link = () => readlinkSync(path.join(root, 'current'));

async function installOld(extra: string[] = []) {
  const result = await hub(world, [
    'install',
    root,
    '--hub-version',
    '1.0.0',
    '--port',
    String(await freePort()),
    ...extra,
  ]);
  expect(result.code).toBe(0);
}

beforeEach(() => {
  temp = tempDir('hub-installer-upgrade-');
  root = path.join(temp.dir, 'hub');
  world = createWorld({ pendingTasks: { '1.1.0': 2 } });
});

afterEach(() => {
  temp.remove();
});

describe('upgrade', () => {
  it('backs up, switches, migrates and starts the new release', async () => {
    await installOld();
    const result = await hub(world, ['upgrade', '--dir', root, '--yes']);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      from: '1.0.0',
      to: '1.1.0',
      migrations: 2,
    });
    expect(link()).toBe(path.join('releases', '1.1.0', 'hub'));
    expect(database()).toBe('schema of 1.1.0');
    const backup = String(result.json.result?.backup);
    expect(readFileSync(path.join(root, backup, 'main.sqlite'), 'utf8')).toBe(
      'schema of 1.0.0',
    );
    expect(state()).toMatchObject({ current: '1.1.0' });
    expect(state().pending).toBeUndefined();
  });

  it('rolls itself back, restoring the database, when the new release does not start (exit 3)', async () => {
    await installOld();
    world.startQueue = ['errored'];
    const result = await hub(world, ['upgrade', '--dir', root, '--yes']);

    expect(result.code).toBe(3);
    expect(result.json.error?.code).toBe('UPGRADE_ROLLED_BACK');
    expect(link()).toBe(path.join('releases', '1.0.0', 'hub'));
    expect(database()).toBe('schema of 1.0.0');
    expect(state().current).toBe('1.0.0');
    expect(state().pending).toBeUndefined();
    // Built by this upgrade and rolled back cleanly: nothing to keep.
    expect(existsSync(path.join(root, 'releases', '1.1.0'))).toBe(false);
  });

  it('keeps the new release and the pending state when the old one does not come back either (exit 4)', async () => {
    await installOld();
    world.startQueue = ['errored', 'errored'];
    const result = await hub(world, ['upgrade', '--dir', root, '--yes']);

    expect(result.code).toBe(4);
    const runs = (
      result.json.error as unknown as { suggestions: { run?: string }[] }
    ).suggestions.map((suggestion) => suggestion.run);
    expect(runs).toContain(
      `npx --yes --registry=${state().registry} @nocobase/hub-installer@${packageMetadata.version} rollback --dir ${root}`,
    );
    expect(existsSync(path.join(root, 'releases', '1.1.0', 'hub'))).toBe(true);
    expect(state().releases.map((record) => record.version)).toContain('1.1.0');
    expect(state().pending).toMatchObject({
      action: 'upgrade',
      switched: true,
    });

    // Once the cause is gone, a plain rollback finishes the job, restoring the database.
    const recovered = await hub(world, ['rollback', '--dir', root, '--yes']);
    expect(recovered.code).toBe(0);
    expect(recovered.json.result).toMatchObject({
      to: '1.0.0',
      databaseRestored: true,
    });
    expect(database()).toBe('schema of 1.0.0');
    expect(state().pending).toBeUndefined();
  });

  it('says where the pre-upgrade database is when the failed rollback did not restore it (exit 4)', async () => {
    // Nothing to migrate, so the automatic rollback leaves the database alone before failing to start.
    world.pendingTasks = {};
    await installOld();
    world.startQueue = ['errored', 'errored'];
    const result = await hub(world, ['upgrade', '--dir', root, '--yes']);

    expect(result.code).toBe(4);
    const error = result.json.error as unknown as {
      details: { backup: string; databaseRestored: boolean };
      suggestions: { message: string; run?: string }[];
    };
    expect(error.details.databaseRestored).toBe(false);
    const note = error.suggestions.find((suggestion) =>
      suggestion.message.includes(path.join(root, error.details.backup)),
    );
    expect(note?.message).toContain(path.join(root, 'storage/hub/database'));
    expect(note?.run).toBeUndefined();
  });

  it('removes a half-written backup and restarts the old release when the backup fails', async () => {
    await installOld();
    rmSync(path.join(root, 'storage/hub/database/main.sqlite'));
    const result = await hub(world, ['upgrade', '--dir', root, '--yes']);

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('UPGRADE_ABORTED');
    expect(readdirSync(path.join(root, 'backups'))).toEqual([]);
    expect(state().pending).toBeUndefined();
    expect(world.pm2.processes.get('nocobase-hub')?.status).toBe('online');
  });

  it('refuses to go to an older release, pointing at rollback', async () => {
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--to',
      '1.0.0',
      '--yes',
    ]);

    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('DOWNGRADE');
  });

  it('rebuilds a recorded release whose directory is gone, and replaces its record', async () => {
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    await hub(world, ['rollback', '--dir', root, '--yes']);
    const before = state().releases.find(
      (record) => record.version === '1.1.0',
    );
    rmSync(path.join(root, 'releases', '1.1.0'), { recursive: true });
    world.calls.length = 0;

    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--to',
      '1.1.0',
      '--yes',
    ]);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({ reused: false });
    expect(world.calls.some((call) => call[1] === 'create')).toBe(true);
    const after = state().releases.filter(
      (record) => record.version === '1.1.0',
    );
    expect(after).toHaveLength(1);
    expect(after[0].installedAt).not.toBe(before?.installedAt);
  });

  it('rebuilds a release recorded for another Node major instead of failing after the prompt', async () => {
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    await hub(world, ['rollback', '--dir', root, '--yes']);
    const next = state();
    next.releases.find(
      (record) => record.version === '1.1.0',
    )!.buildTarget.nodeMajor = 22;
    writeState(next);

    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--to',
      '1.1.0',
      '--yes',
    ]);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({ reused: false });
    expect(
      state().releases.find((record) => record.version === '1.1.0')?.buildTarget
        .nodeMajor,
    ).toBe(Number.parseInt(process.versions.node, 10));
  });

  it('refuses to touch a pm2 process of the same name that belongs to another directory', async () => {
    await installOld();
    world.pm2.processes.get('nocobase-hub')!.cwd = '/srv/other-hub';
    const result = await hub(world, ['upgrade', '--dir', root, '--yes']);

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
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    const result = await hub(world, ['rollback', '--dir', root, '--yes']);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      to: '1.0.0',
      databaseRestored: true,
    });
    expect(database()).toBe('schema of 1.0.0');
    expect(link()).toBe(path.join('releases', '1.0.0', 'hub'));
    expect(state().current).toBe('1.0.0');
  });

  it('on an external database, rolls back without trying to restore a database it never copied', async () => {
    await installOld(['--dialect', 'postgres']);
    const upgraded = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--yes',
      '--backup-done',
    ]);
    expect(upgraded.code).toBe(0);

    const result = await hub(world, ['rollback', '--dir', root, '--yes']);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      to: '1.0.0',
      databaseRestored: false,
    });
    expect(result.json.warnings.join('\n')).toContain(
      'Restore it from your own backup',
    );
  });

  it('changes nothing and keeps installer.json in step with the link when stopping fails', async () => {
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    world.pm2.stop = async () => {
      throw new Error('pm2 stop failed');
    };
    const result = await hub(world, ['rollback', '--dir', root, '--yes']);

    expect(result.code).toBe(1);
    expect(result.json.error?.code).toBe('ROLLBACK_ABORTED');
    expect(state().current).toBe('1.1.0');
    expect(link()).toBe(path.join('releases', '1.1.0', 'hub'));
    expect(state().pending).toBeUndefined();
    expect(database()).toBe('schema of 1.1.0');
  });

  it('stays pending when the target does not start, and finishes when run again', async () => {
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    world.startQueue = ['errored'];
    const failed = await hub(world, ['rollback', '--dir', root, '--yes']);

    expect(failed.code).toBe(4);
    // Switched, so the link and installer.json both say 1.0.0.
    expect(state().current).toBe('1.0.0');
    expect(link()).toBe(path.join('releases', '1.0.0', 'hub'));
    expect(state().pending).toMatchObject({ action: 'rollback', to: '1.0.0' });

    const finished = await hub(world, ['rollback', '--dir', root, '--yes']);
    expect(finished.code).toBe(0);
    expect(finished.json.result).toMatchObject({
      databaseRestored: true,
      recovered: 'rollback',
    });
    expect(state().pending).toBeUndefined();
  });

  it('recovers an upgrade interrupted before the switch by starting the old release, without a restore', async () => {
    await installOld();
    // As left by an upgrade killed while stopping the Hub: pending recorded, no backup, not switched.
    const interrupted = state();
    interrupted.pending = {
      action: 'upgrade',
      from: '1.0.0',
      to: '1.1.0',
      startedAt: new Date().toISOString(),
    };
    writeState(interrupted);
    world.pm2.processes.get('nocobase-hub')!.status = 'stopped';

    const result = await hub(world, ['rollback', '--dir', root, '--yes']);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      to: '1.0.0',
      databaseRestored: false,
      recovered: 'upgrade',
    });
    expect(result.json.warnings).toEqual([]);
    expect(world.pm2.processes.get('nocobase-hub')?.status).toBe('online');
    expect(state().pending).toBeUndefined();
  });

  it('keeps the release upgraded from when pruning, so rollback stays possible', async () => {
    world.published = ['1.0.0', '1.1.0', '1.2.0'];
    world.pendingTasks = {};
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--to', '1.1.0', '--yes']);
    await hub(world, ['upgrade', '--dir', root, '--to', '1.2.0', '--yes']);
    // Back to 1.0.0 over two rollbacks, then straight to 1.2.0, which is reused with its old install time.
    await hub(world, ['rollback', '--dir', root, '--yes']);
    await hub(world, ['rollback', '--dir', root, '--to', '1.0.0', '--yes']);
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--to',
      '1.2.0',
      '--keep',
      '2',
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({ pruned: ['1.1.0'] });
    expect(existsSync(path.join(root, 'releases', '1.0.0', 'hub'))).toBe(true);
    const back = await hub(world, ['rollback', '--dir', root, '--yes']);
    expect(back.json.result).toMatchObject({ to: '1.0.0' });
  });
});

describe('upgrade --rebuild', () => {
  const builds = () =>
    world.calls.filter((call) => call[0] === 'pnpm' && call[1] === 'build')
      .length;
  const marker = () =>
    path.join(root, 'releases', '1.0.0', 'hub', 'old-build.marker');

  it('builds the running version again and swaps it in during the downtime', async () => {
    await installOld();
    writeFileSync(marker(), '');
    const before = builds();
    const recorded = state().releases[0];
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--rebuild',
      '--yes',
    ]);

    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({
      from: '1.0.0',
      to: '1.0.0',
      upgraded: true,
      rebuilt: true,
      reused: false,
      migrations: 0,
    });
    expect(builds()).toBe(before + 1);
    // A fresh unpack replaced the directory; nothing of the old build, and no staging directory, is left.
    expect(existsSync(marker())).toBe(false);
    expect(
      existsSync(
        path.join(root, 'releases/1.0.0/hub/dist/server/standalone.js'),
      ),
    ).toBe(true);
    expect(readdirSync(path.join(root, 'releases'))).toEqual(['1.0.0']);
    expect(link()).toBe(path.join('releases', '1.0.0', 'hub'));
    expect(state().current).toBe('1.0.0');
    expect(state().releases.map((record) => record.version)).toEqual(['1.0.0']);
    expect(state().releases[0].installedAt).not.toBe(recorded.installedAt);
    expect(state().history.at(-1)).toMatchObject({
      action: 'upgrade',
      from: '1.0.0',
      to: '1.0.0',
      outcome: 'completed',
      rebuild: true,
    });
    expect(state().pending).toBeUndefined();
  });

  it('puts the replaced release back when the rebuilt one does not start (exit 3)', async () => {
    await installOld();
    writeFileSync(marker(), '');
    const recorded = state().releases[0];
    world.startQueue = ['errored'];
    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--rebuild',
      '--yes',
    ]);

    expect(result.code).toBe(3);
    expect(result.json.error?.code).toBe('UPGRADE_ROLLED_BACK');
    expect(result.json.error?.message).toContain('as it was before');
    expect(existsSync(marker())).toBe(true);
    expect(readdirSync(path.join(root, 'releases'))).toEqual(['1.0.0']);
    expect(state().releases[0]).toEqual(recorded);
    expect(state().pending).toBeUndefined();
    expect(state().history.at(-1)).toMatchObject({
      outcome: 'rolled-back',
      rebuild: true,
    });
  });

  it('finishes a rebuild that was interrupted between the two renames of the swap', async () => {
    await installOld();
    // The swap had moved the running version aside and not yet put the rebuilt one in its place.
    const releases = path.join(root, 'releases');
    renameSync(
      path.join(releases, '1.0.0'),
      path.join(releases, '1.0.0.replaced'),
    );
    const current = state();
    current.pending = {
      action: 'upgrade',
      from: '1.0.0',
      to: '1.0.0',
      startedAt: '2026-01-01T00:00:00.000Z',
      rebuild: true,
      switched: true,
    };
    writeState(current);

    const refused = await hub(world, ['upgrade', '--dir', root, '--yes']);
    expect(refused.code).toBe(2);
    expect(refused.json.error?.code).toBe('OPERATION_INTERRUPTED');
    expect(
      (refused.json.error as unknown as { suggestions: { run?: string }[] })
        .suggestions[0].run,
    ).toContain('--rebuild');

    const result = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--rebuild',
      '--yes',
    ]);
    expect(result.code).toBe(0);
    expect(result.json.result).toMatchObject({ rebuilt: true, to: '1.0.0' });
    expect(readdirSync(releases)).toEqual(['1.0.0']);
    expect(state().pending).toBeUndefined();
  });

  it('points rollback at the rebuild when the release to return to cannot run on this Node', async () => {
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    const current = state();
    current.releases.find(
      (record) => record.version === '1.0.0',
    )!.buildTarget.nodeMajor = Number.parseInt(process.versions.node, 10) - 1;
    writeState(current);

    const result = await hub(world, ['rollback', '--dir', root, '--yes']);
    expect(result.code).toBe(2);
    expect(result.json.error?.code).toBe('NODE_MISMATCH');
    expect(
      (result.json.error as unknown as { suggestions: { run?: string }[] })
        .suggestions[0].run,
    ).toContain('--rebuild');
  });

  it('names the rebuild when the Hub is on the latest version but built for another Node', async () => {
    await installOld();
    world.published = ['1.0.0'];
    const current = state();
    current.releases[0].buildTarget.nodeMajor =
      Number.parseInt(process.versions.node, 10) - 1;
    writeState(current);
    const result = await hub(world, ['upgrade', '--dir', root, '--yes']);

    expect(result.code).toBe(0);
    expect(result.json.status).toBe('success-noop');
    expect(result.json.result).toMatchObject({
      upgraded: false,
      nodeMatches: false,
    });
    expect(result.json.warnings.join('\n')).toContain('--rebuild');
    expect(builds()).toBe(1);
  });

  it('builds a version already on disk instead of reusing it', async () => {
    await installOld();
    await hub(world, ['upgrade', '--dir', root, '--yes']);
    await hub(world, ['rollback', '--dir', root, '--yes']);
    const before = builds();
    const reused = await hub(world, ['upgrade', '--dir', root, '--yes']);
    expect(reused.json.result?.reused).toBe(true);
    expect(builds()).toBe(before);
    await hub(world, ['rollback', '--dir', root, '--yes']);

    const rebuilt = await hub(world, [
      'upgrade',
      '--dir',
      root,
      '--to',
      '1.1.0',
      '--rebuild',
      '--yes',
    ]);
    expect(rebuilt.code).toBe(0);
    expect(rebuilt.json.result).toMatchObject({
      to: '1.1.0',
      reused: false,
      rebuilt: false,
    });
    expect(builds()).toBe(before + 1);
  });
});
