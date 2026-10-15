import type { Knex } from 'knex';
import {
  BaseSchemaInspector,
  normalizePhysicalDataType,
  normalizeReferentialAction,
  numberValue,
  optionalString,
  parseColumnDefault,
  rawRows,
  temporalFractionalSecondsPrecision,
  numericCapabilities,
} from '@nocobase/db';
import type {
  DecodedPhysicalCollectionCursor,
  NormalizedPhysicalCollectionListOptions,
  PhysicalCollectionIdentifier,
  PhysicalCollectionSchema,
  PhysicalCollectionSummary,
  PhysicalDataType,
  PhysicalForeignKeySchema,
  PhysicalIndexKey,
  PhysicalIndexSchema,
  PhysicalSchemaInfo,
  PhysicalTypeNormalizationStrategy,
  NumericCapabilityStrategy,
  PhysicalUniqueConstraintSchema,
} from '@nocobase/db';

export const damengTypes: PhysicalTypeNormalizationStrategy = {
  temporal: (type): PhysicalDataType | undefined => {
    if (type === 'date') return 'datetime';
    if (type === 'time') return 'time';
    if (
      type === 'timestamp with time zone' ||
      type === 'datetime with time zone' ||
      type === 'timestamp with local time zone'
    ) {
      return 'datetimeTz';
    }
    if (type === 'timestamp' || type === 'datetime') return 'datetime';
    return undefined;
  },
  temporalPrecision: (type, temporal) =>
    temporal
      ? type === 'date'
        ? 0
        : type.match(/\((\d+)\)/)?.[1]
          ? Number(type.match(/\((\d+)\)/)![1])
          : undefined
      : undefined,
};

export const damengNumeric: NumericCapabilityStrategy = {
  special: (_type, base) =>
    base === 'real'
      ? { binaryPrecision: 24 }
      : base === 'double'
        ? { binaryPrecision: 53 }
        : undefined,
};

interface DamengCollectionRow {
  readonly table_name: string;
  readonly object_kind: 'TABLE' | 'VIEW';
  readonly comments?: string | null;
}

interface DamengColumnRow {
  readonly column_name: string;
  readonly column_id: number;
  readonly data_type: string;
  readonly data_length: number | null;
  readonly char_length: number | null;
  readonly char_used: string | null;
  readonly data_precision: number | null;
  readonly data_scale: number | null;
  readonly nullable: string;
  readonly data_default: unknown;
  readonly comments?: string | null;
  readonly identity_flag?: string | null;
}

interface DamengConstraintRow {
  readonly constraint_name: string;
  readonly constraint_type: 'P' | 'U' | 'R' | 'C';
  readonly column_name: string | null;
  readonly position: number | null;
  readonly referenced_owner: string | null;
  readonly referenced_constraint_name: string | null;
  readonly referenced_table: string | null;
  readonly referenced_column: string | null;
  readonly delete_rule: string | null;
  readonly deferrable: string | null;
  readonly deferred: string | null;
  readonly search_condition: string | null;
}

interface DamengIndexRow {
  readonly index_name: string;
  readonly uniqueness: string;
  readonly index_type: string;
  readonly column_position: number;
  readonly column_name: string | null;
  readonly descend: string | null;
  readonly constraint_name: string | null;
  readonly constraint_type: 'P' | 'U' | null;
}

interface GroupedConstraint {
  readonly name: string;
  readonly type: DamengConstraintRow['constraint_type'];
  readonly columns: string[];
  readonly referencedSchema?: string;
  readonly referencedTable?: string;
  readonly referencedColumns: string[];
  readonly onDelete?: string;
  readonly deferrable: boolean;
  readonly initiallyDeferred: boolean;
  readonly checkExpression?: string;
}

export interface DamengSchemaInspectorOptions {
  readonly connectionName: string;
  resolveClient(): Promise<Knex>;
}

export class DamengSchemaInspector extends BaseSchemaInspector {
  constructor(private readonly options: DamengSchemaInspectorOptions) {
    super(options.connectionName, 'dameng');
  }

  protected async inspectSchemas(): Promise<PhysicalSchemaInfo[]> {
    const knex = await this.options.resolveClient();
    const row = rows<{ schema_name: string }>(
      await knex.raw('select user as schema_name from dual'),
    )[0];
    const schema = optionalString(row?.schema_name);
    if (!schema) {
      throw this.invalidOptions(
        'Dameng SchemaInspector could not resolve the current schema.',
      );
    }
    return [{ name: schema, default: true }];
  }

  protected async inspectCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined> {
    const knex = await this.options.resolveClient();
    const schema = await this.currentSchema(knex, identifier.schema);
    const collection = (
      await this.listCollections(knex, schema, {
        tableName: identifier.tableName,
        limit: 1,
      })
    )[0];
    if (!collection) return undefined;

    const columns = rows<DamengColumnRow>(
      await knex.raw(
        `
        select
            c.column_name,
            c.column_id,
            c.data_type,
            c.data_length,
            c.char_length,
            c.char_used,
            c.data_precision,
            c.data_scale,
            c.nullable,
            c.data_default,
            cc.comments,
            case when exists (
              select 1
              from sys.syscolumns sc
              join sys.sysobjects so on so.id = sc.id
              where so.name = c.table_name
                and sc.name = c.column_name
                and sc.info2 = 1
            ) then 'YES' else 'NO' end as identity_flag
          from user_tab_columns c
          left join user_col_comments cc
            on cc.table_name = c.table_name
            and cc.column_name = c.column_name
          where c.table_name = ?
          order by c.column_id
        `,
        [collection.table_name],
      ),
    );
    const constraints = groupConstraints(
      rows<DamengConstraintRow>(
        await knex.raw(
          `
            select
              c.constraint_name,
              c.constraint_type,
              cc.column_name,
              cc.position,
              rc.owner as referenced_owner,
              rc.constraint_name as referenced_constraint_name,
              rc.table_name as referenced_table,
              rcc.column_name as referenced_column,
              c.delete_rule,
              c.deferrable,
              c.deferred,
              c.search_condition
            from user_constraints c
            left join user_cons_columns cc
              on cc.constraint_name = c.constraint_name
              and cc.table_name = c.table_name
            left join all_constraints rc
              on rc.owner = c.r_owner
              and rc.constraint_name = c.r_constraint_name
            left join all_cons_columns rcc
              on rcc.owner = rc.owner
              and rcc.constraint_name = rc.constraint_name
              and rcc.position = cc.position
            where c.table_name = ?
              and c.constraint_type in ('P', 'U', 'R', 'C')
            order by c.constraint_name, cc.position
          `,
          [collection.table_name],
        ),
      ),
    );
    const indexes = readIndexes(
      rows<DamengIndexRow>(
        await knex.raw(
          `
            select
              i.index_name,
              i.uniqueness,
              i.index_type,
              ic.column_position,
              ic.column_name,
              ic.descend,
              c.constraint_name,
              c.constraint_type
            from user_indexes i
            join user_ind_columns ic
              on ic.index_name = i.index_name
              and ic.table_name = i.table_name
            left join user_constraints c
              on c.index_name = i.index_name
              and c.table_name = i.table_name
              and c.constraint_type in ('P', 'U')
            where i.table_name = ?
            order by i.index_name, ic.column_position
          `,
          [collection.table_name],
        ),
      ),
    );
    const primary = constraints.find((item) => item.type === 'P');
    const checkConstraints = constraints
      .filter((item) => item.type === 'C' && item.checkExpression)
      .map((item) => ({
        name: item.name,
        expression: item.checkExpression!,
      }));
    const viewDefinition =
      collection.object_kind === 'VIEW'
        ? optionalString(
            rows<{ text: unknown }>(
              await knex.raw(
                'select text from user_views where view_name = ?',
                [collection.table_name],
              ),
            )[0]?.text,
          )
        : undefined;

    return {
      schema,
      tableName: collection.table_name,
      kind: collection.object_kind === 'VIEW' ? 'view' : 'table',
      comment: optionalString(collection.comments),
      viewDefinition,
      columns: columns.map((column) => {
        const nativeType = nativeColumnType(column);
        const temporalPrecision = temporalFractionalSecondsPrecision(
          damengTypes,
          nativeType,
        );
        return {
          columnName: column.column_name,
          ordinalPosition: Number(column.column_id),
          dataType: normalizePhysicalDataType(damengTypes, nativeType),
          nativeType,
          ...numericCapabilities(damengNumeric, nativeType),
          nullable: column.nullable === 'Y',
          default: parseColumnDefault(column.data_default),
          autoIncrement: column.identity_flag === 'YES',
          length:
            temporalPrecision === undefined ? columnLength(column) : undefined,
          lengthUnit:
            column.char_used === 'B'
              ? ('bytes' as const)
              : column.char_used === 'C'
                ? ('characters' as const)
                : undefined,
          maxByteLength:
            column.char_used === 'B'
              ? numberValue(column.data_length)
              : undefined,
          precision:
            temporalPrecision === undefined
              ? numberValue(column.data_precision)
              : undefined,
          scale:
            temporalPrecision === undefined
              ? numberValue(column.data_scale)
              : undefined,
          fractionalSecondsPrecision: temporalPrecision,
          comment: optionalString(column.comments),
        };
      }),
      primaryKey: primary
        ? {
            name: primary.name,
            columns: primary.columns,
            deferrable: primary.deferrable,
            initiallyDeferred: primary.initiallyDeferred,
          }
        : undefined,
      uniqueConstraints: constraints
        .filter((item) => item.type === 'U')
        .map((item): PhysicalUniqueConstraintSchema => ({
          name: item.name,
          columns: item.columns,
          deferrable: item.deferrable,
          initiallyDeferred: item.initiallyDeferred,
        })),
      indexes,
      foreignKeys: constraints
        .filter(
          (item) =>
            item.type === 'R' &&
            item.referencedTable &&
            item.referencedColumns.length > 0,
        )
        .map((item): PhysicalForeignKeySchema => ({
          name: item.name,
          columns: item.columns,
          referencedCollection: {
            schema: item.referencedSchema ?? schema,
            tableName: item.referencedTable!,
          },
          referencedColumns: item.referencedColumns,
          onDelete:
            item.onDelete?.toUpperCase() === 'NO ACTION'
              ? 'restrict'
              : normalizeReferentialAction(item.onDelete),
          onUpdate: 'cascade',
          deferrable: item.deferrable,
          initiallyDeferred: item.initiallyDeferred,
        })),
      checkConstraints,
      inspection: {
        aspects: {
          columns: 'complete',
          primaryKey: 'complete',
          uniqueConstraints: 'complete',
          indexes: 'complete',
          foreignKeys: 'complete',
          checkConstraints: 'complete',
          comments: 'complete',
          viewDefinition:
            collection.object_kind === 'VIEW' ? 'complete' : 'complete',
        },
        warnings: [],
      },
    };
  }

  protected async inspectCollectionSummaries(
    options: NormalizedPhysicalCollectionListOptions,
    after: DecodedPhysicalCollectionCursor['after'] | undefined,
    fetchLimit: number,
  ): Promise<PhysicalCollectionSummary[]> {
    const knex = await this.options.resolveClient();
    const schema = await this.currentSchema(knex);
    if (options.schemas && !options.schemas.includes(schema)) return [];
    if (after && (after.schema !== schema || !after.tableName)) return [];
    const kinds = options.kinds ?? ['table', 'view'];
    const collections = await this.listCollections(knex, schema, {
      objectKinds: kinds,
      tableNamePrefixes: options.tableNamePrefixes,
      afterTableName: after?.tableName,
      limit: fetchLimit,
    });
    return collections.map((item) => ({
      schema,
      tableName: item.table_name,
      kind: item.object_kind === 'VIEW' ? 'view' : 'table',
      comment: optionalString(item.comments),
    }));
  }

  private async currentSchema(knex: Knex, requested?: string): Promise<string> {
    const row = rows<{ schema_name: string }>(
      await knex.raw('select user as schema_name from dual'),
    )[0];
    const current = optionalString(row?.schema_name);
    if (!current) {
      throw this.invalidOptions(
        'Dameng SchemaInspector could not resolve the current schema.',
      );
    }
    if (requested !== undefined && requested !== current) {
      throw this.invalidOptions(
        `Dameng SchemaInspector currently supports only the current schema "${current}", received "${requested}".`,
        { schema: requested },
      );
    }
    return current;
  }

  private async listCollections(
    knex: Knex,
    _schema: string,
    options: {
      tableName?: string;
      objectKinds?: readonly string[];
      tableNamePrefixes?: readonly string[];
      afterTableName?: string;
      limit?: number;
    },
  ): Promise<DamengCollectionRow[]> {
    const kinds = options.objectKinds ?? ['table', 'view'];
    const includeTables =
      kinds.includes('table') || kinds.includes('partitionedTable');
    const includeViews = kinds.includes('view');
    if (!includeTables && !includeViews) return [];

    const branches: string[] = [];
    const bindings: unknown[] = [];
    if (includeTables) {
      branches.push(
        `select t.table_name, 'TABLE' as object_kind, tc.comments
         from user_tables t
         left join user_tab_comments tc on tc.table_name = t.table_name`,
      );
    }
    if (includeViews) {
      branches.push(
        `select v.view_name as table_name, 'VIEW' as object_kind, tc.comments
         from user_views v
         left join user_tab_comments tc on tc.table_name = v.view_name`,
      );
    }
    const conditions: string[] = [];
    if (options.tableName !== undefined) {
      const names = [options.tableName];
      if (options.tableName !== options.tableName.toUpperCase()) {
        names.push(options.tableName.toUpperCase());
      }
      conditions.push(`(${names.map(() => 'table_name = ?').join(' or ')})`);
      bindings.push(...names);
    }
    if (options.tableNamePrefixes?.length) {
      const prefixConditions = options.tableNamePrefixes.map(
        () => 'upper(table_name) like upper(?)',
      );
      conditions.push(`(${prefixConditions.join(' or ')})`);
      bindings.push(...options.tableNamePrefixes.map((prefix) => `${prefix}%`));
    }
    if (options.afterTableName !== undefined) {
      conditions.push('table_name > ?');
      bindings.push(options.afterTableName);
    }
    const where = conditions.length ? ` where ${conditions.join(' and ')}` : '';
    const limit = Math.max(1, options.limit ?? 100);
    const sql = `select * from (${branches.join(' union all ')}) objects${where} order by table_name fetch first ${limit} rows only`;
    return rows<DamengCollectionRow>(
      await knex.raw(sql, bindings as string[]),
    ).sort((a, b) => a.table_name.localeCompare(b.table_name));
  }
}

function rows<T extends object>(result: unknown): T[] {
  return rawRows<Record<string, unknown>>(result).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    ),
  ) as T[];
}

function nativeColumnType(column: DamengColumnRow): string {
  const type = column.data_type;
  const precision = numberValue(column.data_precision);
  const scale = numberValue(column.data_scale);
  if (
    scale !== undefined &&
    scale > 0 &&
    /^(TIME|TIMESTAMP|DATETIME)/iu.test(type)
  ) {
    return `${type}(${scale})`;
  }
  if (precision !== undefined) {
    return scale !== undefined
      ? `${type}(${precision},${scale})`
      : `${type}(${precision})`;
  }
  const length = columnLength(column);
  if (
    length !== undefined &&
    /^(CHAR|VARCHAR|VARCHAR2|NCHAR|NVARCHAR)$/iu.test(type)
  ) {
    return `${type}(${length}${column.char_used ? ` ${column.char_used}` : ''})`;
  }
  return type;
}

function columnLength(column: DamengColumnRow): number | undefined {
  if (/^(CHAR|VARCHAR|VARCHAR2|NCHAR|NVARCHAR)$/iu.test(column.data_type)) {
    return numberValue(column.char_length ?? column.data_length);
  }
  return undefined;
}

function groupConstraints(
  rowsInput: readonly DamengConstraintRow[],
): GroupedConstraint[] {
  const groups = new Map<string, DamengConstraintRow[]>();
  for (const row of rowsInput) {
    const group =
      groups.get(`${row.constraint_type}:${row.constraint_name}`) ?? [];
    group.push(row);
    groups.set(`${row.constraint_type}:${row.constraint_name}`, group);
  }
  return [...groups.values()].map((group) => {
    const sorted = [...group].sort(
      (left, right) => Number(left.position ?? 0) - Number(right.position ?? 0),
    );
    return {
      name: sorted[0].constraint_name,
      type: sorted[0].constraint_type,
      columns: sorted.flatMap((row) =>
        row.column_name ? [row.column_name] : [],
      ),
      referencedSchema: optionalString(sorted[0].referenced_owner),
      referencedTable: optionalString(sorted[0].referenced_table),
      referencedColumns: sorted.flatMap((row) =>
        row.referenced_column ? [row.referenced_column] : [],
      ),
      onDelete: optionalString(sorted[0].delete_rule),
      deferrable: sorted[0].deferrable === 'DEFERRABLE',
      initiallyDeferred: sorted[0].deferred === 'DEFERRED',
      checkExpression: optionalString(sorted[0].search_condition),
    };
  });
}

function readIndexes(
  rowsInput: readonly DamengIndexRow[],
): PhysicalIndexSchema[] {
  const groups = new Map<string, DamengIndexRow[]>();
  for (const row of rowsInput) {
    const group = groups.get(row.index_name) ?? [];
    group.push(row);
    groups.set(row.index_name, group);
  }
  return [...groups.entries()].map(([name, entries]) => ({
    name: optionalString(entries[0].constraint_name) ?? name,
    keys: entries
      .sort((left, right) => left.column_position - right.column_position)
      .flatMap((entry): PhysicalIndexKey[] =>
        entry.column_name
          ? [
              {
                columnName: entry.column_name,
                order: entry.descend?.toLowerCase() === 'desc' ? 'desc' : 'asc',
              },
            ]
          : [],
      ),
    unique: entries[0].uniqueness.toUpperCase() === 'UNIQUE',
    backsConstraint:
      entries[0].constraint_type === 'P' || entries[0].constraint_type === 'U'
        ? {
            kind: entries[0].constraint_type === 'P' ? 'primaryKey' : 'unique',
            name: optionalString(entries[0].constraint_name),
          }
        : undefined,
    method: optionalString(entries[0].index_type),
  }));
}
