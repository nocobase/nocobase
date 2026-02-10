# ctx.dataSourceManager

The data source manager (`DataSourceManager` instance), used to manage and access multiple data sources.

## Type definition

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
  getDataSources(): DataSource[];                     // list all data sources
  getDataSource(key: string): DataSource | undefined; // get by key

  // Access metadata by data source + collection
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Notes

- `ctx.dataSource`: the current single data source (e.g. the page/block data source)
- `ctx.dataSourceManager`: entry for all data sources, used to enumerate or access another source by key (e.g. `'main'`, `'logging'`)

## Examples

### Get a specific data source

```ts
// Get the 'main' data source
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Get all collections in that data source
const collections = mainDS?.getCollections();
```

### Access collection metadata across data sources

```ts
// Get collection by dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');

// Get field definition by dataSource.key.collection.field path
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');
```
