---
title: "DataSourceManager 数据源管理"
description: "NocoBase 服务端数据源管理：app.dataSourceManager、多数据源、addDataSource、getDataSource。"
keywords: "DataSourceManager,数据源管理,多数据源,addDataSource,getDataSource,NocoBase"
---

# DataSourceManager 数据源管理

NocoBase 提供了 `DataSourceManager`，用于管理多个数据源。每个 `DataSource` 都有自己的 `Database`、`ResourceManager` 和 `ACL` 实例，你可以灵活地管理和扩展不同的数据源。

## 基本概念

每个 `DataSource` 实例包含以下内容：

- **`dataSource.collectionManager`**：用于管理数据表和字段。
- **`dataSource.resourceManager`**：处理与资源相关的操作（比如增删改查等）。
- **`dataSource.acl`**：资源操作的访问控制（ACL）。

为了方便访问，NocoBase 提供了主数据源相关成员的快捷别名：

- `app.db` 等价于 `dataSourceManager.get('main').collectionManager.db`
- `app.acl` 等价于 `dataSourceManager.get('main').acl`
- `app.resourceManager` 等价于 `dataSourceManager.get('main').resourceManager`

## 常用方法

### dataSourceManager.get(dataSourceKey)

返回指定的 `DataSource` 实例。

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

为所有数据源注册中间件，会影响所有数据源的操作。

```ts
dataSourceManager.use(async (ctx, next) => {
  console.log('这个中间件对所有数据源生效');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

在数据源加载之前执行。通常来说用于静态类注册，比如模型类、字段类型注册：

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // 注册自定义字段类型
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

在数据源加载之后执行。通常来说用于注册操作、设置访问控制等。

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // 登录用户即可访问
});
```

## 数据源扩展

完整的数据源扩展方式请参考数据源扩展章节。

## 相关链接

- [Database 数据库](./database.md) — CRUD、Repository、事务与数据库事件
- [Collections 数据表](./collections.md) — 用代码定义或扩展数据表结构
- [ResourceManager 资源管理](./resource-manager.md) — 注册自定义接口与资源操作
- [ACL 权限控制](./acl.md) — 角色权限、权限片段和访问控制
- [Plugin 插件](./plugin.md) — 插件类的生命周期、成员方法和 `app` 对象