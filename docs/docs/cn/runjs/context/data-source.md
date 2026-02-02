# ctx.dataSource

当前数据源实例（`DataSource`）。

## 类型定义

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // 只读属性
  get flowEngine(): FlowEngine;   // 当前 FlowEngine 实例
  get displayName(): string;      // 显示名称（支持 i18n）
  get key(): string;              // 数据源 key，如 'main'

  // 集合相关方法
  getCollections(): Collection[];                      // 获取所有集合
  getCollection(name: string): Collection | undefined;  // 按名称获取集合
  getAssociation(associationName: string): CollectionField | undefined; // 获取关联字段（如 hasMany / belongsTo）

  // 集合管理
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // 字段元数据
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## 常用属性

```ts
ctx.dataSource.key;         // 数据源 key，如 'main'
ctx.dataSource.displayName; // 显示名称（支持 i18n）
```

### 集合相关

```ts
// 获取所有集合
const collections = ctx.dataSource.getCollections();

// 按名称获取集合
const users = ctx.dataSource.getCollection('users');

// 按「集合.字段路径」获取字段定义
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
```

> 说明：`getCollectionField('users.profile.avatar')` 会解析集合名与字段路径，返回字段定义（`CollectionField`），常用于根据字段元数据做动态 UI 或校验。

## 与 ctx.dataSourceManager 的关系

- `ctx.dataSource`：当前上下文的**单一数据源**（如选中的 `main`）
- `ctx.dataSourceManager`：管理所有数据源，通过 `getDataSource(key)` 访问其他数据源

一般只在当前数据源内操作时用 `ctx.dataSource`；需要枚举或切换数据源时用 `ctx.dataSourceManager`。
