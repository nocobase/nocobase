# ctx.dataSourceManager

数据源管理器（`DataSourceManager` 实例），用于管理和访问多个数据源。

## 类型定义

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // 数据源管理
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // 读取数据源
  getDataSources(): DataSource[];                     // 获取所有数据源
  getDataSource(key: string): DataSource | undefined;  // 按 key 获取数据源

  // 按数据源 + 集合直接访问元数据
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## 说明

- `ctx.dataSource`：当前上下文绑定的单一数据源（如当前页/区块的数据源）
- `ctx.dataSourceManager`：所有数据源的入口，可用于列出数据源、按 key 获取指定数据源（如 `'main'`、`'logging'`）、在不确定当前数据源时按「数据源 key + 集合名」访问元数据

## 示例

### 获取指定数据源

```ts
// 获取名为 'main' 的数据源
const mainDS = ctx.dataSourceManager.getDataSource('main');

// 获取该数据源下所有集合
const collections = mainDS?.getCollections();
```

### 跨数据源访问集合元数据

```ts
// 按 dataSourceKey + collectionName 获取集合
const users = ctx.dataSourceManager.getCollection('main', 'users');

// 按「数据源.key.集合.字段路径」获取字段定义
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');
```
