# ctx.dataSourceManager

The data source manager (`DataSourceManager` instance) for managing and accessing multiple data sources (e.g. main `main`, logging `logging`). Use when you have multiple data sources or need cross–data-source metadata access.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **Multiple data sources** | Enumerate all data sources, get one by key |
| **Cross–data-source access** | When context doesn’t know the data source, access by “data source key + collection name” |
| **Field by full path** | Get field definition with path format `dataSourceKey.collectionName.fieldPath` |

> Note: If you only work with the current data source, use `ctx.dataSource`; use `ctx.dataSourceManager` when you need to enumerate or switch data sources.

## Type

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  getDataSources(): DataSource[];
  getDataSource(key: string): DataSource | undefined;

  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relation to ctx.dataSource

| Need | Recommended |
|------|-------------|
| **Single data source for context** | `ctx.dataSource` |
| **Entry to all data sources** | `ctx.dataSourceManager` |
| **List or switch data sources** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Collection in current data source** | `ctx.dataSource.getCollection(name)` |
| **Collection in another data source** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Field in current data source** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Field across data sources** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Examples

### Get a data source

```ts
const mainDS = ctx.dataSourceManager.getDataSource('main');
const collections = mainDS?.getCollections();
```

### Cross–data-source collection metadata

```ts
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

const primaryKey = users?.filterTargetKey ?? 'id';
```

### Field by full path

```ts
// Format: dataSourceKey.collectionName.fieldPath
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Iterate all data sources

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Data source: ${ds.key}, display: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Collection: ${col.name}`);
  }
}
```

### Dynamic data source from variable

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

- `getCollectionField` path format is `dataSourceKey.collectionName.fieldPath`; first segment is data source key, then collection name and field path.
- `getDataSource(key)` returns `undefined` if the data source doesn’t exist—check before use.
- `addDataSource` throws if key already exists; `upsertDataSource` overwrites or adds.

## Related

- [ctx.dataSource](./data-source.md): current data source instance
- [ctx.collection](./collection.md): collection for current context
- [ctx.collectionField](./collection-field.md): current field’s collection field definition
