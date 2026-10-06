import type { Knex } from 'knex';
import {
  BaseSchemaInspector,
  numberValue,
  optionalString,
  rawRows,
  normalizePhysicalDataType,
  normalizeReferentialAction,
  parseColumnDefault,
  temporalFractionalSecondsPrecision,
  numericCapabilities,
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
  NumericCapabilityStrategy,
} from '@nocobase/db';

export const mysqlTypes: PhysicalTypeNormalizationStrategy = {
  special: (_type: string, base: string): PhysicalDataType | undefined =>
    base === 'float' ? 'float' : undefined,
  temporal: (type: string): PhysicalDataType | undefined =>
    type === 'timestamp'
      ? 'datetimeTz'
      : type === 'datetime'
        ? 'datetime'
        : type === 'time'
          ? 'time'
          : type === 'date'
            ? 'date'
            : undefined,
  temporalPrecision: (
    type: string,
    temporal: string | undefined,
  ): number | undefined =>
    temporal
      ? type.match(/\((\d+)\)/)?.[1]
        ? Number(type.match(/\((\d+)\)/)![1])
        : 0
      : undefined,
};
export const mysqlNumeric: NumericCapabilityStrategy = {
  unsigned: (type: string): boolean => /\bunsigned\b/.test(type),
  special: (
    _type: string,
    base: string,
  ): { binaryPrecision: number } | undefined =>
    base === 'float' ? { binaryPrecision: 24 } : undefined,
};

interface MysqlCollectionRow {
  readonly table_schema: string;
  readonly table_name: string;
  readonly table_type: string;
  readonly table_comment: string | null;
  readonly view_definition: string | null;
}

interface MysqlColumnRow {
  readonly character_octet_length: number | null;
  readonly character_set_name: string | null;
  readonly collation_name: string | null;
  readonly column_name: string;
  readonly ordinal_position: number;
  readonly data_type: string;
  readonly column_type: string;
  readonly is_nullable: 'YES' | 'NO';
  readonly column_default: unknown;
  readonly extra: string;
  readonly character_maximum_length: number | null;
  readonly numeric_precision: number | null;
  readonly numeric_scale: number | null;
  readonly column_comment: string | null;
  readonly generation_expression: string | null;
}

interface MysqlConstraintRow {
  readonly constraint_name: string;
  readonly constraint_type: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY';
  readonly column_name: string;
  readonly ordinal_position: number;
  readonly referenced_table_schema: string | null;
  readonly referenced_table_name: string | null;
  readonly referenced_column_name: string | null;
  readonly update_rule: string | null;
  readonly delete_rule: string | null;
}

interface MysqlIndexRow {
  readonly index_name: string;
  readonly non_unique: number;
  readonly seq_in_index: number;
  readonly column_name: string | null;
  readonly expression?: string | null;
  readonly collation: 'A' | 'D' | null;
  readonly index_type: string;
}

interface MysqlCheckRow {
  readonly constraint_name: string;
  readonly check_clause: string;
}

export interface MysqlSchemaInspectorOptions {
  readonly connectionName: string;
  readonly database?: string;
  resolveClient(): Promise<Knex>;
}

export class MysqlSchemaInspector extends BaseSchemaInspector {
  constructor(private readonly options: MysqlSchemaInspectorOptions) {
    super(options.connectionName, 'oceanbase');
  }

  protected async inspectSchemas(): Promise<PhysicalSchemaInfo[]> {
    const knex = await this.options.resolveClient();
    const schema = await this.currentDatabase(knex);
    return [{ name: schema, default: true }];
  }

  protected async inspectCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined> {
    const knex = await this.options.resolveClient();
    const schema = await this.resolveSchema(knex, identifier.schema);
    const collection = mysqlRows<MysqlCollectionRow>(
      await knex.raw(
        `
          select
            t.table_schema,
            t.table_name,
            t.table_type,
            t.table_comment,
            v.view_definition
          from information_schema.tables t
          left join information_schema.views v
            on v.table_schema = t.table_schema
            and v.table_name = t.table_name
          where t.table_schema = ?
            and t.table_name = ?
            and t.table_type in ('BASE TABLE', 'VIEW')
          limit 1
        `,
        [schema, identifier.tableName],
      ),
    )[0];
    if (!collection) {
      return undefined;
    }

    const columns = mysqlRows<MysqlColumnRow>(
      await knex.raw(
        `
          select
            column_name,
            ordinal_position,
            data_type,
            column_type,
            is_nullable,
            column_default,
            extra,
            character_maximum_length,
            character_octet_length,
            character_set_name,
            collation_name,
            numeric_precision,
            numeric_scale,
            column_comment,
            generation_expression
          from information_schema.columns
          where table_schema = ? and table_name = ?
          order by ordinal_position
        `,
        [schema, identifier.tableName],
      ),
    );
    const expressionDefaults = await this.readExpressionDefaults(
      knex,
      schema,
      collection,
      columns,
    );
    const constraints = mysqlRows<MysqlConstraintRow>(
      await knex.raw(
        `
          select
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            kcu.ordinal_position,
            kcu.referenced_table_schema,
            kcu.referenced_table_name,
            kcu.referenced_column_name,
            rc.update_rule,
            rc.delete_rule
          from information_schema.table_constraints tc
          join information_schema.key_column_usage kcu
            on kcu.constraint_schema = tc.constraint_schema
            and kcu.table_schema = tc.table_schema
            and kcu.table_name = tc.table_name
            and kcu.constraint_name = tc.constraint_name
          left join information_schema.referential_constraints rc
            on rc.constraint_schema = tc.constraint_schema
            and rc.table_name = tc.table_name
            and rc.constraint_name = tc.constraint_name
          where tc.table_schema = ?
            and tc.table_name = ?
            and tc.constraint_type in ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
          order by tc.constraint_name, kcu.ordinal_position
        `,
        [schema, identifier.tableName],
      ),
    );
    const groupedConstraints = groupMysqlConstraints(constraints);
    const indexResult = await this.readIndexes(
      knex,
      schema,
      identifier.tableName,
      groupedConstraints,
    );
    const checkResult = await this.readChecks(
      knex,
      schema,
      identifier.tableName,
    );
    const primary = groupedConstraints.find(
      (constraint) => constraint.type === 'PRIMARY KEY',
    );
    const warnings: SchemaInspectionWarning[] = [
      ...indexResult.warnings,
      ...checkResult.warnings,
    ];

    return {
      schema,
      tableName: collection.table_name,
      kind: collection.table_type === 'VIEW' ? 'view' : 'table',
      comment: optionalString(collection.table_comment),
      viewDefinition: optionalString(collection.view_definition),
      columns: columns.map((column) => {
        const generated =
          optionalString(column.generation_expression) !== undefined;
        return {
          columnName: column.column_name,
          ordinalPosition: Number(column.ordinal_position),
          dataType: normalizePhysicalDataType(mysqlTypes, column.data_type),
          nativeType: column.column_type,
          ...numericCapabilities(mysqlNumeric, column.column_type),
          lengthUnit: column.character_set_name
            ? ('characters' as const)
            : undefined,
          maxByteLength: numberValue(column.character_octet_length),
          characterSet: optionalString(column.character_set_name),
          collation: optionalString(column.collation_name),
          nullable: column.is_nullable === 'YES',
          default: generated
            ? undefined
            : parseColumnDefault(
                oceanbaseDefaultLiteral(
                  column,
                  expressionDefaults.has(column.column_name),
                ),
              ),
          autoIncrement: column.extra.toLowerCase().includes('auto_increment'),
          unsigned: /\bunsigned\b/i.test(column.column_type),
          length: numberValue(column.character_maximum_length),
          precision: numberValue(column.numeric_precision),
          scale: numberValue(column.numeric_scale),
          fractionalSecondsPrecision: temporalFractionalSecondsPrecision(
            mysqlTypes,
            column.column_type,
          ),
          comment: optionalString(column.column_comment),
          generated: generated
            ? {
                expression: optionalString(column.generation_expression),
                stored: column.extra.toUpperCase().includes('STORED GENERATED'),
              }
            : undefined,
        };
      }),
      primaryKey: primary
        ? { name: primary.name, columns: primary.columns }
        : undefined,
      uniqueConstraints: groupedConstraints
        .filter((constraint) => constraint.type === 'UNIQUE')
        .map((constraint): PhysicalUniqueConstraintSchema => ({
          name: constraint.name,
          columns: constraint.columns,
        })),
      indexes: indexResult.indexes,
      foreignKeys: groupedConstraints
        .filter((constraint) => constraint.type === 'FOREIGN KEY')
        .map(mysqlForeignKey),
      checkConstraints: checkResult.checks,
      inspection: {
        aspects: {
          columns: 'complete',
          primaryKey: 'complete',
          uniqueConstraints: 'complete',
          indexes: indexResult.status,
          foreignKeys: 'complete',
          checkConstraints: checkResult.status,
          comments: 'complete',
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
    const knex = await this.options.resolveClient();
    const currentDatabase = await this.currentDatabase(knex);
    if (
      options.schemas &&
      (options.schemas.length !== 1 || options.schemas[0] !== currentDatabase)
    ) {
      for (const schema of options.schemas) {
        if (schema !== currentDatabase) {
          throw this.invalidOptions(
            `MySQL SchemaInspector only supports the current database "${currentDatabase}", received "${schema}".`,
            { schema },
          );
        }
      }
    }
    const tableTypes = options.kinds
      ? options.kinds.flatMap((kind) => {
          if (kind === 'table') return ['BASE TABLE'];
          if (kind === 'view') return ['VIEW'];
          return [];
        })
      : ['BASE TABLE', 'VIEW'];
    if (tableTypes.length === 0) {
      return [];
    }
    const bindings: Array<string | number> = [currentDatabase];
    const predicates: string[] = [
      'table_schema = ?',
      `table_type in (${tableTypes.map(() => '?').join(', ')})`,
    ];
    bindings.push(...tableTypes);
    if (after) {
      if (after.schema !== currentDatabase) {
        return [];
      }
      predicates.push('table_name > ?');
      bindings.push(after.tableName);
    }
    if (options.tableNamePrefixes && !options.tableNamePrefixes.includes('')) {
      predicates.push(
        `(${options.tableNamePrefixes.map(() => 'left(table_name, ?) = ?').join(' or ')})`,
      );
      for (const prefix of options.tableNamePrefixes) {
        bindings.push(prefix.length, prefix);
      }
    }
    bindings.push(fetchLimit);
    const rows = mysqlRows<MysqlCollectionRow>(
      await knex.raw(
        `
          select
            table_schema,
            table_name,
            table_type,
            table_comment,
            null as view_definition
          from information_schema.tables
          where ${predicates.join(' and ')}
          order by table_schema, table_name
          limit ?
        `,
        bindings,
      ),
    );
    return rows.map((row) => ({
      schema: row.table_schema,
      tableName: row.table_name,
      kind: row.table_type === 'VIEW' ? 'view' : 'table',
      comment: optionalString(row.table_comment),
    }));
  }

  private async currentDatabase(knex: Knex): Promise<string> {
    const rows = mysqlRows<{ database_name: string | null }>(
      await knex.raw('select database() as database_name'),
    );
    const database = optionalString(rows[0]?.database_name);
    if (!database) {
      throw this.invalidOptions(
        'MySQL SchemaInspector requires the connection to select a database.',
      );
    }
    return database;
  }

  private async resolveSchema(
    knex: Knex,
    requested: string | undefined,
  ): Promise<string> {
    const current = await this.currentDatabase(knex);
    if (requested !== undefined && requested !== current) {
      throw this.invalidOptions(
        `MySQL SchemaInspector only supports the current database "${current}", received "${requested}".`,
        { schema: requested },
      );
    }
    return current;
  }

  /**
   * The columns of a table whose default is an expression. `information_schema` cannot tell: OceanBase reports
   * `default (uuid())` and `default 'uuid()'` alike, as `uuid()`, with nothing in `extra`. Only the table's DDL keeps
   * the difference, so it is read when a character column has a default the two could be confused for.
   *
   * A view reports the defaults of the columns it selects in the same form, but its DDL declares none, so there is
   * nothing to settle them with. A character default on a view that reads like a function call is taken for an
   * expression: reading a literal `'uuid()'` as no default is safer than handing the Repository `uuid()` to write.
   */
  private async readExpressionDefaults(
    knex: Knex,
    schema: string,
    collection: MysqlCollectionRow,
    columns: readonly MysqlColumnRow[],
  ): Promise<ReadonlySet<string>> {
    const characterDefaults = columns.filter(
      (column) =>
        typeof column.column_default === 'string' &&
        OCEANBASE_CHARACTER_DEFAULT_TYPES.has(column.data_type.toLowerCase()),
    );
    if (collection.table_type !== 'BASE TABLE') {
      return new Set(
        characterDefaults
          .filter((column) =>
            /^[a-z_][\w$]*\s*\(.*\)$/isu.test(String(column.column_default)),
          )
          .map((column) => column.column_name),
      );
    }
    if (characterDefaults.length === 0) {
      return new Set();
    }
    const row = mysqlRows<{ readonly 'create table'?: unknown }>(
      await knex.raw('show create table ??.??', [
        schema,
        collection.table_name,
      ]),
    )[0];
    return oceanbaseExpressionDefaultColumns(
      typeof row?.['create table'] === 'string' ? row['create table'] : '',
    );
  }

  private async readIndexes(
    knex: Knex,
    schema: string,
    tableName: string,
    constraints: readonly GroupedMysqlConstraint[],
  ): Promise<{
    indexes: PhysicalIndexSchema[];
    status: 'complete' | 'partial';
    warnings: SchemaInspectionWarning[];
  }> {
    let rows: MysqlIndexRow[];
    let status: 'complete' | 'partial' = 'complete';
    const warnings: SchemaInspectionWarning[] = [];
    try {
      rows = mysqlRows<MysqlIndexRow>(
        await knex.raw(
          `
            select
              index_name,
              non_unique,
              seq_in_index,
              column_name,
              expression,
              collation,
              index_type
            from information_schema.statistics
            where table_schema = ? and table_name = ?
            order by index_name, seq_in_index
          `,
          [schema, tableName],
        ),
      );
    } catch (error) {
      if (!isMysqlMissingExpressionColumn(error)) {
        throw error;
      }
      rows = mysqlRows<MysqlIndexRow>(
        await knex.raw(
          `
            select
              index_name,
              non_unique,
              seq_in_index,
              column_name,
              collation,
              index_type
            from information_schema.statistics
            where table_schema = ? and table_name = ?
            order by index_name, seq_in_index
          `,
          [schema, tableName],
        ),
      );
      status = 'partial';
      warnings.push({
        code: 'MYSQL_INDEX_EXPRESSION_PARTIAL',
        message:
          'The MySQL server does not expose index expressions through information_schema.statistics.',
        aspect: 'indexes',
      });
    }

    const groups = new Map<string, MysqlIndexRow[]>();
    for (const row of rows) {
      const group = groups.get(row.index_name) ?? [];
      group.push(row);
      groups.set(row.index_name, group);
    }
    const indexes = [...groups.entries()].map(
      ([name, entries]): PhysicalIndexSchema => {
        const constraint = constraints.find((item) => item.name === name);
        return {
          name,
          keys: entries
            .sort((left, right) => left.seq_in_index - right.seq_in_index)
            .map(mysqlIndexKey),
          unique: Number(entries[0].non_unique) === 0,
          backsConstraint:
            constraint?.type === 'PRIMARY KEY' || constraint?.type === 'UNIQUE'
              ? {
                  kind:
                    constraint.type === 'PRIMARY KEY' ? 'primaryKey' : 'unique',
                  name: constraint.name,
                }
              : undefined,
          method: entries[0].index_type,
        };
      },
    );
    return { indexes, status, warnings };
  }

  private async readChecks(
    knex: Knex,
    schema: string,
    tableName: string,
  ): Promise<{
    checks: PhysicalCheckConstraintSchema[];
    status: 'complete' | 'unsupported';
    warnings: SchemaInspectionWarning[];
  }> {
    try {
      const rows = mysqlRows<MysqlCheckRow>(
        await knex.raw(
          `
            select tc.constraint_name, cc.check_clause
            from information_schema.table_constraints tc
            join information_schema.check_constraints cc
              on cc.constraint_schema = tc.constraint_schema
              and cc.constraint_name = tc.constraint_name
            where tc.table_schema = ?
              and tc.table_name = ?
              and tc.constraint_type = 'CHECK'
            order by tc.constraint_name
          `,
          [schema, tableName],
        ),
      );
      return {
        checks: rows.map((row) => ({
          name: row.constraint_name,
          expression: row.check_clause,
        })),
        status: 'complete',
        warnings: [],
      };
    } catch (error) {
      if (!isMysqlMissingCheckCatalog(error)) {
        throw error;
      }
      return {
        checks: [],
        status: 'unsupported',
        warnings: [
          {
            code: 'MYSQL_CHECK_CONSTRAINT_UNSUPPORTED',
            message:
              'Check constraint introspection is not supported by this MySQL server.',
            aspect: 'checkConstraints',
          },
        ],
      };
    }
  }
}

/** The data types whose literal default `information_schema` reports as the bare string value, besides temporal ones. */
const OCEANBASE_CHARACTER_DEFAULT_TYPES: ReadonlySet<string> = new Set([
  'char',
  'varchar',
  'tinytext',
  'text',
  'mediumtext',
  'longtext',
  'enum',
  'set',
]);

/**
 * The column default as the SQL form the shared literal parser reads: a string literal quoted, an expression as it is.
 *
 * OceanBase, like MySQL, reports a literal default as the bare value, neither quoted nor escaped: `draft` for
 * `default 'draft'`, `it's` for `default 'it''s'`, `0` for `default 0`. A number reads correctly as it is, but the
 * shared parser takes an unquoted word for an expression, so the default of a character, enum or temporal column had no
 * value at all — and `'42'` or `'NULL'` read as a number and as null. Those types are quoted here, which makes every
 * bare value of theirs a string.
 *
 * Unlike MySQL, OceanBase marks no expression default with `DEFAULT_GENERATED`: it reports `default (uuid())` as the
 * bare `uuid()`, exactly as it reports `default 'uuid()'`. `isExpression` says which one the table's DDL declared,
 * since quoting an expression would hand the Repository its text to write as a value. A temporal literal starts with a
 * digit, or a minus sign for a negative `time`, so `CURRENT_TIMESTAMP` and `curdate()` are expressions without it.
 */
export function oceanbaseDefaultLiteral(
  column: {
    readonly column_default: unknown;
    readonly data_type: string;
  },
  isExpression: boolean,
): unknown {
  const raw = column.column_default;
  if (typeof raw !== 'string' || isExpression) {
    return raw;
  }
  const type = column.data_type.toLowerCase();
  if (mysqlTypes.temporal?.(type) !== undefined) {
    return /^-?\d/u.test(raw.trim()) ? quoteOceanbaseBareDefault(raw) : raw;
  }
  return OCEANBASE_CHARACTER_DEFAULT_TYPES.has(type)
    ? quoteOceanbaseBareDefault(raw)
    : raw;
}

function quoteOceanbaseBareDefault(raw: string): string {
  return `'${raw.replaceAll("'", "''")}'`;
}

/**
 * The columns `SHOW CREATE TABLE` declares with an expression default, `DEFAULT (…)`, where a literal one reads
 * `DEFAULT '…'`. String literals are blanked first, so a comment, an enum value or a default that merely contains the
 * words is not taken for the clause.
 */
export function oceanbaseExpressionDefaultColumns(
  createTable: string,
): ReadonlySet<string> {
  const columns = new Set<string>();
  for (const line of createTable.split('\n')) {
    const match = /^\s*`((?:[^`]|``)+)`\s(.*)$/u.exec(line);
    if (
      match &&
      /\bDEFAULT\s*\(/iu.test(match[2].replace(/'(?:[^'\\]|\\.|'')*'/gu, "''"))
    ) {
      columns.add(match[1].replaceAll('``', '`'));
    }
  }
  return columns;
}

interface GroupedMysqlConstraint {
  readonly name: string;
  readonly type: MysqlConstraintRow['constraint_type'];
  readonly columns: readonly string[];
  readonly referencedSchema?: string;
  readonly referencedTable?: string;
  readonly referencedColumns: readonly string[];
  readonly onUpdate?: string;
  readonly onDelete?: string;
}

function groupMysqlConstraints(
  rows: readonly MysqlConstraintRow[],
): GroupedMysqlConstraint[] {
  const groups = new Map<string, MysqlConstraintRow[]>();
  for (const row of rows) {
    const key = `${row.constraint_type}:${row.constraint_name}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const sorted = [...group].sort(
      (left, right) => left.ordinal_position - right.ordinal_position,
    );
    return {
      name: sorted[0].constraint_name,
      type: sorted[0].constraint_type,
      columns: sorted.map((row) => row.column_name),
      referencedSchema: optionalString(sorted[0].referenced_table_schema),
      referencedTable: optionalString(sorted[0].referenced_table_name),
      referencedColumns: sorted.flatMap((row) =>
        row.referenced_column_name ? [row.referenced_column_name] : [],
      ),
      onUpdate: optionalString(sorted[0].update_rule),
      onDelete: optionalString(sorted[0].delete_rule),
    };
  });
}

function mysqlForeignKey(
  constraint: GroupedMysqlConstraint,
): PhysicalForeignKeySchema {
  return {
    name: constraint.name,
    columns: constraint.columns,
    referencedCollection: {
      schema: constraint.referencedSchema as string,
      tableName: constraint.referencedTable as string,
    },
    referencedColumns: constraint.referencedColumns,
    onDelete: normalizeReferentialAction(constraint.onDelete),
    onUpdate: normalizeReferentialAction(constraint.onUpdate),
  };
}

function mysqlIndexKey(row: MysqlIndexRow): PhysicalIndexKey {
  const order = row.collation === 'D' ? 'desc' : 'asc';
  if (row.column_name) {
    return { columnName: row.column_name, order };
  }
  return {
    expression: optionalString(row.expression) ?? '<unavailable>',
    order,
  };
}

function mysqlRows<T extends object>(result: unknown): T[] {
  return rawRows<Record<string, unknown>>(result).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    ),
  ) as T[];
}

function isMysqlMissingExpressionColumn(error: unknown): boolean {
  const details = mysqlErrorDetails(error);
  return (
    details.code === 'ER_BAD_FIELD_ERROR' &&
    /\bexpression\b/i.test(details.message)
  );
}

function isMysqlMissingCheckCatalog(error: unknown): boolean {
  const details = mysqlErrorDetails(error);
  return (
    details.code === 'ER_NO_SUCH_TABLE' || details.code === 'ER_BAD_TABLE_ERROR'
  );
}

function mysqlErrorDetails(error: unknown): {
  code: string;
  message: string;
} {
  if (!error || typeof error !== 'object') {
    return { code: '', message: '' };
  }
  const record = error as Record<string, unknown>;
  return {
    code: typeof record.code === 'string' ? record.code : '',
    message: typeof record.message === 'string' ? record.message : '',
  };
}
