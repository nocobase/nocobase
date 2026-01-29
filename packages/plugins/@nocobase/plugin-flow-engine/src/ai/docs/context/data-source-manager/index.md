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
  getDataSources(): DataSource[];                 // 获取所有数据源
  getDataSource(key: string): DataSource | undefined; // 根据 key 获取指定数据源

  // 直接按「数据源 + 数据表」访问元数据
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## 说明

- `ctx.dataSource`：当前上下文绑定的单个数据源（例如当前页面 / 块所在的数据源）
- `ctx.dataSourceManager`：所有数据源的入口，可用来：
  - 列出所有数据源
  - 通过 key 获取特定数据源（如 `'main'`、`'logging'` 等）
  - 在不知道当前上下文所处数据源的情况下，按数据源 key + 数据表名访问元数据

## 使用示例

### 获取指定数据源

```ts
// 获取名为 'main' 的数据源
const mainDS = ctx.dataSourceManager.getDataSource('main');

// 获取该数据源下的所有数据表
const collections = mainDS?.getCollections();
```

### 跨数据源访问数据表元数据

```ts
// 直接通过 dataSourceKey + collectionName 获取数据表
const users = ctx.dataSourceManager.getCollection('main', 'users');

// 通过「数据源.key.数据表名.字段路径」获取字段定义
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');
```
