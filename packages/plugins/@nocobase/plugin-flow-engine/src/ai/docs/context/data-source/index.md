# ctx.dataSource

The current data source instance (`DataSource`).

## Type Definition

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Read-only properties
  get flowEngine(): FlowEngine;   // current FlowEngine instance
  get displayName(): string;      // display name (i18n supported)
  get key(): string;              // data source key, e.g. 'main'

  // Collection-related methods
  getCollections(): Collection[];                      // get all collections
  getCollection(name: string): Collection | undefined; // get a collection by name
  getAssociation(associationName: string): CollectionField | undefined; // get association fields (e.g. hasMany / belongsTo)

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

## Common Properties

```ts
ctx.dataSource.key;         // data source key, e.g. 'main'
ctx.dataSource.displayName; // display name (i18n supported)
```

### Collection-related

```ts
// Get all collections
const collections = ctx.dataSource.getCollections();

// Get a collection by name
const users = ctx.dataSource.getCollection('users');

// Get a field definition by "collection.fieldPath"
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
```

> Notes: `getCollectionField('users.profile.avatar')` resolves the collection name and field path and returns the field definition (`CollectionField`). This is commonly used for dynamic UI generation or validation based on field metadata.

## Relationship with ctx.dataSourceManager

- `ctx.dataSource`: the **single data source** for the current context (the selected data source, e.g. `main`)
- `ctx.dataSourceManager`: manages all data sources; use `getDataSource(key)` to access others

In general:

- Use `ctx.dataSource` when you only care about the current data source
- Use `ctx.dataSourceManager` when you need to enumerate or switch data sources
