# ctx.dataSource

The current data source instance (`DataSource`).

## Type definition

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Read-only properties
  get flowEngine(): FlowEngine;   // current FlowEngine instance
  get displayName(): string;      // display name (i18n supported)
  get key(): string;              // data source key, e.g. 'main'

  // Collection methods
  getCollections(): Collection[];                      // list all collections
  getCollection(name: string): Collection | undefined;  // get by name
  getAssociation(associationName: string): CollectionField | undefined; // get association field (hasMany / belongsTo)

  // Collection management
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Field metadata
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Common properties

```ts
ctx.dataSource.key;         // data source key, e.g. 'main'
ctx.dataSource.displayName; // display name (i18n supported)
```

### Collections

```ts
// List all collections
const collections = ctx.dataSource.getCollections();

// Get collection by name
const users = ctx.dataSource.getCollection('users');

// Get field definition by collection.field path
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
```

> Note: `getCollectionField('users.profile.avatar')` parses collection name and field path to return the `CollectionField` definition. Useful for dynamic UI or validation based on metadata.

## Relationship with ctx.dataSourceManager

- `ctx.dataSource`: the **single data source** of the current context (e.g. the selected `main`)
- `ctx.dataSourceManager`: manages all data sources; use `getDataSource(key)` to access others

Use `ctx.dataSource` when operating within the current data source. Use `ctx.dataSourceManager` to enumerate or switch data sources.
