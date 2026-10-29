import { describe, expect, it } from 'vitest';
import { CollectionRegistry } from '../../../src/collection/registry/registry.js';
import { CollectionRelationValidationError } from '../../../src/collection/registry/relation-validator.js';
import { InMemoryCollectionMetadataStore } from '../../../src/index.js';
import type {
  ListPhysicalCollectionsOptions,
  PhysicalCollectionIdentifier,
  PhysicalCollectionPage,
  PhysicalCollectionSchema,
  ScanPhysicalCollectionsOptions,
  SchemaInspector,
} from '../../../src/schema/inspector/types.js';

describe('CollectionRegistry', () => {
  it.each(['get', 'getResolution', 'getPhysical'] as const)(
    '%s rejects physical aliases while retaining the logical collection',
    async (method) => {
      const store = new InMemoryCollectionMetadataStore();
      await store.put(
        { version: 1, name: 'customerOrders', title: 'Customer orders' },
        { expectedRevision: null },
      );
      const registry = new CollectionRegistry({
        inspector: new FakeInspector([physical('customer_orders')]),
        metadataStore: store,
      });
      await expect(registry[method]('customer_orders')).rejects.toMatchObject({
        issues: [
          expect.objectContaining({
            code: 'COLLECTION_NAME_CONFLICT',
            message: expect.stringContaining(
              'logical Collection "customerOrders"',
            ),
          }),
        ],
      });
      await expect(registry.get('customerOrders')).resolves.toMatchObject({
        name: 'customerOrders',
        title: 'Customer orders',
      });
      registry.invalidate('customerOrders');
      await expect(registry[method]('customer_orders')).rejects.toThrow(
        'customerOrders',
      );
    },
  );

  it('checks aliases against collection naming overrides', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      {
        version: 1,
        name: 'customerOrders',
        naming: { tablePrefix: 'legacy_' },
      },
      { expectedRevision: null },
    );
    const registry = new CollectionRegistry({
      inspector: new FakeInspector([physical('legacy_customer_orders')]),
      metadataStore: store,
    });
    await expect(registry.get('legacy_customer_orders')).rejects.toThrow(
      'customerOrders',
    );
    await expect(registry.get('customerOrders')).resolves.toMatchObject({
      name: 'customerOrders',
    });
  });

  it('preserves explicit underscored logical names and metadata-free external tables', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      { version: 1, name: 'customer_orders', title: 'Explicit name' },
      { expectedRevision: null },
    );
    const registry = new CollectionRegistry({
      inspector: new FakeInspector([
        physical('app_customer_orders'),
        physical('app_external_events'),
      ]),
      metadataStore: store,
      naming: { tablePrefix: 'app_' },
    });
    await expect(registry.get('customer_orders')).resolves.toMatchObject({
      name: 'customer_orders',
      title: 'Explicit name',
    });
    await expect(registry.get('externalEvents')).resolves.toMatchObject({
      name: 'externalEvents',
    });
    await expect(registry.get('external_events')).rejects.toThrow(
      'externalEvents',
    );
    await expect(registry.get('missing')).resolves.toBeUndefined();
  });

  it('deduplicates concurrent loads, caches clones, refreshes, and avoids negative caching', async () => {
    const inspector = new FakeInspector([physical('orders')]);
    const registry = new CollectionRegistry({
      inspector,
      metadataStore: new InMemoryCollectionMetadataStore(),
    });

    const [first, second] = await Promise.all([
      registry.get('orders'),
      registry.get('orders'),
    ]);
    expect(inspector.getCalls).toBe(1);
    first!.fields![0].type = 'text';
    expect(second?.fields?.[0]?.type).toBe('bigInt');
    expect((await registry.get('orders'))?.fields?.[0]?.type).toBe('bigInt');
    expect(inspector.getCalls).toBe(1);

    await registry.refresh('orders');
    expect(inspector.getCalls).toBe(2);

    await expect(registry.get('missing')).resolves.toBeUndefined();
    inspector.schemas.set('missing', physical('missing'));
    await expect(registry.get('missing')).resolves.toBeDefined();
    expect(inspector.getCalls).toBe(4);
  });

  it('does not let an invalidated in-flight result repopulate the cache', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const inspector = new FakeInspector([physical('orders')]);
    inspector.beforeGet = async () => gate;
    const registry = new CollectionRegistry({
      inspector,
      metadataStore: new InMemoryCollectionMetadataStore(),
    });

    const loading = registry.get('orders');
    await Promise.resolve();
    registry.invalidate('orders');
    release!();
    await loading;
    inspector.beforeGet = undefined;
    await registry.get('orders');

    expect(inspector.getCalls).toBe(2);
  });

  it('uses Metadata naming overrides and returns lightweight paginated summaries', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      {
        version: 1,
        name: 'orders',
        naming: { tablePrefix: 'legacy_' },
        title: 'Orders',
        description: 'Sales orders',
      },
      { expectedRevision: null },
    );
    const inspector = new FakeInspector([physical('legacy_orders')]);
    const registry = new CollectionRegistry({
      inspector,
      metadataStore: store,
    });

    expect(await registry.get('orders')).toMatchObject({
      name: 'orders',
      title: 'Orders',
      naming: { tablePrefix: 'legacy_' },
    });
    await expect(registry.getPhysical('orders')).resolves.toMatchObject({
      tableName: 'legacy_orders',
      schema: 'public',
    });
    expect(await registry.list({ limit: 10 })).toEqual({
      items: [
        {
          name: 'orders',
          tableName: 'legacy_orders',
          schema: 'public',
          kind: 'table',
          title: 'Orders',
          description: 'Sales orders',
        },
      ],
    });
  });

  it('limits listing and scanning to effective table prefixes', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      {
        version: 1,
        name: 'events',
        naming: { tablePrefix: 'archive_' },
      },
      { expectedRevision: null },
    );
    const inspector = new FakeInspector([
      physical('app_orders'),
      physical('archive_events'),
      physical('other_customers'),
    ]);
    const registry = new CollectionRegistry({
      inspector,
      metadataStore: store,
      naming: { tablePrefix: 'app_' },
    });

    await expect(registry.list()).resolves.toMatchObject({
      items: [
        expect.objectContaining({ name: 'orders' }),
        expect.objectContaining({ name: 'events' }),
      ],
    });
    expect(inspector.listOptions?.tableNamePrefixes).toEqual([
      'app_',
      'archive_',
    ]);

    const names: string[] = [];
    for await (const collection of registry.scan()) {
      names.push(collection.name!);
    }
    expect(names).toEqual(['orders', 'events']);
    expect(inspector.scanOptions?.tableNamePrefixes).toEqual([
      'app_',
      'archive_',
    ]);
  });

  it('reports drift when saved Metadata points at a missing physical Collection', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      { version: 1, name: 'orders', title: 'Orders' },
      { expectedRevision: null },
    );
    const registry = new CollectionRegistry({
      inspector: new FakeInspector([]),
      metadataStore: store,
    });

    await expect(registry.get('orders')).rejects.toMatchObject({
      code: 'COLLECTION_RESOLUTION_FAILED',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'COLLECTION_SCHEMA_DRIFT' }),
      ]),
    });
    await expect(registry.getPhysical('orders')).rejects.toMatchObject({
      code: 'COLLECTION_RESOLUTION_FAILED',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'COLLECTION_SCHEMA_DRIFT' }),
      ]),
    });
  });

  it('reads fresh physical schemas by logical name', async () => {
    const inspector = new FakeInspector([physical('app_orders')]);
    const registry = new CollectionRegistry({
      inspector,
      metadataStore: new InMemoryCollectionMetadataStore(),
      naming: { tablePrefix: 'app_' },
    });

    const first = await registry.getPhysical('orders');
    inspector.schemas.set(
      'app_orders',
      physical('app_orders', ['id', 'status']),
    );
    const second = await registry.getPhysical('orders');

    expect(first?.tableName).toBe('app_orders');
    expect(second?.columns.map((column) => column.columnName)).toEqual([
      'id',
      'status',
    ]);
    expect(inspector.getCalls).toBe(2);
    await expect(registry.getPhysical('missing')).resolves.toBeUndefined();
  });

  it('preserves logical naming conflict and internal collection boundaries', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      {
        version: 1,
        name: 'orders',
        naming: { tablePrefix: 'legacy_' },
      },
      { expectedRevision: null },
    );
    const inspector = new FakeInspector([
      physical('legacy_orders'),
      physical('app_orders'),
      physical('app_internal'),
    ]);
    const registry = new CollectionRegistry({
      inspector,
      metadataStore: store,
      naming: { tablePrefix: 'app_' },
      isInternalPhysicalCollection: ({ tableName }) =>
        tableName === 'app_internal',
    });

    await expect(registry.getPhysical('orders')).rejects.toMatchObject({
      code: 'COLLECTION_RESOLUTION_FAILED',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'COLLECTION_NAME_CONFLICT' }),
      ]),
    });
    await expect(registry.getPhysical('internal')).resolves.toBeUndefined();
  });

  it('scans full Collections explicitly and validates cyclic relation graphs', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      {
        version: 1,
        name: 'users',
        relations: {
          department: {
            targetKey: 'id',
            type: 'belongsTo',
            target: 'departments',
            foreignKey: 'departmentId',
          },
        },
      },
      { expectedRevision: null },
    );
    await store.put(
      {
        version: 1,
        name: 'departments',
        relations: {
          owner: {
            targetKey: 'id',
            type: 'belongsTo',
            target: 'users',
            foreignKey: 'ownerId',
          },
        },
      },
      { expectedRevision: null },
    );
    const registry = new CollectionRegistry({
      inspector: new FakeInspector([
        physical('users', ['id', 'department_id']),
        physical('departments', ['id', 'owner_id']),
      ]),
      metadataStore: store,
    });

    const names: string[] = [];
    for await (const collection of registry.scan())
      names.push(collection.name!);
    expect(names.sort()).toEqual(['departments', 'users']);
    await expect(registry.validateRelations('users')).resolves.toBeUndefined();
  });

  it('validates hasOne keys in their source and target scopes', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      {
        version: 1,
        name: 'workflows',
        relations: {
          stats: {
            type: 'hasOne',
            target: 'workflowStats',
            sourceKey: 'key',
            foreignKey: 'key',
          },
        },
      },
      { expectedRevision: null },
    );
    const registry = new CollectionRegistry({
      inspector: new FakeInspector([
        physical('workflows', ['key']),
        physical('workflow_stats', ['key']),
      ]),
      metadataStore: store,
    });

    await expect(
      registry.validateRelations('workflows'),
    ).resolves.toBeUndefined();
  });

  it('aggregates cross-Collection target, targetKey, remote key, and through errors', async () => {
    const store = new InMemoryCollectionMetadataStore();
    await store.put(
      {
        version: 1,
        name: 'orders',
        relations: {
          owner: {
            targetKey: 'id',
            type: 'belongsTo',
            target: 'missing',
            foreignKey: 'ownerId',
          },
          items: {
            sourceKey: 'id',
            type: 'hasMany',
            target: 'items',
            targetKey: 'missingId',
            foreignKey: 'missingOrderId',
          },
          products: {
            sourceKey: 'id',
            targetKey: 'id',
            foreignKey: 'orderId',
            otherKey: 'productId',
            type: 'belongsToMany',
            target: 'products',
            through: 'missingThrough',
          },
        },
      },
      { expectedRevision: null },
    );
    const registry = new CollectionRegistry({
      inspector: new FakeInspector([
        physical('orders', ['id', 'owner_id']),
        physical('items', ['id']),
        physical('products', ['id']),
      ]),
      metadataStore: store,
    });

    await expect(registry.validateRelations('orders')).rejects.toBeInstanceOf(
      CollectionRelationValidationError,
    );
    try {
      await registry.validateRelations('orders');
    } catch (error) {
      expect((error as CollectionRelationValidationError).issues).toHaveLength(
        4,
      );
    }
  });
});

class FakeInspector implements SchemaInspector {
  readonly schemas = new Map<string, PhysicalCollectionSchema>();
  getCalls = 0;
  beforeGet?: () => Promise<void>;
  listOptions?: ListPhysicalCollectionsOptions;
  scanOptions?: ScanPhysicalCollectionsOptions;

  constructor(schemas: readonly PhysicalCollectionSchema[]) {
    for (const schema of schemas) this.schemas.set(schema.tableName, schema);
  }

  async listSchemas(): Promise<Array<{ name: string; default: boolean }>> {
    return [{ name: 'public', default: true }];
  }

  async getPhysicalCollection(
    identifier: PhysicalCollectionIdentifier,
  ): Promise<PhysicalCollectionSchema | undefined> {
    this.getCalls += 1;
    await this.beforeGet?.();
    return structuredClone(this.schemas.get(identifier.tableName));
  }

  async listPhysicalCollections(
    options: ListPhysicalCollectionsOptions = {},
  ): Promise<PhysicalCollectionPage> {
    this.listOptions = options;
    return {
      items: [...this.schemas.values()]
        .filter((schema) =>
          matchesPrefixes(schema.tableName, options.tableNamePrefixes),
        )
        .map(({ schema, tableName, kind }) => ({
          schema,
          tableName,
          kind,
        })),
    };
  }

  async *scanPhysicalCollections(
    options: ScanPhysicalCollectionsOptions = {},
  ): AsyncIterable<PhysicalCollectionSchema> {
    this.scanOptions = options;
    for (const schema of this.schemas.values()) {
      if (matchesPrefixes(schema.tableName, options.tableNamePrefixes)) {
        yield structuredClone(schema);
      }
    }
  }
}

function matchesPrefixes(
  tableName: string,
  prefixes: readonly string[] | undefined,
): boolean {
  return (
    prefixes === undefined ||
    prefixes.some((prefix) => tableName.startsWith(prefix))
  );
}

function physical(
  tableName: string,
  columns: readonly string[] = ['id'],
): PhysicalCollectionSchema {
  return {
    schema: 'public',
    tableName,
    kind: 'table',
    columns: columns.map((columnName, index) => ({
      columnName,
      ordinalPosition: index + 1,
      dataType: 'bigInt',
      nativeType: 'bigint',
      nullable: false,
      autoIncrement: false,
    })),
    primaryKey: columns.includes('id') ? { columns: ['id'] } : undefined,
    uniqueConstraints: [],
    indexes: [],
    foreignKeys: [],
    checkConstraints: [],
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
