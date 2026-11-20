import type Sqlite from 'better-sqlite3';
import { BackupError, checkAbort } from './errors.js';
import { emptySnapshot, quoteIdentifier, serverMajor } from './engines.js';
import type { DatabaseEngine } from './engines.js';
import type {
  BackupReader,
  BackupTable,
  ServerInfo,
  SqliteBackupConnection,
} from './types.js';

async function withSqlite<T>(
  file: string,
  use: (db: Sqlite.Database) => T | Promise<T>,
): Promise<T> {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(file, { readonly: true, fileMustExist: true });
  try {
    return await use(db);
  } finally {
    db.close();
  }
}

function serverInfo(db: Sqlite.Database): ServerInfo {
  const { version } = db
    .prepare<[], { version: string }>('SELECT sqlite_version() AS version')
    .get()!;
  const charset = String(db.pragma('encoding', { simple: true }));
  return {
    type: 'sqlite',
    version,
    majorVersion: serverMajor(version),
    charset,
  };
}

function sqliteReader(db: Sqlite.Database): BackupReader {
  function name(table: BackupTable): string {
    if (table.schema && table.schema !== 'main') {
      throw new BackupError(
        'BACKUP_INVALID_TARGET',
        'A SQLite backup only contains the main database.',
      );
    }
    return quoteIdentifier(table.name, '"');
  }
  return {
    async hasTable(table) {
      name(table);
      return (
        db
          .prepare('SELECT 1 FROM sqlite_schema WHERE type = ? AND name = ?')
          .get('table', table.name) !== undefined
      );
    },
    async *readRows(table, columns) {
      if (!columns.length) return;
      const projection = columns
        .map((column) => quoteIdentifier(column, '"'))
        .join(', ');
      yield* db
        .prepare<[], Record<string, unknown>>(
          `SELECT ${projection} FROM main.${name(table)}`,
        )
        .iterate();
    },
  };
}

export const sqliteEngine: DatabaseEngine<SqliteBackupConnection> = {
  async export(connection, file, options) {
    return withSqlite(connection.filename, async (db) => {
      const time = new Date().toISOString();
      await db.backup(file, {
        progress: () => {
          checkAbort(options.signal);
          return 100;
        },
      });
      return withSqlite(file, async (snapshot) => ({
        mode: 'dump',
        server: serverInfo(snapshot),
        snapshot: { time },
        ...((await options.collect?.(sqliteReader(snapshot))) ?? emptySnapshot),
      }));
    });
  },
  async verify(file) {
    await withSqlite(file, (db) => {
      const rows = db.pragma('integrity_check') as {
        integrity_check: string;
      }[];
      if (rows.length !== 1 || rows[0]?.integrity_check !== 'ok') {
        throw new BackupError(
          'BACKUP_SQLITE_INTEGRITY',
          'SQLite integrity_check failed for the backup.',
        );
      }
    });
  },
  async probe(connection) {
    return withSqlite(connection.filename, serverInfo);
  },
  async restore(connection, file) {
    // The backup API updates the destination in a SQLite transaction, including WAL databases.
    await withSqlite(file, (db) => db.backup(connection.filename));
  },
  async read(connection, use) {
    return withSqlite(connection.filename, (db) => use(sqliteReader(db)));
  },
};
