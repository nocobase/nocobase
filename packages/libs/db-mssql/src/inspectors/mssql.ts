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
  NumericCapabilityStrategy,
  PhysicalTypeNormalizationStrategy,
  PhysicalDataType,
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
} from '@nocobase/db';

export const mssqlTypes: PhysicalTypeNormalizationStrategy = {
  temporal: (type: string): PhysicalDataType | undefined =>
    type === 'date'
      ? 'date'
      : type === 'datetimeoffset'
        ? 'datetimeTz'
        : type === 'datetime' ||
            type === 'datetime2' ||
            type === 'smalldatetime'
          ? 'datetime'
          : type === 'time'
            ? 'time'
            : undefined,
  special: (type: string, base: string): PhysicalDataType | undefined =>
    /^(n?varchar)\(max\)$/.test(type) || base === 'ntext'
      ? 'text'
      : base === 'bit'
        ? 'boolean'
        : base === 'uniqueidentifier'
          ? 'uuid'
          : base === 'timestamp' || base === 'rowversion' || base === 'image'
            ? 'blob'
            : base === 'money' || base === 'smallmoney'
              ? 'decimal'
              : base === 'float'
                ? Number(type.match(/\((\d+)\)/)?.[1] ?? 53) <= 24
                  ? 'float'
                  : 'double'
                : undefined,
  temporalPrecision: (
    type: string,
    temporal: string | undefined,
  ): number | undefined =>
    temporal
      ? temporal === 'date'
        ? 0
        : type === 'smalldatetime'
          ? 0
          : type === 'datetime'
            ? undefined
            : type.match(/\((\d+)\)/)?.[1]
              ? Number(type.match(/\((\d+)\)/)![1])
              : 7
      : undefined,
};
export const mssqlNumeric: NumericCapabilityStrategy = {
  unsigned: (_type: string, base: string): boolean => base === 'tinyint',
  special: (
    type: string,
    base: string,
  ): { binaryPrecision: number } | undefined =>
    base === 'float'
      ? {
          binaryPrecision:
            Number(type.match(/\((\d+)\)/)?.[1] ?? 53) <= 24 ? 24 : 53,
        }
      : undefined,
};

interface MssqlCollectionRow {
  readonly object_id: number;
  readonly schema_name: string;
  readonly table_name: string;
  readonly object_type: 'U' | 'V';
  readonly comments: string | null;
  readonly view_definition: string | null;
}

interface MssqlColumnRow {
  readonly collation_name: string | null;
  readonly column_name: string;
  readonly column_id: number;
  readonly type_name: string;
  readonly type_schema: string;
  readonly is_user_defined: boolean | number;
  readonly max_length: number;
  readonly precision: number;
  readonly scale: number;
  readonly is_nullable: boolean | number;
  readonly default_definition: string | null;
  readonly is_identity: boolean | number;
  readonly is_computed: boolean | number;
  readonly computed_definition: string | null;
  readonly is_persisted: boolean | number | null;
  readonly comments: string | null;
}

interface MssqlKeyConstraintRow {
  readonly constraint_name: string;
  readonly constraint_type: 'PK' | 'UQ';
  readonly column_name: string;
  readonly key_ordinal: number;
}

interface MssqlIndexRow {
  readonly index_name: string;
  readonly is_unique: boolean | number;
  readonly is_disabled: boolean | number;
  readonly has_filter: boolean | number;
  readonly is_primary_key: boolean | number;
  readonly is_unique_constraint: boolean | number;
  readonly type_desc: string;
  readonly filter_definition: string | null;
  readonly key_ordinal: number;
  readonly index_column_id: number;
  readonly is_descending_key: boolean | number;
  readonly is_included_column: boolean | number;
  readonly column_name: string;
}

interface MssqlForeignKeyRow {
  readonly constraint_name: string;
  readonly constraint_column_id: number;
  readonly column_name: string;
  readonly referenced_schema: string;
  readonly referenced_table: string;
  readonly referenced_column: string;
  readonly delete_action: string;
  readonly update_action: string;
}

interface MssqlCheckRow {
  readonly constraint_name: string;
  readonly definition: string;
}

interface GroupedMssqlKeyConstraint {
  readonly name: string;
  readonly type: MssqlKeyConstraintRow['constraint_type'];
  readonly columns: readonly string[];
}

interface GroupedMssqlForeignKey {
  readonly name: string;
  readonly columns: readonly string[];
  readonly referencedSchema: string;
  readonly referencedTable: string;
  readonly referencedColumns: readonly string[];
  readonly onDelete: string;
  readonly onUpdate: string;
}

export interface MssqlSchemaInspectorOptions {
  readonly connectionName: string;
  resolveClient(): Promise<Knex>;
}

export class MssqlSchemaInspector extends BaseSchemaInspector {
  constructor(private readonly options: MssqlSchemaInspectorOptions) {
    super(options.connectionName, 'mssql');
  }

  protected override isRetryableError(error: unknown): boolean {
    return (
      Boolean(error) &&
      typeof error === 'object' &&
      Number((error as Record<string, unknown>).number) === 1205
    );
  }

  protected override async canRetryDeadlock(): Promise<boolean> {
    // SQL Server rolls back a deadlock victim's entire transaction. Retrying
    // only inspection could silently lose earlier DDL and report missing tables.
    return !(await this.options.resolveClient()).isTransaction;
  }

  protected async inspectSchemas(): Promise<PhysicalSchemaInfo[]> {
    const knex = await this.options.resolveClient();
    const current = await this.currentSchema(knex);
    const rows = mssqlRows<{ schema_name: string }>(
      await knex.raw(`
        select s.name as schema_name
        from sys.schemas s
        where s.name not in ('sys', 'INFORMATION_SCHEMA')
        order by s.name
      `),
    );
    return rows.map((row) => ({
      name: row.schema_name,
      default: row.schema_name === current,
    }));
  }

  protected async inspectCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined> {
    const knex = await this.options.resolveClient();
    const schema = identifier.schema ?? (await this.currentSchema(knex));
    const collection = await this.findCollection(
      knex,
      schema,
      identifier.tableName,
    );
    if (!collection) return undefined;

    const columns = await this.readColumns(knex, collection.object_id);
    const keyRows = await this.readKeyConstraints(knex, collection.object_id);
    const indexRows = await this.readIndexes(knex, collection.object_id);
    const foreignRows = await this.readForeignKeys(knex, collection.object_id);
    const checkRows = await this.readChecks(knex, collection.object_id);
    const keys = groupKeyConstraints(keyRows);
    const primary = keys.find((key) => key.type === 'PK');

    return {
      schema: collection.schema_name,
      tableName: collection.table_name,
      kind: collection.object_type.trim() === 'V' ? 'view' : 'table',
      comment: optionalString(collection.comments),
      viewDefinition: optionalString(collection.view_definition),
      columns: columns.map((column) => {
        const nativeType = mssqlNativeType(column);
        const computed = truthy(column.is_computed);
        return {
          columnName: column.column_name,
          ordinalPosition: Number(column.column_id),
          dataType: normalizePhysicalDataType(mssqlTypes, nativeType),
          nativeType,
          ...numericCapabilities(mssqlNumeric, nativeType),
          lengthUnit:
            mssqlColumnLength(column) === undefined
              ? undefined
              : column.type_name.toLowerCase().startsWith('n')
                ? ('utf16CodeUnits' as const)
                : ('bytes' as const),
          maxByteLength:
            mssqlColumnLength(column) === undefined
              ? undefined
              : Number(column.max_length),
          collation: optionalString(column.collation_name),
          nativeTypeSchema: truthy(column.is_user_defined)
            ? column.type_schema
            : undefined,
          nullable: truthy(column.is_nullable),
          default: computed
            ? undefined
            : parseColumnDefault(column.default_definition),
          autoIncrement: truthy(column.is_identity),
          length: mssqlColumnLength(column),
          precision: mssqlPrecision(column),
          scale: mssqlScale(column),
          fractionalSecondsPrecision: temporalFractionalSecondsPrecision(
            mssqlTypes,
            nativeType,
          ),
          comment: optionalString(column.comments),
          generated: computed
            ? {
                expression: optionalString(column.computed_definition),
                stored: truthy(column.is_persisted),
              }
            : undefined,
        };
      }),
      primaryKey: primary
        ? { name: primary.name, columns: primary.columns }
        : undefined,
      uniqueConstraints: keys
        .filter((key) => key.type === 'UQ')
        .map(mssqlUniqueConstraint),
      indexes: groupIndexes(indexRows),
      foreignKeys: groupForeignKeys(foreignRows).map(mssqlForeignKey),
      checkConstraints: checkRows.map(mssqlCheckConstraint),
      inspection: {
        aspects: {
          columns: 'complete',
          primaryKey: 'complete',
          uniqueConstraints: 'complete',
          indexes: 'complete',
          foreignKeys: 'complete',
          checkConstraints: 'complete',
          comments: 'complete',
          viewDefinition: 'complete',
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
    const objectTypes = options.kinds
      ? options.kinds.flatMap((kind) => {
          if (kind === 'table') return ['U'];
          if (kind === 'view') return ['V'];
          return [];
        })
      : ['U', 'V'];
    if (objectTypes.length === 0) return [];

    const predicates = [
      `o.type in (${objectTypes.map(() => '?').join(', ')})`,
      'o.is_ms_shipped = 0',
    ];
    const bindings: Array<string | number> = [...objectTypes];
    if (options.schemas) {
      predicates.push(
        `s.name in (${options.schemas.map(() => '?').join(', ')})`,
      );
      bindings.push(...options.schemas);
    }
    if (after) {
      predicates.push('(s.name > ? or (s.name = ? and o.name > ?))');
      bindings.push(after.schema, after.schema, after.tableName);
    }
    if (options.tableNamePrefixes && !options.tableNamePrefixes.includes('')) {
      predicates.push(
        `(${options.tableNamePrefixes.map(() => 'left(o.name, ?) = ?').join(' or ')})`,
      );
      for (const prefix of options.tableNamePrefixes) {
        bindings.push(prefix.length, prefix);
      }
    }
    bindings.push(fetchLimit);
    const rows = mssqlRows<MssqlCollectionRow>(
      await knex.raw(
        `
          select
            o.object_id,
            s.name as schema_name,
            o.name as table_name,
            o.type as object_type,
            cast(ep.value as nvarchar(max)) as comments,
            cast(null as nvarchar(max)) as view_definition
          from sys.objects o
          join sys.schemas s on s.schema_id = o.schema_id
          left join sys.extended_properties ep
            on ep.class = 1 and ep.major_id = o.object_id
            and ep.minor_id = 0 and ep.name = 'MS_Description'
          where ${predicates.join(' and ')}
          order by s.name, o.name
          offset 0 rows fetch next ? rows only
        `,
        bindings,
      ),
    );
    return rows.map((row) => ({
      schema: row.schema_name,
      tableName: row.table_name,
      kind: row.object_type.trim() === 'V' ? 'view' : 'table',
      comment: optionalString(row.comments),
    }));
  }

  private async currentSchema(knex: Knex): Promise<string> {
    const row = mssqlRows<{ schema_name: string | null }>(
      await knex.raw('select schema_name() as schema_name'),
    )[0];
    return optionalString(row?.schema_name) ?? 'dbo';
  }

  private async findCollection(
    knex: Knex,
    schema: string,
    tableName: string,
  ): Promise<MssqlCollectionRow | undefined> {
    return mssqlRows<MssqlCollectionRow>(
      await knex.raw(
        `
          select
            o.object_id,
            s.name as schema_name,
            o.name as table_name,
            o.type as object_type,
            cast(ep.value as nvarchar(max)) as comments,
            m.definition as view_definition
          from sys.objects o
          join sys.schemas s on s.schema_id = o.schema_id
          left join sys.extended_properties ep
            on ep.class = 1 and ep.major_id = o.object_id
            and ep.minor_id = 0 and ep.name = 'MS_Description'
          left join sys.sql_modules m on m.object_id = o.object_id
          where s.name = ? and o.name = ?
            and o.type in ('U', 'V') and o.is_ms_shipped = 0
        `,
        [schema, tableName],
      ),
    )[0];
  }

  private async readColumns(
    knex: Knex,
    objectId: number,
  ): Promise<MssqlColumnRow[]> {
    return mssqlRows<MssqlColumnRow>(
      await knex.raw(
        `
          select
            c.name as column_name,
            c.column_id,
            t.name as type_name,
            schema_name(t.schema_id) as type_schema,
            t.is_user_defined,
            c.max_length,
            c.collation_name,
            c.precision,
            c.scale,
            c.is_nullable,
            dc.definition as default_definition,
            c.is_identity,
            c.is_computed,
            cc.definition as computed_definition,
            cc.is_persisted,
            cast(ep.value as nvarchar(max)) as comments
          from sys.columns c
          join sys.types t on t.user_type_id = c.user_type_id
          left join sys.default_constraints dc
            on dc.object_id = c.default_object_id
          left join sys.computed_columns cc
            on cc.object_id = c.object_id and cc.column_id = c.column_id
          left join sys.extended_properties ep
            on ep.class = 1 and ep.major_id = c.object_id
            and ep.minor_id = c.column_id and ep.name = 'MS_Description'
          where c.object_id = ?
          order by c.column_id
        `,
        [objectId],
      ),
    );
  }

  private async readKeyConstraints(
    knex: Knex,
    objectId: number,
  ): Promise<MssqlKeyConstraintRow[]> {
    return mssqlRows<MssqlKeyConstraintRow>(
      await knex.raw(
        `
          select
            kc.name as constraint_name,
            kc.type as constraint_type,
            c.name as column_name,
            ic.key_ordinal
          from sys.key_constraints kc
          join sys.index_columns ic
            on ic.object_id = kc.parent_object_id
            and ic.index_id = kc.unique_index_id
          join sys.columns c
            on c.object_id = ic.object_id and c.column_id = ic.column_id
          where kc.parent_object_id = ? and ic.key_ordinal > 0
          order by kc.name, ic.key_ordinal
        `,
        [objectId],
      ),
    );
  }

  private async readIndexes(
    knex: Knex,
    objectId: number,
  ): Promise<MssqlIndexRow[]> {
    return mssqlRows<MssqlIndexRow>(
      await knex.raw(
        `
          select
            i.name as index_name,
            i.is_unique,
            i.is_disabled,
            i.has_filter,
            i.is_primary_key,
            i.is_unique_constraint,
            i.type_desc,
            i.filter_definition,
            ic.key_ordinal,
            ic.index_column_id,
            ic.is_descending_key,
            ic.is_included_column,
            c.name as column_name
          from sys.indexes i
          join sys.index_columns ic
            on ic.object_id = i.object_id and ic.index_id = i.index_id
          join sys.columns c
            on c.object_id = ic.object_id and c.column_id = ic.column_id
          where i.object_id = ? and i.index_id > 0
            and i.is_hypothetical = 0 and i.name is not null
          order by i.name, ic.is_included_column, ic.key_ordinal, ic.index_column_id
        `,
        [objectId],
      ),
    );
  }

  private async readForeignKeys(
    knex: Knex,
    objectId: number,
  ): Promise<MssqlForeignKeyRow[]> {
    return mssqlRows<MssqlForeignKeyRow>(
      await knex.raw(
        `
          select
            fk.name as constraint_name,
            fkc.constraint_column_id,
            pc.name as column_name,
            rs.name as referenced_schema,
            rt.name as referenced_table,
            rc.name as referenced_column,
            fk.delete_referential_action_desc as delete_action,
            fk.update_referential_action_desc as update_action
          from sys.foreign_keys fk
          join sys.foreign_key_columns fkc
            on fkc.constraint_object_id = fk.object_id
          join sys.columns pc
            on pc.object_id = fkc.parent_object_id
            and pc.column_id = fkc.parent_column_id
          join sys.tables rt on rt.object_id = fkc.referenced_object_id
          join sys.schemas rs on rs.schema_id = rt.schema_id
          join sys.columns rc
            on rc.object_id = fkc.referenced_object_id
            and rc.column_id = fkc.referenced_column_id
          where fk.parent_object_id = ?
          order by fk.name, fkc.constraint_column_id
        `,
        [objectId],
      ),
    );
  }

  private async readChecks(
    knex: Knex,
    objectId: number,
  ): Promise<MssqlCheckRow[]> {
    return mssqlRows<MssqlCheckRow>(
      await knex.raw(
        `
          select name as constraint_name, definition
          from sys.check_constraints
          where parent_object_id = ?
          order by name
        `,
        [objectId],
      ),
    );
  }
}

function groupKeyConstraints(
  rows: readonly MssqlKeyConstraintRow[],
): GroupedMssqlKeyConstraint[] {
  const groups = new Map<string, MssqlKeyConstraintRow[]>();
  for (const row of rows) {
    const group = groups.get(row.constraint_name) ?? [];
    group.push(row);
    groups.set(row.constraint_name, group);
  }
  return [...groups.entries()].map(([name, entries]) => ({
    name,
    type: entries[0].constraint_type,
    columns: [...entries]
      .sort((left, right) => left.key_ordinal - right.key_ordinal)
      .map((entry) => entry.column_name),
  }));
}

function groupIndexes(rows: readonly MssqlIndexRow[]): PhysicalIndexSchema[] {
  const groups = new Map<string, MssqlIndexRow[]>();
  for (const row of rows) {
    const group = groups.get(row.index_name) ?? [];
    group.push(row);
    groups.set(row.index_name, group);
  }
  return [...groups.entries()].map(([name, entries]) => {
    const first = entries[0];
    const keys = entries
      .filter((entry) => !truthy(entry.is_included_column))
      .sort((left, right) => left.key_ordinal - right.key_ordinal)
      .map(mssqlIndexKey);
    const includeColumns = entries
      .filter((entry) => truthy(entry.is_included_column))
      .sort((left, right) => left.index_column_id - right.index_column_id)
      .map((entry) => entry.column_name);
    return {
      name,
      keys,
      includeColumns: includeColumns.length > 0 ? includeColumns : undefined,
      unique: truthy(first.is_unique),
      valid: !truthy(first.is_disabled),
      backsConstraint: truthy(first.is_primary_key)
        ? { kind: 'primaryKey', name }
        : truthy(first.is_unique_constraint)
          ? { kind: 'unique', name }
          : undefined,
      method: first.type_desc,
      predicate: optionalString(first.filter_definition),
      partial: truthy(first.has_filter),
      predicateSatisfiedByNonNullKeys: nonNullKeysSatisfyPredicate(
        first.filter_definition,
        keys,
      ),
    };
  });
}

/** SQL Server's nullable unique indexes exclude NULL keys rather than restricting business rows. */
function nonNullKeysSatisfyPredicate(
  predicate: string | null,
  keys: readonly PhysicalIndexKey[],
): boolean | undefined {
  if (!predicate) return undefined;
  const columns = new Set(keys.map((key) => key.columnName));
  const terms = predicate
    .replace(
      /\[((?:[^\]]|\]\])*)\]\s+IS\s+NOT\s+NULL/giu,
      (term, column: string) =>
        columns.has(column.replace(/\]\]/gu, ']')) ? '1' : term,
    )
    .replace(/[()\s]/gu, '');
  return /^1(?:AND1)*$/iu.test(terms) || undefined;
}

function groupForeignKeys(
  rows: readonly MssqlForeignKeyRow[],
): GroupedMssqlForeignKey[] {
  const groups = new Map<string, MssqlForeignKeyRow[]>();
  for (const row of rows) {
    const group = groups.get(row.constraint_name) ?? [];
    group.push(row);
    groups.set(row.constraint_name, group);
  }
  return [...groups.entries()].map(([name, entries]) => {
    const sorted = [...entries].sort(
      (left, right) => left.constraint_column_id - right.constraint_column_id,
    );
    return {
      name,
      columns: sorted.map((entry) => entry.column_name),
      referencedSchema: sorted[0].referenced_schema,
      referencedTable: sorted[0].referenced_table,
      referencedColumns: sorted.map((entry) => entry.referenced_column),
      onDelete: sorted[0].delete_action,
      onUpdate: sorted[0].update_action,
    };
  });
}

function mssqlUniqueConstraint(
  constraint: GroupedMssqlKeyConstraint,
): PhysicalUniqueConstraintSchema {
  return { name: constraint.name, columns: constraint.columns };
}

function mssqlForeignKey(
  constraint: GroupedMssqlForeignKey,
): PhysicalForeignKeySchema {
  return {
    name: constraint.name,
    columns: constraint.columns,
    referencedCollection: {
      schema: constraint.referencedSchema,
      tableName: constraint.referencedTable,
    },
    referencedColumns: constraint.referencedColumns,
    onDelete: normalizeReferentialAction(constraint.onDelete),
    onUpdate: normalizeReferentialAction(constraint.onUpdate),
  };
}

function mssqlCheckConstraint(
  row: MssqlCheckRow,
): PhysicalCheckConstraintSchema {
  return { name: row.constraint_name, expression: row.definition };
}

function mssqlIndexKey(row: MssqlIndexRow): PhysicalIndexKey {
  return {
    columnName: row.column_name,
    order: truthy(row.is_descending_key) ? 'desc' : 'asc',
  };
}

function mssqlNativeType(column: MssqlColumnRow): string {
  const type = column.type_name.toLowerCase();
  const length = mssqlColumnLength(column);
  if (
    ['varchar', 'nvarchar', 'char', 'nchar', 'binary', 'varbinary'].includes(
      type,
    )
  ) {
    return `${type}(${Number(column.max_length) === -1 ? 'max' : length})`;
  }
  if (['decimal', 'numeric'].includes(type)) {
    return `${type}(${Number(column.precision)},${Number(column.scale)})`;
  }
  if (['datetime2', 'datetimeoffset', 'time'].includes(type)) {
    return `${type}(${Number(column.scale)})`;
  }
  if (type === 'float') return `${type}(${Number(column.precision)})`;
  return type;
}

function mssqlColumnLength(column: MssqlColumnRow): number | undefined {
  const type = column.type_name.toLowerCase();
  if (
    !['varchar', 'nvarchar', 'char', 'nchar', 'binary', 'varbinary'].includes(
      type,
    )
  ) {
    return undefined;
  }
  const maxLength = Number(column.max_length);
  if (maxLength < 0) return undefined;
  return type.startsWith('n') ? maxLength / 2 : maxLength;
}

function mssqlPrecision(column: MssqlColumnRow): number | undefined {
  return ['decimal', 'numeric'].includes(column.type_name.toLowerCase())
    ? numberValue(column.precision)
    : undefined;
}

function mssqlScale(column: MssqlColumnRow): number | undefined {
  return ['decimal', 'numeric'].includes(column.type_name.toLowerCase())
    ? numberValue(column.scale)
    : undefined;
}

function truthy(value: boolean | number | null): boolean {
  return value === true || Number(value) === 1;
}

function mssqlRows<T extends object>(result: unknown): T[] {
  return rawRows<Record<string, unknown>>(result).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    ),
  ) as T[];
}
