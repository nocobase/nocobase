# ctx.dataSourceManager

数据源管理器（`DataSourceManager` 实例），用于管理和访问多个数据源（如主库 `main`、日志库 `logging` 等）。在存在多数据源或需要跨数据源访问元数据时使用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **多数据源** | 枚举所有数据源、按 key 获取指定数据源 |
| **跨数据源访问** | 当前上下文未知数据源时，按「数据源 key + 数据表名」访问元数据 |
| **按全路径获取字段** | 使用 `dataSourceKey.collectionName.fieldPath` 格式获取跨数据源的字段定义 |

> 注意：若仅操作当前数据源，优先使用 `ctx.dataSource`；需要枚举或切换数据源时再使用 `ctx.dataSourceManager`。

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

  // 按数据源 + 数据表直接访问元数据
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## 与 ctx.dataSource 的关系

| 需求 | 推荐用法 |
|------|----------|
| **当前上下文绑定的单一数据源** | `ctx.dataSource`（如当前页/区块的数据源） |
| **所有数据源入口** | `ctx.dataSourceManager` |
| **列举或切换数据源** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **当前数据源内获取数据表** | `ctx.dataSource.getCollection(name)` |
| **跨数据源获取数据表** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **当前数据源内获取字段** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **跨数据源获取字段** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## 示例

### 获取指定数据源

```ts
// 获取名为 'main' 的数据源
const mainDS = ctx.dataSourceManager.getDataSource('main');

// 获取该数据源下所有数据表
const collections = mainDS?.getCollections();
```

### 跨数据源访问数据表元数据

```ts
// 按 dataSourceKey + collectionName 获取数据表
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// 获取数据表主键
const primaryKey = users?.filterTargetKey ?? 'id';
```

### 按全路径获取字段定义

```ts
// 格式：dataSourceKey.collectionName.fieldPath
// 按「数据源.key.数据表.字段路径」获取字段定义
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// 支持关联字段路径
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### 遍历所有数据源

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`数据源: ${ds.key}, 显示名: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - 数据表: ${col.name}`);
  }
}
```

### 根据变量动态选择数据源

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## 注意事项

- `getCollectionField` 的路径格式为 `dataSourceKey.collectionName.fieldPath`，第一段为数据源 key，后续为数据表名与字段路径。
- `getDataSource(key)` 若数据源不存在返回 `undefined`，使用前建议做空值判断。
- `addDataSource` 若 key 已存在会抛出异常；`upsertDataSource` 则覆盖或新增。

## 相关

- [ctx.dataSource](./data-source.md)：当前数据源实例
- [ctx.collection](./collection.md)：当前上下文关联的数据表
- [ctx.collectionField](./collection-field.md)：当前字段的数据表字段定义
