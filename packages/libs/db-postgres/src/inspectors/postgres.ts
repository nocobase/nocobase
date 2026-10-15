import type { Knex } from 'knex';
import {
  numberValue,
  optionalString,
  rawRows,
  BaseSchemaInspector,
  normalizePhysicalDataType,
  normalizeReferentialAction,
  parseColumnDefault,
  temporalFractionalSecondsPrecision,
  numericCapabilities,
  PhysicalTypeNormalizationStrategy,
  PhysicalDataType,
  NumericCapabilityStrategy,
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
} from '@nocobase/db';

export const postgresTypes: PhysicalTypeNormalizationStrategy = {
  temporal: (type: string): PhysicalDataType | undefined =>
    type === 'timestamptz' || type === 'timestamp with time zone'
      ? 'datetimeTz'
      : type === 'timestamp' || type === 'timestamp without time zone'
        ? 'datetime'
        : type === 'time' || type === 'time without time zone'
          ? 'time'
          : type === 'date'
            ? 'date'
            : undefined,
  special: (type: string, base: string): PhysicalDataType | undefined =>
    base === 'bpchar'
      ? 'char'
      : type === 'char' || type === '"char"'
        ? 'native'
        : undefined,
  temporalPrecision: (
    type: string,
    temporal: string | undefined,
  ): number | undefined => {
    if (temporal === 'date') return 0;
    const explicit = type.match(/\((\d+)\)/)?.[1];
    if (/^(timetz|time(?:\(\d+\))? with time zone)$/.test(type))
      return explicit ? Number(explicit) : 6;
    return temporal ? (explicit ? Number(explicit) : 6) : undefined;
  },
} satisfies PhysicalTypeNormalizationStrategy;
export const postgresNumeric: NumericCapabilityStrategy = {
  special: (
    type: string,
    base: string,
  ): { binaryPrecision: number } | undefined =>
    base === 'float'
      ? { binaryPrecision: Number(type.match(/\((\d+)\)/)?.[1] ?? 126) }
      : undefined,
};

interface PostgresCollectionRow {
  readonly oid: string | number;
  readonly schema: string;
  readonly table_name: string;
  readonly relkind: string;
  readonly comment: string | null;
  readonly view_definition: string | null;
}

interface PostgresColumnRow {
  readonly collation: string | null;
  readonly collation_schema: string | null;
  readonly collation_oid: number;
  readonly character_set: string | null;
  readonly attnum: number;
  readonly column_name: string;
  readonly native_type: string;
  readonly native_type_name: string;
  readonly native_type_schema: string;
  readonly nullable: boolean;
  readonly default_expression: string | null;
  readonly identity_kind: string;
  readonly generated_kind: string;
  readonly comment: string | null;
}

interface PostgresConstraintRow {
  readonly constraint_name: string;
  readonly constraint_type: 'p' | 'u' | 'f' | 'c';
  readonly columns: string[];
  readonly referenced_schema: string | null;
  readonly referenced_table: string | null;
  readonly referenced_columns: string[] | null;
  readonly on_update: string;
  readonly on_delete: string;
  readonly deferrable: boolean;
  readonly initially_deferred: boolean;
  readonly check_expression: string | null;
}

interface PostgresIndexRow {
  readonly index_oid: string | number;
  readonly index_name: string;
  readonly unique: boolean;
  readonly primary: boolean;
  readonly method: string;
  readonly predicate: string | null;
  readonly key_count: number;
  readonly attribute_count: number;
  readonly attribute_numbers: string;
  readonly options: string;
  readonly collation_oids: string;
  readonly constraint_name: string | null;
  readonly constraint_type: 'p' | 'u' | null;
}

export interface PostgresSchemaInspectorOptions {
  readonly connectionName: string;
  readonly searchPath?: readonly string[];
  resolveClient(): Promise<Knex>;
}

export class PostgresSchemaInspector extends BaseSchemaInspector {
  constructor(private readonly options: PostgresSchemaInspectorOptions) {
    super(options.connectionName, 'postgres');
  }

  protected async inspectSchemas(): Promise<PhysicalSchemaInfo[]> {
    const knex = await this.options.resolveClient();
    const rows = rawRows<{ name: string }>(
      await knex.raw(`
        select n.nspname as name
        from pg_catalog.pg_namespace n
        where n.nspname !~ '^pg_'
          and n.nspname <> 'information_schema'
          and has_schema_privilege(n.oid, 'USAGE')
        order by n.nspname
      `),
    );
    const defaults = await this.defaultSchemas(knex);
    const firstDefault = defaults[0];
    return rows.map((row) => ({
      name: row.name,
      default: row.name === firstDefault,
    }));
  }

  protected async inspectCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined> {
    const knex = await this.options.resolveClient();
    if (identifier.schema) {
      await this.assertSchema(knex, identifier.schema);
    }
    const collection = await this.findCollection(knex, identifier);
    if (!collection) {
      return undefined;
    }

    const rawColumns = rawRows<PostgresColumnRow>(
      await knex.raw(
        `
          select
            a.attnum,
            a.attname as column_name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) as native_type,
            t.typname as native_type_name,
            tn.nspname as native_type_schema,
            co.collname as collation,
            cn.nspname as collation_schema,
            a.attcollation as collation_oid,
            case when t.typcategory = 'S' then current_setting('server_encoding') end as character_set,
            not a.attnotnull as nullable,
            pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) as default_expression,
            a.attidentity as identity_kind,
            a.attgenerated as generated_kind,
            pg_catalog.col_description(a.attrelid, a.attnum) as comment
          from pg_catalog.pg_attribute a
          join pg_catalog.pg_type t on t.oid = a.atttypid
          join pg_catalog.pg_namespace tn on tn.oid = t.typnamespace
          left join pg_catalog.pg_collation co on co.oid = a.attcollation
          left join pg_catalog.pg_namespace cn on cn.oid = co.collnamespace
          left join pg_catalog.pg_attrdef ad
            on ad.adrelid = a.attrelid and ad.adnum = a.attnum
          where a.attrelid = ?::oid
            and a.attnum > 0
            and not a.attisdropped
          order by a.attnum
        `,
        [collection.oid],
      ),
    );
    const constraints = await this.readConstraints(knex, collection.oid);
    const indexes = await this.readIndexes(knex, collection.oid, rawColumns);
    const primary = constraints.find(
      (constraint) => constraint.constraint_type === 'p',
    );

    return {
      schema: collection.schema,
      tableName: collection.table_name,
      kind: postgresKind(collection.relkind),
      comment: optionalString(collection.comment),
      viewDefinition: optionalString(collection.view_definition),
      columns: rawColumns.map((column) => {
        const modifiers = parseTypeModifiers(column.native_type);
        const generated = column.generated_kind !== '';
        const defaultExpression = generated
          ? undefined
          : column.default_expression;
        return {
          columnName: column.column_name,
          ordinalPosition: column.attnum,
          dataType: normalizePhysicalDataType(
            postgresTypes,
            column.native_type_name,
          ),
          nativeType: column.native_type,
          nativeTypeSchema: column.native_type_schema,
          ...numericCapabilities(postgresNumeric, column.native_type_name),
          lengthUnit:
            modifiers.length !== undefined &&
            ['bpchar', 'varchar'].includes(column.native_type_name)
              ? ('characters' as const)
              : undefined,
          collation: optionalString(column.collation),
          collationSchema: optionalString(column.collation_schema),
          characterSet: optionalString(column.character_set),
          nullable: column.nullable,
          default: parseColumnDefault(defaultExpression),
          autoIncrement:
            column.identity_kind !== '' ||
            /^nextval\(/i.test(defaultExpression ?? ''),
          length: modifiers.length,
          precision: modifiers.precision,
          scale: modifiers.scale,
          fractionalSecondsPrecision: temporalFractionalSecondsPrecision(
            postgresTypes,
            column.native_type,
          ),
          comment: optionalString(column.comment),
          generated: generated
            ? {
                expression:
                  optionalString(column.default_expression) ?? undefined,
                stored: column.generated_kind === 's',
              }
            : undefined,
        };
      }),
      primaryKey: primary
        ? {
            name: primary.constraint_name,
            columns: primary.columns,
            deferrable: primary.deferrable,
            initiallyDeferred: primary.initially_deferred,
          }
        : undefined,
      uniqueConstraints: constraints
        .filter((constraint) => constraint.constraint_type === 'u')
        .map(postgresUniqueConstraint),
      indexes,
      foreignKeys: constraints
        .filter((constraint) => constraint.constraint_type === 'f')
        .map(postgresForeignKey),
      checkConstraints: constraints
        .filter((constraint) => constraint.constraint_type === 'c')
        .flatMap(postgresCheckConstraint),
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
    const schemas = options.schemas
      ? [...options.schemas]
      : await this.defaultSchemas(knex);
    for (const schema of schemas) {
      await this.assertSchema(knex, schema);
    }
    const relkinds = options.kinds
      ? options.kinds.flatMap(postgresRelkinds)
      : ['r', 'p', 'f', 'v', 'm'];
    if (schemas.length === 0 || relkinds.length === 0) {
      return [];
    }
    const query = knex('pg_catalog.pg_class as c')
      .join('pg_catalog.pg_namespace as n', 'n.oid', 'c.relnamespace')
      .select({
        oid: 'c.oid',
        schema: 'n.nspname',
        table_name: 'c.relname',
        relkind: 'c.relkind',
      })
      .select(
        knex.raw('pg_catalog.obj_description(c.oid, ?) as comment', [
          'pg_class',
        ]),
      )
      .whereIn('n.nspname', schemas)
      .whereIn('c.relkind', relkinds)
      .whereRaw("has_schema_privilege(n.oid, 'USAGE')")
      .orderBy('n.nspname')
      .orderBy('c.relname')
      .limit(fetchLimit);
    if (after) {
      query.andWhere((builder) => {
        builder.where('n.nspname', '>', after.schema).orWhere((sameSchema) => {
          sameSchema
            .where('n.nspname', after.schema)
            .andWhere('c.relname', '>', after.tableName);
        });
      });
    }
    applyPostgresPrefixes(query, options.tableNamePrefixes);
    const rows = (await query) as PostgresCollectionRow[];
    return rows.map((row) => ({
      schema: row.schema,
      tableName: row.table_name,
      kind: postgresKind(row.relkind),
      comment: optionalString(row.comment),
    }));
  }

  private async defaultSchemas(knex: Knex): Promise<string[]> {
    if (this.options.searchPath && this.options.searchPath.length > 0) {
      return [...this.options.searchPath];
    }
    const rows = rawRows<{ schemas: unknown }>(
      await knex.raw('select current_schemas(false)::text[] as schemas'),
    );
    return parsePostgresStringArray(rows[0]?.schemas);
  }

  private async assertSchema(knex: Knex, schema: string): Promise<void> {
    const rows = rawRows<{ exists: boolean }>(
      await knex.raw(
        `
          select exists (
            select 1
            from pg_catalog.pg_namespace n
            where n.nspname = ?
              and n.nspname !~ '^pg_'
              and n.nspname <> 'information_schema'
              and has_schema_privilege(n.oid, 'USAGE')
          ) as exists
        `,
        [schema],
      ),
    );
    if (!rows[0]?.exists) {
      throw this.invalidOptions(
        `PostgreSQL schema "${schema}" does not exist or is not available for inspection.`,
        { schema },
      );
    }
  }

  private async findCollection(
    knex: Knex,
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PostgresCollectionRow | undefined> {
    const bindings: string[] = [identifier.tableName];
    let schemaPredicate = 'pg_catalog.pg_table_is_visible(c.oid)';
    if (identifier.schema) {
      schemaPredicate = 'n.nspname = ?';
      bindings.push(identifier.schema);
    }
    return rawRows<PostgresCollectionRow>(
      await knex.raw(
        `
          select
            c.oid,
            n.nspname as schema,
            c.relname as table_name,
            c.relkind,
            pg_catalog.obj_description(c.oid, 'pg_class') as comment,
            case when c.relkind in ('v', 'm')
              then pg_catalog.pg_get_viewdef(c.oid, true)
              else null
            end as view_definition
          from pg_catalog.pg_class c
          join pg_catalog.pg_namespace n on n.oid = c.relnamespace
          where c.relname = ?
            and ${schemaPredicate}
            and c.relkind in ('r', 'p', 'f', 'v', 'm')
            and n.nspname !~ '^pg_'
            and n.nspname <> 'information_schema'
            and has_schema_privilege(n.oid, 'USAGE')
          limit 1
        `,
        bindings,
      ),
    )[0];
  }

  private async readConstraints(
    knex: Knex,
    collectionOid: string | number,
  ): Promise<PostgresConstraintRow[]> {
    const rows = rawRows<PostgresConstraintRow>(
      await knex.raw(
        `
          select
            con.conname as constraint_name,
            con.contype as constraint_type,
            coalesce(array(
              select a.attname::text
              from unnest(con.conkey) with ordinality as keys(attnum, position)
              join pg_catalog.pg_attribute a
                on a.attrelid = con.conrelid and a.attnum = keys.attnum
              order by keys.position
            ), array[]::text[]) as columns,
            rn.nspname as referenced_schema,
            rc.relname as referenced_table,
            case when con.contype = 'f' then array(
              select a.attname::text
              from unnest(con.confkey) with ordinality as keys(attnum, position)
              join pg_catalog.pg_attribute a
                on a.attrelid = con.confrelid and a.attnum = keys.attnum
              order by keys.position
            ) else null end as referenced_columns,
            con.confupdtype as on_update,
            con.confdeltype as on_delete,
            con.condeferrable as deferrable,
            con.condeferred as initially_deferred,
            case when con.contype = 'c'
              then pg_catalog.pg_get_expr(con.conbin, con.conrelid)
              else null
            end as check_expression
          from pg_catalog.pg_constraint con
          left join pg_catalog.pg_class rc on rc.oid = con.confrelid
          left join pg_catalog.pg_namespace rn on rn.oid = rc.relnamespace
          where con.conrelid = ?::oid
            and con.contype in ('p', 'u', 'f', 'c')
          order by con.conname
        `,
        [collectionOid],
      ),
    );
    return rows.map((row) => ({
      ...row,
      columns: parsePostgresStringArray(row.columns),
      referenced_columns:
        row.referenced_columns === null
          ? null
          : parsePostgresStringArray(row.referenced_columns),
    }));
  }

  private async readIndexes(
    knex: Knex,
    collectionOid: string | number,
    columns: readonly PostgresColumnRow[],
  ): Promise<PhysicalIndexSchema[]> {
    const rows = rawRows<PostgresIndexRow>(
      await knex.raw(
        `
          select
            i.indexrelid as index_oid,
            ic.relname as index_name,
            i.indisunique as unique,
            i.indisprimary as primary,
            am.amname as method,
            pg_catalog.pg_get_expr(i.indpred, i.indrelid) as predicate,
            i.indnkeyatts as key_count,
            i.indnatts as attribute_count,
            i.indkey::text as attribute_numbers,
            i.indoption::text as options,
            i.indcollation::text as collation_oids,
            con.conname as constraint_name,
            con.contype as constraint_type
          from pg_catalog.pg_index i
          join pg_catalog.pg_class ic on ic.oid = i.indexrelid
          join pg_catalog.pg_am am on am.oid = ic.relam
          left join pg_catalog.pg_constraint con on con.conindid = i.indexrelid
          where i.indrelid = ?::oid
          order by ic.relname
        `,
        [collectionOid],
      ),
    );
    const columnNames = new Map(
      columns.map((column) => [column.attnum, column.column_name]),
    );
    const columnCollations = new Map(
      columns.map((column) => [column.attnum, Number(column.collation_oid)]),
    );
    const indexes: PhysicalIndexSchema[] = [];
    for (const row of rows) {
      const attributeNumbers = parsePostgresVector(row.attribute_numbers);
      const indexOptions = parsePostgresVector(row.options);
      const indexCollations = parsePostgresVector(row.collation_oids);
      const keyCount = Number(row.key_count);
      const keys: PhysicalIndexKey[] = [];
      const includeColumns: string[] = [];
      for (
        let position = 0;
        position < attributeNumbers.length;
        position += 1
      ) {
        const attributeNumber = attributeNumbers[position];
        if (position >= keyCount) {
          const name = columnNames.get(attributeNumber);
          if (name) {
            includeColumns.push(name);
          }
          continue;
        }
        const option = indexOptions[position] ?? 0;
        const order = (option & 1) === 1 ? 'desc' : 'asc';
        const nulls = (option & 2) === 2 ? 'first' : 'last';
        const columnName = columnNames.get(attributeNumber);
        if (attributeNumber !== 0 && columnName) {
          keys.push({
            columnName,
            order,
            nulls,
            ...(indexCollations[position] ===
            columnCollations.get(attributeNumber)
              ? {}
              : { columnEquality: false }),
          });
          continue;
        }
        const definition = rawRows<{ definition: string }>(
          await knex.raw(
            'select pg_catalog.pg_get_indexdef(?::oid, ?, true) as definition',
            [row.index_oid, position + 1],
          ),
        )[0]?.definition;
        keys.push({
          expression: stripPostgresIndexOrdering(definition ?? '<unavailable>'),
          order,
          nulls,
        });
      }
      indexes.push({
        name: row.index_name,
        keys,
        includeColumns: includeColumns.length > 0 ? includeColumns : undefined,
        unique: row.unique,
        backsConstraint:
          row.constraint_type === 'p' || row.constraint_type === 'u'
            ? {
                kind: row.constraint_type === 'p' ? 'primaryKey' : 'unique',
                name: optionalString(row.constraint_name),
              }
            : undefined,
        method: row.method,
        predicate: optionalString(row.predicate),
      });
    }
    return indexes;
  }
}

function postgresKind(relkind: string): PhysicalCollectionKind {
  switch (relkind) {
    case 'r':
      return 'table';
    case 'p':
      return 'partitionedTable';
    case 'f':
      return 'foreignTable';
    case 'v':
      return 'view';
    case 'm':
      return 'materializedView';
    default:
      throw new Error(`Unsupported PostgreSQL relkind "${relkind}".`);
  }
}

function postgresRelkinds(kind: PhysicalCollectionKind): string[] {
  switch (kind) {
    case 'table':
      return ['r'];
    case 'partitionedTable':
      return ['p'];
    case 'foreignTable':
      return ['f'];
    case 'view':
      return ['v'];
    case 'materializedView':
      return ['m'];
    default:
      return [];
  }
}

function postgresUniqueConstraint(
  row: PostgresConstraintRow,
): PhysicalUniqueConstraintSchema {
  return {
    name: row.constraint_name,
    columns: row.columns,
    deferrable: row.deferrable,
    initiallyDeferred: row.initially_deferred,
  };
}

function postgresForeignKey(
  row: PostgresConstraintRow,
): PhysicalForeignKeySchema {
  return {
    name: row.constraint_name,
    columns: row.columns,
    referencedCollection: {
      schema: row.referenced_schema as string,
      tableName: row.referenced_table as string,
    },
    referencedColumns: row.referenced_columns ?? [],
    onDelete: normalizeReferentialAction(row.on_delete),
    onUpdate: normalizeReferentialAction(row.on_update),
    deferrable: row.deferrable,
    initiallyDeferred: row.initially_deferred,
  };
}

function postgresCheckConstraint(
  row: PostgresConstraintRow,
): PhysicalCheckConstraintSchema[] {
  return row.check_expression
    ? [{ name: row.constraint_name, expression: row.check_expression }]
    : [];
}

function applyPostgresPrefixes(
  query: Knex.QueryBuilder,
  prefixes: readonly string[] | undefined,
): void {
  if (!prefixes || prefixes.includes('')) {
    return;
  }
  query.andWhere((builder) => {
    for (const prefix of prefixes) {
      builder.orWhereRaw('left(c.relname, ?) = ?', [prefix.length, prefix]);
    }
  });
}

function parsePostgresVector(value: string): number[] {
  const text = value.trim();
  return text === '' ? [] : text.split(/\s+/).map(Number);
}

function parsePostgresStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const parsed = optionalString(item);
      return parsed === undefined ? [] : [parsed];
    });
  }
  if (value === null || value === undefined || value === '') {
    return [];
  }
  const text = optionalString(value);
  if (!text) {
    return [];
  }
  if (!text.startsWith('{') || !text.endsWith('}')) {
    return [text];
  }
  return text
    .slice(1, -1)
    .split(',')
    .map((item) => item.replace(/^"|"$/g, '').replaceAll('\\"', '"'));
}

function stripPostgresIndexOrdering(value: string): string {
  return value
    .replace(/\s+(ASC|DESC)\b/gi, '')
    .replace(/\s+NULLS\s+(FIRST|LAST)\b/gi, '')
    .trim();
}

function parseTypeModifiers(nativeType: string): {
  length?: number;
  precision?: number;
  scale?: number;
} {
  const match = nativeType.match(/\((\d+)(?:,(\d+))?\)/);
  if (
    temporalFractionalSecondsPrecision(postgresTypes, nativeType) !== undefined
  )
    return {};
  if (!match) {
    return {};
  }
  const first = numberValue(match[1]);
  const second = numberValue(match[2]);
  if (/^(numeric|decimal)/i.test(nativeType)) {
    return { precision: first, scale: second };
  }
  return { length: first };
}
