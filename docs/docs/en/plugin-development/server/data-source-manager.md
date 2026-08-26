---
title: "DataSourceManager"
description: "NocoBase server-side data source management: app.dataSourceManager, multiple data sources, addDataSource, getDataSource."
keywords: "DataSourceManager,data source management,multiple data sources,addDataSource,getDataSource,NocoBase"
---

# DataSourceManager

NocoBase provides `DataSourceManager` for managing multiple data sources. Each `DataSource` has its own `Database`, `ResourceManager`, and `ACL` instances, allowing you to flexibly manage and extend different data sources.

## Basic Concepts

Each `DataSource` instance contains the following:

- **`dataSource.collectionManager`**: Used to manage collections and fields.
- **`dataSource.resourceManager`**: Handles resource-related operations (such as CRUD, etc.).
- **`dataSource.acl`**: Access control (ACL) for resource operations.

For convenient access, NocoBase provides aliases for main data source members:

- `app.db` is equivalent to `dataSourceManager.get('main').collectionManager.db`
- `app.acl` is equivalent to `dataSourceManager.get('main').acl`
- `app.resourceManager` is equivalent to `dataSourceManager.get('main').resourceManager`

## Common Methods

### dataSourceManager.get(dataSourceKey)

Returns the specified `DataSource` instance.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Register middleware for all data sources, which will affect operations on all data sources.

```ts
dataSourceManager.use(async (ctx, next) => {
  console.log('This middleware applies to all data sources');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Executes before data source loading. Typically used for static class registration, such as model classes and field type registration:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Register custom field type
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Executes after data source loading. Typically used for registering operations, setting access control, etc.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Logged-in users can access
});
```

## Data Source Extension

For complete data source extension, please refer to the data source extension chapter.

## Related Links

- [Database](./database.md) - CRUD, Repository, transactions, and database events
- [Collections](./collections.md) - Define or extend data table structures with code
- [ResourceManager](./resource-manager.md) - Register custom APIs and resource operations
- [ACL](./acl.md) - Role permissions, permission snippets, and access control
- [Plugin](./plugin.md) - Plugin class lifecycle, member methods, and the `app` object
