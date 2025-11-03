# DataSourceManager 数据源管理

NocoBase 提供了 `DataSourceManager`，用于多数据源管理。每个 `DataSource` 都有自己的 `Database`、`ResourceManager` 和 `ACL` 实例，便于开发者灵活地管理和扩展多个数据源。

## 基本概念

每个 `DataSource` 实例包含以下内容：

- **`dataSource.collectionManager`**：用于管理数据表和字段。
- **`dataSource.resourceManager`**：处理与资源相关的操作（例如增删改查等）。
- **`dataSource.acl`**：资源操作的访问控制（ACL）。

为了便捷访问，提供了主数据源相关成员的快捷别名：

- `app.db` 等价于 `dataSourceManager.get('main').collectionManager.db`
- `app.acl` 等价于 `dataSourceManager.get('main').acl`
- `app.resourceManager` 等价于 `dataSourceManager.get('main').resourceManager`

## 常用方法

### dataSourceManager.get(dataSourceKey)

该方法返回指定的 `DataSource` 实例。

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

为所有数据源注册中间件。这将影响所有数据源的操作。

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

在数据源加载之前执行。常用于静态类注册，如模型类、字段类型注册：

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // 自定义字段类型
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

在数据源加载之后执行。常用于注册操作、设置访问控制等。

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // 设置访问权限
});
```

## 数据源扩展

完整的数据源扩展请参考数据源扩展章节