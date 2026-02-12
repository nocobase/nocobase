# ctx.dataSource

当前 RunJS 执行上下文绑定的数据源实例（`DataSource`），用于在**当前数据源内**访问数据表、字段元数据及管理数据表配置。通常对应当前页/区块选中的数据源（如主库 `main`）。

## 适用场景

| 场景 | 说明 |
|------|------|
| **单数据源操作** | 在已知当前数据源时，获取数据表、字段元数据 |
| **数据表管理** | 获取/添加/更新/删除当前数据源下的数据表 |
| **按路径获取字段** | 使用 `collectionName.fieldPath` 格式获取字段定义（支持关联路径） |

> 注意：`ctx.dataSource` 表示当前上下文的单一数据源；若要枚举或访问其他数据源，请使用 [ctx.dataSourceManager](./data-source-manager.md)。

## 类型定义

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // 只读属性
  get flowEngine(): FlowEngine;   // 当前 FlowEngine 实例
  get displayName(): string;      // 显示名称（支持 i18n）
  get key(): string;              // 数据源 key，如 'main'
  get name(): string;             // 同 key

  // 数据表读取
  getCollections(): Collection[];                      // 获取所有数据表
  getCollection(name: string): Collection | undefined; // 按名称获取数据表
  getAssociation(associationName: string): CollectionField | undefined; // 获取关联字段（如 users.roles）

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

| 属性 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 数据源 key，如 `'main'` |
| `name` | `string` | 同 key |
| `displayName` | `string` | 显示名称（支持 i18n） |
| `flowEngine` | `FlowEngine` | 当前 FlowEngine 实例 |

## 常用方法

| 方法 | 说明 |
|------|------|
| `getCollections()` | 获取当前数据源下所有数据表（已排序、过滤隐藏） |
| `getCollection(name)` | 按名称获取数据表；`name` 可为 `collectionName.fieldName` 获取关联目标数据表 |
| `getAssociation(associationName)` | 按 `collectionName.fieldName` 获取关联字段定义 |
| `getCollectionField(fieldPath)` | 按 `collectionName.fieldPath` 获取字段定义，支持关联路径如 `users.profile.avatar` |

## 与 ctx.dataSourceManager 的关系

| 需求 | 推荐用法 |
|------|----------|
| **当前上下文绑定的单一数据源** | `ctx.dataSource` |
| **所有数据源入口** | `ctx.dataSourceManager` |
| **当前数据源内获取数据表** | `ctx.dataSource.getCollection(name)` |
| **跨数据源获取数据表** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **当前数据源内获取字段** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **跨数据源获取字段** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## 示例

### 获取数据表及字段

```ts
// 获取所有数据表
const collections = ctx.dataSource.getCollections();

// 按名称获取数据表
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// 按「数据表.字段路径」获取字段定义（支持关联）
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### 获取关联字段

```ts
// 按 collectionName.fieldName 获取关联字段定义
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // 按目标数据表结构处理
}
```

### 遍历数据表做动态处理

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### 根据字段元数据做校验或动态 UI

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // 根据 interface、enum、validation 等做 UI 或校验
}
```

## 注意事项

- `getCollectionField(fieldPath)` 的路径格式为 `collectionName.fieldPath`，第一段为数据表名，后续为字段路径（支持关联，如 `user.name`）。
- `getCollection(name)` 支持 `collectionName.fieldName` 形式，返回关联字段的目标数据表。
- `ctx.dataSource` 在 RunJS 上下文中通常由当前区块/页面的数据源决定；若上下文无绑定数据源，可能为 `undefined`，使用前建议做空值判断。

## 相关

- [ctx.dataSourceManager](./data-source-manager.md)：数据源管理器，管理所有数据源
- [ctx.collection](./collection.md)：当前上下文关联的数据表
- [ctx.collectionField](./collection-field.md)：当前字段的数据表字段定义
