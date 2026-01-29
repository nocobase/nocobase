# ctx.dataSourceManager

Data source manager (`DataSourceManager` instance), used to manage and access multiple data sources.

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
  getDataSources(): DataSource[];                 // get all data sources
  getDataSource(key: string): DataSource | undefined; // get a data source by key

  // Access metadata by data source + collection directly
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Notes

- `ctx.dataSource`: the single data source bound to the current context (e.g., the data source for the current page / block)
- `ctx.dataSourceManager`: entry point for all data sources, useful to:
  - list all data sources
  - get a specific data source by key (e.g., `'main'`, `'logging'`)
  - access metadata by data source key + collection name when the current context's data source is unknown

## Examples

### Get a specific data source

```ts
// Get the data source named 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Get all collections under that data source
const collections = mainDS?.getCollections();
```

### Access collection metadata across data sources

```ts
// Get a collection by dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');

// Get a field definition by "dataSource.key.collection.fieldPath"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');
```
