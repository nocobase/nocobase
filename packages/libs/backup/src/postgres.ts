import { createReadStream, createWriteStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import pg from 'pg';
import { emptySnapshot, quoteIdentifier, serverMajor } from './engines.js';
import type { DatabaseEngine, EngineContext } from './engines.js';
import { BackupError } from './errors.js';
import { connectionEnvironment, runClient } from './process.js';
import type {
  BackupReader,
  BackupTable,
  PostgresBackupConnection,
  ServerInfo,
} from './types.js';

const quote = (name: string) => quoteIdentifier(name, '"');

async function withClient<T>(
  connection: PostgresBackupConnection,
  use: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const { database, username, password, host, port, tls } = connection;
  const ssl = tls && {
    rejectUnauthorized: tls.mode === 'verify-full',
    ca: tls.caFile && (await readFile(tls.caFile, 'utf8')),
  };
  const client = new pg.Client({
    database,
    user: username,
    password: password ?? '',
    host: host ?? 'localhost',
    port: port ?? 5432,
    ssl: ssl ?? false,
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    return await use(client);
  } finally {
    await client.end();
  }
}

async function credentials(
  connection: PostgresBackupConnection,
  context: EngineContext,
): Promise<NodeJS.ProcessEnv> {
  const {
    database,
    username,
    password,
    host = 'localhost',
    port = 5432,
    tls,
  } = connection;
  const escape = (field: string) => {
    if (/[\r\n\0]/.test(field))
      throw new BackupError(
        'BACKUP_INVALID_TARGET',
        'A PostgreSQL connection value contains a line break or NUL.',
      );
    return field.replaceAll('\\', '\\\\').replaceAll(':', '\\:');
  };
  const file = join(context.directory, 'pgpass');
  await writeFile(
    file,
    ['*', '*', '*', '*', escape(password ?? '')].join(':') + '\n',
    { mode: 0o600 },
  );
  return {
    ...connectionEnvironment(),
    PGHOST: host,
    PGPORT: String(port),
    PGDATABASE: database,
    PGUSER: username,
    PGPASSFILE: file,
    PGSSLMODE: tls?.mode ?? 'disable',
    PGSSLROOTCERT: tls?.caFile,
  };
}

async function serverInfo(client: pg.Client): Promise<ServerInfo> {
  const result = await client.query<{ version: string; charset: string }>(
    "SELECT current_setting('server_version') AS version, current_setting('server_encoding') AS charset",
  );
  const { version, charset } = result.rows[0];
  return {
    type: 'postgres',
    version,
    charset,
    majorVersion: serverMajor(version),
  };
}

function postgresReader(client: pg.Client): BackupReader {
  const schema = (table: BackupTable) => table.schema ?? 'public';
  return {
    async findTables(columns) {
      if (!columns.length) return [];
      const { rows } = await client.query<BackupTable>(
        `SELECT c.table_schema AS schema, c.table_name AS name
         FROM information_schema.columns c JOIN information_schema.tables t USING (table_schema, table_name)
         WHERE t.table_type = 'BASE TABLE' AND c.table_schema NOT LIKE 'pg\\_%'
           AND c.table_schema <> 'information_schema' AND c.column_name = ANY($1::text[])
         GROUP BY c.table_schema, c.table_name HAVING COUNT(*) = $2`,
        [columns, new Set(columns).size],
      );
      return rows;
    },
    async hasTable(table) {
      const result = await client.query(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2',
        [schema(table), table.name],
      );
      return result.rows.length > 0;
    },
    async *readRows(table, columns) {
      if (!columns.length) return;
      const projection = columns.map(quote).join(', ');
      const result = await client.query<Record<string, unknown>>(
        `SELECT ${projection} FROM ${quote(schema(table))}.${quote(table.name)}`,
      );
      yield* result.rows;
    },
  };
}

async function walPosition(client: pg.Client): Promise<string | undefined> {
  await client.query('SAVEPOINT backup_wal');
  try {
    const { rows } = await client.query<{ lsn: string | null }>(
      'SELECT CASE WHEN pg_is_in_recovery() THEN pg_last_wal_replay_lsn() ELSE pg_current_wal_lsn() END::text AS lsn',
    );
    return rows[0]?.lsn ?? undefined;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== '42501'
    )
      throw error;
    await client.query('ROLLBACK TO SAVEPOINT backup_wal');
  } finally {
    await client.query('RELEASE SAVEPOINT backup_wal');
  }
}

export const postgresEngine: DatabaseEngine<PostgresBackupConnection> = {
  async export(connection, file, context) {
    return withClient(connection, async (client) => {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const { rows } = await client.query<{ snapshot: string; time: Date }>(
        'SELECT pg_export_snapshot() AS snapshot, statement_timestamp() AS time',
      );
      const { snapshot, time } = rows[0];
      const lsn = await walPosition(client);
      const server = await serverInfo(client);
      let mode: 'dump' | 'recovery-point' = 'dump';
      try {
        await runClient(
          context.tools.pgDump ?? 'pg_dump',
          ['-Fc', '--no-password', '--snapshot=' + snapshot],
          {
            env: await credentials(connection, context),
            output: file,
            signal: context.signal,
            exportPermission:
              /pg_dump: error: (?:query failed: ERROR:\s+)?(?:permission denied for (?:table|schema|sequence)|must be (?:owner|superuser))/i,
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
        mode = 'recovery-point';
      }
      return {
        mode,
        server,
        snapshot: { time: time.toISOString(), lsn },
        ...((await context.collect?.(postgresReader(client))) ?? emptySnapshot),
      };
    });
  },
  async verify(file, _server, context) {
    await runClient(context.tools.pgRestore ?? 'pg_restore', ['--list', file], {
      signal: context.signal,
    });
  },
  async probe(connection) {
    return withClient(connection, serverInfo);
  },
  async restore(connection, file, server, context) {
    // pg_restore --clean only removes objects recorded in the archive. Clear the
    // dedicated application database's user schemas in the same psql transaction.
    const schemas = await withClient(connection, async (client) => {
      const { rows } = await client.query<{ name: string }>(
        "SELECT nspname AS name FROM pg_namespace WHERE nspname NOT LIKE 'pg\\_%' AND nspname <> 'information_schema'",
      );
      return rows.map(({ name }) => name);
    });
    const env = await credentials(connection, context);
    const sql = join(context.directory, 'restore.sql');
    const script = join(context.directory, 'transaction.sql');
    await runClient(
      context.tools.pgRestore ?? 'pg_restore',
      ['--clean', '--if-exists', '--file=-', file],
      {
        output: sql,
        signal: context.signal,
      },
    );
    const prefix =
      schemas
        .map((schema) => `DROP SCHEMA ${quote(schema)} CASCADE;\n`)
        .join('') +
      (server.majorVersion >= 15
        ? 'CREATE SCHEMA public AUTHORIZATION pg_database_owner;\nGRANT USAGE ON SCHEMA public TO PUBLIC;\n'
        : 'CREATE SCHEMA public;\nGRANT ALL ON SCHEMA public TO PUBLIC;\n');
    await pipeline(
      (async function* () {
        yield prefix;
        yield* createReadStream(sql);
      })(),
      createWriteStream(script, { mode: 0o600 }),
      {
        signal: context.signal,
      },
    );
    await runClient(
      context.tools.psql ?? 'psql',
      [
        '--no-psqlrc',
        '--no-password',
        '--set=ON_ERROR_STOP=1',
        '--single-transaction',
        '--file',
        script,
      ],
      {
        env,
        signal: context.signal,
      },
    );
  },
  async read(connection, use) {
    return withClient(connection, (client) => use(postgresReader(client)));
  },
};

export async function hasOtherPostgresSessions(
  connection: PostgresBackupConnection,
): Promise<boolean> {
  return withClient(connection, async (client) => {
    const result = await client.query(
      "SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND backend_type = 'client backend' LIMIT 1",
    );
    return result.rows.length > 0;
  });
}
