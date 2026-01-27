# DataSourceManager

NocoBase provides `DataSourceManager` for managing multiple data sources. Each `DataSource` has its own `Database`, `ResourceManager`, and `ACL` instances, making it convenient for developers to flexibly manage and extend multiple data sources.

## Basic Concepts

Each `DataSource` instance contains the following:

- **`dataSource.collectionManager`**: Used to manage collections and fields.
- **`dataSource.resourceManager`**: Handles resource-related operations (such as CRUD, etc.).
- **`dataSource.acl`**: Access control (ACL) for resource operations.

For convenient access, aliases are provided for main data source members:

- `app.db` is equivalent to `dataSourceManager.get('main').collectionManager.db`
- `app.acl` is equivalent to `dataSourceManager.get('main').acl`
- `app.resourceManager` is equivalent to `dataSourceManager.get('main').resourceManager`

## Common Methods

### dataSourceManager.get(dataSourceKey)

This method returns the specified `DataSource` instance.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Register middleware for all data sources. This will affect operations on all data sources.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Executes before data source loading. Commonly used for static class registration, such as model classes and field type registration:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Custom field type
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Executes after data source loading. Commonly used for registering operations, setting access control, etc.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Set access permissions
});
```

## Data Source Extension

For complete data source extension, please refer to the data source extension chapter.

