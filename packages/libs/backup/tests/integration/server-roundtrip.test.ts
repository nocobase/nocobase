// db-test-portability: dialect-specific — exercise actual native database dump and restore clients.
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Sqlite from 'better-sqlite3';
import { createConnection } from 'mysql2/promise';
import pg from 'pg';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBackup, restoreBackup, verifyBackup } from '../../src/index.js';
import type {
  BackupConnection,
  BackupReader,
  BackupTarget,
  BackupTools,
} from '../../src/index.js';

const dialect =
  process.env.BACKUP_TEST_DIALECT ?? process.env.NOCOBASE_TEST_DB_DIALECT;
const native = Boolean(process.env.BACKUP_TEST_DIALECT);
const pgTest = dialect === 'postgres';
const mariaTest = dialect === 'mariadb';
const enabled = pgTest || dialect === 'mysql' || mariaTest;
const env = pgTest ? 'POSTGRES' : 'MYSQL';
const host = process.env[env + '_HOST'] ?? '127.0.0.1';
const port = Number(process.env[env + '_PORT']);
const username = process.env.BACKUP_TEST_USER ?? (pgTest ? 'nocobase' : 'root');
const password =
  process.env.BACKUP_TEST_PASSWORD ?? (pgTest ? 'nocobase' : 'root');

const shell = (value: string) => "'" + value.replaceAll("'", "'\\''") + "'";

async function wrapper(file: string, script: string): Promise<string> {
  await writeFile(file, '#!/bin/sh\nset -eu\n' + script + '\n', {
    mode: 0o700,
  });
  return file;
}

async function clientTools(root: string): Promise<BackupTools> {
  if (native) return {};
  const image = pgTest
    ? 'postgres:16-alpine'
    : mariaTest
      ? 'mariadb:10.11'
      : 'mysql:8.4';
  async function tool(name: string) {
    return wrapper(
      join(root, name),
      `exec docker run --rm -i --network host -v ${shell(`${root}:${root}`)} ` +
        '-e PGHOST -e PGPORT -e PGDATABASE -e PGUSER -e PGPASSFILE -e PGSSLMODE -e PGSSLROOTCERT ' +
        `${image} ${name} "$@"`,
    );
  }
  if (pgTest)
    return {
      pgDump: await tool('pg_dump'),
      pgRestore: await tool('pg_restore'),
      psql: await tool('psql'),
    };
  if (mariaTest)
    return {
      mariadbDump: await tool('mariadb-dump'),
      mariadb: await tool('mariadb'),
    };
  return { mysqlDump: await tool('mysqldump'), mysql: await tool('mysql') };
}

async function query(sql: string, database?: string): Promise<unknown> {
  if (pgTest) {
    const client = new pg.Client({
      host,
      port,
      user: username,
      password,
      database: database ?? 'postgres',
    });
    try {
      await client.connect();
      const result = await client.query(sql);
      return result.rows;
    } finally {
      await client.end();
    }
  }
  const client = await createConnection({
    host,
    port,
    user: username,
    password,
    database,
  });
  try {
    const [rows] = await client.query(sql);
    return rows;
  } finally {
    await client.end();
  }
}

async function* references(reader: BackupReader) {
  for await (const { disk, path } of reader.readRows({ name: 'uploads' }, [
    'disk',
    'path',
  ])) {
    if (typeof disk === 'string' && typeof path === 'string')
      yield { disk, key: path };
  }
}

function server(
  name: string,
  database: string,
  schemaManagement: BackupConnection['schemaManagement'] = 'managed',
): BackupConnection {
  return {
    dialect: pgTest ? 'postgres' : 'mysql',
    name,
    schemaManagement,
    database,
    username,
    password,
    host,
    port,
    readFileReferences: references,
    readMigrations: async () => [],
    readMigrationCatalog: async () => [],
  };
}

describe.skipIf(!enabled)('server backup round trip', () => {
  let root: string;
  let disk: string;
  let archive: string;
  let name: string;
  let external: string | undefined;
  let connection: BackupConnection;
  let target: BackupTarget;

  beforeEach(async () => {
    if (!port)
      throw new Error(
        'The backup integration suite requires an explicitly provisioned database listening port.',
      );
    root = await mkdtemp(join(tmpdir(), 'backup-integration-'));
    disk = join(root, 'storage');
    archive = join(root, 'app.tgz');
    name = 'backup_' + randomBytes(8).toString('hex');
    await mkdir(disk);
    await query('CREATE DATABASE ' + name);
    await query(
      'CREATE TABLE uploads (id INT PRIMARY KEY, disk VARCHAR(100), path VARCHAR(255), content TEXT)',
      name,
    );
    connection = server('main', name);
    target = {
      appName: 'integration',
      appVersion: 'local-test',
      connections: [connection],
      disks: [{ name: 'local', driver: 'fs', root: disk }],
      keyFingerprints: [],
      tools: await clientTools(root),
      withDeferredDeletes: async (_disks, operation) => operation(),
      withStoppedApp: async (operation) => operation(),
    };
  });

  afterEach(async () => {
    try {
      if (name) await query('DROP DATABASE IF EXISTS ' + name);
      if (external) await query('DROP DATABASE IF EXISTS ' + external);
    } finally {
      if (root) await rm(root, { recursive: true, force: true });
      external = undefined;
    }
  });

  it('restores database rows and file contents and removes objects added after the snapshot', async () => {
    await query(
      "INSERT INTO uploads VALUES (1, 'local', 'old.txt', 'old value'), (2, NULL, NULL, NULL)",
      name,
    );
    await writeFile(join(disk, 'old.txt'), 'old file');
    const saved = await createBackup(target, { output: archive, tmpDir: root });
    expect(saved.manifest.connections[0]).toMatchObject({
      mode: 'dump',
      server: { type: pgTest ? 'postgres' : mariaTest ? 'mariadb' : 'mysql' },
    });
    expect(await verifyBackup(archive, { target, tmpDir: root })).toMatchObject(
      { ok: true },
    );
    await query("UPDATE uploads SET path = 'new.txt' WHERE id = 1", name);
    await query('CREATE TABLE added_later(id INT)', name);
    await rm(join(disk, 'old.txt'));
    await writeFile(join(disk, 'new.txt'), 'new file');
    expect(
      await restoreBackup(archive, target, { tmpDir: root }),
    ).toMatchObject({
      connections: [{ name: 'main', status: 'restored' }],
      disks: [{ name: 'local', status: 'restored' }],
      missingFiles: [],
    });
    expect(
      await query('SELECT path, content FROM uploads WHERE id = 1', name),
    ).toEqual([{ path: 'old.txt', content: 'old value' }]);
    await expect(query('SELECT * FROM added_later', name)).rejects.toThrow();
    expect(await readFile(join(disk, 'old.txt'), 'utf8')).toBe('old file');
  }, 60_000);

  it.skipIf(pgTest)(
    'checks references written immediately before the native dump snapshot',
    async () => {
      const dump = mariaTest
        ? (target.tools?.mariadbDump ?? 'mariadb-dump')
        : (target.tools?.mysqlDump ?? 'mysqldump');
      const client = mariaTest
        ? (target.tools?.mariadb ?? 'mariadb')
        : (target.tools?.mysql ?? 'mysql');
      const racedDump = await wrapper(
        join(root, 'race'),
        `${shell(client)} "$1" --database=${name} --execute=` +
          `${shell("INSERT INTO uploads VALUES (1, 'local', 'missing.txt', NULL)")}` +
          `\nexec ${shell(dump)} "$@"`,
      );
      target.tools = {
        ...target.tools,
        ...(mariaTest ? { mariadbDump: racedDump } : { mysqlDump: racedDump }),
      };
      await expect(
        createBackup(target, { output: archive, tmpDir: root }),
      ).rejects.toMatchObject({
        code: 'BACKUP_REFERENCED_FILE_MISSING',
        details: { missing: [{ disk: 'local', key: 'missing.txt' }] },
      });
      await expect(readFile(archive)).rejects.toMatchObject({ code: 'ENOENT' });
    },
    60_000,
  );

  it.skipIf(pgTest)(
    'requires downtime for non-InnoDB tables',
    async () => {
      await query('ALTER TABLE uploads ENGINE=MyISAM', name);
      await expect(
        createBackup(target, { output: archive, tmpDir: root }),
      ).rejects.toMatchObject({ code: 'BACKUP_NON_TRANSACTIONAL_TABLES' });
      expect(
        (
          await createBackup(target, {
            output: archive,
            online: false,
            tmpDir: root,
          })
        ).manifest.connections[0],
      ).toMatchObject({ mode: 'dump' });
    },
    60_000,
  );

  it.skipIf(pgTest)(
    'puts MySQL data back after a destructive import fails',
    async () => {
      await query(
        "INSERT INTO uploads VALUES (1, 'local', 'old.txt', 'old value')",
        name,
      );
      await writeFile(join(disk, 'old.txt'), 'old file');
      await createBackup(target, { output: archive, tmpDir: root });
      await query("UPDATE uploads SET content = 'current value'", name);
      await writeFile(join(disk, 'old.txt'), 'current file');

      const client = mariaTest
        ? (target.tools?.mariadb ?? 'mariadb')
        : (target.tools?.mysql ?? 'mysql');
      const marker = shell(join(root, 'failed'));
      const failOnce = await wrapper(
        join(root, 'fail-after-ddl'),
        `if [ ! -e ${marker} ]; then touch ${marker}; ${shell(client)} "$@" --execute='DROP TABLE uploads'; exit 1; fi
exec ${shell(client)} "$@"`,
      );
      target.tools = {
        ...target.tools,
        ...(mariaTest ? { mariadb: failOnce } : { mysql: failOnce }),
      };
      await expect(
        restoreBackup(archive, target, { tmpDir: root }),
      ).rejects.toMatchObject({
        details: {
          connections: [{ name: 'main', status: 'rolled-back' }],
          disks: [{ name: 'local', status: 'pending' }],
        },
      });
      expect(await query('SELECT content FROM uploads', name)).toEqual([
        { content: 'current value' },
      ]);
      expect(await readFile(join(disk, 'old.txt'), 'utf8')).toBe(
        'current file',
      );
    },
    60_000,
  );

  it.skipIf(!pgTest)(
    'rolls back both managed databases when restore of the second connection fails',
    async () => {
      external = name + '_external';
      await query('CREATE DATABASE ' + external);
      await query('CREATE TABLE untouched (value INT)', external);
      await query('INSERT INTO untouched VALUES (7)', external);
      const sqliteFile = join(root, 'test.sqlite');
      const sqlite = new Sqlite(sqliteFile);
      sqlite.exec(
        'CREATE TABLE test (value INTEGER); INSERT INTO test VALUES (1)',
      );
      sqlite.close();
      target.connections = [
        {
          dialect: 'sqlite',
          name: 'sqlite',
          filename: sqliteFile,
          schemaManagement: 'managed',
          readMigrations: async () => [],
          readMigrationCatalog: async () => [],
        },
        connection,
        server('external', external, 'external'),
      ];

      await query("INSERT INTO uploads VALUES (1, NULL, NULL, 'before')", name);
      const saved = await createBackup(target, {
        output: archive,
        tmpDir: root,
      });
      expect(saved.manifest.connections.map(({ mode }) => mode)).toEqual([
        'dump',
        'dump',
        'excluded',
      ]);
      await query("UPDATE uploads SET content = 'current' WHERE id = 1", name);
      await query('UPDATE untouched SET value = 8', external);
      const sqliteCurrent = new Sqlite(sqliteFile);
      sqliteCurrent.exec('UPDATE test SET value = 2');
      sqliteCurrent.close();

      const psql = target.tools?.psql ?? 'psql';
      const marker = shell(join(root, 'failed'));
      const failOnce = await wrapper(
        join(root, 'fail-once'),
        `${shell(psql)} "$@"\nif [ ! -e ${marker} ]; then touch ${marker}; exit 1; fi`,
      );
      target.tools = { ...target.tools, psql: failOnce };
      await expect(
        restoreBackup(archive, target, { tmpDir: root }),
      ).rejects.toMatchObject({
        details: {
          connections: [
            { name: 'sqlite', status: 'rolled-back' },
            { name: 'main', status: 'rolled-back' },
            { name: 'external', status: 'skipped' },
          ],
        },
      });
      expect(await query('SELECT content FROM uploads', name)).toEqual([
        { content: 'current' },
      ]);
      const rolledBack = new Sqlite(sqliteFile);
      expect(rolledBack.prepare('SELECT value FROM test').pluck().get()).toBe(
        2,
      );
      rolledBack.close();
      expect(await query('SELECT value FROM untouched', external)).toEqual([
        { value: 8 },
      ]);

      target.tools = { ...target.tools, psql };
      await restoreBackup(archive, target, { tmpDir: root });
      const restored = new Sqlite(sqliteFile);
      expect(restored.prepare('SELECT value FROM test').pluck().get()).toBe(1);
      restored.close();
      expect(await query('SELECT content FROM uploads', name)).toEqual([
        { content: 'before' },
      ]);
      expect(await query('SELECT value FROM untouched', external)).toEqual([
        { value: 8 },
      ]);
    },
    60_000,
  );

  it.skipIf(pgTest)(
    'falls back only on a confirmed MySQL export permission denial',
    async () => {
      if (connection.dialect !== 'mysql')
        throw new Error('This scenario needs a MySQL server.');
      const account = name + '_reader';
      await query(
        `CREATE USER '${account}'@'%' IDENTIFIED BY 'backup-fixture'`,
      );
      try {
        await query('CREATE TABLE private_data (value INT)', name);
        await query(`GRANT SELECT ON ${name}.uploads TO '${account}'@'%'`);
        await query(`GRANT UPDATE ON ${name}.private_data TO '${account}'@'%'`);
        target.connections = [
          {
            ...connection,
            hosting: 'managed',
            username: account,
            password: 'backup-fixture',
          },
        ];
        const saved = await createBackup(target, {
          output: archive,
          tmpDir: root,
        });
        expect(saved.manifest.connections[0]).toMatchObject({
          mode: 'recovery-point',
          reason: 'export-permission-denied',
        });
        expect(
          await verifyBackup(archive, { target, tmpDir: root }),
        ).toMatchObject({ ok: true });
      } finally {
        await query(`DROP USER '${account}'@'%'`);
      }
    },
    60_000,
  );

  it.skipIf(pgTest)(
    'fails interrupted or invalid dumps even for a managed MySQL server',
    async () => {
      if (connection.dialect !== 'mysql')
        throw new Error('This scenario needs a MySQL server.');
      target.connections = [{ ...connection, hosting: 'managed' }];
      for (const [script, code] of [
        [
          "printf 'incomplete dump'; kill -TERM $$",
          'BACKUP_CLIENT_INTERRUPTED',
        ],
        ["printf 'invalid dump'", 'BACKUP_MYSQL_INCOMPLETE'],
      ] as const) {
        const dump = await wrapper(join(root, 'failed-dump'), script);
        target.tools = {
          ...target.tools,
          ...(mariaTest ? { mariadbDump: dump } : { mysqlDump: dump }),
        };
        await expect(
          createBackup(target, { output: archive, tmpDir: root }),
        ).rejects.toMatchObject({ code });
        await expect(readFile(archive)).rejects.toMatchObject({
          code: 'ENOENT',
        });
      }
    },
    60_000,
  );

  it.skipIf(!pgTest)(
    'records the managed server recovery point on confirmed export permission denial',
    async () => {
      if (connection.dialect !== 'postgres')
        throw new Error('This scenario needs a PostgreSQL server.');
      const account = name + '_reader';
      await query(`CREATE ROLE ${account} LOGIN PASSWORD 'backup-fixture'`);
      try {
        await query('CREATE TABLE private_data (value INT)', name);
        await query('GRANT SELECT ON uploads TO ' + account, name);
        target.connections = [
          {
            ...connection,
            hosting: 'managed',
            username: account,
            password: 'backup-fixture',
          },
        ];
        const saved = await createBackup(target, {
          output: archive,
          tmpDir: root,
        });
        expect(saved.manifest.connections[0]).toMatchObject({
          mode: 'recovery-point',
          reason: 'export-permission-denied',
        });
        expect(saved.manifest.limitations).toHaveLength(1);
        await expect(
          restoreBackup(archive, target, { tmpDir: root }),
        ).rejects.toMatchObject({ code: 'RESTORE_EXTERNAL_RECOVERY_REQUIRED' });
        expect(
          await restoreBackup(archive, target, {
            filesOnly: true,
            tmpDir: root,
          }),
        ).toMatchObject({
          connections: [{ status: 'skipped' }],
          disks: [{ status: 'restored' }],
        });
      } finally {
        await query('DROP OWNED BY ' + account, name);
        await query('DROP ROLE ' + account);
      }
    },
    60_000,
  );
});
