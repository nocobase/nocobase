# ctx.dataSourceManager

The Data Source Manager (`DataSourceManager` instance) is used to manage and access multiple data sources (e.g., the main database `main`, logging database `logging`, etc.). It is used when multiple data sources exist or when cross-data source metadata access is required.

## Use Cases

| Scenario | Description |
|------|------|
| **Multi-data source** | Enumerate all data sources, or get a specific data source by key. |
| **Cross-data source access** | Access metadata using the "data source key + collection name" format when the data source of the current context is unknown. |
| **Get fields by full path** | Use the `dataSourceKey.collectionName.fieldPath` format to retrieve field definitions across different data sources. |

> Note: If you are only operating on the current data source, prioritize using `ctx.dataSource`. Use `ctx.dataSourceManager` only when you need to enumerate or switch between data sources.

## Type Definition

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Data source management
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Read data sources
  getDataSources(): DataSource[];                     // Get all data sources
  getDataSource(key: string): DataSource | undefined;  // Get data source by key

  // Access metadata directly by data source + collection
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relationship with ctx.dataSource

| Requirement | Recommended Usage |
|------|----------|
| **Single data source bound to the current context** | `ctx.dataSource` (e.g., the data source of the current page/block) |
| **Entry point for all data sources** | `ctx.dataSourceManager` |
| **List or switch data sources** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Get collection within the current data source** | `ctx.dataSource.getCollection(name)` |
| **Get collection across data sources** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Get field within the current data source** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Get field across data sources** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Examples

### Get a Specific Data Source

```ts
// Get the data source named 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Get all collections under this data source
const collections = mainDS?.getCollections();
```

### Access Collection Metadata Across Data Sources

```ts
// Get collection by dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Get the primary key of the collection
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Get Field Definition by Full Path

```ts
// Format: dataSourceKey.collectionName.fieldPath
// Get field definition by "data source key.collection name.field path"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Supports association field paths
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Iterate Through All Data Sources

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Data Source: ${ds.key}, Display Name: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Collection: ${col.name}`);
  }
}
```

### Dynamically Select Data Source Based on Variables

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Notes

- The path format for `getCollectionField` is `dataSourceKey.collectionName.fieldPath`, where the first segment is the data source key, followed by the collection name and the field path.
- `getDataSource(key)` returns `undefined` if the data source does not exist; it is recommended to perform a null check before use.
- `addDataSource` will throw an exception if the key already exists; `upsertDataSource` will either overwrite the existing one or add a new one.

## Related

- [ctx.dataSource](./data-source.md): Current data source instance
- [ctx.collection](./collection.md): Collection associated with the current context
- [ctx.collectionField](./collection-field.md): Collection field definition for the current field