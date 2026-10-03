import { createRequire } from 'node:module';
import { RepositoryError } from '@nocobase/db';
import type {
  DatabaseCapabilities,
  DatabaseDriverDefinition,
  DatabaseDriverRuntimeContext,
  JsonResultForm,
} from '@nocobase/db';
import { rawRows } from '@nocobase/db';
import { MysqlSchemaInspector } from './inspectors/mysql.js';
import { compileMysqlJsonCondition } from './json.js';

import type { MysqlConnectionConfig } from './config.js';
export type { MysqlConnectionConfig } from './config.js';

const require = createRequire(import.meta.url);
const Mysql2: unknown = require('mysql2') as unknown;
/** Preserve the mutually exclusive host and socket targets when omitting driver fields. */
type ConnectionOptions<T> = T extends unknown
  ? Omit<T, 'dialect' | 'driver' | 'databaseDriver'>
  : never;

export type MysqlOptions = ConnectionOptions<MysqlConnectionConfig>;
export const mysqlDriver: DatabaseDriverDefinition<
  'mysql',
  MysqlConnectionConfig
> = {
  dialect: 'mysql',
  packageName: '@nocobase/db-mysql',
  nativeDriver: 'mysql2',
  knexClient: 'mysql2',
  resolveKnexClient: () =>
    require('knex/lib/dialects/mysql2/index.js') as typeof import('knex').Knex.Client,
  capabilities: {
    comments: true,
    nativeTypes: true,
  } satisfies Partial<DatabaseCapabilities>,
  createRuntime: ({ dialect, capabilities, config }) => ({
    dialect,
    capabilities,
    numeric: {
      hasNativeResults: true,
      aggregateProjection: ({ expression }) => expression,
    },
    schema: {
      columnType: ({ column }) =>
        column.type === 'datetime' || column.type === 'datetimeTz'
          ? 'datetime(3)'
          : column.type === 'time'
            ? 'time(3)'
            : undefined,
    },
    repository: {
      jsonResults: resolveJsonResults(config),
      enumGroupKey: ({ client, field }) => client.raw('binary ??', [field]),
      compileFilterCondition: ({ query, node, field, name, boolean }) => {
        if (
          field?.type === 'enum' &&
          typeof node.value === 'string' &&
          (node.operator === '$eq' || node.operator === '$ne')
        ) {
          query[boolean === 'or' ? 'orWhereRaw' : 'whereRaw'](
            `binary ?? ${node.operator === '$eq' ? '=' : '<>'} binary ?`,
            [name, node.value],
          );
          return { handled: true };
        }
        return { handled: false };
      },
      compileJsonCondition: ({ client, column, node }) =>
        compileMysqlJsonCondition(client, column, node),
      encodeBoolean: (_field, value) => (value === null ? null : value ? 1 : 0),
      temporalBinding: ({ client, field, value }) => {
        const normalized = String(value);
        const instant = field.type === 'datetimeTz';
        const physical = normalized.replace('T', ' ').replace(/Z$/, '');
        if (
          instant &&
          /^timestamp(?:\(|$)/i.test(String(field.db?.nativeType))
        ) {
          if (
            normalized < '1970-01-01T00:00:01.000Z' ||
            normalized > '2038-01-19T03:14:07.000Z'
          )
            throw new RepositoryError(
              'INVALID_MUTATION',
              'Value exceeds the native MySQL TIMESTAMP range.',
            );
          return client.raw("convert_tz(?, '+00:00', @@session.time_zone)", [
            physical,
          ]);
        }
        return physical;
      },
      numericMutation: ({ client, field, name, operation, operand }) => {
        if (
          field?.type !== 'integer' &&
          field?.type !== 'bigInt' &&
          field?.type !== 'decimal'
        )
          return undefined;
        const text = String(operand);
        const operator = (
          {
            increment: '+',
            decrement: '-',
            multiply: '*',
            divide: '/',
          } as Record<string, string>
        )[operation];
        if (!operator) return undefined;
        if (field.type === 'bigInt' || field.type === 'integer')
          return client.raw(`?? ${operator} cast(? as signed)`, [name, text]);
        const precision = field.precision ?? 65;
        const scale = field.scale ?? 30;
        if (precision > 65 || scale > 30 || scale > precision)
          throw new RepositoryError(
            'INVALID_MUTATION',
            'Numeric operand exceeds the database decimal precision.',
          );
        return client.raw(
          `?? ${operator} cast(? as decimal(${precision}, ${scale}))`,
          [name, text],
        );
      },
      temporalProjection: ({ client, field, reference }) => {
        if (!field)
          return typeof reference === 'string'
            ? client.ref(reference)
            : reference;
        const instant = field.type === 'datetimeTz';
        const source =
          instant && /^timestamp(?:\(|$)/i.test(String(field.db?.nativeType))
            ? "convert_tz(??, @@session.time_zone, '+00:00')"
            : '??';
        const format =
          field.type === 'date'
            ? '%Y-%m-%d'
            : field.type === 'time'
              ? '%H:%i:%s.%f'
              : '%Y-%m-%dT%H:%i:%s.%f';
        const length =
          field.type === 'date' ? 10 : field.type === 'time' ? 12 : 23;
        const formatted = `left(date_format(${source}, ?), ${length})`;
        return client.raw(instant ? `concat(${formatted}, 'Z')` : formatted, [
          reference,
          format,
        ]);
      },
    },
  }),
  createKnexClient: (_config, baseClient) => {
    if (!baseClient) return 'mysql2';
    class MysqlClientWithDriver extends baseClient {
      _driver(): unknown {
        return Mysql2;
      }
    }
    return MysqlClientWithDriver;
  },
  resolveConnection: (config: MysqlConnectionConfig) => {
    assertSocketPathExclusive(config, ['host', 'port']);
    assertDriverOptions(config.driverOptions, [
      'host',
      'port',
      'database',
      'user',
      'username',
      'password',
      'charset',
      'timezone',
      'socketPath',
      'ssl',
      'pool',
      'url',
      'connectionString',
      'uri',
    ]);
    return {
      connection: compactObject({
        ...config.driverOptions,
        supportBigNumbers: true,
        bigNumberStrings: true,
        decimalNumbers: false,
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        charset: config.charset,
        timezone: config.timezone,
        socketPath: config.socketPath,
        ssl: normalizeMysqlSsl(config.ssl),
      }),
    };
  },
  createSchemaInspector: (context) =>
    new MysqlSchemaInspector({
      connectionName: context.connectionName,
      resolveClient: context.resolveClient,
    }),
  normalizeConnection: (config) => {
    // The connection target is a union — host and port, or socketPath — and filling in host defaults
    // produces an object TypeScript cannot attribute to one branch of it.
    return {
      ...(config.socketPath ? {} : { host: '127.0.0.1', port: 3306 }),
      database: 'app',
      username: 'root',
      password: '',
      charset: 'utf8mb4',
      ...config,
    } as MysqlConnectionConfig;
  },
  resolveOwnershipTarget: (config) => {
    return [
      'mysql',
      config.host,
      config.port,
      config.socketPath,
      config.database,
      undefined,
    ];
  },
  resetManagedSchema: async (context) => {
    const config = context.config;
    const client = await context.resolveClient();
    const database =
      config.database ??
      rawRows<{ database: string }>(
        await client.raw('select database() as database'),
      )[0]?.database;
    if (!database)
      throw new Error('MySQL connection has no selected database.');
    const rows = rawRows<{
      table_name?: string;
      table_type?: string;
      TABLE_NAME?: string;
      TABLE_TYPE?: string;
    }>(
      await client.raw(
        `select table_name, table_type
         from information_schema.tables
         where table_schema = ?
         order by case table_type when 'VIEW' then 0 else 1 end, table_name`,
        [database],
      ),
    );
    const foreignKeyChecks = rawRows<{ value: number | string }>(
      await client.raw('select @@session.foreign_key_checks as value'),
    )[0]?.value;
    if (foreignKeyChecks === undefined) {
      throw new Error('MySQL connection did not return foreign_key_checks.');
    }
    await client.raw('set foreign_key_checks = 0');
    try {
      for (const row of rows) {
        const tableName = row.table_name ?? row.TABLE_NAME;
        const tableType = row.table_type ?? row.TABLE_TYPE;
        if (!tableName) continue;
        const kind = tableType === 'VIEW' ? 'view' : 'table';
        await client.raw(`drop ${kind} if exists ${quoteMysql(tableName)}`);
      }
    } finally {
      await client.raw(
        `set foreign_key_checks = ${Number(foreignKeyChecks) === 0 ? 0 : 1}`,
      );
    }
  },
  // Every connection runs its transactions at READ COMMITTED, the level PostgreSQL, SQL Server, Oracle and
  // OceanBase default to and the one NocoBase's code is written against. Under MySQL's REPEATABLE READ default a
  // transaction's snapshot is taken at its first read — the Collection metadata lookup every transaction starts
  // with — so a check made after taking a lock still counted rows a concurrent transaction had already removed,
  // and two administrators could delete each other.
  configurePool: (_config, pool) => {
    const afterCreate = pool.afterCreate as
      ((connection: unknown, done: PoolDone) => void) | undefined;
    return {
      ...pool,
      afterCreate: (connection: MysqlPoolConnection, done: PoolDone) => {
        connection.query(
          'set session transaction isolation level read committed',
          (error) => {
            if (error) done(error, connection);
            else if (afterCreate) afterCreate(connection, done);
            else done(null, connection);
          },
        );
      },
    };
  },
};

type PoolDone = (error: unknown, connection?: unknown) => void;

interface MysqlPoolConnection {
  query(sql: string, callback: (error: unknown) => void): void;
}

export type MysqlConnection = MysqlOptions & {
  dialect: 'mysql';
  databaseDriver: typeof mysqlDriver;
};
export interface MysqlFactory {
  (options?: MysqlOptions): MysqlConnection;
  readonly dialect: 'mysql';
  readonly driver: typeof mysqlDriver;
}
export const mysql: MysqlFactory = Object.assign(
  (options: MysqlOptions = {}) => ({
    ...options,
    dialect: 'mysql' as const,
    driver: 'mysql2' as const,
    databaseDriver: mysqlDriver,
  }),
  { dialect: 'mysql' as const, driver: mysqlDriver },
);
export default mysql;

function quoteMysql(identifier: string): string {
  return `\`${identifier.replaceAll('`', '``')}\``;
}

function assertSocketPathExclusive(
  config: { socketPath?: string },
  fields: readonly string[],
): void {
  if (!config.socketPath) return;
  const conflicts = fields.filter(
    (field) => (config as Record<string, unknown>)[field] !== undefined,
  );
  if (conflicts.length > 0) {
    throw new Error(
      `Database connection socketPath cannot be combined with ${conflicts.join(', ')}.`,
    );
  }
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

function normalizeMysqlSsl(
  ssl: MysqlConnectionConfig['ssl'],
): boolean | Record<string, unknown> | undefined {
  return ssl === true ? {} : ssl;
}

function compactObject(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export { mysqlTypes, mysqlNumeric } from './inspectors/mysql.js';

/**
 * mysql2 parses a json column before the row reaches us, so the decoder is
 * told the value is already decoded. That is only true while the driver is
 * left alone: `jsonStrings` makes it return the stored text instead, and it
 * reaches the driver through `driverOptions`. Reading the resolved connection
 * keeps the declaration true for the connection it describes rather than for
 * the default one.
 */
function resolveJsonResults(
  config: DatabaseDriverRuntimeContext['config'],
): JsonResultForm {
  const connection = config.connection as { jsonStrings?: unknown } | undefined;
  return connection?.jsonStrings === true ? 'text' : 'parsed';
}
