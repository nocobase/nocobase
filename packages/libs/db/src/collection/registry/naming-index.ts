import type { NamingOptions } from '../types.js';
import type {
  CollectionNamingIdentity,
  CollectionResolutionContext,
} from '../resolver/types.js';
import { CollectionResolutionError } from '../resolver/errors.js';
import type {
  CollectionMetadataStore,
  CollectionMetadataSummary,
} from '../../metadata/document-store.js';
import { DefaultNamingStrategy } from '../../naming/default-strategy.js';
import type { PhysicalCollectionIdentifier } from '../../schema/inspector/types.js';
import {
  readMetadataNamingSnapshot,
  type CollectionMetadataNamingSnapshot,
} from '../../metadata/internal/naming-snapshot.js';

const indexes = new WeakMap<
  CollectionMetadataNamingSnapshot,
  Map<string, CollectionNamingIndex>
>();

export interface IndexedCollectionIdentity extends CollectionNamingIdentity {
  readonly tableName: string;
  readonly metadata?: CollectionMetadataSummary;
}

export class CollectionNamingIndex implements CollectionResolutionContext {
  private constructor(
    private readonly naming: Required<NamingOptions>,
    private readonly byName: ReadonlyMap<string, IndexedCollectionIdentity>,
    private readonly byTableName: ReadonlyMap<
      string,
      IndexedCollectionIdentity
    >,
  ) {}

  static async create(
    store: CollectionMetadataStore,
    naming: NamingOptions = {},
    overrides: readonly CollectionMetadataSummary[] = [],
  ): Promise<CollectionNamingIndex> {
    const snapshot = await readMetadataNamingSnapshot(store);
    const key = JSON.stringify(effectiveNaming(naming));
    const cached = indexes.get(snapshot)?.get(key);
    if (cached && overrides.length === 0) return cached;
    const summaries = [...snapshot];
    for (const override of overrides) {
      const index = summaries.findIndex((item) => item.name === override.name);
      if (index >= 0) summaries[index] = override;
      else summaries.push(override);
    }

    const effectiveDefault = effectiveNaming(naming);
    const byName = new Map<string, IndexedCollectionIdentity>();
    const byTableName = new Map<string, IndexedCollectionIdentity>();
    for (const summary of summaries) {
      const effective = effectiveNaming(naming, summary.naming);
      const tableName = new DefaultNamingStrategy(
        effective,
      ).collectionToTableName(summary.name);
      const identity: IndexedCollectionIdentity = {
        name: summary.name,
        naming: effective,
        tableName,
        metadata: summary,
      };
      const conflicting = byTableName.get(tableName);
      if (conflicting && conflicting.name !== summary.name) {
        throw new CollectionResolutionError([
          {
            code: 'COLLECTION_NAME_CONFLICT',
            path: ['metadata', summary.name, 'naming'],
            message: `Collections "${conflicting.name}" and "${summary.name}" map to the same physical table "${tableName}".`,
          },
        ]);
      }
      byName.set(summary.name, identity);
      byTableName.set(tableName, identity);
    }
    const index = new CollectionNamingIndex(
      effectiveDefault,
      byName,
      byTableName,
    );
    if (overrides.length === 0) {
      const variants =
        indexes.get(snapshot) ?? new Map<string, CollectionNamingIndex>();
      variants.set(key, index);
      indexes.set(snapshot, variants);
    }
    return index;
  }

  resolveLogicalCollection(name: string): IndexedCollectionIdentity {
    return (
      this.byName.get(name) ?? {
        name,
        naming: this.naming,
        tableName: new DefaultNamingStrategy(this.naming).collectionToTableName(
          name,
        ),
      }
    );
  }

  resolvePhysicalCollection(
    identity: PhysicalCollectionIdentifier,
  ): CollectionNamingIdentity | undefined {
    const explicit = this.byTableName.get(identity.tableName);
    if (explicit) return explicit;
    const prefix = this.naming.tablePrefix;
    if (!identity.tableName.startsWith(prefix)) return undefined;
    const unprefixed = identity.tableName.slice(prefix.length);
    const name = reverseIdentifier(unprefixed, this.naming.underscored);
    if (!name) return undefined;
    const strategy = new DefaultNamingStrategy(this.naming);
    if (strategy.collectionToTableName(name) !== identity.tableName) {
      return undefined;
    }
    const explicitLogical = this.byName.get(name);
    if (explicitLogical) {
      throw new CollectionResolutionError([
        {
          code: 'COLLECTION_NAME_CONFLICT',
          path: [
            'physical',
            identity.schema ?? '<default>',
            identity.tableName,
          ],
          message: `Physical Collection "${identity.schema ?? '<default>'}.${identity.tableName}" maps to logical name "${name}", which Metadata maps to "${explicitLogical.tableName}".`,
        },
      ]);
    }
    return { name, naming: this.naming };
  }

  physicalTableNamePrefixes(requested?: readonly string[]): readonly string[] {
    const managed = [
      ...new Set([
        this.naming.tablePrefix,
        ...[...this.byName.values()].map(
          (identity) => identity.naming.tablePrefix,
        ),
      ]),
    ];
    if (requested === undefined) return managed.sort();

    const intersection = new Set<string>();
    for (const managedPrefix of managed) {
      for (const requestedPrefix of requested) {
        if (managedPrefix.startsWith(requestedPrefix)) {
          intersection.add(managedPrefix);
        } else if (requestedPrefix.startsWith(managedPrefix)) {
          intersection.add(requestedPrefix);
        }
      }
    }
    return [...intersection].sort();
  }

  metadata(name: string): CollectionMetadataSummary | undefined {
    return this.byName.get(name)?.metadata;
  }
}

function effectiveNaming(
  connection: NamingOptions = {},
  collection: NamingOptions = {},
): Required<NamingOptions> {
  return {
    underscored: collection.underscored ?? connection.underscored ?? true,
    tablePrefix: collection.tablePrefix ?? connection.tablePrefix ?? '',
  };
}

function reverseIdentifier(
  physicalName: string,
  underscored: boolean,
): string | undefined {
  if (!physicalName) return undefined;
  return underscored
    ? physicalName.replace(/_([a-z])/g, (_match: string, character: string) =>
        character.toUpperCase(),
      )
    : physicalName;
}
