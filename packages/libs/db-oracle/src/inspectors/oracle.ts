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
  PhysicalCollectionKind,
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

export const oracleTypes: PhysicalTypeNormalizationStrategy = {
  temporal: (type: string): PhysicalDataType | undefined =>
    type === 'date'
      ? 'datetime'
      : type === 'timestamp with time zone' ||
          type === 'timestamp with local time zone'
        ? 'datetimeTz'
        : type === 'timestamp'
          ? 'datetime'
          : undefined,
  special: (_type: string, base: string): PhysicalDataType | undefined =>
    base === 'float' ? 'decimal' : undefined,
  temporalPrecision: (
    type: string,
    temporal: string | undefined,
  ): number | undefined =>
    temporal
      ? type === 'date'
        ? 0
        : type.match(/\((\d+)\)/)?.[1]
          ? Number(type.match(/\((\d+)\)/)![1])
          : 6
      : undefined,
};
export const oracleNumeric: NumericCapabilityStrategy = {
  special: (
    _type: string,
    base: string,
  ): { binaryPrecision: number } | undefined =>
    base === 'binary_float'
      ? { binaryPrecision: 24 }
      : base === 'binary_double'
        ? { binaryPrecision: 53 }
        : base === 'float'
          ? { binaryPrecision: 126 }
          : undefined,
};

interface OracleCollectionRow {
  readonly schema_name: string;
  readonly table_name: string;
  readonly object_kind:
    'TABLE' | 'PARTITIONED TABLE' | 'VIEW' | 'MATERIALIZED VIEW';
  readonly comments: string | null;
}

interface OracleColumnRow {
  readonly column_name: string;
  readonly column_id: number;
  readonly data_type: string;
  readonly data_type_owner: string | null;
  readonly data_length: number | null;
  readonly char_length: number | null;
  readonly char_used: string | null;
  readonly data_precision: number | null;
  readonly data_scale: number | null;
  readonly nullable: 'Y' | 'N';
  readonly identity_column: 'YES' | 'NO';
  readonly virtual_column: 'YES' | 'NO';
  readonly comments: string | null;
}

interface OracleColumnDefaultRow {
  readonly column_name: string;
  readonly data_default: string | null;
}

interface OracleConstraintRow {
  readonly constraint_name: string;
  readonly constraint_type: 'P' | 'U' | 'R' | 'C';
  readonly column_name: string;
  readonly position: number;
  readonly referenced_owner: string | null;
  readonly referenced_table: string | null;
  readonly referenced_column: string | null;
  readonly delete_rule: string | null;
  readonly deferrable: 'DEFERRABLE' | 'NOT DEFERRABLE';
  readonly deferred: 'DEFERRED' | 'IMMEDIATE';
  readonly status: string;
  readonly validated: string;
  readonly search_condition: string | null;
}

interface OracleIndexRow {
  readonly index_name: string;
  readonly uniqueness: 'UNIQUE' | 'NONUNIQUE';
  readonly index_type: string;
  readonly valid: number;
  readonly column_position: number;
  readonly column_name: string | null;
  readonly data_type: string | null;
  readonly collation: string | null;
  readonly column_expression: string | null;
  readonly descend: 'ASC' | 'DESC';
  readonly constraint_name: string | null;
  readonly constraint_type: 'P' | 'U' | null;
}

interface OracleViewDefinitionRow {
  readonly definition: string | null;
  readonly definition_length: number | null;
}

interface OracleCollectionQueryOptions {
  readonly tableName?: string;
  readonly objectKinds?: readonly OracleCollectionRow['object_kind'][];
  readonly afterTableName?: string;
  readonly tableNamePrefixes?: readonly string[];
  readonly limit?: number;
}

interface GroupedOracleConstraint {
  readonly name: string;
  readonly type: OracleConstraintRow['constraint_type'];
  readonly columns: readonly string[];
  readonly referencedSchema?: string;
  readonly referencedTable?: string;
  readonly referencedColumns: readonly string[];
  readonly onDelete?: string;
  readonly deferrable: boolean;
  readonly initiallyDeferred: boolean;
  readonly valid: boolean;
  readonly checkExpression?: string;
}

export interface OracleSchemaInspectorOptions {
  readonly connectionName: string;
  resolveClient(): Promise<Knex>;
}

export class OracleSchemaInspector extends BaseSchemaInspector {
  constructor(private readonly options: OracleSchemaInspectorOptions) {
    super(options.connectionName, 'oracle');
  }

  protected async inspectSchemas(): Promise<PhysicalSchemaInfo[]> {
    const knex = await this.options.resolveClient();
    return [{ name: await this.currentSchema(knex), default: true }];
  }

  protected async inspectCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined> {
    const knex = await this.options.resolveClient();
    const schema = await this.resolveSchema(knex, identifier.schema);
    const collection = await this.findCollection(
      knex,
      schema,
      identifier.tableName,
    );
    if (!collection) {
      return undefined;
    }

    const columns = oracleRows<OracleColumnRow>(
      await knex.raw(
        `
          select
            c.column_name,
            c.column_id,
            c.data_type,
            c.data_type_owner,
            c.data_length,
            c.char_length,
            c.char_used,
            c.data_precision,
            c.data_scale,
            c.nullable,
            c.identity_column,
            c.virtual_column,
            cc.comments
          from user_tab_cols c
          left join user_col_comments cc
            on cc.table_name = c.table_name
            and cc.column_name = c.column_name
          where c.table_name = ?
            and c.hidden_column = 'NO'
          order by c.column_id
        `,
        [collection.table_name],
      ),
    );
    const defaultResult = await this.readColumnDefaults(
      knex,
      collection.table_name,
    );
    const defaults = new Map(
      defaultResult.rows.map((row) => [
        row.column_name,
        optionalString(row.data_default),
      ]),
    );
    const constraints = await this.readConstraints(knex, collection.table_name);
    const indexes = await this.readIndexes(knex, collection.table_name);
    const primary = constraints.find((constraint) => constraint.type === 'P');
    const knexAutoIncrementColumns = await this.readKnexAutoIncrementColumns(
      knex,
      collection.table_name,
      primary?.columns ?? [],
    );
    const warnings: SchemaInspectionWarning[] = [...defaultResult.warnings];
    const checkConstraints = constraints
      .filter((constraint) => constraint.type === 'C')
      .flatMap(oracleCheckConstraint);
    if (
      constraints.some(
        (constraint) => constraint.type === 'C' && !constraint.checkExpression,
      )
    ) {
      warnings.push({
        code: 'ORACLE_CHECK_EXPRESSION_PARTIAL',
        message: 'Oracle did not expose every check constraint expression.',
        aspect: 'checkConstraints',
      });
    }
    const viewResult = await this.readViewDefinition(
      knex,
      schema,
      collection.table_name,
      oracleKind(collection.object_kind),
    );
    warnings.push(...viewResult.warnings);

    return {
      schema,
      tableName: collection.table_name,
      kind: oracleKind(collection.object_kind),
      comment: optionalString(collection.comments),
      viewDefinition: viewResult.definition,
      columns: columns.map((column) => {
        const precision = numberValue(column.data_precision);
        const scale = numberValue(column.data_scale);
        const nativeType = oracleNativeType(column);
        const generated = column.virtual_column === 'YES';
        const defaultExpression = defaults.get(column.column_name);
        return {
          columnName: column.column_name,
          ordinalPosition: Number(column.column_id),
          dataType: normalizePhysicalDataType(oracleTypes, column.data_type),
          nativeType,
          ...numericCapabilities(oracleNumeric, nativeType),
          lengthUnit:
            column.char_used === 'B'
              ? ('bytes' as const)
              : column.char_used === 'C'
                ? ('characters' as const)
                : undefined,
          maxByteLength: /^(N?VARCHAR2|N?CHAR)$/i.test(column.data_type)
            ? numberValue(column.data_length)
            : undefined,
          nativeTypeSchema: optionalString(column.data_type_owner),
          nullable: column.nullable === 'Y',
          default: generated
            ? undefined
            : parseColumnDefault(defaultExpression),
          autoIncrement:
            column.identity_column === 'YES' ||
            knexAutoIncrementColumns.has(column.column_name),
          length: oracleColumnLength(column),
          precision:
            column.data_type.toUpperCase() !== 'FLOAT' &&
            temporalFractionalSecondsPrecision(oracleTypes, nativeType) ===
              undefined
              ? precision
              : undefined,
          scale:
            temporalFractionalSecondsPrecision(oracleTypes, nativeType) ===
            undefined
              ? scale
              : undefined,
          fractionalSecondsPrecision: temporalFractionalSecondsPrecision(
            oracleTypes,
            nativeType,
          ),
          comment: optionalString(column.comments),
          generated: generated
            ? { expression: defaultExpression, stored: false }
            : undefined,
        };
      }),
      primaryKey: primary
        ? {
            name: primary.name,
            columns: primary.columns,
            deferrable: primary.deferrable,
            initiallyDeferred: primary.initiallyDeferred,
            valid: primary.valid,
          }
        : undefined,
      uniqueConstraints: constraints
        .filter((constraint) => constraint.type === 'U')
        .map(oracleUniqueConstraint),
      indexes,
      foreignKeys: constraints
        .filter((constraint) => constraint.type === 'R')
        .map(oracleForeignKey),
      checkConstraints,
      inspection: {
        aspects: {
          columns: defaultResult.status,
          primaryKey: 'complete',
          uniqueConstraints: 'complete',
          indexes: 'complete',
          foreignKeys: 'complete',
          checkConstraints: warnings.some(
            (warning) => warning.aspect === 'checkConstraints',
          )
            ? 'partial'
            : 'complete',
          comments: 'complete',
          viewDefinition: viewResult.status,
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
    const schema = await this.currentSchema(knex);
    if (options.schemas) {
      for (const requested of options.schemas) {
        this.assertCurrentSchema(requested, schema);
      }
    }
    if (after && after.schema !== schema) {
      return [];
    }
    const kinds = options.kinds ?? [
      'table',
      'partitionedTable',
      'view',
      'materializedView',
    ];
    const objectKinds = kinds.flatMap(oracleObjectKinds);
    if (objectKinds.length === 0) {
      return [];
    }

    const rows = await this.listCollections(knex, schema, {
      objectKinds,
      afterTableName: after?.tableName,
      tableNamePrefixes: options.tableNamePrefixes,
      limit: fetchLimit,
    });
    return rows.map((row) => ({
      schema: row.schema_name,
      tableName: row.table_name,
      kind: oracleKind(row.object_kind),
      comment: optionalString(row.comments),
    }));
  }

  private async currentSchema(knex: Knex): Promise<string> {
    const row = oracleRows<{ schema_name: string }>(
      await knex.raw(`select user as schema_name from dual`),
    )[0];
    const schema = optionalString(row?.schema_name);
    if (!schema) {
      throw this.invalidOptions(
        'Oracle SchemaInspector could not resolve the current schema.',
      );
    }
    return schema;
  }

  private async resolveSchema(
    knex: Knex,
    requested: string | undefined,
  ): Promise<string> {
    const current = await this.currentSchema(knex);
    if (requested !== undefined) {
      this.assertCurrentSchema(requested, current);
    }
    return current;
  }

  private assertCurrentSchema(requested: string, current: string): void {
    if (requested !== current) {
      throw this.invalidOptions(
        `Oracle SchemaInspector currently supports only the current schema "${current}", received "${requested}".`,
        { schema: requested },
      );
    }
  }

  private async findCollection(
    knex: Knex,
    schema: string,
    tableName: string,
  ): Promise<OracleCollectionRow | undefined> {
    return (
      await this.listCollections(knex, schema, { tableName, limit: 1 })
    )[0];
  }

  private async listCollections(
    knex: Knex,
    schema: string,
    options: OracleCollectionQueryOptions = {},
  ): Promise<OracleCollectionRow[]> {
    const conditions: string[] = [];
    const bindings: string[] = [schema];
    if (options.tableName !== undefined) {
      conditions.push('objects.table_name = ?');
      bindings.push(options.tableName);
    }
    if (options.objectKinds?.length) {
      conditions.push(
        `objects.object_kind in (${options.objectKinds.map(() => '?').join(', ')})`,
      );
      bindings.push(...options.objectKinds);
    }
    if (options.afterTableName !== undefined) {
      conditions.push('objects.table_name > ?');
      bindings.push(options.afterTableName);
    }
    if (options.tableNamePrefixes && !options.tableNamePrefixes.includes('')) {
      conditions.push(
        `(${options.tableNamePrefixes
          .map(() => `objects.table_name like ? escape '\\'`)
          .join(' or ')})`,
      );
      bindings.push(
        ...options.tableNamePrefixes.map(
          (prefix) => `${escapeOracleLike(prefix)}%`,
        ),
      );
    }
    if (
      options.limit !== undefined &&
      (!Number.isSafeInteger(options.limit) || options.limit < 1)
    ) {
      throw this.invalidOptions(
        'Oracle collection query limit must be positive.',
      );
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    const rowLimit =
      options.limit === undefined
        ? ''
        : `fetch first ${options.limit} rows only`;
    return oracleRows<OracleCollectionRow>(
      await knex.raw(
        `
          select
            ? as schema_name,
            objects.table_name,
            objects.object_kind,
            comments.comments
          from (
            select
              t.table_name,
              case when t.partitioned = 'YES'
                then 'PARTITIONED TABLE'
                else 'TABLE'
              end as object_kind
            from user_tables t
            where t.nested = 'NO'
              and t.secondary = 'N'
              and t.dropped = 'NO'
              and not exists (
                select 1 from user_mviews m where m.mview_name = t.table_name
              )
            union all
            select v.view_name as table_name, 'VIEW' as object_kind
            from user_views v
            union all
            select m.mview_name as table_name, 'MATERIALIZED VIEW' as object_kind
            from user_mviews m
          ) objects
          left join user_tab_comments comments
            on comments.table_name = objects.table_name
          ${where}
          order by objects.table_name
          ${rowLimit}
        `,
        bindings,
      ),
    );
  }

  private async readColumnDefaults(
    knex: Knex,
    tableName: string,
  ): Promise<{
    rows: OracleColumnDefaultRow[];
    status: 'complete' | 'partial';
    warnings: SchemaInspectionWarning[];
  }> {
    const escapedTableName = tableName.replaceAll("'", "''");
    try {
      const rows = oracleRows<OracleColumnDefaultRow>(
        await knex.raw(`
          select column_name, data_default
          from xmltable(
            '/ROWSET/ROW'
            passing dbms_xmlgen.getXMLType(
              'select column_name, data_default
               from user_tab_cols
               where table_name = ''${escapedTableName}''
                 and hidden_column = ''NO''
               order by column_id'
            )
            columns
              column_name varchar2(128) path 'COLUMN_NAME',
              data_default varchar2(4000) path 'DATA_DEFAULT'
          )
        `),
      );
      return { rows, status: 'complete', warnings: [] };
    } catch (error: unknown) {
      if (!isUnavailableOracleMetadataApi(error)) {
        throw error;
      }
      return {
        rows: [],
        status: 'partial',
        warnings: [
          {
            code: 'ORACLE_COLUMN_DEFAULT_PARTIAL',
            message:
              'Oracle column defaults could not be read through DBMS_XMLGEN.',
            aspect: 'columns',
          },
        ],
      };
    }
  }

  private async readConstraints(
    knex: Knex,
    tableName: string,
  ): Promise<GroupedOracleConstraint[]> {
    const rows = oracleRows<OracleConstraintRow>(
      await knex.raw(
        `
          select
            c.constraint_name,
            c.constraint_type,
            cc.column_name,
            cc.position,
            rc.owner as referenced_owner,
            rc.table_name as referenced_table,
            rcc.column_name as referenced_column,
            c.delete_rule,
            c.deferrable,
            c.deferred,
            c.status,
            c.validated,
            c.search_condition_vc as search_condition
          from user_constraints c
          join user_cons_columns cc
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
        [tableName],
      ),
    );
    return groupOracleConstraints(rows).filter(
      (constraint) =>
        constraint.type !== 'C' || !isOracleNotNullConstraint(constraint),
    );
  }

  private async readIndexes(
    knex: Knex,
    tableName: string,
  ): Promise<PhysicalIndexSchema[]> {
    const rows = oracleRows<OracleIndexRow>(
      await knex.raw(
        `
          select
            i.index_name,
            i.uniqueness,
            i.index_type,
            case
              when i.partitioned = 'NO' and i.status = 'VALID' then 1
              when i.partitioned = 'YES'
                and exists (
                  select 1 from user_ind_partitions p
                  where p.index_name = i.index_name
                )
                and not exists (
                  select 1 from user_ind_partitions p
                  left join user_ind_subpartitions s
                    on s.index_name = p.index_name
                    and s.partition_name = p.partition_name
                  where p.index_name = i.index_name
                    and nvl(case p.composite
                      when 'YES' then s.status
                      when 'NO' then p.status
                    end, 'UNUSABLE') <> 'USABLE'
                ) then 1
              else 0
            end as valid,
            ic.column_position,
            ic.column_name,
            tc.data_type,
            tc.collation,
            ie.column_expression,
            ic.descend,
            c.constraint_name,
            c.constraint_type
          from user_indexes i
          join user_ind_columns ic
            on ic.index_name = i.index_name
          left join user_tab_cols tc
            on tc.table_name = ic.table_name
            and tc.column_name = ic.column_name
          left join user_ind_expressions ie
            on ie.index_name = ic.index_name
            and ie.column_position = ic.column_position
          left join user_constraints c
            on c.index_name = i.index_name
            and c.table_name = i.table_name
            and c.constraint_type in ('P', 'U')
          where i.table_name = ?
          order by i.index_name, ic.column_position
        `,
        [tableName],
      ),
    );
    const groups = new Map<string, OracleIndexRow[]>();
    for (const row of rows) {
      const group = groups.get(row.index_name) ?? [];
      group.push(row);
      groups.set(row.index_name, group);
    }
    return [...groups.entries()].map(([name, entries]) => {
      // Joining constraints repeats each key when several constraints share an index.
      const keys = new Map<number, OracleIndexRow>();
      const constraints = new Map<
        string,
        NonNullable<PhysicalIndexSchema['backsConstraint']>
      >();
      for (const entry of entries) {
        keys.set(entry.column_position, entry);
        if (entry.constraint_type === 'P' || entry.constraint_type === 'U') {
          constraints.set(`${entry.constraint_type}:${entry.constraint_name}`, {
            kind: entry.constraint_type === 'P' ? 'primaryKey' : 'unique',
            name: optionalString(entry.constraint_name),
          });
        }
      }
      const references = [...constraints.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, reference]) => reference);
      return {
        name,
        keys: [...keys.values()]
          .sort((left, right) => left.column_position - right.column_position)
          .map(oracleIndexKey),
        unique: entries[0].uniqueness === 'UNIQUE',
        // Partitioned indexes report N/A at the index level; inspect their leaves.
        valid: numberValue(entries[0].valid) === 1,
        backsConstraint: references[0],
        backsConstraints: references.length > 1 ? references : undefined,
        method: entries[0].index_type,
      };
    });
  }

  private async readKnexAutoIncrementColumns(
    knex: Knex,
    tableName: string,
    primaryColumns: readonly string[],
  ): Promise<ReadonlySet<string>> {
    if (primaryColumns.length !== 1) {
      return new Set();
    }
    const triggers = oracleRows<{ trigger_name: string }>(
      await knex.raw(
        `
          select trigger_name
          from user_triggers
          where table_name = ?
            and status = 'ENABLED'
            and triggering_event like '%INSERT%'
        `,
        [tableName],
      ),
    );
    return triggers.some((trigger) =>
      trigger.trigger_name.toLowerCase().endsWith('_autoinc_trg'),
    )
      ? new Set(primaryColumns)
      : new Set();
  }

  private async readViewDefinition(
    knex: Knex,
    schema: string,
    tableName: string,
    kind: PhysicalCollectionKind,
  ): Promise<{
    definition?: string;
    status: 'complete' | 'partial' | 'unsupported';
    warnings: SchemaInspectionWarning[];
  }> {
    if (kind !== 'view' && kind !== 'materializedView') {
      return { status: 'complete', warnings: [] };
    }
    const objectType = kind === 'view' ? 'VIEW' : 'MATERIALIZED_VIEW';
    // Ordinary view SQL is already in the catalog; GET_DDL reconstructs it
    // through Oracle's substantially more expensive metadata machinery.
    const rows = oracleRows<OracleViewDefinitionRow>(
      kind === 'view'
        ? await knex.raw(
            `select text_vc as definition, text_length as definition_length
             from user_views where view_name = ?`,
            [tableName],
          )
        : await knex.raw(
            `
          select
            dbms_lob.substr(ddl, 4000, 1) as definition,
            dbms_lob.getlength(ddl) as definition_length
          from (
            select dbms_metadata.get_ddl(?, ?, ?) as ddl from dual
          )
        `,
            [objectType, tableName, schema],
          ),
    );
    const rawDefinition = optionalString(rows[0]?.definition);
    const definition =
      kind === 'view'
        ? rawDefinition
        : rawDefinition?.match(/\bAS\s+([\s\S]+)$/iu)?.[1]?.trim();
    const truncated = Number(rows[0]?.definition_length ?? 0) > 4000;
    return {
      definition: definition ?? rawDefinition,
      status: truncated ? 'partial' : 'complete',
      warnings: truncated
        ? [
            {
              code: 'ORACLE_VIEW_DEFINITION_TRUNCATED',
              message:
                'Oracle view definition exceeded 4000 characters and was truncated.',
              aspect: 'viewDefinition',
            },
          ]
        : [],
    };
  }
}

function oracleRows<T extends object>(result: unknown): T[] {
  return rawRows<Record<string, unknown>>(result).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    ),
  ) as T[];
}

function oracleKind(
  kind: OracleCollectionRow['object_kind'],
): PhysicalCollectionKind {
  switch (kind) {
    case 'TABLE':
      return 'table';
    case 'PARTITIONED TABLE':
      return 'partitionedTable';
    case 'VIEW':
      return 'view';
    case 'MATERIALIZED VIEW':
      return 'materializedView';
  }
}

function oracleObjectKinds(
  kind: PhysicalCollectionKind,
): OracleCollectionRow['object_kind'][] {
  switch (kind) {
    case 'table':
      return ['TABLE'];
    case 'partitionedTable':
      return ['PARTITIONED TABLE'];
    case 'view':
      return ['VIEW'];
    case 'materializedView':
      return ['MATERIALIZED VIEW'];
    case 'foreignTable':
      return [];
  }
}

function escapeOracleLike(value: string): string {
  return value.replace(/[\\%_]/gu, (character) => `\\${character}`);
}

function isUnavailableOracleMetadataApi(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === 'string' &&
    /ORA-01031|ORA-06550|PLS-00201|ORA-00904|ORA-00942/iu.test(message)
  );
}

function oracleNativeType(column: OracleColumnRow): string {
  const type = column.data_type;
  const precision = numberValue(column.data_precision);
  const scale = numberValue(column.data_scale);
  if (type.toUpperCase() === 'FLOAT')
    return precision === undefined ? type : `${type}(${precision})`;
  if (precision !== undefined) {
    return scale === undefined
      ? `${type}(${precision})`
      : `${type}(${precision},${scale})`;
  }
  const length = oracleColumnLength(column);
  return length !== undefined && /^(N?VARCHAR2|N?CHAR|RAW)$/iu.test(type)
    ? `${type}(${length}${/^(VARCHAR2|CHAR)$/i.test(type) && column.char_used ? (column.char_used === 'B' ? ' BYTE' : ' CHAR') : ''})`
    : type;
}

function oracleColumnLength(column: OracleColumnRow): number | undefined {
  return /^(N?VARCHAR2|N?CHAR)$/iu.test(column.data_type)
    ? numberValue(
        column.char_used === 'B' ? column.data_length : column.char_length,
      )
    : undefined;
}

function groupOracleConstraints(
  rows: readonly OracleConstraintRow[],
): GroupedOracleConstraint[] {
  const groups = new Map<string, OracleConstraintRow[]>();
  for (const row of rows) {
    const key = `${row.constraint_type}:${row.constraint_name}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const sorted = [...group].sort(
      (left, right) => left.position - right.position,
    );
    return {
      name: sorted[0].constraint_name,
      type: sorted[0].constraint_type,
      columns: sorted.map((row) => row.column_name),
      referencedSchema: optionalString(sorted[0].referenced_owner),
      referencedTable: optionalString(sorted[0].referenced_table),
      referencedColumns: sorted.flatMap((row) =>
        row.referenced_column ? [row.referenced_column] : [],
      ),
      onDelete: optionalString(sorted[0].delete_rule),
      deferrable: sorted[0].deferrable === 'DEFERRABLE',
      initiallyDeferred: sorted[0].deferred === 'DEFERRED',
      valid:
        sorted[0].status === 'ENABLED' && sorted[0].validated === 'VALIDATED',
      checkExpression: optionalString(sorted[0].search_condition),
    };
  });
}

function isOracleNotNullConstraint(
  constraint: GroupedOracleConstraint,
): boolean {
  if (!constraint.checkExpression || constraint.columns.length !== 1) {
    return false;
  }
  const normalized = constraint.checkExpression
    .replaceAll('"', '')
    .replace(/\s+/gu, ' ')
    .trim()
    .toUpperCase();
  return normalized === `${constraint.columns[0].toUpperCase()} IS NOT NULL`;
}

function oracleUniqueConstraint(
  constraint: GroupedOracleConstraint,
): PhysicalUniqueConstraintSchema {
  return {
    name: constraint.name,
    columns: constraint.columns,
    deferrable: constraint.deferrable,
    initiallyDeferred: constraint.initiallyDeferred,
    valid: constraint.valid,
  };
}

function oracleForeignKey(
  constraint: GroupedOracleConstraint,
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
    onUpdate: 'noAction',
    deferrable: constraint.deferrable,
    initiallyDeferred: constraint.initiallyDeferred,
  };
}

function oracleCheckConstraint(
  constraint: GroupedOracleConstraint,
): PhysicalCheckConstraintSchema[] {
  return constraint.checkExpression
    ? [{ name: constraint.name, expression: constraint.checkExpression }]
    : [];
}

function oracleIndexKey(row: OracleIndexRow): PhysicalIndexKey {
  const order = row.descend === 'DESC' ? 'desc' : 'asc';
  const expression = optionalString(row.column_expression);
  // Session-dependent collations can broaden WHERE equality without changing
  // the index's uniqueness. Never cache a proof from the inspecting session.
  const columnEquality =
    typeof row.data_type === 'string' &&
    (!/^(N?VARCHAR2?|N?CHAR|LONG|N?CLOB)$/i.test(row.data_type) ||
      row.collation === 'BINARY');
  return expression
    ? { expression, order }
    : {
        columnName: row.column_name as string,
        order,
        ...(columnEquality ? {} : { columnEquality: false }),
      };
}
