import { createRequire } from 'node:module';
import { RepositoryError } from '@nocobase/db';
import type {
  DatabaseCapabilities,
  DatabaseDriverDefinition,
} from '@nocobase/db';
import { rawRows } from '@nocobase/db';
import { MssqlSchemaInspector } from './inspectors/mssql.js';
import {
  enqueueRequest,
  chompRequests,
  type RequestConnection,
  type SqlRequest,
} from './request-queue.js';

import type { MssqlConnectionConfig } from './config.js';
export type { MssqlConnectionConfig } from './config.js';

const require = createRequire(import.meta.url);
const Tedious: unknown = require('tedious') as unknown;
export type MssqlOptions = Omit<
  MssqlConnectionConfig,
  'dialect' | 'driver' | 'databaseDriver'
>;
export const mssqlDriver: DatabaseDriverDefinition<
  'mssql',
  MssqlConnectionConfig
> = {
  dialect: 'mssql',
  packageName: '@nocobase/db-mssql',
  nativeDriver: 'tedious',
  knexClient: 'mssql',
  resolveKnexClient: () =>
    require('knex/lib/dialects/mssql/index.js') as typeof import('knex').Knex.Client,
  capabilities: {
    schemas: true,
    partialIndexes: true,
    nativeTypes: true,
    comments: true,
  } satisfies Partial<DatabaseCapabilities>,
  createRuntime: ({ dialect, capabilities }) => ({
    dialect,
    capabilities,
    numeric: {
      aggregateSql: ({ client, kind, field, distinct, source }) => {
        const operand = field === '*' ? client.raw('*') : client.ref(field);
        const prefix = distinct ? 'distinct ' : '';
        if (kind === 'count') {
          return client.raw(`count_big(${prefix}?)`, [operand]);
        }
        const floating = source && ['float', 'double'].includes(source.type);
        if (!floating && (kind === 'avg' || kind === 'sum')) {
          if (source?.type === 'decimal') {
            return client.raw(`${kind}(${prefix}?)`, [operand]);
          }
          return client.raw(`${kind}(${prefix}cast(? as decimal(38,0)))`, [
            operand,
          ]);
        }
        return client.raw(`${kind}(${prefix}?)`, [operand]);
      },
      aggregateProjection: ({ client, expression }) =>
        client.raw('cast(? as varchar(max))', [expression]),
    },
    schema: {
      columnType: ({ column }) => {
        if (column.type === 'enum') return `nvarchar(${column.length ?? 255})`;
        if (column.type === 'char') return `nchar(${column.length ?? 255})`;
        if (column.type === 'datetime') return 'datetime2(3)';
        if (column.type === 'datetimeTz') return 'datetimeoffset(3)';
        if (column.type === 'time') return 'time(3)';
        return undefined;
      },
      configureForeignKey: ({ foreign, constraint }) => {
        const builder = foreign as {
          onDelete(action: string): unknown;
          onUpdate(action: string): unknown;
        };
        if (constraint.onDelete)
          builder.onDelete(
            constraint.onDelete === 'restrict'
              ? 'NO ACTION'
              : constraint.onDelete.toUpperCase(),
          );
        if (constraint.onUpdate)
          builder.onUpdate(constraint.onUpdate.toUpperCase());
      },
      buildPredicate: ({ client, predicate }) => {
        const query = client.queryBuilder();
        for (const [field, expression] of Object.entries(predicate)) {
          const identifier = client.ref(field).toQuery();
          if (
            expression &&
            typeof expression === 'object' &&
            !Array.isArray(expression)
          ) {
            for (const [operator, value] of Object.entries(expression))
              query.whereRaw(mssqlPredicate(identifier, operator, value));
          } else query.whereRaw(mssqlPredicate(identifier, '$eq', expression));
        }
        return query;
      },
    },
    repository: {
      // The column is text; the stored JSON arrives unparsed.
      jsonResults: 'text',
      enumGroupKey: ({ client, field }) =>
        client.raw('cast(?? as varbinary(max))', [field]),
      compileFilterCondition: ({ query, node, field, name, boolean }) => {
        const method = boolean === 'or' ? 'orWhereRaw' : 'whereRaw';
        if (
          field?.type === 'enum' &&
          typeof node.value === 'string' &&
          (node.operator === '$eq' || node.operator === '$ne')
        ) {
          query[method](
            `cast(?? as varbinary(max)) ${node.operator === '$eq' ? '=' : '<>'} cast(? as varbinary(max))`,
            [name, node.value],
          );
          return { handled: true };
        }
        if (
          field &&
          ['integer', 'bigInt', 'decimal'].includes(field.type) &&
          node.value !== null &&
          node.value !== undefined &&
          (typeof node.value === 'string' ||
            typeof node.value === 'number' ||
            typeof node.value === 'bigint') &&
          ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte'].includes(node.operator)
        ) {
          const operator = (
            {
              $eq: '=',
              $ne: '<>',
              $gt: '>',
              $gte: '>=',
              $lt: '<',
              $lte: '<=',
            } as Record<string, string>
          )[node.operator];
          const type =
            field.type === 'bigInt'
              ? 'bigint'
              : field.type === 'integer'
                ? 'int'
                : `decimal(${field.precision ?? 38}, ${field.scale ?? 0})`;
          query[method](`?? ${operator} cast(? as ${type})`, [
            name,
            decimalLiteral(String(node.value)),
          ]);
          return { handled: true };
        }
        return { handled: false };
      },
      encodeBoolean: (_field, value) =>
        value === null ? null : Boolean(value),
      reloadReturnedDecimal: true,
      encodeBlobNull: (client) => client.raw('cast(null as varbinary(max))'),
      escapeLikePattern: (value) =>
        value.replace(/[\\%_[]/g, (char) => `\\${char}`),
      likeEscapeCharacter: '\\',
      numericMutation: ({ client, field, name, operation, operand }) => {
        const integral = field?.type === 'integer' || field?.type === 'bigInt';
        if (!integral && field?.type !== 'decimal') return undefined;
        const text = decimalLiteral(String(operand));
        const match = text.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
        if (!match || !(match[2] || match[3])) return undefined;
        const scale = Math.max(
          0,
          (match[3]?.length ?? 0) - Number(match[4] ?? 0),
        );
        const digits =
          (match[2] + (match[3] ?? '')).replace(/^0+(?=\d)/, '').length || 1;
        const precision = Math.max(digits, scale, 1);
        if (precision > 38 || scale > 38)
          throw new RepositoryError(
            'INVALID_MUTATION',
            'Numeric operand exceeds the database decimal precision.',
          );
        const operator = (
          {
            increment: '+',
            decrement: '-',
            multiply: '*',
            divide: '/',
          } as Record<string, string>
        )[operation];
        return client.raw(
          `?? ${operator} cast(? as decimal(${precision}, ${scale}))`,
          [name, text],
        );
      },
      temporalBinding: ({ client, field, value }) => {
        const normalized = String(value);
        const native = String(field.db?.nativeType).toLowerCase();
        if (
          native === 'smalldatetime' &&
          (normalized < '1900-01-01T00:00:00.000' ||
            normalized > '2079-06-06T23:59:00.000' ||
            !normalized.endsWith(':00.000'))
        )
          throw new RepositoryError(
            'INVALID_MUTATION',
            'SMALLDATETIME requires a value in its native range with minute precision.',
          );
        if (
          native === 'datetime' &&
          (normalized < '1753-01-01T00:00:00.000' ||
            normalized > '9999-12-31T23:59:59.997')
        )
          throw new RepositoryError(
            'INVALID_MUTATION',
            'Value exceeds the native SQL Server DATETIME range.',
          );
        if (native === 'datetime' && !/[037]$/.test(normalized))
          throw new RepositoryError(
            'INVALID_MUTATION',
            'SQL Server DATETIME requires milliseconds ending in 0, 3, or 7 to avoid rounding.',
          );
        const type = (
          {
            date: 'date',
            time: 'time(3)',
            datetime: 'datetime2(3)',
            datetimeTz: 'datetimeoffset(3)',
          } as Record<string, string>
        )[field.type];
        return client.raw(`cast(? as ${type})`, [normalized]);
      },
      temporalProjection: ({ client, field, reference }) => {
        if (!field)
          return typeof reference === 'string'
            ? client.ref(reference)
            : reference;
        if (field.type === 'date')
          return client.raw('convert(varchar(10), ??, 23)', [reference]);
        if (field.type === 'time')
          return client.raw('convert(varchar(12), cast(?? as time(3)), 114)', [
            reference,
          ]);
        const instant = field.type === 'datetimeTz';
        return client.raw(
          instant
            ? "replace(convert(varchar(23), cast(switchoffset(??, '+00:00') as datetime2(3)), 121), ' ', 'T') + 'Z'"
            : "replace(convert(varchar(23), cast(?? as datetime2(3)), 121), ' ', 'T')",
          [reference],
        );
      },
    },
  }),
  createKnexClient: (_config, baseClient) => {
    if (!baseClient) return 'mssql';
    class MssqlClientWithDriver extends baseClient {
      _enqueueRequest(
        request: SqlRequest,
        connection: RequestConnection,
      ): void {
        enqueueRequest(request, connection);
      }

      _chomp(connection: RequestConnection): void {
        chompRequests(connection);
      }

      _driver(): unknown {
        return Tedious;
      }
    }
    return MssqlClientWithDriver;
  },
  resolveConnection: (config: MssqlConnectionConfig) => {
    assertDriverOptions(config.driverOptions, [
      'host',
      'server',
      'port',
      'database',
      'user',
      'userName',
      'username',
      'password',
      'encrypt',
      'trustServerCertificate',
      'options',
      'pool',
      'url',
      'connectionString',
      'uri',
    ]);
    return {
      connection: compactObject({
        ...config.driverOptions,
        server: config.host ?? '127.0.0.1',
        port: config.port ?? 1433,
        database: config.database,
        user: config.username,
        password: config.password,
        encrypt: config.encrypt ?? false,
        options: {
          lowerCaseGuids: true,
          trustServerCertificate: config.trustServerCertificate ?? false,
        },
      }),
    };
  },
  createSchemaInspector: (context) =>
    new MssqlSchemaInspector({
      connectionName: context.connectionName,
      resolveClient: context.resolveClient,
    }),
  normalizeConnection: (source) => ({
    host: '127.0.0.1',
    port: 1433,
    database: 'app',
    username: 'sa',
    password: '',
    encrypt: false,
    trustServerCertificate: false,
    ...source,
  }),
  resolveOwnershipTarget: (source) => {
    const config = source;
    return [
      'mssql',
      config.host,
      config.port,
      undefined,
      config.database,
      'dbo',
    ];
  },
  resetManagedSchema: async (context) => {
    const client = await context.resolveClient();
    const schema = 'dbo';
    const constraints = rawRows<{
      schema_name: string;
      table_name: string;
      constraint_name: string;
    }>(
      await client.raw(
        `select s.name as schema_name, t.name as table_name, fk.name as constraint_name
         from sys.foreign_keys fk
         join sys.tables t on t.object_id = fk.parent_object_id
         join sys.schemas s on s.schema_id = t.schema_id
         where s.name = ?`,
        [schema],
      ),
    );
    for (const constraint of constraints) {
      await client.raw(
        `alter table ${quoteMssql(schema)}.${quoteMssql(constraint.table_name)}
         drop constraint ${quoteMssql(constraint.constraint_name)}`,
      );
    }
    const views = rawRows<{ name?: string; NAME?: string }>(
      await client.raw(
        `select v.name
         from sys.views v
         join sys.schemas s on s.schema_id = v.schema_id
         where s.name = ? and v.is_ms_shipped = 0
         order by v.name`,
        [schema],
      ),
    );
    const tables = rawRows<{ name?: string; NAME?: string }>(
      await client.raw(
        `select t.name
         from sys.tables t
         join sys.schemas s on s.schema_id = t.schema_id
         where s.name = ? and t.is_ms_shipped = 0
         order by t.name`,
        [schema],
      ),
    );
    const sequences = rawRows<{ name?: string; NAME?: string }>(
      await client.raw(
        `select seq.name
         from sys.sequences seq
         join sys.schemas s on s.schema_id = seq.schema_id
         where s.name = ?
         order by seq.name`,
        [schema],
      ),
    );
    for (const object of views) {
      const name = object.name ?? object.NAME;
      if (!name) continue;
      await client.raw(`drop view ${quoteMssql(schema)}.${quoteMssql(name)}`);
    }
    for (const object of tables) {
      const name = object.name ?? object.NAME;
      if (!name) continue;
      await client.raw(`drop table ${quoteMssql(schema)}.${quoteMssql(name)}`);
    }
    for (const object of sequences) {
      const name = object.name ?? object.NAME;
      if (!name) continue;
      await client.raw(
        `drop sequence ${quoteMssql(schema)}.${quoteMssql(name)}`,
      );
    }
  },
};
export type MssqlConnection = MssqlOptions & {
  dialect: 'mssql';
  databaseDriver: typeof mssqlDriver;
};
export interface MssqlFactory {
  (options?: MssqlOptions): MssqlConnection;
  readonly dialect: 'mssql';
  readonly driver: typeof mssqlDriver;
}
export const mssql: MssqlFactory = Object.assign(
  (options: MssqlOptions = {}) => ({
    ...options,
    dialect: 'mssql' as const,
    driver: 'tedious' as const,
    databaseDriver: mssqlDriver,
  }),
  { dialect: 'mssql' as const, driver: mssqlDriver },
);
export default mssql;

function quoteMssql(identifier: string): string {
  return `[${identifier.replaceAll(']', ']]')}]`;
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

function mssqlPredicate(
  identifier: string,
  operator: string,
  value: unknown,
): string {
  switch (operator) {
    case '$gt':
      return `${identifier} > ${mssqlLiteral(value)}`;
    case '$gte':
      return `${identifier} >= ${mssqlLiteral(value)}`;
    case '$lt':
      return `${identifier} < ${mssqlLiteral(value)}`;
    case '$lte':
      return `${identifier} <= ${mssqlLiteral(value)}`;
    case '$ne':
      return value === null
        ? `${identifier} is not null`
        : `${identifier} <> ${mssqlLiteral(value)}`;
    case '$notNull':
      return `${identifier} is not null`;
    default:
      return value === null
        ? `${identifier} is null`
        : `${identifier} = ${mssqlLiteral(value)}`;
  }
}
function mssqlLiteral(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return String(value);
  if (value instanceof Date)
    return `N'${value.toISOString().replaceAll("'", "''")}'`;
  if (typeof value === 'string') return `N'${value.replaceAll("'", "''")}'`;
  throw new Error(
    `MSSQL filtered index predicate value must be a scalar, received ${typeof value}.`,
  );
}

/** SQL Server's numeric casts do not accept scientific notation consistently. */
function decimalLiteral(value: string): string {
  const match = value.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
  if (!match || !(match[2] || match[3])) return value;
  const sign = match[1] === '-' ? '-' : '';
  const whole = match[2] ?? '';
  const fraction = match[3] ?? '';
  const exponent = Number(match[4] ?? 0);
  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '') || '0';
  const point = whole.length + exponent;
  if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length)
    return `${sign}${digits}${'0'.repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

export { mssqlTypes, mssqlNumeric } from './inspectors/mssql.js';
