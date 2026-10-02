import { createRequire } from 'node:module';
import type { Knex } from 'knex';
import { rollbackFailedCommits } from './transaction.js';

const require = createRequire(import.meta.url);

interface SqliteColumn {
  name: string;
  type: string | null;
}
interface SqliteStatement {
  reader: boolean;
  safeIntegers(enabled: boolean): SqliteStatement;
  columns(): SqliteColumn[];
  all(bindings: unknown[]): Record<string, unknown>[];
  run(bindings: unknown[]): {
    lastInsertRowid: number | bigint;
    changes: number | bigint;
  };
}
interface SqliteConnection {
  prepare(sql: string): SqliteStatement;
}
interface SqliteQuery {
  sql: string;
  bindings?: unknown[];
  response?: unknown;
  context?: { lastID: number | string; changes: number };
}

function sqliteInteger(value: unknown, declaredType?: string | null): unknown {
  if (typeof value !== 'bigint') return value;
  if (/^(bigint|int8)/i.test(declaredType ?? '')) return value.toString();
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : value.toString();
}

export function preciseIntegerClient(
  nativeDriver?: unknown,
): string | typeof Knex.Client {
  const Base =
    require('knex/lib/dialects/better-sqlite3/index.js') as typeof Knex.Client;
  class PreciseIntegerClient extends Base {}
  rollbackFailedCommits(PreciseIntegerClient);
  if (nativeDriver !== undefined) {
    (
      PreciseIntegerClient.prototype as Knex.Client & { _driver: () => unknown }
    )._driver = () => nativeDriver;
  }
  const prototype = PreciseIntegerClient.prototype as Knex.Client & {
    _query(
      connection: SqliteConnection,
      query: SqliteQuery,
    ): Promise<SqliteQuery>;
  };
  prototype._query = async (connection, query) => {
    if (!query.sql) throw new Error('The query is empty');
    const statement = connection.prepare(query.sql).safeIntegers(true);
    const bindings = (query.bindings ?? []).map((value) =>
      value instanceof Date
        ? value.valueOf()
        : typeof value === 'boolean'
          ? Number(value)
          : value,
    );
    if (statement.reader) {
      const columns = statement.columns();
      query.response = statement.all(bindings).map((row) => {
        for (const column of columns)
          row[column.name] = sqliteInteger(row[column.name], column.type);
        return row;
      });
    } else {
      const result = statement.run(bindings);
      const lastID = sqliteInteger(result.lastInsertRowid) as number | string;
      const changes = Number(result.changes);
      query.response = { lastInsertRowid: lastID, changes };
      query.context = { lastID, changes };
    }
    return query;
  };
  return PreciseIntegerClient;
}
