/**
 * Backups and restores of a real application release through a real managed Host child and its IPC channel: the
 * release's own `backup` commands back the App up while it runs and while it is stopped, a later change to its
 * database and uploads is undone by a restore with the backup's release, a failed restore stays recorded with the App
 * stopped, a killed Host neither repeats a finished backup nor loses its result nor leaves its command running, and an
 * interrupted one runs again.
 *
 * Opt in with `APP_HOST_BACKUP_IT_ARTIFACT=<release archive>` (`pnpm build --tar` of an application, such as the
 * default template's `storage/exports/dist.tar.gz`). `APP_HOST_BACKUP_IT_POSTGRES=postgres://user:password@host:port/db`
 * also runs the PostgreSQL case, with compatible `pg_dump`, `pg_restore` and `psql` on `PATH` or in
 * `APP_HOST_BACKUP_IT_PG_BIN`; the release has to include `@nocobase/db-postgres`.
 */
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type {
  HostDeploymentSpec,
  HostManagementService,
  HostScope,
} from '../src/management/index.ts';
import { AppHostSupervisor } from '../src/supervisor.ts';

const ARTIFACT = process.env.APP_HOST_BACKUP_IT_ARTIFACT;
const POSTGRES = process.env.APP_HOST_BACKUP_IT_POSTGRES;
const PG_BIN = process.env.APP_HOST_BACKUP_IT_PG_BIN;
const scope: HostScope = { id: 'backup-it' };

let root: string;
let supervisor: AppHostSupervisor;
let host: HostManagementService;
let volumesDir: string;
let artifactDir: string;
let version: string;
let checksum: string;

function config(database: string, tools = ''): string {
  return `secrets:
  keys:
    - version: 1
      key: ${randomUUID()}
users:
  initialAdmin:
    username: nocobase
    email: admin@nocobase.com
    password: admin123-${randomUUID().slice(0, 8)}
${database}
${tools}`;
}

const SQLITE = `database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: database.sqlite
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true`;

function postgres(url: URL): string {
  return `database:
  default: main
  connections:
    main:
      dialect: postgres
      host: ${url.hostname}
      port: ${url.port || 5432}
      database: ${url.pathname.slice(1)}
      username: ${decodeURIComponent(url.username)}
      password: ${decodeURIComponent(url.password)}
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true`;
}

function spec(
  appId: string,
  operationId: string,
  content: string,
  extra: Partial<HostDeploymentSpec> = {},
): HostDeploymentSpec {
  return {
    id: appId,
    appId,
    operationId,
    scope,
    artifact: { key: 'app.tar.gz', appId, version, checksum },
    desiredState: 'running',
    backend: 'in-process',
    activation: 'eager',
    config: { provider: 'file', content, revision: operationId },
    ...extra,
  };
}

async function startSupervisor(): Promise<void> {
  supervisor = AppHostSupervisor.create({
    mode: 'managed',
    driver: 'auto',
    appRevisionsDir: path.join(root, 'revisions'),
    appVolumesDir: volumesDir,
    configPath: path.join(root, 'host.json'),
    startTimeoutMs: 60_000,
    ipcTimeoutMs: 60_000,
    autoRestart: false,
  });
  host = await supervisor.getManagementClient();
}

async function healthy(appId: string): Promise<boolean> {
  const response = await fetch(
    new URL(`/${appId}/api/healthz`, supervisor.getInfo().targetUrl),
  );
  await response.body?.cancel();
  return response.ok;
}

async function sqliteFile(appId: string): Promise<string> {
  const storage = path.join(volumesDir, appId, 'storage');
  const found: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== '.nocobase-backup')
        await walk(file);
      else if (entry.name === 'database.sqlite') found.push(file);
    }
  };
  await walk(storage);
  expect(found).toHaveLength(1);
  return found[0]!;
}

function marker(file: string, value?: string): string | null {
  const db = new DatabaseSync(file);
  try {
    db.exec('CREATE TABLE IF NOT EXISTS it_marker (value TEXT)');
    if (value !== undefined) {
      db.exec('DELETE FROM it_marker');
      db.prepare('INSERT INTO it_marker (value) VALUES (?)').run(value);
    }
    const row = db.prepare('SELECT value FROM it_marker').get() as
      { value: string } | undefined;
    return row?.value ?? null;
  } finally {
    db.close();
  }
}

/** A file in the App's local uploads, beside what the backup captured. */
async function uploads(appId: string): Promise<string> {
  const dir = path.join(volumesDir, appId, 'storage', 'uploads');
  await mkdir(dir, { recursive: true });
  return dir;
}

function psql(url: string, sql: string): string {
  const result = spawnSync(
    PG_BIN ? path.join(PG_BIN, 'psql') : 'psql',
    [url, '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

describe.runIf(ARTIFACT)('backups with a real release', () => {
  beforeAll(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'app-host-backup-it-'));
    volumesDir = path.join(root, 'volumes');
    artifactDir = path.join(root, 'artifacts');
    await mkdir(artifactDir, { recursive: true });
    await copyFile(ARTIFACT!, path.join(artifactDir, 'app.tar.gz'));
    checksum = createHash('sha256')
      .update(await readFile(path.join(artifactDir, 'app.tar.gz')))
      .digest('hex');
    const listing = spawnSync(
      'tar',
      ['-xzOf', ARTIFACT!, 'dist/package.json'],
      { encoding: 'utf8' },
    );
    version = (JSON.parse(listing.stdout) as { version: string }).version;
    await writeFile(
      path.join(root, 'host.json'),
      JSON.stringify({
        host: {
          mode: 'managed',
          server: { host: '127.0.0.1', port: 0 },
          artifact: {
            driver: 'fs',
            location: artifactDir,
            visibility: 'private',
          },
          appRevisionsDir: path.join(root, 'revisions'),
          appVolumesDir: volumesDir,
          controlDir: path.join(root, 'control'),
          logging: { file: { directory: path.join(root, 'host-logs') } },
        },
      }),
    );
    await startSupervisor();
  }, 120_000);

  afterAll(async () => {
    await supervisor?.shutdown();
    if (root && !process.env.APP_HOST_BACKUP_IT_KEEP)
      await rm(root, { recursive: true, force: true });
  }, 120_000);

  it('describes in-process Apps as backed up', async () => {
    const described = await host.describeHost();
    expect(
      described.backends.find((backend) => backend.name === 'in-process')
        ?.capabilities.backup,
    ).toBe(true);
  });

  it('backs a running SQLite App up and restores its database and uploads', async () => {
    const content = config(SQLITE);
    const deployment = spec('shop', 'd-1', content);
    await host.applyDeployment(deployment);
    expect(await healthy('shop')).toBe(true);
    const database = await sqliteFile('shop');
    marker(database, 'before');
    const files = await uploads('shop');
    await writeFile(path.join(files, 'kept.txt'), 'kept');

    const backup = await host.createBackup!('shop', {
      operationId: 'b-online',
      scope,
    });
    expect(backup).toMatchObject({
      backupId: 'b-online',
      appId: 'shop',
      version,
      artifact: checksum,
      complete: true,
    });
    expect(backup.size).toBeGreaterThan(0);
    expect(backup.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(backup.manifest).toMatchObject({
      connections: [{ name: 'main', mode: 'dump' }],
      limitations: [],
    });
    const archive = path.join(volumesDir, 'shop', 'backups', 'b-online.tar.gz');
    const written = (await stat(archive)).mtimeMs;
    console.info('online SQLite backup', JSON.stringify(backup, null, 2));

    // The same operation answers its result without backing up again.
    await expect(
      host.createBackup!('shop', { operationId: 'b-online', scope }),
    ).resolves.toEqual(backup);
    expect((await stat(archive)).mtimeMs).toBe(written);

    marker(database, 'after');
    await writeFile(path.join(files, 'later.txt'), 'later');
    const restored = await host.restoreBackup!('shop', {
      operationId: 'r-online',
      scope,
      backupId: 'b-online',
      deployment: spec('shop', 'r-online', content),
    });
    console.info('SQLite restore', JSON.stringify(restored.restore, null, 2));
    expect(restored.status.deployments).toMatchObject([
      { appId: 'shop', observedState: 'running' },
    ]);
    expect(await healthy('shop')).toBe(true);
    expect(marker(await sqliteFile('shop'), undefined)).toBe('before');
    await expect(readFile(path.join(files, 'kept.txt'), 'utf8')).resolves.toBe(
      'kept',
    );
  }, 300_000);

  it('backs a stopped App up offline and refuses offline while it runs', async () => {
    await expect(
      host.createBackup!('shop', {
        operationId: 'b-refused',
        scope,
        offline: true,
      }),
    ).rejects.toMatchObject({ code: expect.stringMatching(/RUNNING|ACTIVE/) });
    const refused = await host.getOperation('b-refused', { scope });
    expect(refused).toMatchObject({ kind: 'backup', state: 'failed' });
    expect(refused?.errorCode).toBeTruthy();

    await host.stopDeployment('shop');
    const backup = await host.createBackup!('shop', {
      operationId: 'b-offline',
      scope,
      offline: true,
    });
    expect(backup.complete).toBe(true);
  }, 300_000);

  it('keeps a refused restore traceable', async () => {
    const content = config(SQLITE);
    await expect(
      host.restoreBackup!('shop', {
        operationId: 'r-wrong',
        scope,
        backupId: 'b-offline',
        sha256: '0'.repeat(64),
        deployment: spec('shop', 'r-wrong', content),
      }),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^BACKUP_/) });
    const operation = await host.getOperation('r-wrong', { scope });
    expect(operation).toMatchObject({ kind: 'restore', state: 'failed' });
    console.info('failed restore', JSON.stringify(operation, null, 2));
    const status = await host.getStatus({ scope: scope.id });
    expect(
      status.deployments.find((deployment) => deployment.appId === 'shop')
        ?.observedState,
    ).toBe('stopped');
    // It is a recorded failure: the same operation answers it again, and refuses other parameters.
    await expect(
      host.restoreBackup!('shop', {
        operationId: 'r-wrong',
        scope,
        backupId: 'b-offline',
        sha256: '0'.repeat(64),
        deployment: spec('shop', 'r-wrong', content),
      }),
    ).rejects.toMatchObject({ code: operation?.errorCode });
    await expect(
      host.restoreBackup!('shop', {
        operationId: 'r-wrong',
        scope,
        backupId: 'b-offline',
        deployment: spec('shop', 'r-wrong', content),
      }),
    ).rejects.toMatchObject({ code: 'OPERATION_CONFLICT' });
  }, 300_000);

  it('keeps a finished backup across a killed Host and runs an interrupted one again', async () => {
    const content = config(SQLITE);
    const deployment = spec('shop', 'd-2', content);
    await host.applyDeployment(deployment);
    const backup = await host.createBackup!('shop', {
      operationId: 'b-kept',
      scope,
    });
    const archive = path.join(volumesDir, 'shop', 'backups', 'b-kept.tar.gz');
    const written = (await stat(archive)).mtimeMs;

    // Killed while a backup runs: the next Host records it interrupted. Enough uploads keep it running a while.
    const large = await uploads('shop');
    for (let index = 0; index < 4; index += 1)
      await writeFile(
        path.join(large, `large-${index}.bin`),
        randomBytes(64 * 1024 * 1024),
      );
    const pending = host.createBackup!('shop', {
      operationId: 'b-interrupted',
      scope,
    }).catch((error: unknown) => error);
    await waitFor(async () => {
      const operation = await host.getOperation('b-interrupted', { scope });
      return operation?.state === 'running';
    });
    killHost();
    expect(await pending).toBeInstanceOf(Error);
    await supervisor.shutdown();
    // The command does not outlive the Host that started it.
    await waitFor(
      async () =>
        spawnSync('pgrep', ['-f', 'b-interrupted.tar.gz']).status === 1,
      60_000,
    );
    await startSupervisor();

    await expect(host.getOperation('b-kept', { scope })).resolves.toMatchObject(
      {
        kind: 'backup',
        state: 'succeeded',
        result: backup,
      },
    );
    await expect(
      host.getOperation('b-interrupted', { scope }),
    ).resolves.toMatchObject({ kind: 'backup', state: 'interrupted' });

    // The control plane puts its Apps back, then asks again.
    await host.restoreDeploymentSet({
      revision: 1,
      scope,
      deployments: [deployment],
    });
    await expect(
      host.createBackup!('shop', { operationId: 'b-kept', scope }),
    ).resolves.toEqual(backup);
    expect((await stat(archive)).mtimeMs).toBe(written);
    const rerun = await host.createBackup!('shop', {
      operationId: 'b-interrupted',
      scope,
    });
    expect(rerun.complete).toBe(true);
    await expect(
      host.getOperation('b-interrupted', { scope }),
    ).resolves.toMatchObject({ state: 'succeeded' });
  }, 300_000);

  it('removes a backup', async () => {
    await expect(
      host.deleteBackup!('shop', 'b-kept', { scope }),
    ).resolves.toEqual({ deleted: true });
    await expect(
      stat(path.join(volumesDir, 'shop', 'backups', 'b-kept.tar.gz')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      host.deleteBackup!('shop', 'b-kept', { scope }),
    ).resolves.toEqual({ deleted: false });
  });

  it('copies a SQLite backup into isolated storage and keeps the source unchanged', async () => {
    const sourceAppId = 'copy_sqlite_source';
    const appId = 'copy_sqlite_target';
    const content = config(SQLITE);
    await host.applyDeployment(spec(sourceAppId, 'd-copy-sqlite', content));
    const database = await sqliteFile(sourceAppId);
    const sourceFile = path.join(await uploads(sourceAppId), 'marker.txt');
    marker(database, 'snapshot');
    await writeFile(sourceFile, 'snapshot file');
    const backup = await host.createBackup!(sourceAppId, {
      operationId: 'b-copy-sqlite',
      scope,
    });
    const archive = path.join(
      volumesDir,
      sourceAppId,
      'backups',
      'b-copy-sqlite.tar.gz',
    );
    const sourceArchive = await readFile(archive);
    marker(database, 'live');
    await writeFile(sourceFile, 'live file');

    const targetStorage = path.join(volumesDir, appId, 'storage');
    await mkdir(targetStorage, { recursive: true });
    const targetDatabase = path.join(targetStorage, 'database.sqlite');
    new DatabaseSync(targetDatabase).close();
    const base = {
      scope,
      sourceAppId,
      backupId: backup.backupId,
      sha256: backup.sha256,
    };

    await expect(
      host.restoreBackup!(appId, {
        ...base,
        operationId: 'r-copy-sqlite-shared',
        deployment: spec(
          appId,
          'r-copy-sqlite-shared',
          content.replace(
            'database: database.sqlite',
            `database: ${JSON.stringify(database)}`,
          ),
        ),
      }),
    ).rejects.toMatchObject({ code: 'BACKUP_TARGET_UNSAFE' });
    expect(await healthy(sourceAppId)).toBe(true);
    expect(marker(database)).toBe('live');
    expect(await healthy(appId)).toBe(false);

    const request = {
      ...base,
      operationId: 'r-copy-sqlite',
      deployment: spec(appId, 'r-copy-sqlite', content, {
        desiredState: 'stopped',
      }),
    };
    const restored = await host.restoreBackup!(appId, request);
    expect(restored.status.deployments).toMatchObject([
      { appId, observedState: 'stopped' },
    ]);
    expect(restored.restore).toMatchObject({
      connections: [{ status: 'restored' }],
      disks: [{ status: 'restored' }],
    });
    expect(marker(targetDatabase)).toBe('snapshot');
    expect(
      await readFile(path.join(targetStorage, 'uploads/marker.txt'), 'utf8'),
    ).toBe('snapshot file');
    marker(targetDatabase, 'target edit');
    await expect(host.restoreBackup!(appId, request)).resolves.toEqual(
      restored,
    );
    expect(marker(targetDatabase)).toBe('target edit');
    await expect(
      host.restoreBackup!(appId, { ...request, sourceAppId: 'another_source' }),
    ).rejects.toMatchObject({ code: 'OPERATION_CONFLICT' });

    await host.removeDeployment(appId, { scope, purgeData: true });
    await expect(stat(targetStorage)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await healthy(sourceAppId)).toBe(true);
    expect(marker(database)).toBe('live');
    expect(await readFile(sourceFile, 'utf8')).toBe('live file');
    expect(await readFile(archive)).toEqual(sourceArchive);
  }, 300_000);

  it.runIf(POSTGRES)(
    'copies a PostgreSQL backup into a dedicated database with a restricted owner',
    async () => {
      const sourceAppId = 'copy_pg_source';
      const appId = 'copy_pg_target';
      const admin = new URL(POSTGRES!);
      const source = new URL(admin);
      source.pathname = '/copy_pg_source';
      const target = new URL(admin);
      target.pathname = '/copy_pg_target';
      target.username = appId;
      const password = randomBytes(16).toString('hex');
      target.password = password;
      const tools = PG_BIN
        ? `backup:
  tools:
    pgDump: ${path.join(PG_BIN, 'pg_dump')}
    pgRestore: ${path.join(PG_BIN, 'pg_restore')}
    psql: ${path.join(PG_BIN, 'psql')}`
        : '';
      // The controller allocates the dedicated database and role; Host only restores and purges its managed volume.
      psql(POSTGRES!, 'CREATE DATABASE copy_pg_source');
      psql(
        POSTGRES!,
        `CREATE ROLE copy_pg_target LOGIN PASSWORD '${password}'`,
      );
      psql(POSTGRES!, 'CREATE DATABASE copy_pg_target OWNER copy_pg_target');
      try {
        const sourceConfig = config(postgres(source), tools);
        const targetConfig = sourceConfig.replace(
          postgres(source),
          postgres(target),
        );
        await host.applyDeployment(
          spec(sourceAppId, 'd-copy-pg', sourceConfig),
        );
        expect(await healthy(sourceAppId)).toBe(true);
        psql(
          source.href,
          "CREATE TABLE it_marker (value text); INSERT INTO it_marker VALUES ('snapshot'); GRANT SELECT ON it_marker TO PUBLIC",
        );
        const sourceFile = path.join(await uploads(sourceAppId), 'marker.txt');
        await writeFile(sourceFile, 'snapshot file');
        const backup = await host.createBackup!(sourceAppId, {
          operationId: 'b-copy-pg',
          scope,
        });
        const archive = path.join(
          volumesDir,
          sourceAppId,
          'backups',
          'b-copy-pg.tar.gz',
        );
        const sourceArchive = await readFile(archive);
        psql(source.href, "UPDATE it_marker SET value = 'live'");
        await writeFile(sourceFile, 'live file');

        const base = { scope, sourceAppId, backupId: backup.backupId };
        await expect(
          host.restoreBackup!(appId, {
            ...base,
            operationId: 'r-copy-pg-shared',
            deployment: spec(appId, 'r-copy-pg-shared', sourceConfig),
          }),
        ).rejects.toMatchObject({ code: 'BACKUP_TARGET_UNSAFE' });
        expect(await healthy(sourceAppId)).toBe(true);
        expect(psql(source.href, 'SELECT value FROM it_marker')).toBe('live');

        const request = {
          ...base,
          operationId: 'r-copy-pg',
          deployment: spec(appId, 'r-copy-pg', targetConfig, {
            desiredState: 'stopped',
          }),
        };
        await expect(
          host.restoreBackup!(appId, {
            ...request,
            operationId: 'r-copy-pg-bad-checksum',
            sha256: '0'.repeat(64),
          }),
        ).rejects.toMatchObject({ code: 'BACKUP_DIGEST_MISMATCH' });
        expect(psql(target.href, "SELECT to_regclass('it_marker')")).toBe('');
        await expect(
          host.restoreBackup!(appId, request),
        ).resolves.toMatchObject({
          restore: {
            connections: [{ status: 'restored' }],
            disks: [{ status: 'restored' }],
          },
          status: { deployments: [{ appId, observedState: 'stopped' }] },
        });
        expect(psql(target.href, 'SELECT value FROM it_marker')).toBe(
          'snapshot',
        );
        expect(
          psql(
            target.href,
            "SELECT tableowner FROM pg_tables WHERE schemaname = 'public' AND tablename = 'it_marker'",
          ),
        ).toBe(appId);
        expect(
          psql(
            target.href,
            "SELECT EXISTS (SELECT 1 FROM pg_class, LATERAL aclexplode(relacl) acl WHERE oid = 'public.it_marker'::regclass AND acl.grantee = 0 AND acl.privilege_type = 'SELECT')",
          ),
        ).toBe('f');
        const targetStorage = path.join(volumesDir, appId, 'storage');
        expect(
          await readFile(
            path.join(targetStorage, 'uploads/marker.txt'),
            'utf8',
          ),
        ).toBe('snapshot file');

        await host.removeDeployment(appId, { scope, purgeData: true });
        await expect(stat(targetStorage)).rejects.toMatchObject({
          code: 'ENOENT',
        });
        psql(POSTGRES!, 'DROP DATABASE copy_pg_target');
        expect(await healthy(sourceAppId)).toBe(true);
        expect(psql(source.href, 'SELECT value FROM it_marker')).toBe('live');
        expect(await readFile(sourceFile, 'utf8')).toBe('live file');
        expect(await readFile(archive)).toEqual(sourceArchive);
      } finally {
        await host.removeDeployment(appId, { scope, purgeData: true });
        await host.removeDeployment(sourceAppId, { scope, purgeData: true });
        psql(POSTGRES!, 'DROP DATABASE IF EXISTS copy_pg_target');
        psql(POSTGRES!, 'DROP ROLE IF EXISTS copy_pg_target');
        psql(POSTGRES!, 'DROP DATABASE IF EXISTS copy_pg_source');
      }
    },
    300_000,
  );

  it.runIf(POSTGRES)(
    'backs a PostgreSQL App up and restores its database',
    async () => {
      const url = new URL(POSTGRES!);
      const tools = PG_BIN
        ? `backup:
  tools:
    pgDump: ${path.join(PG_BIN, 'pg_dump')}
    pgRestore: ${path.join(PG_BIN, 'pg_restore')}
    psql: ${path.join(PG_BIN, 'psql')}`
        : '';
      const content = config(postgres(url), tools);
      await host.applyDeployment(spec('pg', 'd-pg', content));
      expect(await healthy('pg')).toBe(true);
      psql(
        POSTGRES!,
        "CREATE TABLE IF NOT EXISTS it_marker (value text); DELETE FROM it_marker; INSERT INTO it_marker VALUES ('before');",
      );
      const backup = await host.createBackup!('pg', {
        operationId: 'b-pg',
        scope,
      });
      console.info('PostgreSQL backup', JSON.stringify(backup, null, 2));
      expect(backup).toMatchObject({ complete: true });
      expect(backup.manifest).toMatchObject({
        connections: [{ name: 'main', mode: 'dump' }],
      });
      psql(POSTGRES!, "UPDATE it_marker SET value = 'after';");
      const restored = await host.restoreBackup!('pg', {
        operationId: 'r-pg',
        scope,
        backupId: 'b-pg',
        deployment: spec('pg', 'r-pg', content),
      });
      expect(restored.status.deployments).toMatchObject([
        { appId: 'pg', observedState: 'running' },
      ]);
      expect(await healthy('pg')).toBe(true);
      expect(psql(POSTGRES!, 'SELECT value FROM it_marker;')).toBe('before');
    },
    300_000,
  );
});

/**
 * Kills the Host process outright. Run from sources, the supervisor's child is a `tsx` launcher whose own child is the
 * Host: both go, as when the machine loses the process, so nothing closes the Host gracefully.
 */
function killHost(): void {
  const launcher = supervisor.getInfo().pid!;
  const tsx = readFileSync(`/proc/${launcher}/cmdline`, 'utf8').includes('tsx');
  const children = tsx
    ? spawnSync('pgrep', ['-P', String(launcher)], { encoding: 'utf8' })
        .stdout.split('\n')
        .filter(Boolean)
        .map(Number)
    : [];
  for (const pid of [...children, launcher]) process.kill(pid, 'SIGKILL');
}

async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs = 60_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await predicate())) {
    if (Date.now() > deadline) throw new Error('Condition was not met in time');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
