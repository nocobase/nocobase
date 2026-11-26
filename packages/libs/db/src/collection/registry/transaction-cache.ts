import type {
  CollectionSchemaVersion,
  DatabaseCollectionMetadataStore,
} from '../../metadata/internal/database-document-store.js';
import type { CollectionResolutionResult } from '../resolver/types.js';
import type { CollectionNamingIndex } from './naming-index.js';

interface VersionEntries {
  readonly version: CollectionSchemaVersion;
  index?: CollectionNamingIndex;
  readonly collections: Map<string, CollectionResolutionResult | undefined>;
}

function entries(version: CollectionSchemaVersion): VersionEntries {
  return { version, collections: new Map() };
}

function matches(
  left: CollectionSchemaVersion | undefined,
  right: CollectionSchemaVersion | undefined,
): boolean {
  return (
    left !== undefined &&
    left.sequence === right?.sequence &&
    left.version === right.version
  );
}

/** Keeps only the newest observed committed version for one connection family. */
export class CommittedCollectionCache {
  private current?: VersionEntries;
  private conflictingVersion = false;

  observe(version: CollectionSchemaVersion): VersionEntries | undefined {
    if (!this.current || version.sequence > this.current.version.sequence) {
      this.current = entries(version);
      this.conflictingVersion = false;
    } else if (
      version.sequence === this.current.version.sequence &&
      !matches(version, this.current.version)
    ) {
      // An old writer may update the UUID without advancing the sequence.
      this.conflictingVersion = true;
    }
    return !this.conflictingVersion && matches(version, this.current.version)
      ? this.current
      : undefined;
  }

  reset(): void {
    this.current = undefined;
    this.conflictingVersion = false;
  }

  publish(candidate: VersionEntries): void {
    if (
      this.conflictingVersion ||
      !matches(candidate.version, this.current?.version)
    )
      return;
    const current = this.current!;
    current.index ??= candidate.index;
    for (const [name, result] of candidate.collections) {
      if (result) current.collections.set(name, result);
    }
  }
}

/** A transaction only publishes entries after COMMIT, including released savepoints. */
export class TransactionCollectionCache {
  private pending?: VersionEntries;
  private shared?: VersionEntries;
  private version?: CollectionSchemaVersion;
  private probed = false;
  private sqliteProbe?: Promise<CollectionSchemaVersion | undefined>;
  private readonly visitedTables = new Set<string>();
  private readonly visitedCollections = new Set<string>();
  private readonly local = new Map<
    string,
    CollectionResolutionResult | undefined
  >();
  private index?: CollectionNamingIndex;
  private dirty = false;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: DatabaseCollectionMetadataStore,
    private readonly committed: CommittedCollectionCache,
    private readonly dialect: 'postgres' | 'sqlite',
    private readonly generation: number,
    private readonly parent: TransactionCollectionCache | undefined = undefined,
  ) {
    this.generation = parent?.generation ?? generation;
  }

  invalidate(): void {
    this.dirty = true;
    this.clear();
  }

  commit(): void {
    if (!this.eligible) return;
    if (this.parent) {
      this.parent.sqliteProbe ??= this.sqliteProbe;
      for (const name of this.visitedCollections)
        this.parent.visitedCollections.add(name);
      for (const table of this.visitedTables)
        this.parent.visitedTables.add(table);
      if (
        this.pending &&
        (!this.parent.version ||
          this.pending.version.sequence >= this.parent.version.sequence)
      ) {
        this.parent.select(this.pending.version);
        const target = this.parent.pending;
        if (!target) return;
        target.index ??= this.pending.index;
        for (const [name, result] of this.pending.collections)
          target.collections.set(name, result);
      }
    } else if (this.pending) {
      this.committed.publish(this.pending);
    }
  }

  namingForInspection(
    createIndex: (
      version?: CollectionSchemaVersion,
    ) => Promise<CollectionNamingIndex>,
  ): Promise<CollectionNamingIndex> | undefined {
    if (!this.eligible) return undefined;
    const result = this.queue.then(async () => {
      if (this.dialect === 'postgres') return this.index ?? createIndex();
      this.select(await this.probe());
      const index = await this.namingIndex(createIndex);
      if (this.pending) this.pending.index = index;
      return index;
    });
    this.queue = result.catch(() => {});
    return result;
  }

  resolve(
    name: string,
    forQuery: boolean,
    createIndex: (
      version?: CollectionSchemaVersion,
    ) => Promise<CollectionNamingIndex>,
    load: (
      name: string,
      index: CollectionNamingIndex,
    ) => Promise<CollectionResolutionResult | undefined>,
  ): Promise<CollectionResolutionResult | undefined> {
    const result = this.queue.then(async () => {
      const visited = forQuery ? this.visitedTables : this.visitedCollections;
      if (!visited.has(name)) {
        const parentVisited = forQuery
          ? this.parent?.visitedTables
          : this.parent?.visitedCollections;
        if (!parentVisited?.has(name) || !this.version) {
          const version = parentVisited?.has(name)
            ? this.parent?.version
            : await this.probe();
          this.select(version);
        }
        visited.add(name);
      }

      const index = await this.namingIndex(createIndex);
      const logicalName = forQuery
        ? index.resolvePhysicalCollection({ tableName: name })?.name
        : name;
      if (logicalName === undefined) return undefined;
      this.visitedCollections.add(logicalName);
      this.visitedTables.add(
        index.resolveLogicalCollection(logicalName).tableName,
      );
      if (this.local.has(logicalName)) return this.local.get(logicalName);
      const cached = this.pending?.collections.has(logicalName)
        ? this.pending
        : this.shared;
      if (cached?.collections.has(logicalName))
        return cached.collections.get(logicalName);
      const resolved = await load(logicalName, index);
      if (!this.eligible) return resolved;

      if (this.version && this.dialect === 'postgres') {
        // Catalog inspection and metadata reads are separate READ COMMITTED
        // statements. Publish only if they were bracketed by the same token.
        const verified = await this.probe();
        if (!matches(this.version, verified)) {
          this.select(verified);
          const currentIndex = await this.namingIndex(createIndex);
          const currentName = forQuery
            ? currentIndex.resolvePhysicalCollection({ tableName: name })?.name
            : name;
          return currentName === undefined
            ? undefined
            : load(currentName, currentIndex);
        }
      }
      this.local.set(logicalName, resolved);
      if (this.pending) {
        this.pending.index = index;
        this.pending.collections.set(logicalName, resolved);
      }
      return resolved;
    });
    this.queue = result.catch(() => {});
    return result;
  }

  private async namingIndex(
    createIndex: (
      version?: CollectionSchemaVersion,
    ) => Promise<CollectionNamingIndex>,
  ): Promise<CollectionNamingIndex> {
    if (!this.index) {
      this.index = this.shared?.index ?? (await createIndex(this.version));
    }
    return this.index;
  }

  get eligible(): boolean {
    return (
      !this.dirty &&
      (!this.parent || this.parent.eligible) &&
      this.generation === this.store.cacheGeneration
    );
  }

  private clear(): void {
    this.version = undefined;
    this.index = undefined;
    this.shared = undefined;
    this.pending = undefined;
    this.local.clear();
  }

  private select(version: CollectionSchemaVersion | undefined): void {
    if (
      matches(version, this.version) ||
      (this.dialect === 'sqlite' && this.probed && !version && !this.version)
    )
      return;
    this.probed = true;
    this.clear();
    if (!version || !this.eligible) return;
    this.version = version;
    this.shared = this.committed.observe(version);
    if (this.shared) this.pending = entries(version);
  }

  private probe(): Promise<CollectionSchemaVersion | undefined> {
    if (!this.eligible) return Promise.resolve(undefined);
    if (this.dialect === 'sqlite') {
      this.sqliteProbe ??=
        this.parent?.sqliteProbe ?? this.store.readSchemaVersion();
      return this.sqliteProbe;
    }
    return this.store.readSchemaVersion();
  }
}
