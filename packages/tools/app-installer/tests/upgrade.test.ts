import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };
import { backupFor, defaultRollbackTarget } from '../src/commands/rollback.ts';
import { assertNoPending, releasesToPrune } from '../src/commands/upgrade.ts';
import {
  backupForUpgrade,
  backupHasDatabase,
  backupName,
  readDatabaseInventory,
  restoreDatabase,
} from '../src/lib/backup.ts';
import { confirm } from '../src/lib/confirm.ts';
import { InstallerError } from '../src/lib/errors.ts';
import { layoutOf } from '../src/lib/layout.ts';
import type { InstallerState, ReleaseRecord } from '../src/lib/state.ts';

const target = { platform: 'linux', arch: 'x64', nodeMajor: 24 };

/** A release whose id is its version, which is all these functions compare. */
function release(version: string, installedAt: string): ReleaseRecord {
  return {
    id: version,
    version,
    builtAt: installedAt,
    installedAt,
    buildTarget: target,
  };
}

function state(overrides: Partial<InstallerState> = {}): InstallerState {
  return {
    schemaVersion: 1,
    appName: 'hub',
    basePath: '/hub',
    templateKind: 'hub',
    source: {
      kind: 'template',
      template: 'hub',
      package: '@nocobase/app-template-hub',
    },
    name: 'nocobase-hub',
    registry: 'https://npm.nocobase.ai',
    dialect: 'sqlite',
    drivers: [],
    current: '3.0.0',
    releases: [],
    history: [],
    ...overrides,
  };
}

describe('releasesToPrune', () => {
  const releases = [
    release('1.0.0', '2026-01-01T00:00:00.000Z'),
    release('2.0.0', '2026-02-01T00:00:00.000Z'),
    release('3.0.0', '2026-03-01T00:00:00.000Z'),
    release('4.0.0', '2026-04-01T00:00:00.000Z'),
  ];

  const versions = (records: { id: string }[]) =>
    records.map((record) => record.id);

  it('keeps the newest releases and the protected ones', () => {
    expect(versions(releasesToPrune(releases, ['4.0.0', '3.0.0'], 3))).toEqual([
      '1.0.0',
    ]);
  });

  it('never prunes the release upgraded from, whatever its install time', () => {
    // Current is 3.0.0, reached from 1.0.0 after rollbacks; 1.0.0 is what rollback returns to.
    expect(versions(releasesToPrune(releases, ['3.0.0', '1.0.0'], 2))).toEqual([
      '2.0.0',
      '4.0.0',
    ]);
  });

  it('prunes nothing while there is room', () => {
    expect(releasesToPrune(releases, ['4.0.0'], 10)).toEqual([]);
  });
});

describe('rollback target', () => {
  it('returns to where the last completed upgrade came from', () => {
    const s = state({
      history: [
        { action: 'install', to: '1.0.0', at: 'a' },
        {
          action: 'upgrade',
          from: '1.0.0',
          to: '2.0.0',
          at: 'b',
          outcome: 'completed',
        },
        {
          action: 'upgrade',
          from: '2.0.0',
          to: '3.0.0',
          at: 'c',
          outcome: 'completed',
          migrations: 2,
          backup: 'backups/x',
        },
        {
          action: 'upgrade',
          from: '3.0.0',
          to: '4.0.0',
          at: 'd',
          outcome: 'rolled-back',
        },
      ],
    });
    expect(defaultRollbackTarget(s)).toBe('2.0.0');
    expect(backupFor(s, '2.0.0')).toEqual({
      backup: 'backups/x',
      migrated: true,
    });
  });

  it('leaves the database alone when the upgrade applied no migrations', () => {
    const s = state({
      history: [
        {
          action: 'upgrade',
          from: '2.0.0',
          to: '3.0.0',
          at: 'c',
          outcome: 'completed',
          migrations: 0,
          backup: 'backups/x',
        },
      ],
    });
    expect(backupFor(s, '2.0.0')).toEqual({
      backup: 'backups/x',
      migrated: false,
    });
  });

  it('undoes an interrupted upgrade and finishes an interrupted rollback', () => {
    const stopped = state({
      pending: {
        action: 'upgrade',
        from: '3.0.0',
        to: '4.0.0',
        startedAt: 'x',
      },
    });
    expect(defaultRollbackTarget(stopped)).toBe('3.0.0');
    // Interrupted before `current` moved: nothing can have been migrated.
    expect(backupFor(stopped, '3.0.0')).toEqual({ migrated: false });

    const switched = state({
      pending: {
        action: 'upgrade',
        from: '3.0.0',
        to: '4.0.0',
        startedAt: 'x',
        backup: 'backups/y',
        switched: true,
      },
    });
    // After the switch, how far it got is unknown, so the database is treated as migrated.
    expect(backupFor(switched, '3.0.0')).toEqual({
      backup: 'backups/y',
      migrated: true,
    });

    const rollingBack = state({
      pending: {
        action: 'rollback',
        from: '3.0.0',
        to: '2.0.0',
        startedAt: 'x',
      },
    });
    expect(defaultRollbackTarget(rollingBack)).toBe('2.0.0');

    // A rollback that set out to restore restores again when it is finished.
    const restoring = state({
      pending: {
        action: 'rollback',
        from: '3.0.0',
        to: '2.0.0',
        startedAt: 'x',
        restoreFrom: 'backups/z',
      },
    });
    expect(backupFor(restoring, '2.0.0')).toEqual({
      backup: 'backups/z',
      migrated: true,
    });
  });

  it('has nothing to return to on a fresh install', () => {
    expect(
      defaultRollbackTarget(
        state({ history: [{ action: 'install', to: '3.0.0', at: 'a' }] }),
      ),
    ).toBeUndefined();
  });

  it('refuses to stack an operation on an interrupted one, naming the rollback that recovers', () => {
    const interrupted = state({
      registry: 'http://127.0.0.1:4873',
      pending: {
        action: 'upgrade',
        from: '3.0.0',
        to: '4.0.0',
        startedAt: 'x',
      },
    });
    let error: unknown;
    try {
      assertNoPending(interrupted, '/srv/my hub');
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(InstallerError);
    expect((error as InstallerError).message).toMatch(/did not finish/);
    expect((error as InstallerError).suggestions[0].run).toBe(
      `npx --yes --registry=http://127.0.0.1:4873 @nocobase/app-installer@${packageMetadata.version} rollback --dir '/srv/my hub'`,
    );
    expect(() => assertNoPending(state(), '/srv/hub')).not.toThrow();
  });
});

describe('backup and restore', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'app-installer-backup-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('names a backup after the time and both versions', () => {
    expect(
      backupName('1.0.0', '1.1.0', new Date(Date.UTC(2026, 8, 26, 3, 4, 5))),
    ).toBe('20260926-030405Z_1.0.0_to_1.1.0');
  });

  async function writeConfig(
    layout: ReturnType<typeof layoutOf>,
    yaml: string,
  ) {
    await writeFile(layout.configFile, yaml);
    await writeFile(layout.appEnv, 'NODE_ENV=production\n');
  }

  it('refuses to guess when config.yml cannot be parsed', async () => {
    const layout = layoutOf(root);
    await writeConfig(layout, 'database: [unterminated');
    expect(() => readDatabaseInventory(layout, {})).toThrow(
      expect.objectContaining({ code: 'CONFIG_UNREADABLE', exitCode: 2 }),
    );
  });

  it('finds every SQLite database config.yml declares, resolved against the storage directory', async () => {
    const layout = layoutOf(root);
    await writeConfig(
      layout,
      [
        'database:',
        '  default: primary',
        '  connections:',
        '    primary: { dialect: sqlite, database: data/main.sqlite }',
        '    analytics: { dialect: sqlite, filename: /var/analytics.sqlite }',
        '    scratch: { dialect: sqlite, database: ":memory:" }',
        '    crm: { dialect: postgres, host: db }',
        '    reports: { dialect: sqlite, database: "${REPORTS_DB}" }',
        '    legacy: { dialect: sqlite, database: "${UNSET_DB}" }',
        '',
      ].join('\n'),
    );
    expect(
      readDatabaseInventory(layout, { REPORTS_DB: 'reports.sqlite' }),
    ).toEqual({
      defaultConnection: 'primary',
      sqlite: [
        {
          connection: 'primary',
          file: path.join(layout.storageDir, 'data/main.sqlite'),
        },
        { connection: 'analytics', file: '/var/analytics.sqlite' },
        {
          connection: 'reports',
          file: path.join(layout.storageDir, 'reports.sqlite'),
        },
      ],
      external: ['crm'],
      unresolved: ['legacy'],
    });
  });

  it('copies each database with its journal and restores it, dropping a newer journal', async () => {
    const layout = layoutOf(root);
    const main = path.join(layout.storageDir, 'hub/database/main.sqlite');
    const extra = path.join(layout.storageDir, 'extra/main.sqlite');
    await mkdir(path.dirname(main), { recursive: true });
    await mkdir(path.dirname(extra), { recursive: true });
    await writeConfig(layout, 'config');
    await writeFile(main, 'before');
    await writeFile(extra, 'extra before');

    const backup = await backupForUpgrade(layout, 'b1', [
      { connection: 'main', file: main },
      { connection: 'extra', file: extra },
      { connection: 'unopened', file: path.join(root, 'never.sqlite') },
    ]);
    expect(backup.relative).toBe(path.join('backups', 'b1'));
    expect(backup.databases.map((database) => database.files)).toEqual([
      ['main.sqlite'],
      ['main.sqlite'],
      [],
    ]);
    expect((await readdir(path.join(root, backup.relative))).sort()).toEqual([
      'app.env',
      'backup.json',
      'config.yml',
      'sqlite',
    ]);
    expect(backupHasDatabase(layout, backup.relative)).toBe(true);

    // The failed upgrade migrated, left a write-ahead log behind, and opened a database for the first time.
    await writeFile(main, 'after');
    await writeFile(`${main}-wal`, 'newer writes');
    await writeFile(extra, 'extra after');
    await writeFile(path.join(root, 'never.sqlite'), 'created');

    await restoreDatabase(layout, backup.relative);
    expect(await readFile(main, 'utf8')).toBe('before');
    expect(await readFile(extra, 'utf8')).toBe('extra before');
    await expect(readFile(`${main}-wal`, 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(
      readFile(path.join(root, 'never.sqlite'), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('backs up only the configuration for an external database', async () => {
    const layout = layoutOf(root);
    await writeConfig(layout, 'config');
    const backup = await backupForUpgrade(layout, 'b2', []);
    expect(backup.databases).toEqual([]);
    expect(backupHasDatabase(layout, backup.relative)).toBe(false);
    await expect(restoreDatabase(layout, backup.relative)).rejects.toThrow(
      /no SQLite database/,
    );
  });

  it('never restores from a backup cut short before its manifest was written', async () => {
    const layout = layoutOf(root);
    await mkdir(path.join(layout.backupsDir, 'b3'), { recursive: true });
    expect(backupHasDatabase(layout, path.join('backups', 'b3'))).toBe(false);
  });
});

describe('confirm', () => {
  it('passes straight through with --yes', async () => {
    await expect(
      confirm(['Upgrade?'], { yes: true, json: true }),
    ).resolves.toBeUndefined();
  });

  it('refuses to guess under --json or without a terminal', async () => {
    const input = Object.assign(new PassThrough(), { isTTY: false });
    await expect(
      confirm(['Upgrade?', 'The application stops.'], {
        yes: false,
        json: false,
        input,
      }),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED', exitCode: 2 });
    await expect(
      confirm(['Upgrade?'], { yes: false, json: true }),
    ).rejects.toMatchObject({
      code: 'CONFIRMATION_REQUIRED',
    });
  });

  it('asks on a terminal and cancels on anything but yes', async () => {
    const answer = async (text: string) => {
      const input = Object.assign(new PassThrough(), { isTTY: true });
      const output = new PassThrough();
      const pending = confirm(['Upgrade?'], {
        yes: false,
        json: false,
        input,
        output,
      });
      input.write(`${text}\n`);
      return pending;
    };
    await expect(answer('y')).resolves.toBeUndefined();
    await expect(answer('n')).rejects.toMatchObject({ code: 'CANCELLED' });
  });
});
