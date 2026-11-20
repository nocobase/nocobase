// db-test-portability: sqlite-only — exercise the native backup API and on-disk restore.
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Sqlite from 'better-sqlite3';
import { create } from 'tar';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BackupError,
  createBackup,
  inspectBackup,
  restoreBackup,
  verifyBackup,
} from '../src/index.js';
import type {
  BackupReader,
  BackupTarget,
  MigrationFingerprint,
} from '../src/index.js';

const initialMigration: MigrationFingerprint = {
  packageName: 'app',
  name: 'setup',
  checksum: 'original',
};
const initialKey = createHash('sha256')
  .update('test fingerprint')
  .digest('hex');

async function* references(reader: BackupReader) {
  for await (const { disk, key } of reader.readRows({ name: 'uploads' }, [
    'disk',
    'key',
  ])) {
    if (typeof disk === 'string' && typeof key === 'string')
      yield { disk, key };
  }
}

describe('SQLite application backup', () => {
  let root: string;
  let disk: string;
  let archive: string;
  let dbFile: string;
  let external: string;
  let target: BackupTarget;
  let online: boolean;
  let leased: boolean;
  let deleted: boolean;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'backup-test-'));
    disk = join(root, 'storage');
    const output = join(disk, 'exports');
    archive = join(output, 'test.tgz');
    dbFile = join(disk, 'data.sqlite');
    external = join(disk, 'external.sqlite');
    await mkdir(join(disk, 'deployment/artifacts'), { recursive: true });
    await mkdir(join(disk, 'deployment/hosts/tenant'), { recursive: true });
    await mkdir(join(disk, 'jobs'), { recursive: true });
    await mkdir(output);
    await writeFile(join(disk, 'jobs', 'log'), 'runtime');
    await writeFile(
      join(disk, 'deployment/hosts/tenant', 'database'),
      'tenant runtime',
    );
    await writeFile(join(disk, 'upload.txt'), 'old upload');
    await symlink(join(root, 'outside'), join(disk, 'dangling'));
    for (const filename of [dbFile, external]) {
      const db = new Sqlite(filename);
      db.pragma('journal_mode = WAL');
      db.exec(
        "CREATE TABLE uploads(disk TEXT, key TEXT); INSERT INTO uploads VALUES ('local', 'upload.txt')",
      );
      db.close();
    }
    online = true;
    leased = false;
    deleted = false;
    target = {
      appName: 'test',
      appVersion: '2026.11',
      connections: [
        {
          name: 'main',
          schemaManagement: 'managed',
          dialect: 'sqlite',
          filename: dbFile,
          readMigrations: async () => {
            expect(online && !leased).toBe(false);
            return [initialMigration];
          },
          readMigrationCatalog: async () => [initialMigration],
          readFileReferences: references,
        },
        {
          name: 'external',
          schemaManagement: 'external',
          dialect: 'sqlite',
          filename: external,
          readMigrations: async () => {
            throw new Error('External connection should not have been read');
          },
          readMigrationCatalog: async () => [],
        },
      ],
      disks: [
        { name: 'local', driver: 'fs', root: disk },
        {
          name: 'artifacts',
          driver: 'fs',
          root: join(disk, 'deployment/artifacts'),
        },
        { name: 'cloud', driver: 's3', bucket: 'test', prefix: 'uploads' },
      ],
      skipPaths: [join(disk, 'jobs'), join(disk, 'deployment/hosts')],
      keyFingerprints: [{ version: 'v1', fingerprint: initialKey }],
      async withStoppedApp(operation) {
        if (online)
          throw new BackupError(
            'RESTORE_APP_RUNNING',
            'Application is running.',
          );
        return operation();
      },
      async withDeferredDeletes(disks, operation) {
        if (disks.join(',') !== 'local')
          throw new Error('Unexpected deferral disks');
        leased = true;
        try {
          return await operation();
        } finally {
          leased = false;
          deleted = true;
        }
      },
    };
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  function createOnline() {
    return createBackup(target, {
      output: archive,
      excludeDisks: ['artifacts'],
    });
  }

  it('creates and verifies a backup with 200,000 snapshot references', async () => {
    const db = new Sqlite(dbFile);
    try {
      db.exec(`WITH RECURSIVE count(n) AS (
        SELECT 1 UNION ALL SELECT n + 1 FROM count WHERE n < 199999
      ) INSERT INTO uploads SELECT 'local', 'upload.txt' FROM count`);
    } finally {
      db.close();
    }

    const created = await createOnline();
    expect(created.manifest.disks[0]).toMatchObject({ count: 1 });
    await expect(
      verifyBackup(archive, { target, sha256: created.sha256 }),
    ).resolves.toMatchObject({ ok: true });
  }, 15_000);

  it('restores a live SQLite snapshot and uploads while preserving nested excluded paths', async () => {
    const db = new Sqlite(dbFile);
    db.exec("INSERT INTO uploads VALUES ('artifacts', 'removed.zip')");
    await writeFile(
      join(disk, 'deployment/artifacts/keep.zip'),
      'original artifact',
    );
    try {
      const created = await createOnline();
      expect(deleted).toBe(true);
      expect(created.manifest.connections.map(({ mode }) => mode)).toEqual([
        'dump',
        'excluded',
      ]);
      expect(created.manifest.disks[0]).toMatchObject({
        count: 1,
        size: 10,
        skippedPaths: expect.arrayContaining([
          'data.sqlite',
          'data.sqlite-wal',
          'external.sqlite',
          'deployment/artifacts',
          'deployment/hosts',
          'exports',
          'jobs',
        ]),
      });
      expect(await inspectBackup(archive)).toEqual(created.manifest);
      expect(
        await verifyBackup(archive, { target, sha256: created.sha256 }),
      ).toMatchObject({ ok: true });
      db.exec(
        "DELETE FROM uploads; INSERT INTO uploads VALUES ('local', 'new.txt'); CREATE TABLE new_collection(id integer)",
      );
    } finally {
      db.close();
    }
    const anotherDb = new Sqlite(external);
    anotherDb.exec("UPDATE uploads SET key = 'external change'");
    anotherDb.close();
    await rm(join(disk, 'upload.txt'));
    await writeFile(join(disk, 'new.txt'), 'new upload');
    await writeFile(
      join(disk, 'deployment/artifacts/keep.zip'),
      'replacement artifact',
    );
    await writeFile(join(disk, 'jobs/log'), 'replacement runtime');
    await expect(restoreBackup(archive, target)).rejects.toMatchObject({
      code: 'RESTORE_APP_RUNNING',
    });
    online = false;
    expect(await restoreBackup(archive, target)).toEqual({
      connections: [
        { name: 'main', status: 'restored' },
        { name: 'external', status: 'skipped' },
      ],
      disks: [
        { name: 'local', status: 'restored' },
        { name: 'artifacts', status: 'skipped' },
        { name: 'cloud', status: 'skipped' },
      ],
      missingFiles: [{ disk: 'artifacts', key: 'removed.zip' }],
    });
    expect(await readFile(join(disk, 'upload.txt'), 'utf8')).toBe('old upload');
    await expect(readFile(join(disk, 'new.txt'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(
      await readFile(join(disk, 'deployment/artifacts/keep.zip'), 'utf8'),
    ).toBe('replacement artifact');
    expect(
      await readFile(join(disk, 'deployment/hosts/tenant/database'), 'utf8'),
    ).toBe('tenant runtime');
    expect(await readFile(join(disk, 'jobs/log'), 'utf8')).toBe(
      'replacement runtime',
    );
    const restored = new Sqlite(dbFile);
    expect(
      restored.prepare('SELECT key FROM uploads ORDER BY key').pluck().all(),
    ).toEqual(['removed.zip', 'upload.txt']);
    expect(
      restored
        .prepare("SELECT name FROM sqlite_master WHERE name = 'new_collection'")
        .get(),
    ).toBeUndefined();
    restored.close();
    const untouched = new Sqlite(external);
    expect(untouched.prepare('SELECT key FROM uploads').pluck().get()).toBe(
      'external change',
    );
    untouched.close();
  });

  it('rejects broken data, digests, migrations and fingerprints before touching disk or database', async () => {
    const saved = await createOnline();
    online = false;
    const revisedTargets = [
      [{ ...target, appVersion: 'wrong' }, 'RESTORE_APP_VERSION_MISMATCH'],
      [{ ...target, keyFingerprints: [] }, 'RESTORE_KEY_FINGERPRINT_MISMATCH'],
      [{ ...target, connections: [] }, 'RESTORE_CONNECTION_MISSING'],
      [
        {
          ...target,
          connections: [
            { ...target.connections[0]!, readMigrationCatalog: async () => [] },
          ],
        },
        'RESTORE_MIGRATION_MISMATCH',
      ],
    ] as const;
    await writeFile(join(disk, 'upload.txt'), 'current');
    for (const [incompatible, code] of revisedTargets) {
      await expect(restoreBackup(archive, incompatible)).rejects.toMatchObject({
        code,
      });
      expect(await readFile(join(disk, 'upload.txt'), 'utf8')).toBe('current');
    }
    await expect(
      restoreBackup(archive, target, { sha256: '0'.repeat(64) }),
    ).rejects.toMatchObject({ code: 'BACKUP_DIGEST_MISMATCH' });
    const file = await readFile(saved.file);
    await writeFile(archive, file.subarray(0, -6));
    expect(await verifyBackup(archive)).toMatchObject({
      ok: false,
      problems: [{ code: 'BACKUP_INVALID_ARCHIVE' }],
    });
    expect(await verifyBackup(archive + '.missing')).toMatchObject({
      ok: false,
      problems: [{ code: 'BACKUP_FILE_MISSING' }],
    });
  });

  it('keeps the output directory empty after a missing reference or an interrupted backup', async () => {
    await rm(join(disk, 'upload.txt'));
    await expect(createOnline()).rejects.toMatchObject({
      code: 'BACKUP_REFERENCED_FILE_MISSING',
      details: { missing: [{ disk: 'local', key: 'upload.txt' }] },
    });
    const controller = new AbortController();
    target.connections = target.connections.map((connection) => ({
      ...connection,
      readMigrations: async () => {
        controller.abort();
        return [];
      },
    }));
    await expect(
      createBackup(target, {
        output: archive,
        signal: controller.signal,
        excludeDisks: ['artifacts'],
      }),
    ).rejects.toMatchObject({ code: 'BACKUP_ABORTED' });
    expect(await readdir(join(disk, 'exports'))).toEqual([]);
    expect(leased).toBe(false);
  });

  it('restores only the explicitly selected database during a partial restore', async () => {
    await createOnline();
    online = false;
    const live = new Sqlite(dbFile);
    live.exec("UPDATE uploads SET key = 'current.txt'");
    live.close();
    await writeFile(join(disk, 'upload.txt'), 'changed after backup');

    await expect(
      restoreBackup(archive, target, { connections: ['main'] }),
    ).rejects.toMatchObject({ code: 'RESTORE_PARTIAL_NOT_ALLOWED' });
    const result = await restoreBackup(archive, target, {
      connections: ['main'],
      allowPartial: true,
    });
    expect(result.disks.every(({ status }) => status === 'skipped')).toBe(true);
    expect(await readFile(join(disk, 'upload.txt'), 'utf8')).toBe(
      'changed after backup',
    );
    const restored = new Sqlite(dbFile);
    expect(restored.prepare('SELECT key FROM uploads').pluck().get()).toBe(
      'upload.txt',
    );
    restored.close();
  });

  it('puts both database and disk contents back if a post-restore reference check fails', async () => {
    await createOnline();
    online = false;
    const live = new Sqlite(dbFile);
    live.exec("UPDATE uploads SET key = 'current.txt'");
    live.close();
    await rm(join(disk, 'upload.txt'));
    await writeFile(join(disk, 'current.txt'), 'current file');
    target.connections = [
      {
        ...target.connections[0]!,
        readFileReferences() {
          throw new Error('Reference lookup failed');
        },
      },
      target.connections[1]!,
    ];

    await expect(restoreBackup(archive, target)).rejects.toMatchObject({
      code: 'RESTORE_REFERENCE_CHECK_FAILED',
      details: {
        connections: [
          { name: 'main', status: 'rolled-back' },
          { name: 'external', status: 'skipped' },
        ],
        disks: [
          { name: 'local', status: 'rolled-back' },
          { name: 'artifacts', status: 'skipped' },
          { name: 'cloud', status: 'skipped' },
        ],
      },
    });
    expect(await readFile(join(disk, 'current.txt'), 'utf8')).toBe(
      'current file',
    );
    await expect(readFile(join(disk, 'upload.txt'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    const rolledBack = new Sqlite(dbFile);
    expect(rolledBack.prepare('SELECT key FROM uploads').pluck().get()).toBe(
      'current.txt',
    );
    rolledBack.close();
  });

  it('rejects a non-regular archive member', async () => {
    await create({ cwd: disk, gzip: true, file: archive }, ['dangling']);
    expect(await verifyBackup(archive)).toMatchObject({
      ok: false,
      problems: [{ code: 'BACKUP_UNSAFE_PATH' }],
    });
  });
});
