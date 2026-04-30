---
title: "ctx.dataSource"
description: "ctx.dataSource là instance data source hiện tại, dùng để truy cập Collection, Repository, chỉ định data source trong kịch bản đa data source."
keywords: "ctx.dataSource,data source,Collection,Repository,đa data source,ngữ cảnh RunJS,NocoBase"
---

# ctx.dataSource

Instance data source (`DataSource`) được liên kết với ngữ cảnh thực thi RunJS hiện tại, dùng để truy cập collection, metadata field và quản lý cấu hình collection **trong data source hiện tại**. Thường tương ứng với data source được chọn trên trang/block hiện tại (như database chính `main`).

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Thao tác data source đơn** | Khi đã biết data source hiện tại, lấy collection, metadata field |
| **Quản lý collection** | Lấy/thêm/cập nhật/xóa collection trong data source hiện tại |
| **Lấy field theo đường dẫn** | Sử dụng định dạng `collectionName.fieldPath` để lấy định nghĩa field (hỗ trợ đường dẫn quan hệ) |

> Lưu ý: `ctx.dataSource` đại diện cho data source duy nhất của ngữ cảnh hiện tại; nếu cần liệt kê hoặc truy cập data source khác, hãy sử dụng [ctx.dataSourceManager](./data-source-manager.md).

## Định nghĩa kiểu

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

## Thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `key` | `string` | Key data source, như `'main'` |
| `name` | `string` | Giống key |
| `displayName` | `string` | Tên hiển thị (hỗ trợ i18n) |
| `flowEngine` | `FlowEngine` | Instance FlowEngine hiện tại |

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `getCollections()` | Lấy tất cả collection trong data source hiện tại (đã sắp xếp, lọc ẩn) |
| `getCollection(name)` | Lấy collection theo tên; `name` có thể là `collectionName.fieldName` để lấy collection đích quan hệ |
| `getAssociation(associationName)` | Lấy định nghĩa field quan hệ theo `collectionName.fieldName` |
| `getCollectionField(fieldPath)` | Lấy định nghĩa field theo `collectionName.fieldPath`, hỗ trợ đường dẫn quan hệ như `users.profile.avatar` |

## Quan hệ với ctx.dataSourceManager

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Data source duy nhất liên kết với ngữ cảnh hiện tại** | `ctx.dataSource` |
| **Điểm vào tất cả data source** | `ctx.dataSourceManager` |
| **Lấy collection trong data source hiện tại** | `ctx.dataSource.getCollection(name)` |
| **Lấy collection xuyên data source** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Lấy field trong data source hiện tại** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Lấy field xuyên data source** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Ví dụ

### Lấy collection và field

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

### Lấy field quan hệ

```ts
// 按 collectionName.fieldName 获取关联字段定义
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // 按目标数据表结构处理
}
```

### Duyệt collection để xử lý động

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Validate hoặc UI động dựa trên metadata field

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // 根据 interface、enum、validation 等做 UI 或校验
}
```

## Lưu ý

- Định dạng đường dẫn của `getCollectionField(fieldPath)` là `collectionName.fieldPath`, đoạn đầu là tên collection, các đoạn sau là đường dẫn field (hỗ trợ quan hệ, như `user.name`).
- `getCollection(name)` hỗ trợ dạng `collectionName.fieldName`, trả về collection đích của field quan hệ.
- `ctx.dataSource` trong ngữ cảnh RunJS thường được xác định bởi data source của block/page hiện tại; nếu ngữ cảnh không liên kết data source, có thể là `undefined`, khuyến nghị kiểm tra null trước khi sử dụng.

## Liên quan

- [ctx.dataSourceManager](./data-source-manager.md): Trình quản lý data source, quản lý tất cả data source
- [ctx.collection](./collection.md): Collection liên kết với ngữ cảnh hiện tại
- [ctx.collectionField](./collection-field.md): Định nghĩa field collection của field hiện tại
