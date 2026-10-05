import type { Knex } from 'knex';

import { encodeJsonValue, type JsonValue } from '../../../json.js';
import type { DatabaseCapabilities, SchemaAdapter } from '../../adapter.js';
import type { DatabaseDriverRuntime } from '../../../database/runtime.js';
import type {
  ColumnSchemaDefinition,
  FilterExpression,
  PhysicalConstraintDefinition,
  PhysicalIndexDefinition,
  QueryViewDefinition,
  RawViewDefinition,
  SchemaOperation,
  TableAlterSchemaOperation,
  TableSchemaDefinition,
  ViewSchemaDefinition,
} from '../../../collection/types.js';

export class KnexSchemaAdapter implements SchemaAdapter {
  readonly dialect?: string;
  readonly capabilities?: DatabaseCapabilities;

  readonly runtime?: DatabaseDriverRuntime;

  constructor(
    private readonly knex: Knex,
    options: {
      dialect?: string;
      capabilities?: DatabaseCapabilities;
      runtime?: DatabaseDriverRuntime;
    } = {},
  ) {
    this.dialect = options.dialect;
    this.capabilities = options.capabilities;
    this.runtime = options.runtime;
  }

  async execute(operations: SchemaOperation[]): Promise<void> {
    this.assertExecutable(operations);
    for (const operation of operations) {
      await this.executeOperation(operation);
    }
  }

  async compile(operations: SchemaOperation[]): Promise<string[]> {
    this.assertExecutable(operations);
    const sql: string[] = [];
    for (const operation of operations) {
      const builder = this.toKnexBuilder(
        await this.normalizeOracleAlter(operation),
      );
      const commands = await builder.generateDdlCommands();
      sql.push(...applyIdempotentSql(operation, extractSql(commands)));
    }
    return sql;
  }

  assertExecutable(operations: SchemaOperation[]): void {
    const custom = this.runtime?.schema?.assertExecutable;
    if (custom) {
      custom(operations);
      return;
    }
    return;
  }

  private async executeOperation(operation: SchemaOperation): Promise<void> {
    operation = await this.normalizeOracleAlter(operation);
    if (
      operation.type === 'alterTable' &&
      operation.operations.length > 0 &&
      operation.operations.every((item) => item.type === 'dropIndex') &&
      this.runtime?.schema?.dropIndexOperation
    ) {
      for (const item of operation.operations) {
        try {
          await this.toKnexBuilder({ ...operation, operations: [item] });
        } catch (error: unknown) {
          if (!this.runtime.schema.dropIndexOperation(error)) {
            throw error;
          }
        }
      }
      return;
    }
    if (operation.type === 'createTable' && operation.ifNotExists) {
      if (
        await this.hasTable(operation.table.name, operation.table.db?.schema)
      ) {
        return;
      }
      await this.createTable(operation.table);
      return;
    }
    if (operation.type === 'dropTable' && operation.ifExists) {
      await this.withSchema(operation.db?.schema).dropTableIfExists(
        operation.tableName,
      );
      return;
    }
    await this.toKnexBuilder(operation);
  }

  private async normalizeOracleAlter(
    operation: SchemaOperation,
  ): Promise<SchemaOperation> {
    const custom = this.runtime?.schema?.normalizeOperation;
    return custom ? await custom(operation, this.knex) : operation;
  }

  private toKnexBuilder(operation: SchemaOperation): any {
    switch (operation.type) {
      case 'createTable':
        return this.createTable(operation.table);
      case 'alterTable':
        return this.withSchema(operation.db?.schema).alterTable(
          operation.tableName,
          (table) => {
            for (const tableOperation of operation.operations) {
              this.buildTableAlterOperation(table, tableOperation);
            }
          },
        );
      case 'dropTable':
        return operation.ifExists
          ? this.withSchema(operation.db?.schema).dropTableIfExists(
              operation.tableName,
            )
          : this.withSchema(operation.db?.schema).dropTable(
              operation.tableName,
            );
      case 'renameTable':
        return this.withSchema(operation.db?.schema).renameTable(
          operation.from,
          operation.to,
        );
      case 'createView':
        return this.createView(
          operation.view,
          operation.orReplace,
          operation.materialized,
        );
      case 'refreshMaterializedView':
        return (
          this.withSchema(operation.db?.schema) as any
        ).refreshMaterializedView(operation.viewName, operation.concurrently);
      default:
        return assertNever(operation);
    }
  }

  private withSchema(schema?: string): Knex.SchemaBuilder {
    return schema ? this.knex.schema.withSchema(schema) : this.knex.schema;
  }

  private async hasTable(tableName: string, schema?: string): Promise<boolean> {
    return this.withSchema(schema).hasTable(tableName);
  }

  private createTable(definition: TableSchemaDefinition): Knex.SchemaBuilder {
    const schema = this.withSchema(definition.db?.schema);
    return schema.createTable(definition.name, (table) => {
      this.buildTable(table, definition);
    });
  }

  private buildTable(
    table: Knex.CreateTableBuilder,
    definition: TableSchemaDefinition,
  ): void {
    for (const column of definition.columns) {
      this.buildColumn(
        table,
        column,
        definition.constraints.some(
          (constraint) => constraint.type === 'primary',
        ),
      );
    }
    for (const constraint of definition.constraints) {
      this.buildConstraint(table, constraint);
    }
    for (const index of definition.indexes) {
      this.buildIndex(table, index);
    }
  }

  private buildTableAlterOperation(
    table: Knex.AlterTableBuilder,
    operation: TableAlterSchemaOperation,
  ): void {
    switch (operation.type) {
      case 'addColumn':
        this.buildColumn(table, operation.column);
        break;
      case 'alterColumn':
        this.buildColumn(
          table,
          operation.changes as ColumnSchemaDefinition,
          false,
          true,
        ).alter();
        break;
      case 'dropColumn':
        table.dropColumn(operation.column);
        break;
      case 'addIndex':
        this.buildIndex(table, operation.index);
        break;
      case 'dropIndex':
        table.dropIndex([], operation.name);
        break;
      case 'addConstraint':
        this.buildConstraint(table, operation.constraint);
        break;
      case 'dropConstraint':
        switch (operation.constraintType) {
          case 'primary':
            table.dropPrimary(operation.name);
            break;
          case 'unique':
            table.dropUnique([], operation.name);
            break;
          case 'check':
            table.dropChecks(operation.name);
            break;
          case 'foreignKey':
          case undefined:
            table.dropForeign([], operation.name);
            break;
          default:
            assertNever(operation.constraintType);
        }
        break;
      default:
        assertNever(operation);
    }
  }

  private buildColumn(
    table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
    column: ColumnSchemaDefinition,
    tablePrimaryKey: boolean = false,
    altering: boolean = false,
  ): Knex.ColumnBuilder {
    let builder: Knex.ColumnBuilder;
    const nativeType = column.db?.nativeType;

    const runtimeType = this.runtime?.schema?.columnType?.({
      column,
      tablePrimaryKey,
      altering,
    });
    if (runtimeType) {
      builder = table.specificType(column.name, runtimeType);
    } else if (nativeType) {
      builder = table.specificType(column.name, nativeType);
    } else if (column.autoIncrement || column.type === 'increments') {
      builder =
        column.type === 'bigInt'
          ? table.bigIncrements(column.name, { primaryKey: !tablePrimaryKey })
          : table.increments(column.name, { primaryKey: !tablePrimaryKey });
    } else {
      switch (column.type) {
        case 'integer':
          builder = table.integer(column.name);
          break;
        case 'bigInt':
          builder = table.bigInteger(column.name);
          break;
        case 'enum':
          builder = table.string(column.name, column.length ?? 255);
          break;
        case 'char':
          if (!Number.isSafeInteger(column.length) || column.length! < 1)
            throw new Error('CHAR columns require a positive integer length.');
          builder = table.specificType(column.name, `char(${column.length})`);
          break;
        case 'string':
          builder = table.string(column.name, column.length);
          break;
        case 'text':
          builder = table.text(column.name);
          break;
        case 'boolean':
          builder = table.boolean(column.name);
          break;
        case 'decimal':
          builder = table.decimal(column.name, column.precision, column.scale);
          break;
        case 'float':
          builder = table.float(column.name);
          break;
        case 'double':
          builder = table.double(column.name);
          break;
        case 'date':
          builder = table.date(column.name);
          break;
        case 'time':
          builder = table.specificType(column.name, 'time(3)');
          break;
        case 'datetime':
        case 'datetimeTz': {
          builder = table.specificType(column.name, 'timestamp(3)');
          break;
        }
        case 'json':
          builder = table.json(column.name);
          break;
        case 'blob':
          builder = table.binary(column.name, column.length);
          break;
        case 'uuid':
          builder = table.uuid(column.name);
          break;
        case 'native':
          builder = table.specificType(column.name, nativeType ?? 'text');
          break;
        default:
          builder = table.specificType(column.name, String(column.type));
          break;
      }
    }

    if (column.unsigned && 'unsigned' in builder) {
      builder.unsigned();
    }
    if (column.nullable === false) {
      builder.notNullable();
    }
    if (column.nullable === true) {
      builder.nullable();
    }
    if (column.defaultValue !== undefined) {
      // A JSON default normally reaches Knex as the value, because Knex
      // serializes it for a column it built as `json()` and MySQL needs the
      // value to compile the expression form `default ('{"a":1}')` its engine
      // requires. A dialect that builds the column as something else loses
      // that handling and would emit `[object Object]`, so it asks for the
      // encoded text instead.
      const encodeDefault =
        column.type === 'json' &&
        this.runtime?.schema?.encodeJsonDefault?.({ altering }) === true;
      const expression = this.runtime?.schema?.columnDefault?.({
        client: this.knex,
        column,
        altering,
      });
      builder.defaultTo(
        expression ??
          (encodeDefault
            ? (encodeJsonValue(column.defaultValue as JsonValue) as any)
            : (column.defaultValue as any)),
      );
    }
    if (
      column.primaryKey &&
      !tablePrimaryKey &&
      (runtimeType !== undefined || !column.autoIncrement)
    ) {
      builder.primary();
    }
    if (column.db?.comment && 'comment' in builder) {
      builder.comment(String(column.db.comment));
    }

    return builder;
  }

  private buildIndex(
    table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
    index: PhysicalIndexDefinition,
  ): void {
    if (!index.columns?.length) {
      return;
    }
    table.index(index.columns, index.name, {
      indexType: index.type,
      predicate: index.predicate
        ? this.buildPredicate(index.predicate)
        : undefined,
    });
  }

  private buildConstraint(
    table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
    constraint: PhysicalConstraintDefinition,
  ): void {
    switch (constraint.type) {
      case 'primary':
        addPrimaryConstraint(
          table,
          constraint.columns,
          constraintOptions({
            constraintName: constraint.name,
            deferrable: normalizeDeferrable(constraint.deferrable),
          }),
        );
        break;
      case 'unique':
        addUniqueConstraint(
          table,
          constraint.columns,
          indexOptions({
            indexName: constraint.name,
            deferrable: normalizeDeferrable(constraint.deferrable),
            storageEngineIndexType: constraint.indexType,
            useConstraint: constraint.mode === 'constraint' ? true : undefined,
            predicate: constraint.predicate
              ? this.buildPredicate(constraint.predicate)
              : undefined,
          }),
        );
        break;
      case 'foreignKey': {
        const foreign = table
          .foreign(constraint.columns, constraint.name)
          .references(constraint.references.columns)
          .inTable(constraint.references.table);
        const customForeignKey = this.runtime?.schema?.configureForeignKey;
        if (customForeignKey) customForeignKey({ foreign, constraint });
        else {
          if (constraint.onDelete)
            foreign.onDelete(constraint.onDelete.toUpperCase());
          if (constraint.onUpdate)
            foreign.onUpdate(constraint.onUpdate.toUpperCase());
        }
        const deferrable = normalizeDeferrable(constraint.deferrable);
        if (deferrable && 'deferrable' in foreign) {
          foreign.deferrable(deferrable);
        }
        break;
      }
      case 'check':
        // Knex has check helpers, but expression compilation belongs in a later pass.
        break;
      default:
        assertNever(constraint);
    }
  }

  private createView(
    view: ViewSchemaDefinition,
    orReplace = false,
    materialized = false,
  ): any {
    const schema = this.withSchema(view.db?.schema);
    const method = materialized
      ? 'createMaterializedView'
      : orReplace
        ? 'createViewOrReplace'
        : 'createView';

    return (schema as any)[method](view.name, (builder: Knex.ViewBuilder) => {
      builder.columns(view.columns);
      if (view.raw) {
        builder.as(this.buildRawView(view.raw) as any);
      } else if (view.query) {
        builder.as(this.buildViewQuery(view.query));
      }
    });
  }

  private buildViewQuery(query: QueryViewDefinition): Knex.QueryBuilder {
    const builder = this.knex(query.from).select(query.select);
    applyFilter(builder, query.filter ?? {});
    return builder;
  }

  private buildRawView(raw: RawViewDefinition): Knex.Raw {
    return this.knex.raw(raw.sql, (raw.bindings ?? []) as any);
  }

  private buildPredicate(predicate: FilterExpression): Knex.QueryBuilder {
    const custom = this.runtime?.schema?.buildPredicate?.({
      client: this.knex,
      predicate,
    });
    if (custom) return custom;
    const query = this.knex.queryBuilder();
    applyFilter(query, predicate);
    return query;
  }
}

function normalizeDeferrable(
  value: unknown,
): 'not deferrable' | 'immediate' | 'deferred' | undefined {
  if (value === true) {
    return 'deferred';
  }
  if (value === false) {
    return 'not deferrable';
  }
  if (value === 'immediate' || value === 'deferred') {
    return value;
  }
  return undefined;
}

function cleanOptions<T extends Record<string, unknown>>(
  options: T,
): T | undefined {
  const cleaned = Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as T;
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function constraintOptions(options: {
  constraintName?: string;
  deferrable?: 'not deferrable' | 'immediate' | 'deferred';
}): string | typeof options | undefined {
  if (options.deferrable) {
    return cleanOptions(options);
  }
  return options.constraintName;
}

function indexOptions<T extends { indexName?: string; deferrable?: unknown }>(
  options: T,
): string | T | undefined {
  const cleaned = cleanOptions(options);
  if (!cleaned) {
    return undefined;
  }
  const onlyIndexName = Object.keys(cleaned).length === 1 && cleaned.indexName;
  return onlyIndexName ? cleaned.indexName : cleaned;
}

function addPrimaryConstraint(
  table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
  columns: string[],
  options?:
    | string
    | {
        constraintName?: string;
        deferrable?: 'not deferrable' | 'immediate' | 'deferred';
      },
): void {
  if (typeof options === 'string') {
    table.primary(columns, options);
  } else if (options === undefined) {
    table.primary(columns);
  } else {
    table.primary(columns, options);
  }
}

function addUniqueConstraint(
  table: Knex.CreateTableBuilder | Knex.AlterTableBuilder,
  columns: string[],
  options?:
    | string
    | {
        indexName?: string;
        deferrable?: 'not deferrable' | 'immediate' | 'deferred';
        storageEngineIndexType?: string;
        useConstraint?: boolean;
        predicate?: Knex.QueryBuilder;
      },
): void {
  if (typeof options === 'string') {
    table.unique(columns, options);
  } else if (options === undefined) {
    table.unique(columns);
  } else {
    table.unique(columns, options);
  }
}

function extractSql(commands: unknown): string[] {
  if (!commands || typeof commands !== 'object') {
    return [];
  }
  const commandObject = commands as { sql?: Array<string | { sql?: string }> };
  return (
    commandObject.sql
      ?.map((item) => (typeof item === 'string' ? item : item.sql))
      .filter((sql): sql is string => Boolean(sql)) ?? []
  );
}

function isOperatorExpression(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function applyWhere(
  builder: Knex.QueryBuilder,
  field: string,
  operator: string,
  value: unknown,
): void {
  switch (operator) {
    case '$gt':
      builder.where(field, '>', value as any);
      break;
    case '$gte':
      builder.where(field, '>=', value as any);
      break;
    case '$lt':
      builder.where(field, '<', value as any);
      break;
    case '$lte':
      builder.where(field, '<=', value as any);
      break;
    case '$ne':
      builder.where(field, '!=', value as any);
      break;
    case '$notNull':
      builder.whereNotNull(field);
      break;
    case '$is':
      if (value === null) {
        builder.whereNull(field);
      } else {
        builder.where(field, value as any);
      }
      break;
    case '$eq':
    default:
      builder.where(field, value as any);
      break;
  }
}

function applyFilter(
  builder: Knex.QueryBuilder,
  filter: FilterExpression,
): void {
  for (const [field, expression] of Object.entries(filter)) {
    if (isOperatorExpression(expression)) {
      for (const [operator, value] of Object.entries(expression)) {
        applyWhere(builder, field, operator, value);
      }
    } else {
      builder.where(field, expression as any);
    }
  }
}

function applyIdempotentSql(
  operation: SchemaOperation,
  sql: string[],
): string[] {
  if (operation.type !== 'createTable' || !operation.ifNotExists) {
    return sql;
  }

  let patched = false;
  return sql.map((statement) => {
    if (patched || !/^\s*create\s+table\s+/i.test(statement)) {
      return statement;
    }
    patched = true;
    return statement.replace(/^(\s*create\s+table\s+)/i, '$1if not exists ');
  });
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
