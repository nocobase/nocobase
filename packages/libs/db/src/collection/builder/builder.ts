import { NoopSchemaAdapter, type SchemaAdapter } from '../../schema/adapter.js';
import {
  planCapabilities,
  throwIfStrictWarnings,
} from '../../schema/capabilities.js';
import {
  CollectionCompiler,
  type CollectionCompilerContext,
} from '../compiler/compiler.js';
import {
  FluentCollectionAlterBuilder,
  FluentCollectionDefinitionBuilder,
  FluentViewCollectionDefinitionBuilder,
} from '../fluent/index.js';
import {
  type CollectionMetadataInvalidator,
  type CollectionMetadataService,
} from '../../metadata/service.js';
import { CollectionMetadataStoreReadOnlyError } from '../../metadata/document-store-errors.js';
import {
  extractLegacyCollectionMetadata,
  type LegacyMetadataExtractionDiagnostic,
} from '../../metadata/legacy-extraction.js';
import type { ConnectionCollections } from '../registry/types.js';
import { CollectionResolutionError } from '../resolver/errors.js';
import { metadataFieldType } from '../../metadata/field-type.js';
import type {
  AnyFieldDefinition,
  BuilderExecOptions,
  BuilderImpact,
  BuilderResult,
  CollectionAlterDefinition,
  CollectionAlterInput,
  CollectionCreateInput,
  CollectionDefinition,
  CollectionDefinitionInput,
  CollectionKind,
  CollectionOperation,
  ConstraintDefinition,
  FieldAlterInput,
  IndexDefinition,
  MaterializedViewCollectionInput,
  NamingOptions,
  RefreshMaterializedViewOptions,
  ViewCollectionInput,
  RelationFieldDefinition,
} from '../types.js';

export interface CollectionBuilderOptions {
  schemaAdapter?: SchemaAdapter;
  collections?: Pick<ConnectionCollections, 'get' | 'scan'>;
  collectionMetadata?: CollectionMetadataService;
  schemaInvalidator?: CollectionMetadataInvalidator;
  naming?: NamingOptions;
}

export class CollectionMetadataFieldNotFoundError extends Error {
  readonly code = 'COLLECTION_METADATA_FIELD_NOT_FOUND' as const;

  constructor(
    readonly collection: string,
    readonly field: string,
  ) {
    super(`Collection "${collection}" does not contain Field "${field}".`);
    this.name = 'CollectionMetadataFieldNotFoundError';
  }
}

export class CollectionMetadataExtractionError extends Error {
  readonly code = 'COLLECTION_METADATA_EXTRACTION_FAILED' as const;

  constructor(
    readonly collection: string,
    readonly diagnostics: readonly LegacyMetadataExtractionDiagnostic[],
  ) {
    super(`Supplemental Metadata extraction failed for "${collection}".`);
    this.name = 'CollectionMetadataExtractionError';
  }
}

export type CollectionRenameDependencyKind =
  | 'relationTarget'
  | 'relationThrough'
  | 'foreignKey'
  | 'structuredView'
  | 'rawView';

export interface CollectionRenameDependency {
  kind: CollectionRenameDependencyKind;
  collection: string;
  path: string;
}

export class CollectionRenameDependencyError extends Error {
  readonly code = 'COLLECTION_RENAME_HAS_DEPENDENCIES' as const;
  readonly from: string;
  readonly to: string;
  readonly dependencies: CollectionRenameDependency[];

  constructor(
    from: string,
    to: string,
    dependencies: CollectionRenameDependency[],
  ) {
    super(formatRenameDependencyError(from, to, dependencies));
    this.name = 'CollectionRenameDependencyError';
    this.from = from;
    this.to = to;
    this.dependencies = dependencies;
  }
}

export class CollectionRenameAtomicityError extends Error {
  readonly code = 'COLLECTION_RENAME_ATOMICITY_REQUIRED' as const;

  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    super(
      `Cannot rename collection "${from}" to "${to}" because supplemental Metadata exists and the configured Store cannot atomically rename it with the physical Schema.`,
    );
    this.name = 'CollectionRenameAtomicityError';
  }
}

export class CollectionRenameUnsupportedKindError extends Error {
  readonly code = 'COLLECTION_RENAME_UNSUPPORTED_KIND' as const;

  constructor(
    readonly from: string,
    readonly to: string,
    readonly kind: Exclude<CollectionKind, 'table'>,
  ) {
    super(
      `Cannot rename ${kind} collection "${from}" to "${to}" because renameCollection currently supports table collections only.`,
    );
    this.name = 'CollectionRenameUnsupportedKindError';
  }
}

export class CollectionBuilder {
  private readonly schemaAdapter: SchemaAdapter;
  private readonly collections?: Pick<ConnectionCollections, 'get' | 'scan'>;
  private readonly collectionMetadata?: CollectionMetadataService;
  private readonly schemaInvalidator?: CollectionMetadataInvalidator;
  private readonly compiler: CollectionCompiler;
  private readonly plannedCollections = new Map<string, CollectionDefinition>();

  constructor(options: CollectionBuilderOptions = {}) {
    assertSupportedBuilderOptions(options);
    this.schemaAdapter = options.schemaAdapter ?? new NoopSchemaAdapter();
    this.collections = options.collections;
    this.collectionMetadata = options.collectionMetadata;
    this.schemaInvalidator = options.schemaInvalidator;
    this.compiler = new CollectionCompiler({
      naming: options.naming,
    });
  }

  async createCollection(
    name: string,
    input: CollectionDefinitionInput,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    const definition = normalizeCollectionInput(input);
    return this.apply(
      [{ type: 'createCollection', name, definition }],
      options,
    );
  }

  async createCollections(
    inputs: readonly CollectionCreateInput[],
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply(
      inputs.map(({ name, definition }) => ({
        type: 'createCollection' as const,
        name,
        definition: normalizeCollectionInput(definition),
      })),
      options,
    );
  }

  async hasCollection(name: string): Promise<boolean> {
    if (this.collections) {
      return Boolean(await this.collections.get(name));
    }
    return this.plannedCollections.has(name);
  }

  /** Inspect the current definition before an incremental schema change. */
  async getCollection(name: string): Promise<CollectionDefinition | undefined> {
    const definition = this.collections
      ? await this.collections.get(name)
      : this.plannedCollections.get(name);
    return definition ? structuredClone(definition) : undefined;
  }

  async alterCollection(
    name: string,
    input: CollectionAlterInput,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    const changes = normalizeAlterInput(input);
    return this.apply(
      [{ type: 'alterCollection', collection: name, changes }],
      options,
    );
  }

  async dropCollection(
    name: string,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply([{ type: 'dropCollection', collection: name }], options);
  }

  async renameCollection(
    oldName: string,
    newName: string,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply(
      [
        {
          type: 'renameCollection',
          from: oldName,
          to: newName,
        },
      ],
      options,
    );
  }

  async createViewCollection(
    name: string,
    input: ViewCollectionInput,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    const definition = {
      ...normalizeViewInput(input),
      kind: 'view' as const,
    };
    return this.apply(
      [{ type: 'createViewCollection', name, definition }],
      options,
    );
  }

  async replaceViewCollection(
    name: string,
    input: ViewCollectionInput,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    const definition = {
      ...normalizeViewInput(input),
      kind: 'view' as const,
    };
    return this.apply(
      [{ type: 'replaceViewCollection', name, definition }],
      options,
    );
  }

  async createMaterializedViewCollection(
    name: string,
    input: MaterializedViewCollectionInput,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    const definition = {
      ...normalizeViewInput(input),
      kind: 'materializedView' as const,
    };
    return this.apply(
      [{ type: 'createMaterializedViewCollection', name, definition }],
      options,
    );
  }

  async refreshMaterializedViewCollection(
    name: string,
    options: RefreshMaterializedViewOptions = {},
  ): Promise<BuilderResult> {
    return this.apply(
      [
        {
          type: 'refreshMaterializedViewCollection',
          collection: name,
          concurrently: options.concurrently,
        },
      ],
      options,
    );
  }

  async addField(
    collection: string,
    field: AnyFieldDefinition,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply([{ type: 'addField', collection, field }], options);
  }

  async alterField(
    collection: string,
    field: string,
    changes: FieldAlterInput,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply(
      [{ type: 'alterField', collection, field, changes }],
      options,
    );
  }

  async dropField(
    collection: string,
    field: string,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply([{ type: 'dropField', collection, field }], options);
  }

  async addIndex(
    collection: string,
    index: IndexDefinition,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply([{ type: 'addIndex', collection, index }], options);
  }

  async dropIndex(
    collection: string,
    index: string,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply([{ type: 'dropIndex', collection, index }], options);
  }

  async addConstraint(
    collection: string,
    constraint: ConstraintDefinition,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply(
      [{ type: 'addConstraint', collection, constraint }],
      options,
    );
  }

  async dropConstraint(
    collection: string,
    constraint: string,
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    return this.apply(
      [{ type: 'dropConstraint', collection, constraint }],
      options,
    );
  }

  async apply(
    operations: CollectionOperation[],
    options: BuilderExecOptions = {},
  ): Promise<BuilderResult> {
    if ('syncMetadata' in options) {
      throw new Error(
        'CollectionBuilder no longer supports syncMetadata. Metadata synchronization is required for correct data input and output. Remove this option.',
      );
    }
    const effectiveOperations = applyExecOptions(operations, options);
    assertNoPhysicalMappingOperations(effectiveOperations);
    const compilerContext =
      await this.createCompilerContext(effectiveOperations);
    assertOptimisticLockOperations(effectiveOperations, compilerContext);
    await assertRenameOperations(
      effectiveOperations,
      compilerContext,
      this.collectionMetadata,
    );
    const compiledSchemaOperations = this.compiler.compile(
      effectiveOperations,
      compilerContext,
    );
    const capabilityPlan = planCapabilities(compiledSchemaOperations, {
      capabilities: this.schemaAdapter.capabilities,
      dialect: this.schemaAdapter.dialect,
      strict: options.strict,
    });
    if (!options.dryRun) {
      throwIfStrictWarnings(capabilityPlan.warnings, options);
    }

    const schemaOperations = capabilityPlan.schemaOperations;
    const sql =
      options.previewSql && this.schemaAdapter.compile
        ? await this.schemaAdapter.compile(schemaOperations)
        : undefined;
    const impact = [
      ...createImpact(effectiveOperations),
      ...capabilityPlan.impact,
    ];

    if (!options.dryRun) {
      this.schemaAdapter.assertExecutable?.(schemaOperations);
      const executedOperations = filterMetadataOperations(
        this.compiler,
        effectiveOperations,
        schemaOperations,
        compilerContext,
      );
      assertMetadataFieldChanges(executedOperations, compilerContext);
      await this.assertDocumentMetadataWritable(executedOperations);
      await this.schemaAdapter.execute(schemaOperations);
      this.updatePlannedCollections(executedOperations, compilerContext);
      this.invalidatePhysicalSchema(effectiveOperations);
      await this.applyDocumentMetadataChanges(
        executedOperations,
        compilerContext,
      );
    }

    return {
      operations: effectiveOperations,
      schemaOperations,
      sql,
      impact,
      warnings: capabilityPlan.warnings,
    };
  }

  async transaction<T>(
    fn: (builder: CollectionBuilder) => Promise<T>,
  ): Promise<T> {
    return fn(this);
  }

  private async createCompilerContext(
    operations: CollectionOperation[],
  ): Promise<CollectionCompilerContext> {
    const names = new Set<string>();
    /**
     * Collections these operations define themselves. Their entry below comes
     * from the operation, so resolving the stored one would be discarded — and
     * resolving fails outright for a name whose metadata outlived its table,
     * which is exactly the state a recreating migration is there to repair.
     */
    const defined = new Set<string>();
    const includesRename = operations.some(
      (operation) => operation.type === 'renameCollection',
    );
    for (const operation of operations) {
      switch (operation.type) {
        case 'createCollection':
        case 'createViewCollection':
        case 'replaceViewCollection':
        case 'createMaterializedViewCollection':
          names.add(operation.name);
          defined.add(operation.name);
          collectReferencedCollections(names, operation.definition);
          break;
        case 'alterCollection':
          names.add(operation.collection);
          collectAlterReferences(names, operation.changes);
          break;
        case 'dropCollection':
        case 'alterField':
        case 'dropField':
        case 'addIndex':
        case 'dropIndex':
        case 'dropConstraint':
        case 'refreshMaterializedViewCollection':
          names.add(operation.collection);
          break;
        case 'renameCollection':
          names.add(operation.from);
          names.add(operation.to);
          break;
        case 'addField':
          names.add(operation.collection);
          collectFieldReferences(names, operation.field);
          break;
        case 'addConstraint':
          names.add(operation.collection);
          collectConstraintReferences(names, operation.constraint);
          break;
        default:
          break;
      }
    }

    const collections: Record<string, CollectionDefinition | undefined> = {};
    if (includesRename && this.collections) {
      for await (const collection of this.collections.scan()) {
        if (!collection.name) continue;
        collections[collection.name] = collection;
      }
    }
    if (!this.collections) {
      for (const [name, definition] of this.plannedCollections) {
        collections[name] = structuredClone(definition);
      }
    }
    await Promise.all(
      [...names].map(async (name) => {
        if (Object.hasOwn(collections, name) || defined.has(name)) {
          return;
        }
        collections[name] = await this.collections?.get(name);
      }),
    );
    for (const operation of operations) {
      switch (operation.type) {
        case 'createCollection':
        case 'createViewCollection':
        case 'replaceViewCollection':
        case 'createMaterializedViewCollection':
          collections[operation.name] = {
            ...operation.definition,
            name: operation.name,
          };
          break;
        default:
          break;
      }
    }
    return { collections };
  }

  private updatePlannedCollections(
    operations: CollectionOperation[],
    context: CollectionCompilerContext,
  ): void {
    if (this.collections) return;
    for (const operation of operations) {
      switch (operation.type) {
        case 'createCollection':
        case 'createViewCollection':
        case 'replaceViewCollection':
        case 'createMaterializedViewCollection':
          this.plannedCollections.set(
            operation.name,
            this.compiler.resolveCollectionNames(
              operation.name,
              {
                ...structuredClone(operation.definition),
                name: operation.name,
              },
              context,
            ),
          );
          break;
        case 'dropCollection':
          this.plannedCollections.delete(operation.collection);
          break;
        case 'renameCollection': {
          const current = this.plannedCollections.get(operation.from);
          this.plannedCollections.delete(operation.from);
          if (current) {
            this.plannedCollections.set(operation.to, {
              ...current,
              name: operation.to,
            });
          }
          break;
        }
        case 'alterCollection': {
          const current = this.plannedCollections.get(operation.collection);
          if (current) {
            this.plannedCollections.set(
              operation.collection,
              this.applyPlannedChanges(
                operation.collection,
                current,
                operation.changes,
                context,
              ),
            );
          }
          break;
        }
        case 'addField': {
          const current = this.plannedCollections.get(operation.collection);
          if (current) {
            this.plannedCollections.set(operation.collection, {
              ...current,
              fields: [...(current.fields ?? []), operation.field],
            });
          }
          break;
        }
        case 'alterField': {
          const current = this.plannedCollections.get(operation.collection);
          if (current) {
            this.plannedCollections.set(
              operation.collection,
              applyAlterMetadata(current, {
                alterFields: [
                  { name: operation.field, changes: operation.changes },
                ],
              }),
            );
          }
          break;
        }
        case 'dropField': {
          const current = this.plannedCollections.get(operation.collection);
          if (current) {
            this.plannedCollections.set(operation.collection, {
              ...current,
              fields: current.fields?.filter(
                (field) => field.name !== operation.field,
              ),
            });
          }
          break;
        }
        case 'addIndex':
        case 'dropIndex':
        case 'addConstraint':
        case 'dropConstraint': {
          const current = this.plannedCollections.get(operation.collection);
          if (current) {
            const changes =
              operation.type === 'addIndex'
                ? { addIndexes: [operation.index] }
                : operation.type === 'dropIndex'
                  ? { dropIndexes: [operation.index] }
                  : operation.type === 'addConstraint'
                    ? { addConstraints: [operation.constraint] }
                    : { dropConstraints: [operation.constraint] };
            this.plannedCollections.set(
              operation.collection,
              this.applyPlannedChanges(
                operation.collection,
                current,
                changes,
                context,
              ),
            );
          }
          break;
        }
        default:
          break;
      }
    }
  }

  private applyPlannedChanges(
    name: string,
    current: CollectionDefinition,
    changes: CollectionAlterDefinition,
    context: CollectionCompilerContext,
  ): CollectionDefinition {
    // Name additions before applying drops, including when both occur in one alteration.
    const additions = this.compiler.resolveCollectionNames(
      name,
      {
        ...current,
        fields: [...(current.fields ?? []), ...(changes.addFields ?? [])],
        indexes: changes.addIndexes,
        constraints: changes.addConstraints,
      },
      context,
    );
    return applyAlterMetadata(current, {
      ...changes,
      addIndexes: additions.indexes,
      addConstraints: additions.constraints,
    });
  }

  private async applyDocumentMetadataChanges(
    operations: CollectionOperation[],
    context: CollectionCompilerContext,
  ): Promise<void> {
    const service = this.collectionMetadata;
    if (!service) return;
    const projected = new Map<string, CollectionDefinition>();
    for (const [name, definition] of Object.entries(
      context.collections ?? {},
    )) {
      if (definition) projected.set(name, structuredClone(definition));
    }
    for (const operation of operations) {
      switch (operation.type) {
        case 'createCollection':
        case 'createViewCollection':
        case 'replaceViewCollection':
        case 'createMaterializedViewCollection': {
          const definition = {
            ...operation.definition,
            name: operation.name,
          };
          projected.set(operation.name, definition);
          await service.replaceDocument(
            extractSupplementalMetadata(operation.name, definition),
          );
          break;
        }
        case 'dropCollection':
          projected.delete(operation.collection);
          await service.removeDocument(operation.collection);
          break;
        case 'renameCollection': {
          const definition = projected.get(operation.from);
          projected.delete(operation.from);
          if (definition) {
            const renamed = { ...definition, name: operation.to };
            projected.set(operation.to, renamed);
          }
          break;
        }
        case 'alterCollection': {
          const definition = applyAlterMetadata(
            projected.get(operation.collection) ?? {
              name: operation.collection,
            },
            operation.changes,
          );
          projected.set(operation.collection, definition);
          // Validate the final document against the already-applied physical DDL.
          // Per-field updates can reference columns dropped in the same operation.
          const current = (await service.get(operation.collection))
            ?.document ?? { version: 1 as const, name: operation.collection };
          const fields = { ...current.fields };
          const relations = { ...current.relations };
          const changedNames = new Set([
            ...(operation.changes.addFields ?? []).map((field) => field.name),
            ...(operation.changes.alterFields ?? []).map((field) => field.name),
          ]);
          for (const name of operation.changes.dropFields ?? []) {
            delete fields[name];
            delete relations[name];
          }
          const updates = extractSupplementalMetadata(operation.collection, {
            fields: definition.fields?.filter((field) =>
              changedNames.has(field.name),
            ),
          });
          for (const name of changedNames) {
            delete fields[name];
            delete relations[name];
          }
          await service.replaceDocument({
            ...current,
            ...(operation.changes.optimisticLock !== undefined
              ? {
                  optimisticLock: operation.changes.optimisticLock ?? undefined,
                }
              : {}),
            fields: { ...fields, ...updates.fields },
            relations: { ...relations, ...updates.relations },
          });
          break;
        }
        case 'addField': {
          const definition = projected.get(operation.collection) ?? {
            name: operation.collection,
          };
          const next = {
            ...definition,
            fields: [...(definition.fields ?? []), operation.field],
          };
          projected.set(operation.collection, next);
          await syncFieldMetadata(
            service,
            operation.collection,
            operation.field,
          );
          break;
        }
        case 'alterField': {
          const definition = applyAlterMetadata(
            projected.get(operation.collection) ?? {
              name: operation.collection,
            },
            {
              alterFields: [
                { name: operation.field, changes: operation.changes },
              ],
            },
          );
          projected.set(operation.collection, definition);
          const resolved = definition.fields?.find(
            (field) => field.name === operation.field,
          );
          if (resolved) {
            await syncFieldMetadata(
              service,
              operation.collection,
              resolved,
              operation.changes,
            );
          }
          break;
        }
        case 'dropField': {
          const definition = projected.get(operation.collection);
          if (definition) {
            const next = {
              ...definition,
              fields: definition.fields?.filter(
                (field) => field.name !== operation.field,
              ),
            };
            projected.set(operation.collection, next);
          }
          await service.removeField(operation.collection, operation.field);
          break;
        }
        case 'addIndex':
        case 'dropIndex':
        case 'addConstraint':
        case 'dropConstraint':
        case 'refreshMaterializedViewCollection':
          break;
      }
    }
  }

  private invalidatePhysicalSchema(operations: CollectionOperation[]): void {
    if (!this.schemaInvalidator) {
      return;
    }
    if (
      operations.some(
        (operation) =>
          operation.type === 'dropCollection' ||
          operation.type === 'renameCollection',
      )
    ) {
      this.schemaInvalidator.invalidateAll();
      return;
    }
    const collections = affectedCollections(operations);
    if (collections.length > 0) {
      this.schemaInvalidator.invalidate({
        collections,
        namingIndex: false,
      });
    }
  }

  private async assertDocumentMetadataWritable(
    operations: CollectionOperation[],
  ): Promise<void> {
    const service = this.collectionMetadata;
    if (!service || service.capabilities.writable) return;
    for (const operation of operations) {
      const write = await requiredMetadataWrite(operation, service);
      if (write) {
        throw new CollectionMetadataStoreReadOnlyError(write);
      }
    }
  }
}

function normalizeCollectionInput(
  input: CollectionDefinitionInput,
): CollectionDefinition {
  const definition = (() => {
    if (typeof input !== 'function') {
      return input;
    }
    const builder = new FluentCollectionDefinitionBuilder();
    input(builder);
    return builder.toDefinition();
  })();
  assertNoPhysicalMappings(definition, definition.name ?? '(new collection)');
  return definition;
}

function assertNoPhysicalMappingOperations(
  operations: CollectionOperation[],
): void {
  for (const operation of operations) {
    switch (operation.type) {
      case 'createCollection':
      case 'createViewCollection':
      case 'replaceViewCollection':
      case 'createMaterializedViewCollection':
        assertNoPhysicalMappings(operation.definition, operation.name);
        break;
      case 'alterCollection':
        assertNoPhysicalMappings(
          { fields: operation.changes.addFields ?? [] },
          operation.collection,
        );
        assertNoPhysicalFieldAlterMappings(
          operation.collection,
          operation.changes,
        );
        break;
      case 'addField':
        assertNoPhysicalMappings(
          { fields: [operation.field] },
          operation.collection,
        );
        break;
      case 'alterField':
        assertNoPhysicalFieldMapping(
          operation.collection,
          operation.field,
          operation.changes,
        );
        break;
      default:
        break;
    }
  }
}

function normalizeAlterInput(
  input: CollectionAlterInput,
): CollectionAlterDefinition {
  const changes = (() => {
    if (typeof input !== 'function') {
      return input;
    }
    const builder = new FluentCollectionAlterBuilder();
    input(builder);
    return builder.toAlterDefinition();
  })();
  assertNoPhysicalMappings(
    { fields: changes.addFields ?? [] },
    '(altered collection)',
  );
  assertNoPhysicalFieldAlterMappings('(altered collection)', changes);
  return changes;
}

function normalizeViewInput(input: ViewCollectionInput): CollectionDefinition {
  if (typeof input === 'function') {
    const builder = new FluentViewCollectionDefinitionBuilder();
    input(builder);
    return builder.toDefinition();
  }
  assertNoPhysicalMappings(input, input.name ?? '(new view)');
  return input;
}

function applyExecOptions(
  operations: CollectionOperation[],
  options: Pick<BuilderExecOptions, 'ifNotExists' | 'ifExists'>,
): CollectionOperation[] {
  return operations.map((operation) => {
    switch (operation.type) {
      case 'createCollection': {
        const ifNotExists = operation.ifNotExists ?? options.ifNotExists;
        if (ifNotExists === undefined) {
          return operation;
        }
        return {
          ...operation,
          ifNotExists,
        };
      }
      case 'dropCollection': {
        const ifExists = operation.ifExists ?? options.ifExists;
        if (ifExists === undefined) {
          return operation;
        }
        return {
          ...operation,
          ifExists,
        };
      }
      default:
        return operation;
    }
  });
}

function createImpact(operations: CollectionOperation[]): BuilderImpact[] {
  return operations.map((operation) => {
    switch (operation.type) {
      case 'dropField':
        return {
          level: 'destructive',
          operation: operation.type,
          message: `Dropping field ${operation.collection}.${operation.field} may remove existing data.`,
        };
      case 'dropCollection':
        return {
          level: 'destructive',
          operation: operation.type,
          message: `Dropping collection ${operation.collection} may remove the backing database object.`,
        };
      default:
        return {
          level: 'safe',
          operation: operation.type,
          message: `Operation ${operation.type} is planned.`,
        };
    }
  });
}

export function createCollectionBuilder(
  options: CollectionBuilderOptions = {},
): CollectionBuilder {
  return new CollectionBuilder(options);
}

function filterMetadataOperations(
  compiler: CollectionCompiler,
  operations: CollectionOperation[],
  schemaOperations: ReturnType<CollectionCompiler['compile']>,
  context: CollectionCompilerContext,
): CollectionOperation[] {
  const plannedViewNames = new Set(
    schemaOperations
      .filter((operation) => operation.type === 'createView')
      .map((operation) => operation.view.name),
  );

  return operations.filter(
    (operation) =>
      !isViewMetadataOperation(operation) ||
      compiler
        .compile([operation], context)
        .every(
          (schemaOperation) =>
            schemaOperation.type !== 'createView' ||
            plannedViewNames.has(schemaOperation.view.name),
        ),
  );
}

function isViewMetadataOperation(operation: CollectionOperation): boolean {
  return (
    operation.type === 'createViewCollection' ||
    operation.type === 'replaceViewCollection' ||
    operation.type === 'createMaterializedViewCollection'
  );
}

function applyAlterMetadata(
  current: CollectionDefinition,
  changes: CollectionAlterDefinition,
): CollectionDefinition {
  let fields = [...(current.fields ?? [])];
  fields.push(...(changes.addFields ?? []));
  for (const field of changes.alterFields ?? []) {
    const index = fields.findIndex((item) => item.name === field.name);
    if (index >= 0) {
      fields[index] = {
        ...fields[index],
        ...field.changes,
      } as AnyFieldDefinition;
    } else {
      throw new CollectionMetadataFieldNotFoundError(
        current.name ?? '(unknown collection)',
        field.name,
      );
    }
  }
  fields = fields.filter(
    (field) => !(changes.dropFields ?? []).includes(field.name),
  );

  let indexes = [...(current.indexes ?? []), ...(changes.addIndexes ?? [])];
  indexes = indexes.filter(
    (index) =>
      !index.name ||
      (!(changes.dropIndexes ?? []).includes(index.name) &&
        !(
          index.db?.unique === true &&
          (changes.dropConstraints ?? []).includes(index.name)
        )),
  );

  let constraints = [
    ...(current.constraints ?? []),
    ...(changes.addConstraints ?? []),
  ];
  constraints = constraints.filter(
    (constraint) =>
      !constraint.name ||
      !(changes.dropConstraints ?? []).includes(constraint.name),
  );

  return {
    ...current,
    optimisticLock:
      changes.optimisticLock === null
        ? undefined
        : (changes.optimisticLock ?? current.optimisticLock),
    fields,
    indexes,
    constraints,
  };
}

function assertOptimisticLockOperations(
  operations: CollectionOperation[],
  context: CollectionCompilerContext,
): void {
  const collections = new Map<string, CollectionDefinition>();
  for (const [name, definition] of Object.entries(context.collections ?? {})) {
    if (definition) collections.set(name, definition);
  }
  for (const operation of operations) {
    let name: string | undefined;
    let definition: CollectionDefinition | undefined;
    switch (operation.type) {
      case 'createCollection':
      case 'createViewCollection':
      case 'replaceViewCollection':
      case 'createMaterializedViewCollection':
        name = operation.name;
        definition = {
          ...operation.definition,
          name,
          kind:
            operation.type === 'createViewCollection' ||
            operation.type === 'replaceViewCollection'
              ? 'view'
              : operation.type === 'createMaterializedViewCollection'
                ? 'materializedView'
                : (operation.definition.kind ?? 'table'),
        };
        break;
      case 'alterCollection':
        name = operation.collection;
        if (
          !collections.get(name)?.optimisticLock &&
          operation.changes.optimisticLock === undefined
        ) {
          continue;
        }
        definition = applyAlterMetadata(
          collections.get(name) ?? { name },
          operation.changes,
        );
        break;
      case 'addField':
        name = operation.collection;
        if (!collections.get(name)?.optimisticLock) continue;
        definition = {
          ...(collections.get(name) ?? { name }),
          fields: [...(collections.get(name)?.fields ?? []), operation.field],
        };
        break;
      case 'alterField':
        name = operation.collection;
        if (!collections.get(name)?.optimisticLock) continue;
        definition = applyAlterMetadata(collections.get(name) ?? { name }, {
          alterFields: [{ name: operation.field, changes: operation.changes }],
        });
        break;
      case 'dropField':
        name = operation.collection;
        if (!collections.get(name)?.optimisticLock) continue;
        definition = applyAlterMetadata(collections.get(name) ?? { name }, {
          dropFields: [operation.field],
        });
        break;
      case 'dropCollection':
        collections.delete(operation.collection);
        continue;
      case 'renameCollection':
      case 'addIndex':
      case 'dropIndex':
      case 'addConstraint':
      case 'dropConstraint':
      case 'refreshMaterializedViewCollection':
        continue;
    }
    if (name && definition) {
      assertOptimisticLockDefinition(name, definition);
      collections.set(name, definition);
    }
  }
}

function assertOptimisticLockDefinition(
  name: string,
  definition: CollectionDefinition,
): void {
  const optimisticLock = definition.optimisticLock;
  if (!optimisticLock) return;
  const issues: Array<{
    code: 'COLLECTION_OPTIMISTIC_LOCK_INVALID';
    path: readonly (string | number)[];
    message: string;
  }> = [];
  if ((definition.kind ?? 'table') !== 'table') {
    issues.push({
      code: 'COLLECTION_OPTIMISTIC_LOCK_INVALID',
      path: ['optimisticLock'],
      message: 'Optimistic locking is only supported for table Collections.',
    });
  }
  const field = definition.fields?.find(
    (candidate) => candidate.name === optimisticLock.field,
  );
  if (!field || 'target' in field) {
    issues.push({
      code: 'COLLECTION_OPTIMISTIC_LOCK_INVALID',
      path: ['optimisticLock', 'field'],
      message: `Optimistic lock Field "${optimisticLock.field}" does not exist as a direct Field in Collection "${name}".`,
    });
  } else {
    if (field.type !== 'integer' && field.type !== 'bigInt') {
      issues.push({
        code: 'COLLECTION_OPTIMISTIC_LOCK_INVALID',
        path: ['optimisticLock', 'field'],
        message: `Optimistic lock Field "${optimisticLock.field}" must be integer or bigInt.`,
      });
    }
    if (field.nullable !== false) {
      issues.push({
        code: 'COLLECTION_OPTIMISTIC_LOCK_INVALID',
        path: ['optimisticLock', 'field'],
        message: `Optimistic lock Field "${optimisticLock.field}" must be non-nullable.`,
      });
    }
  }
  if (issues.length > 0) throw new CollectionResolutionError(issues);
}

function assertMetadataFieldChanges(
  operations: CollectionOperation[],
  context: CollectionCompilerContext,
): void {
  const collections = new Map<string, CollectionDefinition>();
  for (const [name, definition] of Object.entries(context.collections ?? {})) {
    if (definition) {
      collections.set(name, definition);
    }
  }

  for (const operation of operations) {
    switch (operation.type) {
      case 'createCollection':
      case 'createViewCollection':
      case 'replaceViewCollection':
      case 'createMaterializedViewCollection':
        collections.set(operation.name, {
          ...operation.definition,
          name: operation.name,
        });
        break;
      case 'dropCollection':
        collections.delete(operation.collection);
        break;
      case 'renameCollection': {
        const current = collections.get(operation.from) ?? {
          name: operation.from,
        };
        collections.delete(operation.from);
        collections.set(operation.to, { ...current, name: operation.to });
        break;
      }
      case 'alterCollection': {
        const current = collections.get(operation.collection) ?? {
          name: operation.collection,
        };
        collections.set(
          operation.collection,
          applyAlterMetadata(current, operation.changes),
        );
        break;
      }
      case 'addField': {
        const current = collections.get(operation.collection) ?? {
          name: operation.collection,
        };
        collections.set(operation.collection, {
          ...current,
          fields: [...(current.fields ?? []), operation.field],
        });
        break;
      }
      case 'alterField': {
        const current = collections.get(operation.collection) ?? {
          name: operation.collection,
        };
        collections.set(
          operation.collection,
          applyAlterMetadata(current, {
            alterFields: [
              { name: operation.field, changes: operation.changes },
            ],
          }),
        );
        break;
      }
      case 'dropField': {
        const current = collections.get(operation.collection);
        if (current) {
          collections.set(operation.collection, {
            ...current,
            fields: current.fields?.filter(
              (field) => field.name !== operation.field,
            ),
          });
        }
        break;
      }
      default:
        break;
    }
  }
}

function collectReferencedCollections(
  names: Set<string>,
  definition: CollectionDefinition,
): void {
  for (const field of definition.fields ?? []) {
    collectFieldReferences(names, field);
  }
  for (const constraint of definition.constraints ?? []) {
    collectConstraintReferences(names, constraint);
  }
  if (definition.view?.as?.from) {
    names.add(definition.view.as.from);
  }
}

function collectAlterReferences(
  names: Set<string>,
  changes: CollectionAlterDefinition,
): void {
  for (const field of changes.addFields ?? []) {
    collectFieldReferences(names, field);
  }
  for (const constraint of changes.addConstraints ?? []) {
    collectConstraintReferences(names, constraint);
  }
}

function collectFieldReferences(
  names: Set<string>,
  field: AnyFieldDefinition,
): void {
  if (!isRelationField(field)) {
    return;
  }

  names.add(field.target);
  if (field.through) {
    names.add(field.through);
  }
}

function isRelationField(
  field: AnyFieldDefinition,
): field is RelationFieldDefinition {
  return (
    'target' in field &&
    typeof field.target === 'string' &&
    (field.type === 'belongsTo' ||
      field.type === 'hasOne' ||
      field.type === 'hasMany' ||
      field.type === 'belongsToMany')
  );
}

function collectConstraintReferences(
  names: Set<string>,
  constraint: ConstraintDefinition,
): void {
  if (constraint.type === 'foreignKey') {
    names.add(constraint.references.collection);
  }
}

function assertSupportedBuilderOptions(
  options: CollectionBuilderOptions,
): void {
  if ('namingStrategy' in options) {
    throw new Error(
      'CollectionBuilder no longer supports a custom namingStrategy. Use connection or collection naming.tablePrefix instead.',
    );
  }
}

function assertNoPhysicalMappings(
  definition: CollectionDefinition,
  collection: string,
): void {
  if ('tableName' in definition) {
    throw new Error(
      `Collection "${collection}" no longer supports tableName. Use naming with a logical collection name instead.`,
    );
  }
  for (const field of definition.fields ?? []) {
    assertNoPhysicalFieldMapping(collection, field.name, field);
  }
}

function assertNoPhysicalFieldAlterMappings(
  collection: string,
  changes: CollectionAlterDefinition,
): void {
  for (const field of changes.alterFields ?? []) {
    assertNoPhysicalFieldMapping(collection, field.name, field.changes);
  }
}

function assertNoPhysicalFieldMapping(
  collection: string,
  field: string,
  definition: object,
): void {
  if ('columnName' in definition) {
    throw new Error(
      `Field "${collection}.${field}" no longer supports columnName. Its physical column name is derived from the logical field name and naming options.`,
    );
  }
}

async function assertRenameOperations(
  operations: CollectionOperation[],
  context: CollectionCompilerContext,
  metadata?: CollectionMetadataService,
): Promise<void> {
  for (const operation of operations) {
    if (operation.type !== 'renameCollection') {
      continue;
    }
    const collections = context.collections ?? {};
    const source = collections[operation.from];
    if (!source) {
      throw new Error(
        `Cannot rename collection "${operation.from}" because its metadata does not exist.`,
      );
    }
    const kind = source.kind ?? 'table';
    if (kind !== 'table') {
      throw new CollectionRenameUnsupportedKindError(
        operation.from,
        operation.to,
        kind,
      );
    }
    if (collections[operation.to]) {
      throw new Error(
        `Cannot rename collection "${operation.from}" to "${operation.to}" because the target collection already exists.`,
      );
    }
    const dependencies = collectRenameDependencies(operation.from, collections);
    if (dependencies.length > 0) {
      throw new CollectionRenameDependencyError(
        operation.from,
        operation.to,
        dependencies,
      );
    }
    if (metadata && (await metadata.get(operation.from))) {
      throw new CollectionRenameAtomicityError(operation.from, operation.to);
    }
  }
}

function extractSupplementalMetadata(
  name: string,
  definition: CollectionDefinition,
) {
  const result = extractLegacyCollectionMetadata({ ...definition, name });
  if (!result.document) {
    throw new CollectionMetadataExtractionError(name, result.diagnostics);
  }
  return result.document;
}

async function syncFieldMetadata(
  service: CollectionMetadataService,
  collection: string,
  field: AnyFieldDefinition,
  changes: Partial<AnyFieldDefinition> = field,
): Promise<void> {
  if (isRelationField(field)) {
    if (relationMetadataChanged(changes)) {
      const extracted = extractSupplementalMetadata(collection, {
        name: collection,
        fields: [field],
      });
      const relation = extracted.relations?.[field.name];
      if (relation) {
        await service.setRelation(collection, field.name, relation);
      }
    }
    return;
  }
  if (
    changes.type !== undefined ||
    ('values' in changes && changes.values !== undefined) ||
    changes.title !== undefined ||
    changes.description !== undefined
  ) {
    await service.updateField(collection, field.name, {
      type:
        changes.type === undefined
          ? undefined
          : (metadataFieldType(field.type) ?? null),
      title: changes.title,
      values: 'values' in changes ? changes.values : undefined,
      description: changes.description,
    });
  }
}

function relationMetadataChanged(
  changes: Partial<AnyFieldDefinition>,
): boolean {
  return [
    'type',
    'target',
    'sourceKey',
    'targetKey',
    'foreignKey',
    'otherKey',
    'through',
    'title',
    'description',
  ].some((property) => Object.hasOwn(changes, property));
}

function affectedCollections(operations: CollectionOperation[]): string[] {
  const names = new Set<string>();
  for (const operation of operations) {
    switch (operation.type) {
      case 'createCollection':
      case 'createViewCollection':
      case 'replaceViewCollection':
      case 'createMaterializedViewCollection':
        names.add(operation.name);
        break;
      case 'renameCollection':
        names.add(operation.from);
        names.add(operation.to);
        break;
      default:
        names.add(operation.collection);
        break;
    }
  }
  return [...names];
}

async function requiredMetadataWrite(
  operation: CollectionOperation,
  service: CollectionMetadataService,
): Promise<'put' | 'delete' | undefined> {
  switch (operation.type) {
    case 'createCollection':
    case 'createViewCollection':
    case 'replaceViewCollection':
    case 'createMaterializedViewCollection':
      return isEmptySupplementalMetadata(
        extractSupplementalMetadata(operation.name, operation.definition),
      )
        ? undefined
        : 'put';
    case 'dropCollection':
      return (await service.get(operation.collection)) ? 'delete' : undefined;
    case 'renameCollection':
      return undefined;
    case 'alterCollection': {
      if (
        operation.changes.optimisticLock !== undefined ||
        (operation.changes.addFields ?? []).some(
          fieldHasSupplementalMetadata,
        ) ||
        (operation.changes.alterFields ?? []).some((field) =>
          fieldChangesSupplementalMetadata(field.changes),
        )
      ) {
        return 'put';
      }
      const stored = await service.get(operation.collection);
      return (operation.changes.dropFields ?? []).some(
        (field) =>
          Object.hasOwn(stored?.document.fields ?? {}, field) ||
          Object.hasOwn(stored?.document.relations ?? {}, field),
      )
        ? 'put'
        : undefined;
    }
    case 'addField':
      return fieldHasSupplementalMetadata(operation.field) ? 'put' : undefined;
    case 'alterField':
      return fieldChangesSupplementalMetadata(operation.changes)
        ? 'put'
        : undefined;
    case 'dropField': {
      const stored = await service.get(operation.collection);
      return Object.hasOwn(stored?.document.fields ?? {}, operation.field) ||
        Object.hasOwn(stored?.document.relations ?? {}, operation.field)
        ? 'put'
        : undefined;
    }
    case 'addIndex':
    case 'dropIndex':
    case 'addConstraint':
    case 'dropConstraint':
    case 'refreshMaterializedViewCollection':
      return undefined;
  }
}

function isEmptySupplementalMetadata(
  document: ReturnType<typeof extractSupplementalMetadata>,
): boolean {
  return Object.keys(document).every(
    (key) => key === 'version' || key === 'name',
  );
}

function fieldHasSupplementalMetadata(field: AnyFieldDefinition): boolean {
  return isRelationField(field) || fieldChangesSupplementalMetadata(field);
}

function fieldChangesSupplementalMetadata(
  changes: Partial<AnyFieldDefinition>,
): boolean {
  return (
    relationMetadataChanged(changes) ||
    Object.hasOwn(changes, 'title') ||
    Object.hasOwn(changes, 'description')
  );
}

function collectRenameDependencies(
  target: string,
  collections: Record<string, CollectionDefinition | undefined>,
): CollectionRenameDependency[] {
  const dependencies: CollectionRenameDependency[] = [];
  for (const [collectionName, definition] of Object.entries(collections)) {
    if (!definition) {
      continue;
    }
    for (const field of definition.fields ?? []) {
      if (!isRelationField(field)) {
        continue;
      }
      if (field.target === target) {
        dependencies.push({
          kind: 'relationTarget',
          collection: collectionName,
          path: `fields.${field.name}.target`,
        });
      }
      if (field.through === target) {
        dependencies.push({
          kind: 'relationThrough',
          collection: collectionName,
          path: `fields.${field.name}.through`,
        });
      }
    }
    for (const [index, constraint] of (
      definition.constraints ?? []
    ).entries()) {
      if (
        constraint.type === 'foreignKey' &&
        constraint.references.collection === target
      ) {
        dependencies.push({
          kind: 'foreignKey',
          collection: collectionName,
          path: `constraints.${index}.references.collection`,
        });
      }
    }
    if (definition.view?.as?.from === target) {
      dependencies.push({
        kind: 'structuredView',
        collection: collectionName,
        path: 'view.as.from',
      });
    }
    if (definition.view?.asRaw) {
      dependencies.push({
        kind: 'rawView',
        collection: collectionName,
        path: 'view.asRaw',
      });
    }
  }
  return dependencies;
}

function formatRenameDependencyError(
  from: string,
  to: string,
  dependencies: CollectionRenameDependency[],
): string {
  const lines = dependencies.map(
    (dependency) =>
      `- ${dependency.collection}.${dependency.path} (${dependency.kind})`,
  );
  return [
    `Cannot rename collection "${from}" to "${to}" because dependent metadata cannot be updated atomically.`,
    ...lines,
    'Rename was not applied.',
  ].join('\n');
}
