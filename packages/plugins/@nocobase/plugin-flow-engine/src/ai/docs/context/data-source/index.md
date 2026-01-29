# ctx.dataSource

当前数据源实例（`DataSource`）。

## 类型定义

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // 只读属性
  get flowEngine(): FlowEngine;   // 当前 FlowEngine 实例
  get displayName(): string;      // 友好名称（支持多语言）
  get key(): string;              // 数据源标识，如 'main'

  // 数据表（Collection）相关方法
  getCollections(): Collection[];                      // 获取所有数据表
  getCollection(name: string): Collection | undefined; // 获取指定数据表
  getAssociation(associationName: string): CollectionField | undefined; // 获取关联字段（如 hasMany / belongsTo）

  // 数据表管理
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
ctx.dataSource.key;         // 数据源标识，如 'main'
ctx.dataSource.displayName; // 友好名称（支持多语言）
```

### 数据表（Collection）相关

```ts
// 获取所有数据表（Collections）
const collections = ctx.dataSource.getCollections();

// 获取指定数据表
const users = ctx.dataSource.getCollection('users');

// 通过「数据表名.字段路径」获取字段定义
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
```

> 说明：`getCollectionField('users.profile.avatar')` 会解析数据表名和字段路径，并返回对应的字段定义（`CollectionField`），常用于根据字段元数据生成动态界面或校验逻辑。

## 与 ctx.dataSourceManager 的关系

- `ctx.dataSource`：当前上下文所在的 **单个数据源**（已选中的 dataSource，如 `main`）
- `ctx.dataSourceManager`：管理所有数据源，可通过 `getDataSource(key)` 获取其他数据源

一般情况下：

- 只关心当前数据源时使用 `ctx.dataSource`
- 需要枚举或切换数据源时使用 `ctx.dataSourceManager`

