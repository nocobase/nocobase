import type { Knex } from 'knex';
import {
  BaseSchemaInspector,
  rawRows,
  sqliteAffinity,
  normalizePhysicalDataType,
  normalizeReferentialAction,
  parseColumnDefault,
  temporalFractionalSecondsPrecision,
} from '@nocobase/db';
import type {
  DecodedPhysicalCollectionCursor,
  NormalizedPhysicalCollectionListOptions,
  PhysicalCheckConstraintSchema,
  PhysicalCollectionIdentifier,
  PhysicalCollectionSchema,
  PhysicalCollectionSummary,
  PhysicalForeignKeySchema,
  PhysicalIndexKey,
  PhysicalIndexSchema,
  PhysicalSchemaInfo,
  PhysicalUniqueConstraintSchema,
  SchemaInspectionWarning,
  PhysicalTypeNormalizationStrategy,
  PhysicalDataType,
} from '@nocobase/db';

export const sqliteTypes: PhysicalTypeNormalizationStrategy = {
  special: (_type: string, base: string): PhysicalDataType | undefined =>
    base === 'float' ? 'float' : undefined,
  temporal: (type: string): PhysicalDataType | undefined =>
    type === 'date'
      ? 'date'
      : type === 'time'
        ? 'time'
        : type === 'datetime' || type === 'timestamp'
          ? 'datetime'
          : undefined,
  temporalPrecision: (
    type: string,
    temporal: string | undefined,
  ): number | undefined =>
    temporal
      ? type.match(/\((\d+)\)/)?.[1]
        ? Number(type.match(/\((\d+)\)/)![1])
        : undefined
      : undefined,
};

interface SqliteSchemaRow {
  readonly name: string;
  readonly type: 'table' | 'view' | 'index';
  readonly sql: string | null;
}

interface SqliteColumnRow {
  readonly cid: number;
  readonly name: string;
  readonly type: string;
  readonly notnull: 0 | 1;
  readonly dflt_value: unknown;
  readonly pk: number;
  readonly hidden: number;
}

interface SqliteIndexListRow {
  readonly seq: number;
  readonly name: string;
  readonly unique: 0 | 1;
  readonly origin: 'c' | 'u' | 'pk';
  readonly partial: 0 | 1;
}

interface SqliteIndexRow extends SqliteIndexListRow {
  readonly sql: string | null;
  readonly key_seqno: number | null;
  readonly key_name: string | null;
  readonly key_desc: 0 | 1 | null;
}

interface SqliteForeignKeyRow {
  readonly id: number;
  readonly seq: number;
  readonly table: string;
  readonly from: string;
  readonly to: string;
  readonly on_update: string;
  readonly on_delete: string;
}

export interface SqliteSchemaInspectorOptions {
  readonly connectionName: string;
  resolveClient(): Promise<Knex>;
}

export class SqliteSchemaInspector extends BaseSchemaInspector {
  constructor(private readonly options: SqliteSchemaInspectorOptions) {
    super(options.connectionName, 'sqlite');
  }

  protected async inspectSchemas(): Promise<PhysicalSchemaInfo[]> {
    return [{ name: 'main', default: true }];
  }

  protected async inspectCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined> {
    this.assertMainSchema(identifier.schema);
    const knex = await this.options.resolveClient();
    const row = await knex<SqliteSchemaRow>('sqlite_schema')
      .select('name', 'type', 'sql')
      .whereIn('type', ['table', 'view'])
      .where({ name: identifier.tableName })
      .whereNot('name', 'like', 'sqlite_%')
      .first();
    if (!row) {
      return undefined;
    }

    const columns = rawRows<SqliteColumnRow>(
      await knex.raw('select * from pragma_table_xinfo(?)', [row.name]),
    );
    const tableInfo =
      row.type === 'table'
        ? rawRows<{ strict: number }>(
            await knex.raw(
              'select strict from pragma_table_list(?) where schema = ?',
              [row.name, 'main'],
            ),
          )[0]
        : undefined;
    const primaryColumns = columns
      .filter((column) => column.pk > 0)
      .sort((left, right) => left.pk - right.pk);
    const autoIncrementColumn =
      primaryColumns.length === 1 &&
      /^integer$/i.test(primaryColumns[0].type.trim())
        ? primaryColumns[0].name
        : undefined;
    const warnings: SchemaInspectionWarning[] = [];
    if (columns.some((column) => column.hidden === 2 || column.hidden === 3)) {
      warnings.push({
        code: 'SQLITE_GENERATED_EXPRESSION_PARTIAL',
        message:
          'SQLite reports generated columns but does not expose every generated expression through PRAGMA table_xinfo.',
        aspect: 'columns',
      });
    }

    const indexResult = await this.readIndexes(knex, row.name);
    warnings.push(...indexResult.warnings);
    const foreignKeys = await this.readForeignKeys(knex, row.name);
    const checkConstraints =
      row.type === 'table' ? extractCheckConstraints(row.sql ?? '') : [];
    if (row.type === 'table') {
      warnings.push({
        code: 'SQLITE_CHECK_CONSTRAINT_PARTIAL',
        message:
          'SQLite check constraints are parsed from the schema SQL and may be incomplete.',
        aspect: 'checkConstraints',
      });
    }

    return {
      schema: 'main',
      tableName: row.name,
      kind: row.type as 'table' | 'view',
      strict:
        tableInfo === undefined ? undefined : Number(tableInfo.strict) === 1,
      viewDefinition:
        row.type === 'view' ? extractSqliteViewDefinition(row.sql) : undefined,
      columns: columns
        .filter((column) => column.hidden !== 1)
        .sort((left, right) => left.cid - right.cid)
        .map((column) => {
          const modifiers = parseSqliteTypeModifiers(column.type);
          return {
            columnName: column.name,
            ordinalPosition: column.cid + 1,
            dataType: normalizePhysicalDataType(sqliteTypes, column.type),
            nativeType: column.type,
            affinity: sqliteAffinity(column.type),
            nullable: column.notnull === 0 && column.pk === 0,
            default: parseColumnDefault(column.dflt_value),
            autoIncrement: column.name === autoIncrementColumn,
            length:
              temporalFractionalSecondsPrecision(sqliteTypes, column.type) ===
              undefined
                ? modifiers.length
                : undefined,
            precision: modifiers.precision,
            scale: modifiers.scale,
            fractionalSecondsPrecision: temporalFractionalSecondsPrecision(
              sqliteTypes,
              column.type,
            ),
            generated:
              column.hidden === 2 || column.hidden === 3
                ? { stored: column.hidden === 3 }
                : undefined,
          };
        }),
      primaryKey:
        primaryColumns.length > 0
          ? { columns: primaryColumns.map((column) => column.name) }
          : undefined,
      uniqueConstraints: indexResult.uniqueConstraints,
      indexes: indexResult.indexes,
      foreignKeys,
      checkConstraints,
      inspection: {
        aspects: {
          columns: columns.some(
            (column) => column.hidden === 2 || column.hidden === 3,
          )
            ? 'partial'
            : 'complete',
          primaryKey: 'complete',
          uniqueConstraints: indexResult.status,
          indexes: indexResult.status,
          foreignKeys: 'complete',
          checkConstraints: row.type === 'table' ? 'partial' : 'complete',
          comments: 'unsupported',
          viewDefinition: 'complete',
        },
        warnings,
      },
    };
  }

  protected async inspectCollectionSummaries(
    options: NormalizedPhysicalCollectionListOptions,
    after: DecodedPhysicalCollectionCursor['after'] | undefined,
    fetchLimit: number,
  ): Promise<PhysicalCollectionSummary[]> {
    if (options.schemas && !options.schemas.includes('main')) {
      return [];
    }
    const supportedTypes: Array<'table' | 'view'> = options.kinds
      ? options.kinds
          .filter((kind) => kind === 'table' || kind === 'view')
          .map((kind) => kind)
      : ['table', 'view'];
    if (supportedTypes.length === 0) {
      return [];
    }
    const knex = await this.options.resolveClient();
    const query = knex<SqliteSchemaRow>('sqlite_schema')
      .select('name', 'type')
      .whereIn('type', supportedTypes)
      .whereNot('name', 'like', 'sqlite_%')
      .orderBy('name')
      .limit(fetchLimit);
    if (after) {
      if (after.schema !== 'main') {
        return [];
      }
      query.andWhere('name', '>', after.tableName);
    }
    applySqlitePrefixes(query, options.tableNamePrefixes);
    const rows = await query;
    return rows.map((row): PhysicalCollectionSummary => ({
      schema: 'main',
      tableName: row.name,
      kind: row.type as 'table' | 'view',
    }));
  }

  private assertMainSchema(schema: string | undefined): void {
    if (schema !== undefined && schema !== 'main') {
      throw this.invalidOptions(
        `SQLite SchemaInspector only supports schema "main", received "${schema}".`,
        { schema },
      );
    }
  }

  private async readIndexes(
    knex: Knex,
    tableName: string,
  ): Promise<{
    indexes: PhysicalIndexSchema[];
    uniqueConstraints: PhysicalUniqueConstraintSchema[];
    status: 'complete' | 'partial';
    warnings: SchemaInspectionWarning[];
  }> {
    // PRAGMA table-valued functions can be joined: inspect every index and
    // its SQL together instead of issuing two extra queries per index.
    const rows = rawRows<SqliteIndexRow>(
      await knex.raw(
        `
        select il.*, s.sql, xi.seqno as key_seqno,
          xi.name as key_name, xi.desc as key_desc
        from pragma_index_list(?) as il
        left join sqlite_schema as s on s.type = 'index' and s.name = il.name
        left join pragma_index_xinfo(il.name) as xi on xi.key = 1
        order by il.seq, xi.seqno
      `,
        [tableName],
      ),
    );
    const groups = new Map<
      string,
      { index: SqliteIndexRow; keys: SqliteIndexRow[] }
    >();
    for (const row of rows) {
      let group = groups.get(row.name);
      if (!group) {
        group = { index: row, keys: [] };
        groups.set(row.name, group);
      }
      if (row.key_seqno !== null) group.keys.push(row);
    }
    const indexes: PhysicalIndexSchema[] = [];
    const uniqueConstraints: PhysicalUniqueConstraintSchema[] = [];
    const warnings: SchemaInspectionWarning[] = [];
    let status: 'complete' | 'partial' = 'complete';

    for (const { index, keys: info } of groups.values()) {
      const parsed = parseSqliteIndexSql(index.sql);
      const keys: PhysicalIndexKey[] = info.map((key) => {
        if (key.key_name) {
          return {
            columnName: key.key_name,
            order: key.key_desc === 1 ? 'desc' : 'asc',
          };
        }
        const expression = parsed.keys[key.key_seqno!];
        if (!expression) {
          status = 'partial';
          warnings.push({
            code: 'SQLITE_INDEX_EXPRESSION_PARTIAL',
            message: `SQLite index "${index.name}" contains an expression that could not be parsed.`,
            aspect: 'indexes',
          });
          return { expression: '<unavailable>' };
        }
        return {
          expression,
          order: key.key_desc === 1 ? 'desc' : 'asc',
        };
      });
      const constraintKind =
        index.origin === 'pk'
          ? 'primaryKey'
          : index.origin === 'u'
            ? 'unique'
            : undefined;
      indexes.push({
        name: index.name,
        keys,
        unique: index.unique === 1,
        backsConstraint: constraintKind ? { kind: constraintKind } : undefined,
        predicate: index.partial === 1 ? parsed.predicate : undefined,
      });
      if (index.partial === 1 && !parsed.predicate) {
        status = 'partial';
        warnings.push({
          code: 'SQLITE_INDEX_PREDICATE_PARTIAL',
          message: `SQLite partial index "${index.name}" predicate could not be parsed.`,
          aspect: 'indexes',
        });
      }
      if (index.origin === 'u' && info.every((key) => key.key_name !== null)) {
        uniqueConstraints.push({
          columns: info.map((key) => key.key_name as string),
        });
      }
    }
    return { indexes, uniqueConstraints, status, warnings };
  }

  private async readForeignKeys(
    knex: Knex,
    tableName: string,
  ): Promise<PhysicalForeignKeySchema[]> {
    const rows = rawRows<SqliteForeignKeyRow>(
      await knex.raw('select * from pragma_foreign_key_list(?)', [tableName]),
    ).sort((left, right) => left.id - right.id || left.seq - right.seq);
    const groups = new Map<number, SqliteForeignKeyRow[]>();
    for (const row of rows) {
      const group = groups.get(row.id) ?? [];
      group.push(row);
      groups.set(row.id, group);
    }
    return [...groups.values()].map((group) => ({
      columns: group.map((row) => row.from),
      referencedCollection: {
        schema: 'main',
        tableName: group[0].table,
      },
      referencedColumns: group.map((row) => row.to),
      onDelete: normalizeReferentialAction(group[0].on_delete),
      onUpdate: normalizeReferentialAction(group[0].on_update),
    }));
  }
}

function applySqlitePrefixes(
  query: Knex.QueryBuilder,
  prefixes: readonly string[] | undefined,
): void {
  if (!prefixes || prefixes.includes('')) {
    return;
  }
  query.andWhere((builder) => {
    for (const prefix of prefixes) {
      builder.orWhereRaw('substr(name, 1, ?) = ?', [prefix.length, prefix]);
    }
  });
}

function parseSqliteIndexSql(sql: string | null): {
  keys: string[];
  predicate?: string;
} {
  if (!sql) {
    return { keys: [] };
  }
  const open = sql.indexOf('(');
  if (open === -1) {
    return { keys: [] };
  }
  const close = findMatchingParenthesis(sql, open);
  if (close === -1) {
    return { keys: [] };
  }
  const keys = splitSqlList(sql.slice(open + 1, close)).map((key) =>
    key.replace(/\s+(ASC|DESC)\s*$/i, '').trim(),
  );
  const after = sql.slice(close + 1);
  const where = after.match(/\bWHERE\s+([\s\S]+)$/i)?.[1]?.trim();
  return { keys, predicate: where };
}

function extractCheckConstraints(sql: string): PhysicalCheckConstraintSchema[] {
  const checks: PhysicalCheckConstraintSchema[] = [];
  const pattern = /\bCHECK\s*\(/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sql))) {
    const open = sql.indexOf('(', match.index);
    const close = findMatchingParenthesis(sql, open);
    if (close === -1) {
      break;
    }
    checks.push({ expression: sql.slice(open + 1, close).trim() });
    pattern.lastIndex = close + 1;
  }
  return checks;
}

function extractSqliteViewDefinition(sql: string | null): string | undefined {
  if (!sql) {
    return undefined;
  }
  return sql.match(/\bAS\s+([\s\S]+)$/i)?.[1]?.trim();
}

function findMatchingParenthesis(sql: string, open: number): number {
  let depth = 0;
  let quote: string | undefined;
  for (let index = open; index < sql.length; index += 1) {
    const character = sql[index];
    if (quote) {
      if (character === quote && sql[index + 1] === quote) {
        index += 1;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
    } else if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function splitSqlList(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: string | undefined;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === quote && value[index + 1] === quote) {
        index += 1;
      } else if (character === quote) {
        quote = undefined;
      }
    } else if (character === "'" || character === '"' || character === '`') {
      quote = character;
    } else if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function parseSqliteTypeModifiers(nativeType: string): {
  length?: number;
  precision?: number;
  scale?: number;
} {
  const match = nativeType.match(/\((\d+)(?:\s*,\s*(\d+))?\)/);
  if (!match) {
    return {};
  }
  const first = Number(match[1]);
  const second = match[2] === undefined ? undefined : Number(match[2]);
  if (/^(decimal|numeric)/i.test(nativeType)) {
    return { precision: first, scale: second };
  }
  return { length: first };
}
