import type {
  CollectionDefinition,
  CollectionKind,
  NamingOptions,
} from '../types.js';
import { CollectionResolver } from '../resolver/resolver.js';
import { CollectionResolutionError } from '../resolver/errors.js';
import type { CollectionResolutionResult } from '../resolver/types.js';
import type { CollectionMetadataStore } from '../../metadata/document-store.js';
import type { StoredCollectionMetadata } from '../../metadata/document.js';
import { invalidateMetadataNamingSnapshot } from '../../metadata/internal/naming-snapshot.js';
import type {
  CollectionMetadataInvalidation,
  CollectionMetadataInvalidator,
} from '../../metadata/service.js';
import { DefaultNamingStrategy } from '../../naming/default-strategy.js';
import type {
  PhysicalCollectionKind,
  PhysicalCollectionSchema,
  PhysicalCollectionSummary,
  SchemaInspector,
} from '../../schema/inspector/types.js';
import { CollectionNamingIndex } from './naming-index.js';
import { CollectionRelationValidator } from './relation-validator.js';
import type {
  CollectionDiagnosis,
  CollectionDiagnosisIssue,
  CollectionSummary,
  CollectionSummaryPage,
  ConnectionCollections,
  ListCollectionsOptions,
  ScanCollectionsOptions,
} from './types.js';

/** Metadata records read per page while diagnosing. */
const DIAGNOSE_PAGE_SIZE = 200;

export interface CollectionRegistryOptions {
  readonly inspector: SchemaInspector;
  readonly metadataStore: CollectionMetadataStore;
  readonly naming?: NamingOptions;
  readonly resolver?: CollectionResolver;
  readonly isInternalPhysicalCollection?: (identity: {
    readonly tableName: string;
    readonly schema: string;
  }) => boolean;
}

interface LogicalCollectionInspection {
  readonly physical: PhysicalCollectionSchema;
  readonly stored?: StoredCollectionMetadata;
}

export class CollectionRegistry
  implements ConnectionCollections, CollectionMetadataInvalidator
{
  private readonly cache = new Map<string, CollectionResolutionResult>();
  private readonly inFlight = new Map<
    string,
    Promise<CollectionResolutionResult | undefined>
  >();
  private readonly resolver: CollectionResolver;
  private generation = 0;
  private readonly collectionGenerations = new Map<string, number>();
  private namingIndexPromise?: Promise<CollectionNamingIndex>;
  private initializationPromise?: Promise<void>;
  private readonly relationValidator: CollectionRelationValidator;

  constructor(private readonly options: CollectionRegistryOptions) {
    this.resolver = options.resolver ?? new CollectionResolver();
    this.relationValidator = new CollectionRelationValidator({
      get: (name) => this.get(name),
      scan: () => this.scan(),
    });
  }

  async initialize(): Promise<void> {
    if (!this.initializationPromise) {
      const initializing = this.options.metadataStore.initialize();
      this.initializationPromise = initializing.catch((error: unknown) => {
        this.initializationPromise = undefined;
        throw error;
      });
    }
    await this.initializationPromise;
  }

  async get(name: string): Promise<CollectionDefinition | undefined> {
    return (await this.getResolution(name))?.collection;
  }

  /** Resolve Query's relative table identifiers without treating them as logical names. */
  async getForQuery(name: string): Promise<CollectionDefinition | undefined> {
    const index = await this.namingIndex();
    const tableName = new DefaultNamingStrategy(
      this.options.naming,
    ).collectionToTableName(name);
    const identity = index.resolvePhysicalCollection({ tableName });
    return identity ? this.get(identity.name) : undefined;
  }

  async getPhysical(
    name: string,
  ): Promise<PhysicalCollectionSchema | undefined> {
    validateName(name);
    const index = await this.namingIndex();
    const inspected = await this.inspectLogicalCollection(name, index);
    return inspected ? structuredClone(inspected.physical) : undefined;
  }

  async getResolution(
    name: string,
  ): Promise<CollectionResolutionResult | undefined> {
    const result = await this.getResolutionInternal(name);
    return result ? structuredClone(result) : undefined;
  }

  private async getResolutionInternal(
    name: string,
  ): Promise<CollectionResolutionResult | undefined> {
    validateName(name);
    const cached = this.cache.get(name);
    if (cached) return cached;
    const loading = this.inFlight.get(name);
    if (loading) return loading;

    const token = this.generationToken(name);
    const promise = this.load(name).then((result) => {
      if (result && this.sameGeneration(name, token)) {
        this.cache.set(name, result);
      }
      return result;
    });
    this.inFlight.set(name, promise);
    try {
      return await promise;
    } finally {
      if (this.inFlight.get(name) === promise) this.inFlight.delete(name);
    }
  }

  async list(
    options: ListCollectionsOptions = {},
  ): Promise<CollectionSummaryPage> {
    await this.initialize();
    const index = await this.namingIndex();
    const limit = options.limit ?? 100;
    const tableNamePrefixes = index.physicalTableNamePrefixes(
      options.tableNamePrefixes,
    );
    const seen = new Map<string, PhysicalCollectionSummary>();
    const items: CollectionSummary[] = [];
    let cursor = options.cursor;
    let nextCursor: string | undefined;
    do {
      const page = await this.options.inspector.listPhysicalCollections({
        ...options,
        tableNamePrefixes,
        limit: limit - items.length,
        cursor,
      });
      for (const physical of page.items) {
        if (this.options.isInternalPhysicalCollection?.(physical)) continue;
        const identity = index.resolvePhysicalCollection(physical);
        if (!identity) throw physicalNameError(physical);
        const duplicate = seen.get(identity.name);
        if (
          duplicate &&
          (duplicate.tableName !== physical.tableName ||
            duplicate.schema !== physical.schema)
        ) {
          throw logicalNameConflict(identity.name, duplicate, physical);
        }
        seen.set(identity.name, physical);
        const metadata = index.metadata(identity.name);
        items.push(summarize(physical, identity.name, metadata));
      }
      nextCursor = page.nextCursor;
      cursor = nextCursor;
    } while (items.length < limit && nextCursor);
    return nextCursor ? { items, nextCursor } : { items };
  }

  async *scan(
    options: ScanCollectionsOptions = {},
  ): AsyncIterable<CollectionDefinition> {
    await this.initialize();
    const index = await this.namingIndex();
    const tableNamePrefixes = index.physicalTableNamePrefixes(
      options.tableNamePrefixes,
    );
    const seen = new Map<string, PhysicalCollectionSchema>();
    for await (const physical of this.options.inspector.scanPhysicalCollections(
      { ...options, tableNamePrefixes },
    )) {
      if (this.options.isInternalPhysicalCollection?.(physical)) continue;
      const identity = index.resolvePhysicalCollection(physical);
      if (!identity) throw physicalNameError(physical);
      const duplicate = seen.get(identity.name);
      if (
        duplicate &&
        (duplicate.tableName !== physical.tableName ||
          duplicate.schema !== physical.schema)
      ) {
        throw logicalNameConflict(identity.name, duplicate, physical);
      }
      seen.set(identity.name, physical);
      const stored = await this.options.metadataStore.get(identity.name);
      const token = this.generationToken(identity.name);
      const result = this.resolver.resolve({
        physical,
        metadata: stored?.document,
        naming: this.options.naming,
        context: index,
      });
      if (this.sameGeneration(identity.name, token)) {
        this.cache.set(identity.name, result);
      }
      yield structuredClone(result.collection);
    }
  }

  async refresh(name: string): Promise<CollectionDefinition | undefined> {
    this.invalidate(name);
    return this.get(name);
  }

  invalidate(name?: string): void;
  invalidate(change: CollectionMetadataInvalidation): void;
  invalidate(input?: string | CollectionMetadataInvalidation): void {
    if (typeof input === 'string') {
      this.bumpCollectionGeneration(input);
      this.cache.delete(input);
      this.inFlight.delete(input);
      return;
    }
    if (input) {
      for (const name of input.collections) {
        this.bumpCollectionGeneration(name);
        this.cache.delete(name);
        this.inFlight.delete(name);
      }
      if (input.namingIndex) this.namingIndexPromise = undefined;
      return;
    }
    this.invalidateAll();
  }

  invalidateAll(): void {
    invalidateMetadataNamingSnapshot(this.options.metadataStore);
    this.generation += 1;
    this.collectionGenerations.clear();
    this.cache.clear();
    this.inFlight.clear();
    this.namingIndexPromise = undefined;
  }

  async validateRelations(name?: string): Promise<void> {
    await this.relationValidator.validateGraph(name);
  }

  async diagnose(): Promise<CollectionDiagnosis> {
    const index = await this.namingIndex();
    const issues: CollectionDiagnosisIssue[] = [];
    let checked = 0;
    let cursor: string | undefined;

    do {
      const page = await this.options.metadataStore.list({
        limit: DIAGNOSE_PAGE_SIZE,
        ...(cursor === undefined ? {} : { cursor }),
      });
      for (const { name } of page.items) {
        checked += 1;
        const { tableName } = index.resolveLogicalCollection(name);
        const physical = await this.options.inspector.getPhysicalCollection({
          tableName,
        });
        if (!physical) {
          issues.push({
            name,
            tableName,
            code: 'COLLECTION_TABLE_MISSING',
            message: `Metadata Collection "${name}" maps to missing physical table "${tableName}".`,
            orphaned: true,
          });
          continue;
        }

        // The table is there, so whatever disagrees is inside it. Resolving is
        // what the runtime does, so its own issues are what to report.
        try {
          await this.get(name);
        } catch (error) {
          if (!(error instanceof CollectionResolutionError)) throw error;
          for (const issue of error.issues)
            issues.push({
              name,
              tableName,
              code: issue.code,
              message: issue.message,
              orphaned: false,
            });
        }
      }
      cursor = page.nextCursor;
    } while (cursor);

    return { checked, issues };
  }

  private async load(
    name: string,
  ): Promise<CollectionResolutionResult | undefined> {
    const index = await this.namingIndex();
    const inspected = await this.inspectLogicalCollection(name, index);
    if (!inspected) return undefined;
    return this.resolver.resolve({
      physical: inspected.physical,
      metadata: inspected.stored?.document,
      naming: this.options.naming,
      context: index,
    });
  }

  private async inspectLogicalCollection(
    name: string,
    index: CollectionNamingIndex,
  ): Promise<LogicalCollectionInspection | undefined> {
    const identity = index.resolveLogicalCollection(name);
    const [physical, stored] = await Promise.all([
      this.options.inspector.getPhysicalCollection({
        tableName: identity.tableName,
      }),
      this.options.metadataStore.get(name),
    ]);
    if (physical && this.options.isInternalPhysicalCollection?.(physical)) {
      return undefined;
    }
    if (!physical) {
      if (stored) {
        throw new CollectionResolutionError([
          {
            code: 'COLLECTION_SCHEMA_DRIFT',
            path: ['metadata', name],
            message: `Metadata Collection "${name}" maps to missing physical table "${identity.tableName}".`,
          },
        ]);
      }
      return undefined;
    }
    const canonical = index.resolvePhysicalCollection(physical);
    if (canonical && canonical.name !== name) {
      throw new CollectionResolutionError([
        {
          code: 'COLLECTION_NAME_CONFLICT',
          path: ['collections', name],
          message: `Collection name "${name}" resolves to physical table "${physical.tableName}", which belongs to logical Collection "${canonical.name}". Use the logical Collection name "${canonical.name}".`,
        },
      ]);
    }
    if (identity.metadata) {
      const defaultTableName = new DefaultNamingStrategy(
        this.options.naming,
      ).collectionToTableName(name);
      if (defaultTableName !== identity.tableName) {
        const conflicting = await this.options.inspector.getPhysicalCollection({
          tableName: defaultTableName,
        });
        if (conflicting) {
          throw logicalNameConflict(name, conflicting, physical);
        }
      }
    }
    return { physical, stored };
  }

  private namingIndex(): Promise<CollectionNamingIndex> {
    if (!this.namingIndexPromise) {
      const created = this.initialize().then(() =>
        CollectionNamingIndex.create(
          this.options.metadataStore,
          this.options.naming,
        ),
      );
      this.namingIndexPromise = created.catch((error: unknown) => {
        this.namingIndexPromise = undefined;
        throw error;
      });
    }
    return this.namingIndexPromise;
  }

  private generationToken(name: string): readonly [number, number] {
    return [this.generation, this.collectionGenerations.get(name) ?? 0];
  }

  private sameGeneration(
    name: string,
    token: readonly [number, number],
  ): boolean {
    return (
      token[0] === this.generation &&
      token[1] === (this.collectionGenerations.get(name) ?? 0)
    );
  }

  private bumpCollectionGeneration(name: string): void {
    this.collectionGenerations.set(
      name,
      (this.collectionGenerations.get(name) ?? 0) + 1,
    );
  }
}

function summarize(
  physical: PhysicalCollectionSummary,
  name: string,
  metadata:
    | {
        readonly title?: string;
        readonly description?: string;
      }
    | undefined,
): CollectionSummary {
  const base = {
    name,
    tableName: physical.tableName,
    schema: physical.schema,
    kind: collectionKind(physical.kind),
  };
  return metadata?.title !== undefined || metadata?.description !== undefined
    ? {
        ...base,
        ...(metadata.title !== undefined ? { title: metadata.title } : {}),
        ...(metadata.description !== undefined
          ? { description: metadata.description }
          : {}),
      }
    : base;
}

function collectionKind(kind: PhysicalCollectionKind): CollectionKind {
  if (kind === 'view') return 'view';
  if (kind === 'materializedView') return 'materializedView';
  return 'table';
}

function validateName(name: string): void {
  if (typeof name !== 'string' || name.length === 0 || name.trim() !== name) {
    throw new CollectionResolutionError([
      {
        code: 'COLLECTION_NAME_CONFLICT',
        path: ['name'],
        message:
          'Collection name must be a non-empty string without surrounding whitespace.',
      },
    ]);
  }
}

function physicalNameError(
  physical: PhysicalCollectionSummary,
): CollectionResolutionError {
  return new CollectionResolutionError([
    {
      code: 'COLLECTION_NAME_CONFLICT',
      path: ['physical', physical.schema, physical.tableName],
      message: `Physical Collection "${physical.schema}.${physical.tableName}" cannot be mapped to a logical name.`,
    },
  ]);
}

function logicalNameConflict(
  name: string,
  first: PhysicalCollectionSummary,
  second: PhysicalCollectionSummary,
): CollectionResolutionError {
  return new CollectionResolutionError([
    {
      code: 'COLLECTION_NAME_CONFLICT',
      path: ['collections', name],
      message: `Physical Collections "${first.schema}.${first.tableName}" and "${second.schema}.${second.tableName}" map to the same logical name "${name}".`,
    },
  ]);
}
