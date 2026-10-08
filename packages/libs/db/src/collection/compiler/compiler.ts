import { DefaultNamingStrategy } from '../../naming/default-strategy.js';
import { validateEnumDefinition, assertEnumExpansion } from '../enum.js';
import {
  requireRelationOption,
  validateRelationOptions,
} from '../relation-contract.js';
import type { NamingStrategy } from '../../naming/strategy.js';
import type {
  AnyFieldDefinition,
  CollectionAlterDefinition,
  CollectionDefinition,
  CollectionOperation,
  ConstraintDefinition,
  FieldDefinition,
  ForeignKeyConstraintDefinition,
  IndexDefinition,
  PhysicalConstraintDefinition,
  PhysicalIndexDefinition,
  QueryViewDefinition,
  RelationFieldDefinition,
  SchemaOperation,
  TableAlterSchemaOperation,
  TableSchemaDefinition,
  ColumnSchemaDefinition,
  NamingOptions,
} from '../types.js';

export interface CollectionCompilerOptions {
  naming?: NamingOptions;
}

export interface CollectionCompilerContext {
  collections?: Record<string, CollectionDefinition | undefined>;
}

export class CollectionCompiler {
  private readonly naming: NamingStrategy;
  private readonly namingOptions: Required<NamingOptions>;

  constructor(options: CollectionCompilerOptions = {}) {
    this.namingOptions = {
      underscored: options.naming?.underscored ?? true,
      tablePrefix: options.naming?.tablePrefix ?? '',
    };
    this.naming = new DefaultNamingStrategy(this.namingOptions);
  }

  compile(
    operations: CollectionOperation[],
    context: CollectionCompilerContext = {},
  ): SchemaOperation[] {
    return operations.flatMap((operation) =>
      this.compileOperation(operation, context),
    );
  }

  effectiveTableName(name: string, definition?: CollectionDefinition): string {
    return this.namingFor(definition).collectionToTableName(name);
  }

  effectiveColumnName(
    field: string,
    definition?: CollectionDefinition,
  ): string {
    return this.namingFor(definition).fieldToColumnName(field);
  }

  private compileOperation(
    operation: CollectionOperation,
    context: CollectionCompilerContext,
  ): SchemaOperation[] {
    switch (operation.type) {
      case 'createCollection':
        return [
          pruneUndefined({
            type: 'createTable',
            table: this.compileTable(
              operation.name,
              operation.definition,
              context,
            ),
            ifNotExists: operation.ifNotExists,
          }),
        ];
      case 'alterCollection':
        return [
          this.compileAlterTable(
            operation.collection,
            operation.changes,
            context,
          ),
        ];
      case 'dropCollection':
        return [
          pruneUndefined({
            type: 'dropTable',
            tableName: this.effectiveTableName(
              operation.collection,
              context.collections?.[operation.collection],
            ),
            ifExists: operation.ifExists,
          }),
        ];
      case 'renameCollection':
        return [
          {
            type: 'renameTable',
            from: this.effectiveTableName(
              operation.from,
              context.collections?.[operation.from],
            ),
            to: this.effectiveTableName(
              operation.to,
              context.collections?.[operation.from],
            ),
          },
        ];
      case 'createViewCollection':
        return [
          {
            type: 'createView',
            view: this.compileView(
              operation.name,
              operation.definition,
              context,
            ),
          },
        ];
      case 'replaceViewCollection':
        return [
          {
            type: 'createView',
            view: this.compileView(
              operation.name,
              operation.definition,
              context,
            ),
            orReplace: true,
          },
        ];
      case 'createMaterializedViewCollection':
        return [
          {
            type: 'createView',
            view: this.compileView(
              operation.name,
              operation.definition,
              context,
            ),
            materialized: true,
          },
        ];
      case 'refreshMaterializedViewCollection':
        return [
          {
            type: 'refreshMaterializedView',
            viewName: this.effectiveTableName(
              operation.collection,
              context.collections?.[operation.collection],
            ),
            concurrently: operation.concurrently,
          },
        ];
      case 'addField':
        return [
          this.compileAlterTable(
            operation.collection,
            { addFields: [operation.field] },
            context,
          ),
        ];
      case 'alterField':
        return [
          this.compileAlterTable(
            operation.collection,
            {
              alterFields: [
                { name: operation.field, changes: operation.changes },
              ],
            },
            context,
          ),
        ];
      case 'dropField':
        return [
          this.compileAlterTable(
            operation.collection,
            { dropFields: [operation.field] },
            context,
          ),
        ];
      case 'addIndex':
        return [
          this.compileAlterTable(
            operation.collection,
            { addIndexes: [operation.index] },
            context,
          ),
        ];
      case 'dropIndex':
        return [
          this.compileAlterTable(
            operation.collection,
            { dropIndexes: [operation.index] },
            context,
          ),
        ];
      case 'addConstraint':
        return [
          this.compileAlterTable(
            operation.collection,
            { addConstraints: [operation.constraint] },
            context,
          ),
        ];
      case 'dropConstraint':
        return [
          this.compileAlterTable(
            operation.collection,
            { dropConstraints: [operation.constraint] },
            context,
          ),
        ];
      default:
        return assertNever(operation);
    }
  }

  private compileTable(
    name: string,
    definition: CollectionDefinition,
    context: CollectionCompilerContext,
  ): TableSchemaDefinition {
    const tableName = this.effectiveTableName(name, definition);
    const normalized = this.normalizeCollectionDefinition(definition);
    const indexes = deduplicatePhysicalIndexes(
      tableName,
      normalized.indexes.map((index) =>
        this.compileIndex(tableName, index, normalized.fields, definition),
      ),
    );

    return {
      name: tableName,
      db: definition.db,
      columns: normalized.fields.flatMap((field) =>
        this.compileFieldColumns(field, definition),
      ),
      indexes,
      constraints: normalized.constraints.map((constraint) =>
        this.compileConstraint(
          tableName,
          constraint,
          normalized.fields,
          definition,
          context,
        ),
      ),
    };
  }

  private compileView(
    name: string,
    definition: CollectionDefinition,
    context: CollectionCompilerContext,
  ) {
    const tableName = this.effectiveTableName(name, definition);
    const fields = definition.fields ?? [];

    return {
      name: tableName,
      db: definition.db,
      columns: fields.map((field) => this.columnName(field, definition)),
      query: definition.view?.as
        ? this.compileViewQuery(definition.view.as, context)
        : undefined,
      raw: definition.view?.asRaw,
      indexes: deduplicatePhysicalIndexes(
        tableName,
        definition.indexes?.map((index) =>
          this.compileIndex(tableName, index, fields, definition),
        ) ?? [],
      ),
    };
  }

  private compileViewQuery(
    query: QueryViewDefinition,
    context: CollectionCompilerContext,
  ): QueryViewDefinition {
    const source = context.collections?.[query.from];
    const sourceFields = source?.fields ?? [];
    return {
      from: this.effectiveTableName(query.from, source),
      select: query.select.map((field) =>
        this.resolveColumn(field, sourceFields, source),
      ),
      filter: query.filter
        ? this.compileFilterExpression(query.filter, source)
        : undefined,
    };
  }

  private compileFilterExpression(
    filter: Record<string, unknown>,
    collection?: CollectionDefinition,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(filter).map(([key, value]) => {
        if (key.startsWith('$')) {
          return [key, this.compileFilterValue(value, collection)];
        }
        return [
          this.resolveColumn(key, collection?.fields ?? [], collection),
          this.compileFilterValue(value, collection),
        ];
      }),
    );
  }

  private compileFilterValue(
    value: unknown,
    collection?: CollectionDefinition,
  ): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.compileFilterValue(item, collection));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }
    return this.compileFilterExpression(
      value as Record<string, unknown>,
      collection,
    );
  }

  private compileAlterTable(
    collection: string,
    changes: CollectionAlterDefinition,
    context: CollectionCompilerContext,
  ): SchemaOperation {
    const current = context.collections?.[collection];
    const existingFields = current?.fields ?? [];
    const addFields = changes.addFields ?? [];
    const availableFields = [...existingFields, ...addFields];
    const availableCollection = this.collectionWithFields(
      collection,
      current,
      availableFields,
    );
    const tableName = this.effectiveTableName(collection, current);
    const operations: TableAlterSchemaOperation[] = [];

    for (const field of addFields) {
      operations.push(
        ...this.compileFieldColumns(field, availableCollection).map(
          (column) => ({ type: 'addColumn' as const, column }),
        ),
      );
    }

    for (const field of addFields) {
      operations.push(
        ...this.compileImplicitRelationOperations(
          tableName,
          field,
          availableCollection,
          context,
        ),
      );
      if (field.index) {
        operations.push({
          type: 'addIndex',
          index: this.compileIndex(
            tableName,
            { fields: [field.name] },
            availableFields,
            availableCollection,
          ),
        });
      }
      if (field.primaryKey) {
        operations.push({
          type: 'addConstraint',
          constraint: this.compileConstraint(
            tableName,
            { type: 'primary', fields: [field.name] },
            availableFields,
            availableCollection,
          ),
        });
      }
      if (field.unique) {
        operations.push({
          type: 'addConstraint',
          constraint: this.compileConstraint(
            tableName,
            { type: 'unique', fields: [field.name] },
            availableFields,
            availableCollection,
          ),
        });
      }
    }

    for (const field of changes.alterFields ?? []) {
      const previous = existingFields.find((item) => item.name === field.name);
      if (previous?.type === 'enum' || field.changes.type === 'enum') {
        if (
          previous?.type !== 'enum' ||
          (field.changes.type !== undefined && field.changes.type !== 'enum')
        )
          throw new Error(
            'Changing an existing Field to or from enum requires an explicit migration.',
          );
        const merged = {
          ...previous,
          ...field.changes,
          name: field.name,
          db: field.changes.db,
        } as FieldDefinition;
        validateEnumDefinition(merged);
        assertEnumExpansion(previous.values, merged.values!);
        if (
          Object.keys(field.changes).every((key) =>
            ['title', 'description', 'values'].includes(key),
          )
        ) {
          if (
            previous.length !== undefined &&
            merged.values!.some((value) => value.length > previous.length!)
          )
            throw new Error(
              'Added enum members exceed current storage capacity; widen the column explicitly.',
            );
          continue;
        }
        const [definition] = this.compileFieldColumns(merged, current);
        operations.push({
          type: 'alterColumn',
          column: definition.name,
          changes: definition,
        });
        continue;
      }
      if (previous?.type === 'char' || field.changes.type === 'char') {
        if (
          Object.keys(field.changes).every((key) =>
            ['title', 'description'].includes(key),
          )
        )
          continue;
        const merged = {
          ...previous,
          ...field.changes,
          name: field.name,
        } as FieldDefinition;
        if (
          field.changes.length !== undefined ||
          field.changes.type !== undefined
        )
          merged.db = field.changes.db;
        const [definition] = this.compileFieldColumns(merged, current);
        // Existing primary keys are constraints, not new column declarations.
        delete definition.primaryKey;
        operations.push({
          type: 'alterColumn',
          column: definition.name,
          changes: definition,
        });
        continue;
      }
      const oldColumnName = this.resolveColumn(
        field.name,
        existingFields,
        current,
      );
      operations.push({
        type: 'alterColumn',
        column: oldColumnName,
        changes: {
          ...field.changes,
          name: oldColumnName,
        },
      });
    }

    for (const field of changes.dropFields ?? []) {
      // A relation that owns no column (hasOne, hasMany, belongsToMany, or a belongsTo over an existing Field) leaves
      // the table as it is, just as adding it did.
      const existing = existingFields.find((item) => item.name === field);
      const relation = existing ? relationField(existing) : undefined;
      if (
        relation &&
        (relation.type !== 'belongsTo' ||
          this.relationUsesExistingField(relation, current))
      )
        continue;
      operations.push({
        type: 'dropColumn',
        column: this.resolveColumn(field, existingFields, current),
      });
    }

    for (const index of changes.addIndexes ?? []) {
      operations.push({
        type: 'addIndex',
        index: this.compileIndex(
          tableName,
          index,
          availableFields,
          availableCollection,
        ),
      });
    }

    for (const index of changes.dropIndexes ?? []) {
      operations.push({ type: 'dropIndex', name: index });
    }

    for (const constraint of changes.addConstraints ?? []) {
      operations.push({
        type: 'addConstraint',
        constraint: this.compileConstraint(
          tableName,
          constraint,
          availableFields,
          availableCollection,
          context,
        ),
      });
    }

    for (const constraint of changes.dropConstraints ?? []) {
      const definition = current?.constraints?.find(
        (candidate) => candidate.name === constraint,
      );
      // A unique constraint with a predicate exists only as a partial unique index — no database can attach a
      // predicate to a constraint — so it is dropped as one; as a constraint, PostgreSQL refused to drop it. A
      // definition resolved from the database keeps the predicate on the index, which it lists under the same
      // name among the indexes; a unique constraint backed by a constraint of its own is not listed there.
      const indexBacked =
        definition?.type === 'unique' &&
        (definition.predicate !== undefined ||
          (current?.indexes ?? []).some(
            (candidate) => candidate.name === constraint,
          ));
      if (indexBacked) {
        operations.push({ type: 'dropIndex', name: constraint });
        continue;
      }
      operations.push({
        type: 'dropConstraint',
        name: constraint,
        constraintType: definition?.type,
      });
    }

    return {
      type: 'alterTable',
      tableName,
      operations: deduplicateAlterIndexOperations(tableName, operations),
    };
  }

  private normalizeCollectionDefinition(
    definition: CollectionDefinition,
  ): Required<
    Pick<CollectionDefinition, 'fields' | 'indexes' | 'constraints'>
  > {
    const fields = [...(definition.fields ?? [])];
    const indexes = [...(definition.indexes ?? [])];
    const constraints = [...(definition.constraints ?? [])].filter(
      (constraint) => {
        if (constraint.type !== 'primary') {
          return true;
        }
        return !constraint.fields.every((fieldName) => {
          const field = fields.find((item) => item.name === fieldName);
          return field?.autoIncrement || field?.type === 'increments';
        });
      },
    );

    for (const field of fields) {
      if (
        field.primaryKey &&
        !field.autoIncrement &&
        field.type !== 'increments' &&
        !constraints.some(
          (constraint) =>
            constraint.type === 'primary' &&
            constraint.fields.includes(field.name),
        )
      ) {
        constraints.push({ type: 'primary', fields: [field.name] });
      }
      if (
        field.unique &&
        !constraints.some(
          (constraint) =>
            constraint.type === 'unique' &&
            constraint.fields.includes(field.name),
        )
      ) {
        constraints.push({ type: 'unique', fields: [field.name] });
      }
      const relation = relationField(field);
      if (relation?.type === 'belongsTo') {
        const relationColumn = relation.foreignKey
          ? this.columnName(relation, {
              ...definition,
              fields,
            })
          : undefined;
        if (
          relation.index !== false &&
          relationColumn &&
          !indexes.some((index) => {
            const columns = index.fields?.map((fieldName) =>
              this.resolveColumn(fieldName, fields, definition),
            );
            return columns?.length === 1 && columns[0] === relationColumn;
          })
        ) {
          indexes.push({ fields: [relation.name] });
        }
        if (relation.constraints) {
          constraints.push(this.relationForeignKeyConstraint(relation));
        }
      }
    }

    return { fields, indexes, constraints };
  }

  private compileFieldColumns(
    field: AnyFieldDefinition,
    collection?: CollectionDefinition,
  ): ColumnSchemaDefinition[] {
    const relation = relationField(field);
    if (relation) validateRelationOptions(relation);
    if (
      relation &&
      (relation.type === 'hasOne' ||
        relation.type === 'hasMany' ||
        relation.type === 'belongsToMany')
    ) {
      return [];
    }

    if (relation?.type === 'belongsTo') {
      if (this.relationUsesExistingField(relation, collection)) {
        return [];
      }
      if (!relation.foreignKeyType) {
        throw new Error(
          `Relation "${relation.name}" requires an existing scalar foreignKey Field or an explicit foreignKeyType.`,
        );
      }
      return [
        {
          name: this.columnName(relation, collection),
          type: relation.foreignKeyType,
          nullable: relation.nullable ?? true,
          unsigned: relation.unsigned,
          db: relation.db,
        },
      ];
    }

    const scalarField = field as FieldDefinition;
    validateEnumDefinition(scalarField);
    if (
      scalarField.type === 'enum' &&
      collection?.constraints?.some(
        (constraint) =>
          (constraint.type === 'primary' || constraint.type === 'unique') &&
          constraint.fields.includes(scalarField.name),
      )
    )
      throw new Error('V1 enum Fields cannot be identity Fields.');
    if (scalarField.type === 'char') {
      if (!Number.isSafeInteger(scalarField.length) || scalarField.length! < 1)
        throw new Error(
          `CHAR Field "${scalarField.name}" requires a positive integer length.`,
        );
      if (
        scalarField.defaultValue !== undefined &&
        scalarField.defaultValue !== null &&
        typeof scalarField.defaultValue !== 'string'
      )
        throw new Error(
          `CHAR Field "${scalarField.name}" requires a string default.`,
        );
      if (
        typeof scalarField.defaultValue === 'string' &&
        ([...scalarField.defaultValue].length > scalarField.length! ||
          /[\uD800-\uDFFF]/u.test(scalarField.defaultValue) ||
          scalarField.defaultValue.includes('\0'))
      )
        throw new Error(
          `CHAR Field "${scalarField.name}" has an invalid or overlong default.`,
        );
    }
    return [
      {
        name: this.columnName(scalarField, collection),
        type: normalizeColumnType(scalarField),
        nullable: scalarField.nullable,
        defaultValue: scalarField.defaultValue,
        primaryKey: scalarField.primaryKey,
        autoIncrement:
          scalarField.autoIncrement ??
          (scalarField.type === 'increments' ? true : undefined),
        length:
          scalarField.type === 'enum'
            ? (scalarField.length ?? 255)
            : scalarField.length,
        precision: scalarField.precision,
        scale: scalarField.scale,
        unsigned: scalarField.unsigned,
        db: scalarField.db,
      },
    ];
  }

  private compileImplicitRelationOperations(
    tableName: string,
    field: AnyFieldDefinition,
    collection?: CollectionDefinition,
    context: CollectionCompilerContext = {},
  ): TableAlterSchemaOperation[] {
    const relation = relationField(field);
    if (relation?.type !== 'belongsTo') {
      return [];
    }

    const operations: TableAlterSchemaOperation[] = [];
    const columnName = this.columnName(relation, collection);
    if (relation.index !== false) {
      operations.push({
        type: 'addIndex',
        index: {
          columns: [columnName],
          name: this.namingFor(collection).indexName(tableName, [columnName]),
        },
      });
    }
    if (relation.constraints) {
      operations.push({
        type: 'addConstraint',
        constraint: this.compileConstraint(
          tableName,
          this.relationForeignKeyConstraint(relation),
          [relation],
          collection,
          context,
        ),
      });
    }
    return operations;
  }

  private compileConstraint(
    tableName: string,
    constraint: ConstraintDefinition,
    fields: AnyFieldDefinition[],
    collection?: CollectionDefinition,
    context: CollectionCompilerContext = {},
  ): PhysicalConstraintDefinition {
    if (
      (constraint.type === 'primary' || constraint.type === 'unique') &&
      constraint.fields.some((name) =>
        fields.some((field) => field.name === name && field.type === 'enum'),
      )
    )
      throw new Error('V1 enum Fields cannot be identity Fields.');
    switch (constraint.type) {
      case 'primary':
        return {
          ...constraint,
          columns: constraint.fields.map((field) =>
            this.resolveColumn(field, fields, collection),
          ),
          name:
            constraint.name ??
            this.namingFor(collection).indexName(
              tableName,
              constraint.fields.map((field) =>
                this.resolveColumn(field, fields, collection),
              ),
            ),
        };
      case 'unique':
        return {
          ...constraint,
          columns: constraint.fields.map((field) =>
            this.resolveColumn(field, fields, collection),
          ),
          name:
            constraint.name ??
            this.namingFor(collection).indexName(
              tableName,
              constraint.fields.map((field) =>
                this.resolveColumn(field, fields, collection),
              ),
            ),
          predicate: constraint.predicate
            ? this.compileFilterExpression(constraint.predicate, collection)
            : undefined,
        };
      case 'foreignKey': {
        if (
          !constraint.references.fields?.length ||
          constraint.references.fields.length !== constraint.fields.length
        ) {
          throw new Error(
            'Foreign key references.fields must explicitly match the number of local fields.',
          );
        }
        const target = context.collections?.[constraint.references.collection];
        const targetTable = this.effectiveTableName(
          constraint.references.collection,
          target,
        );
        const columns = constraint.fields.map((field) =>
          this.resolveColumn(field, fields, collection),
        );
        return {
          ...constraint,
          columns,
          name:
            constraint.name ??
            this.namingFor(collection).foreignKeyName(
              tableName,
              columns,
              targetTable,
            ),
          references: {
            table: targetTable,
            columns: constraint.references.fields.map((field) =>
              this.resolveColumn(field, target?.fields ?? [], target),
            ),
          },
        };
      }
      case 'check':
        return constraint;
      default:
        return assertNever(constraint);
    }
  }

  private relationForeignKeyConstraint(
    field: RelationFieldDefinition,
  ): ForeignKeyConstraintDefinition {
    return {
      type: 'foreignKey',
      fields: [field.name],
      references: {
        collection: field.target,
        fields: [requireRelationOption(field, 'targetKey')],
      },
      onDelete: field.onDelete,
      onUpdate: field.onUpdate,
    };
  }

  private compileIndex(
    tableName: string,
    index: IndexDefinition,
    fields: AnyFieldDefinition[],
    collection?: CollectionDefinition,
  ): PhysicalIndexDefinition {
    const columns = index.fields?.map((field) =>
      this.resolveColumn(field, fields, collection),
    );
    return {
      ...index,
      columns,
      name:
        index.name ??
        (columns
          ? this.namingFor(collection).indexName(tableName, columns)
          : undefined),
      predicate: index.predicate
        ? this.compileFilterExpression(index.predicate, collection)
        : undefined,
    };
  }

  private resolveColumn(
    fieldName: string,
    fields: AnyFieldDefinition[],
    collection?: CollectionDefinition,
  ): string {
    const field = fields.find((item) => item.name === fieldName);
    return field
      ? this.columnName(field, collection)
      : this.namingFor(collection).fieldToColumnName(fieldName);
  }

  private columnName(
    field: AnyFieldDefinition,
    collection?: CollectionDefinition,
  ): string {
    const relation = relationField(field);
    if (relation?.type === 'belongsTo') {
      if (relation.foreignKey) {
        return this.resolveColumn(
          relation.foreignKey,
          (collection?.fields ?? []).filter((item) => item !== relation),
          collection,
        );
      }
      throw new Error(
        `Relation "${relation.name}" requires an explicit foreignKey.`,
      );
    }
    return this.namingFor(collection).fieldToColumnName(field.name);
  }

  private relationUsesExistingField(
    field: RelationFieldDefinition,
    collection?: CollectionDefinition,
  ): boolean {
    if (!field.foreignKey) {
      return false;
    }
    return Boolean(
      (collection?.fields ?? []).find(
        (item) =>
          item !== field && item.name === field.foreignKey && !isRelation(item),
      ),
    );
  }

  private namingFor(definition?: CollectionDefinition): NamingStrategy {
    if (!definition?.naming) {
      return this.naming;
    }
    return new DefaultNamingStrategy({
      ...this.namingOptions,
      ...definition.naming,
    });
  }

  private collectionWithFields(
    name: string,
    collection: CollectionDefinition | undefined,
    fields: AnyFieldDefinition[],
  ): CollectionDefinition {
    return {
      ...(collection ?? { name }),
      fields,
    };
  }
}

function normalizeColumnType(field: FieldDefinition): FieldDefinition['type'] {
  if (field.type === 'increments') {
    return 'integer';
  }
  return field.type;
}

function isRelation(field: AnyFieldDefinition): boolean {
  return (
    'target' in field &&
    typeof field.target === 'string' &&
    isRelationType(field.type)
  );
}

function relationField(
  field: AnyFieldDefinition,
): RelationFieldDefinition | undefined {
  return isRelation(field) ? (field as RelationFieldDefinition) : undefined;
}

function isRelationType(type: string): boolean {
  return (
    type === 'belongsTo' ||
    type === 'hasOne' ||
    type === 'hasMany' ||
    type === 'belongsToMany'
  );
}

function pruneUndefined<T extends Record<string, unknown>>(value: T): T {
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) {
      delete value[key];
    }
  }
  return value;
}

function deduplicatePhysicalIndexes(
  tableName: string,
  indexes: readonly PhysicalIndexDefinition[],
): PhysicalIndexDefinition[] {
  const seen = new Map<string, PhysicalIndexDefinition>();
  const result: PhysicalIndexDefinition[] = [];
  for (const index of indexes) {
    if (!index.name) {
      result.push(index);
      continue;
    }
    const previous = seen.get(index.name);
    if (!previous) {
      seen.set(index.name, index);
      result.push(index);
      continue;
    }

    if (samePhysicalIndex(previous, index)) {
      continue;
    }

    throw new Error(
      `Collection "${tableName}" defines conflicting physical indexes with the same name "${index.name}".`,
    );
  }
  return result;
}

function deduplicateAlterIndexOperations(
  tableName: string,
  operations: readonly TableAlterSchemaOperation[],
): TableAlterSchemaOperation[] {
  const seen = new Map<string, PhysicalIndexDefinition>();
  return operations.filter((operation) => {
    if (operation.type !== 'addIndex' || !operation.index.name) return true;

    const previous = seen.get(operation.index.name);
    if (!previous) {
      seen.set(operation.index.name, operation.index);
      return true;
    }

    if (samePhysicalIndex(previous, operation.index)) return false;

    throw new Error(
      `Collection "${tableName}" defines conflicting physical indexes with the same name "${operation.index.name}".`,
    );
  });
}

function samePhysicalIndex(
  left: PhysicalIndexDefinition,
  right: PhysicalIndexDefinition,
): boolean {
  return (
    sameStringArray(left.columns, right.columns) &&
    sameStringArray(left.expressions, right.expressions) &&
    left.type === right.type &&
    JSON.stringify(left.predicate) === JSON.stringify(right.predicate) &&
    JSON.stringify(left.order) === JSON.stringify(right.order) &&
    JSON.stringify(left.db) === JSON.stringify(right.db)
  );
}

function sameStringArray(
  left: readonly unknown[] | undefined,
  right: readonly unknown[] | undefined,
): boolean {
  if (left === undefined || right === undefined) return left === right;
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
