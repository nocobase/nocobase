import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type {
  DatabaseCapabilities,
  DatabaseDriverDefinition,
} from '@nocobase/db';
import { rawRows } from '@nocobase/db';
import { installDecimalAggregates } from './numeric.js';
import { preciseIntegerClient } from './precise-integers.js';
import { SqliteSchemaInspector } from './inspectors/sqlite.js';
import { compileSqliteJsonCondition } from './json.js';

import type { SqliteConnectionConfig } from './config.js';
export type { SqliteConnectionConfig } from './config.js';

const require = createRequire(import.meta.url);
const BetterSqlite3: unknown = require('better-sqlite3') as unknown;
export type SqliteOptions = Omit<
  SqliteConnectionConfig,
  'dialect' | 'driver' | 'databaseDriver'
>;
export const sqliteDriver: DatabaseDriverDefinition<
  'sqlite',
  SqliteConnectionConfig
> = {
  dialect: 'sqlite',
  packageName: '@nocobase/db-sqlite',
  nativeDriver: 'better-sqlite3',
  knexClient: 'better-sqlite3',
  resolveKnexClient: () =>
    require('knex/lib/dialects/better-sqlite3/index.js') as typeof import('knex').Knex.Client,
  capabilities: {
    partialIndexes: true,
  } satisfies Partial<DatabaseCapabilities>,
  createRuntime: ({ dialect, capabilities }) => ({
    dialect,
    capabilities,
    numeric: {
      aggregateSql: ({ client, kind, field, distinct, source }) => {
        const operand = field === '*' ? client.raw('*') : client.ref(field);
        const prefix = distinct ? 'distinct ' : '';
        const floating = source && ['float', 'double'].includes(source.type);
        if (!floating && (kind === 'avg' || kind === 'sum')) {
          return client.raw(`nb_decimal_${kind}(${prefix}?)`, [operand]);
        }
        return client.raw(`${kind}(${prefix}?)`, [operand]);
      },
      aggregateProjection: ({ client, expression }) =>
        client.raw('nb_decimal_text(?)', [expression]),
    },
    query: {
      wrapAggregateOrdering: ({ client, ordering, functionName }) =>
        ['sum', 'avg'].includes(functionName)
          ? client.raw('nb_decimal_key(?)', [ordering])
          : ordering,
      decimalAggregateKey: ({ client, value }) =>
        client.raw('nb_decimal_key(?)', [value]),
    },
    schema: {
      columnType: ({ column }) =>
        ['date', 'time', 'datetime', 'datetimeTz'].includes(column.type)
          ? 'text'
          : undefined,
    },
    repository: {
      // The column is text; the stored JSON arrives unparsed.
      jsonResults: 'text',
      // RETURNING (SQLite 3.35+) reports every row of a multi-row INSERT.
      insertManyReturning: true,
      compileJsonCondition: ({ client, column, node }) =>
        compileSqliteJsonCondition(client, column, node),
      encodeBoolean: (_field, value) => (value === null ? null : value ? 1 : 0),
      numericMutation: ({ client, field, name, operation, operand }) => {
        if (field?.type !== 'integer' && field?.type !== 'bigInt')
          return undefined;
        return client.raw(`nb_integer_${operation}(??, ?)`, [
          name,
          String(operand),
        ]);
      },
      groupAggregateOrder: ({ client, value, aggregate }) =>
        aggregate && ['sum', 'avg'].includes(aggregate)
          ? client.raw('nb_decimal_key(??)', [value])
          : value,
      relationAggregateProjection: ({ client, value, aggregate }) =>
        ['sum', 'avg'].includes(aggregate)
          ? client.raw('nb_decimal_key(?)', [value])
          : value,
      enumGroupKey: ({ client, field }) =>
        client.raw('?? collate binary', [field]),
      compileFilterCondition: ({ query, node, field, name, boolean }) => {
        if (
          field?.db?.preciseAggregate &&
          node.value != null &&
          ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte'].includes(node.operator)
        ) {
          const operators: Record<string, string> = {
            $eq: '=',
            $ne: '<>',
            $gt: '>',
            $gte: '>=',
            $lt: '<',
            $lte: '<=',
          };
          const method = boolean === 'or' ? 'orWhereRaw' : 'whereRaw';
          query[method](
            `nb_decimal_key(??) ${operators[node.operator]} nb_decimal_key(?)`,
            [name, node.value as unknown as string],
          );
          return { handled: true };
        }
        if (
          field?.type === 'enum' &&
          typeof node.value === 'string' &&
          (node.operator === '$eq' || node.operator === '$ne')
        ) {
          const operator = node.operator === '$eq' ? '=' : '<>';
          query[boolean === 'or' ? 'orWhereRaw' : 'whereRaw'](
            `(?? collate binary) ${operator} ?`,
            [name, node.value],
          );
          return { handled: true };
        }
        return { handled: false };
      },
    },
  }),
  createKnexClient: () => preciseIntegerClient(BetterSqlite3),
  resolveConnection: (config) => {
    assertDriverOptions(config.driverOptions, [
      'filename',
      'pool',
      'url',
      'connectionString',
      'uri',
    ]);
    return {
      connection: compactObject({
        ...config.driverOptions,
        filename: config.filename,
      }),
      useNullAsDefault: true,
    };
  },
  createSchemaInspector: (context) =>
    new SqliteSchemaInspector({
      connectionName: context.connectionName,
      resolveClient: context.resolveClient,
    }),
  normalizeConnection: (source, context) => {
    // `database` is the spelling config.yml uses for the file, which the declarative type does not carry.
    const config = source as SqliteConnectionConfig & { database?: string };
    const filename = config.database ?? config.filename;
    return {
      ...config,
      filename:
        filename && filename !== ':memory:' && context.resolveStoragePath
          ? context.resolveStoragePath(filename)
          : filename,
    };
  },
  resolveOwnershipTarget: (config) => {
    if (!config.filename || config.filename === ':memory:') return undefined;
    return ['sqlite', path.resolve(config.filename)];
  },
  prepareStorage: async (config, context) => {
    if (!config.filename || config.filename === ':memory:') return;
    await context.ensureDirectory(path.dirname(config.filename));
  },
  // SQLite creates the file on first open; an in-memory database never touches disk.
  hasStorage: (config) =>
    !config.filename ||
    config.filename === ':memory:' ||
    existsSync(config.filename),
  resetManagedSchema: async (context) => {
    const client = await context.resolveClient();
    const rows = rawRows<{ name: string; type: 'table' | 'view' }>(
      await client.raw(
        "select name, type from sqlite_schema where type in ('view', 'table') and name not like 'sqlite_%' order by case type when 'view' then 0 else 1 end, name",
      ),
    );
    await client.raw('pragma foreign_keys = off');
    try {
      for (const row of rows) {
        await client.raw(`drop ${row.type} if exists ${quoteSqlite(row.name)}`);
      }
    } finally {
      await client.raw('pragma foreign_keys = on');
    }
  },
  configurePool: (_config, pool) => {
    const afterCreate = pool.afterCreate;
    return {
      ...pool,
      afterCreate: (
        connection: Parameters<typeof installDecimalAggregates>[0],
        done: (error: unknown, connection?: unknown) => void,
      ) => {
        try {
          installDecimalAggregates(connection);
          if (afterCreate) {
            (
              afterCreate as unknown as (
                connection: unknown,
                done: (error: unknown, connection?: unknown) => void,
              ) => void
            )(connection, done);
          } else done(null, connection);
        } catch (error) {
          done(error);
        }
      },
    };
  },
};
export type SqliteConnection = SqliteOptions & {
  dialect: 'sqlite';
  databaseDriver: typeof sqliteDriver;
};
export interface SqliteFactory {
  (options?: SqliteOptions): SqliteConnection;
  readonly dialect: 'sqlite';
  readonly driver: typeof sqliteDriver;
}
export const sqlite: SqliteFactory = Object.assign(
  (options: SqliteOptions = { filename: ':memory:' }) => ({
    ...options,
    dialect: 'sqlite' as const,
    driver: 'better-sqlite3' as const,
    databaseDriver: sqliteDriver,
  }),
  { dialect: 'sqlite' as const, driver: sqliteDriver },
);
export default sqlite;

function quoteSqlite(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function assertDriverOptions(
  driverOptions: Record<string, unknown> | undefined,
  reservedKeys: readonly string[],
): void {
  if (!driverOptions) return;
  const reserved = reservedKeys.filter(
    (key) => driverOptions[key] !== undefined,
  );
  if (reserved.length > 0) {
    throw new Error(
      `Database driverOptions cannot include ${reserved.join(', ')}. Use flattened connection parameters.`,
    );
  }
}

function compactObject(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export { sqliteTypes } from './inspectors/sqlite.js';
