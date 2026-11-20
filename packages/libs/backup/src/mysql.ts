import { createReadStream, createWriteStream } from 'node:fs';
import { open, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createConnection } from 'mysql2/promise';
import type { Connection, RowDataPacket } from 'mysql2/promise';
import { emptySnapshot, quoteIdentifier, serverMajor } from './engines.js';
import type { DatabaseEngine, EngineContext } from './engines.js';
import { BackupError } from './errors.js';
import { mysqlDumpReader } from './mysql-dump.js';
import { runClient } from './process.js';
import type {
  BackupReader,
  BackupTable,
  MysqlBackupConnection,
  ServerInfo,
} from './types.js';

const quote = (name: string) => quoteIdentifier(name, '`');

async function withClient<T>(
  target: MysqlBackupConnection,
  use: (client: Connection) => Promise<T>,
): Promise<T> {
  const { database, username, password, socketPath, host, port, tls } = target;
  const ssl = tls && {
    rejectUnauthorized: tls.mode === 'verify-full',
    verifyIdentity: tls.mode === 'verify-full',
    ca: tls.caFile && (await readFile(tls.caFile, 'utf8')),
  };
  const client = await createConnection({
    database,
    user: username,
    password: password ?? '',
    socketPath,
    host: host ?? '127.0.0.1',
    port: port ?? 3306,
    charset: 'UTF8MB4_UNICODE_CI',
    ssl,
    connectTimeout: 10000,
  });
  try {
    return await use(client);
  } finally {
    await client.end();
  }
}

async function credentials(
  target: MysqlBackupConnection,
  server: ServerInfo,
  context: EngineContext,
): Promise<string> {
  const escaped = (value: string) => {
    if (/[\r\n\0]/.test(value))
      throw new BackupError(
        'BACKUP_INVALID_TARGET',
        'A MySQL connection value contains a line break or NUL.',
      );
    return '"' + value.replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"';
  };
  const {
    username,
    password,
    socketPath,
    host = '127.0.0.1',
    port = 3306,
    tls,
  } = target;
  const lines = [
    '[client]',
    'user=' + escaped(username),
    'password=' + escaped(password ?? ''),
    'default-character-set=utf8mb4',
    ...(socketPath
      ? ['protocol=socket', 'socket=' + escaped(socketPath)]
      : ['protocol=tcp', 'host=' + escaped(host), 'port=' + port]),
  ];
  if (server.type === 'mariadb') {
    lines.push(
      ...(tls
        ? [
            'ssl',
            `ssl-verify-server-cert=${tls.mode === 'verify-full' ? '1' : '0'}`,
          ]
        : ['skip-ssl']),
    );
  } else {
    lines.push(
      'ssl-mode=' +
        (tls
          ? tls.mode === 'verify-full'
            ? 'VERIFY_IDENTITY'
            : 'REQUIRED'
          : 'DISABLED'),
    );
  }
  if (tls?.caFile) lines.push('ssl-ca=' + escaped(tls.caFile));
  const file = join(context.directory, 'client.cnf');
  await writeFile(file, lines.join('\n') + '\n', { mode: 0o600 });
  return '--defaults-file=' + file;
}

async function serverInfo(client: Connection): Promise<ServerInfo> {
  const [rows] = await client.query<
    (RowDataPacket & { version: string; charset: string; caseNames: number })[]
  >(
    'SELECT version() AS version, @@character_set_database AS charset, @@lower_case_table_names AS caseNames',
  );
  const { version, charset, caseNames } = rows[0];
  const type = /mariadb/i.test(version) ? 'mariadb' : 'mysql';
  return {
    type,
    version,
    charset,
    majorVersion: serverMajor(version.replace(/^5\.5\.5-(?=.*mariadb)/i, '')),
    lowerCaseTableNames: Number(caseNames),
  };
}

async function serverTime(client: Connection): Promise<string> {
  const [rows] = await client.query<(RowDataPacket & { time: string })[]>(
    "SELECT DATE_FORMAT(UTC_TIMESTAMP(6), '%Y-%m-%dT%H:%i:%s.%fZ') AS time",
  );
  return rows[0].time;
}

function mysqlReader(client: Connection, database: string): BackupReader {
  function tableName(table: BackupTable): string {
    if (table.schema && table.schema !== database) {
      throw new BackupError(
        'BACKUP_INVALID_TARGET',
        'A MySQL backup only contains the configured database.',
      );
    }
    return quote(database) + '.' + quote(table.name);
  }
  return {
    async findTables(columns) {
      const names = [...new Set(columns)];
      if (!names.length) return [];
      const [rows] = await client.query<(RowDataPacket & BackupTable)[]>(
        `SELECT c.TABLE_NAME AS name FROM information_schema.columns c
         JOIN information_schema.tables t USING (TABLE_SCHEMA, TABLE_NAME)
         WHERE t.TABLE_TYPE = 'BASE TABLE' AND c.TABLE_SCHEMA = ? AND c.COLUMN_NAME IN (?)
         GROUP BY c.TABLE_NAME HAVING COUNT(*) = ?`,
        [database, names, names.length],
      );
      return rows;
    },
    async hasTable(table) {
      tableName(table);
      const [result] = await client.query<RowDataPacket[]>(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? AND table_type = ?',
        [database, table.name, 'BASE TABLE'],
      );
      return result.length > 0;
    },
    async *readRows(table, columns) {
      if (!columns.length) return;
      const [rows] = await client.query<RowDataPacket[]>(
        `SELECT ${columns.map(quote).join(', ')} FROM ${tableName(table)}`,
      );
      yield* rows;
    },
  };
}

async function nonTransactionalTables(
  client: Connection,
  database: string,
): Promise<string[]> {
  const [rows] = await client.query<(RowDataPacket & { name: string })[]>(
    "SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' AND ENGINE <> 'InnoDB'",
    [database],
  );
  return rows.map(({ name }) => name);
}

async function verifyMysqlDump(file: string): Promise<void> {
  const input = await open(file, 'r');
  try {
    const size = (await input.stat()).size;
    const chunk = Buffer.alloc(Math.min(size, 8192));
    await input.read(chunk, 0, chunk.length, size - chunk.length);
    if (
      !/(?:^|\n)-- Dump completed on \d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}\s*$/.test(
        chunk.toString('utf8'),
      )
    ) {
      throw new BackupError(
        'BACKUP_MYSQL_INCOMPLETE',
        'The MySQL dump is missing its completion marker.',
      );
    }
  } finally {
    await input.close();
  }
}

async function clearSchema(
  client: Connection,
  database: string,
): Promise<string> {
  const [tables] = await client.query<
    (RowDataPacket & { name: string; type: string })[]
  >(
    'SELECT TABLE_NAME AS name, TABLE_TYPE AS type FROM information_schema.tables WHERE TABLE_SCHEMA = ?',
    [database],
  );
  const [routines] = await client.query<
    (RowDataPacket & { name: string; type: string })[]
  >(
    'SELECT ROUTINE_NAME AS name, ROUTINE_TYPE AS type FROM information_schema.routines WHERE ROUTINE_SCHEMA = ?',
    [database],
  );
  const [events] = await client.query<(RowDataPacket & { name: string })[]>(
    'SELECT EVENT_NAME AS name FROM information_schema.events WHERE EVENT_SCHEMA = ?',
    [database],
  );
  const drop = (type: string, name: string) =>
    `DROP ${type} IF EXISTS ${quote(database)}.${quote(name)};\n`;
  const prefix =
    'SET FOREIGN_KEY_CHECKS=0;\n' +
    events.map(({ name }) => drop('EVENT', name)).join('') +
    tables
      .filter(({ type }) => type === 'VIEW')
      .map(({ name }) => drop('VIEW', name))
      .join('') +
    tables
      .filter(({ type }) => type !== 'VIEW')
      .map(({ type, name }) =>
        drop(type === 'SEQUENCE' ? 'SEQUENCE' : 'TABLE', name),
      )
      .join('') +
    routines
      .map(({ type, name }) =>
        drop(type === 'FUNCTION' ? 'FUNCTION' : 'PROCEDURE', name),
      )
      .join('');
  return prefix + 'SET FOREIGN_KEY_CHECKS=1;\n';
}

export const mysqlEngine: DatabaseEngine<MysqlBackupConnection> = {
  async export(connection, file, context) {
    return withClient(connection, async (client) => {
      const server = await serverInfo(client);
      const nonTransactional = await nonTransactionalTables(
        client,
        connection.database,
      );
      if (context.online && nonTransactional.length) {
        throw new BackupError(
          'BACKUP_NON_TRANSACTIONAL_TABLES',
          'Stop the application before backing up non-InnoDB tables.',
          {
            connection: connection.name,
            tables: nonTransactional,
          },
        );
      }
      const mariadb = server.type === 'mariadb';
      const tool = mariadb
        ? (context.tools.mariadbDump ?? 'mariadb-dump')
        : (context.tools.mysqlDump ?? 'mysqldump');
      const defaults = await credentials(connection, server, context);
      const time = await serverTime(client);
      try {
        await runClient(
          tool,
          [
            defaults,
            nonTransactional.length ? '--lock-tables' : '--single-transaction',
            '--routines',
            '--triggers',
            '--events',
            '--hex-blob',
            '--no-tablespaces',
            '--complete-insert',
            ...(mariadb ? [] : ['--set-gtid-purged=OFF']),
            '--',
            connection.database,
          ],
          {
            output: file,
            signal: context.signal,
            exportPermission:
              /(?:command denied to user|access denied.*(?:privilege|to database)|you need \(at least one of\) the).*\((?:1044|1142|1227|1370)\)|insufficient privileges to SHOW CREATE/i,
          },
        );
      } catch (error) {
        if (
          !context.collect ||
          connection.hosting !== 'managed' ||
          !(error instanceof BackupError) ||
          error.code !== 'BACKUP_EXPORT_DENIED'
        )
          throw error;
        await rm(file, { force: true });
        await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await client.query(
          'START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY',
        );
        return {
          mode: 'recovery-point',
          server,
          snapshot: { time: await serverTime(client) },
          ...(await context.collect(mysqlReader(client, connection.database))),
        };
      }
      await verifyMysqlDump(file);
      return {
        mode: 'dump',
        server,
        snapshot: { time },
        ...(context.collect
          ? await context.collect(
              await mysqlDumpReader(file, connection.database),
            )
          : emptySnapshot),
      };
    });
  },
  async verify(file) {
    await verifyMysqlDump(file);
  },
  async probe(connection) {
    return withClient(connection, serverInfo);
  },
  async restore(connection, file, server, context) {
    const tool =
      server.type === 'mariadb'
        ? (context.tools.mariadb ?? 'mariadb')
        : (context.tools.mysql ?? 'mysql');
    const defaults = await credentials(connection, server, context);
    const script = join(context.directory, 'restore.sql');
    const prefix = await withClient(connection, (client) =>
      clearSchema(client, connection.database),
    );
    await pipeline(
      (async function* () {
        yield prefix;
        yield* createReadStream(file);
      })(),
      createWriteStream(script, { mode: 0o600 }),
      {
        signal: context.signal,
      },
    );
    await runClient(
      tool,
      [defaults, '--binary-mode', '--database=' + connection.database],
      { input: script, signal: context.signal },
    );
  },
  async read(connection, use) {
    return withClient(connection, (client) =>
      use(mysqlReader(client, connection.database)),
    );
  },
};

export async function hasOtherMysqlSessions(
  connection: MysqlBackupConnection,
): Promise<boolean> {
  return withClient(connection, async (client) => {
    const [rows] = await client.query<RowDataPacket[]>(
      "SELECT 1 FROM information_schema.PROCESSLIST WHERE DB = DATABASE() AND ID <> CONNECTION_ID() AND COMMAND NOT IN ('Daemon', 'Binlog Dump', 'Binlog Dump GTID') LIMIT 1",
    );
    return rows.length > 0;
  });
}
