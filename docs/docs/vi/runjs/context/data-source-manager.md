---
title: "ctx.dataSourceManager"
description: "ctx.dataSourceManager là trình quản lý data source, dùng để lấy đa data source, instance Collection, Repository."
keywords: "ctx.dataSourceManager,trình quản lý data source,Collection,Repository,đa data source,RunJS,NocoBase"
---

# ctx.dataSourceManager

Trình quản lý data source (instance `DataSourceManager`), dùng để quản lý và truy cập nhiều data source (như database chính `main`, database log `logging`, v.v.). Sử dụng khi có đa data source hoặc cần truy cập metadata xuyên data source.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Đa data source** | Liệt kê tất cả data source, lấy data source chỉ định theo key |
| **Truy cập xuyên data source** | Khi ngữ cảnh hiện tại không biết data source, truy cập metadata theo "key data source + tên collection" |
| **Lấy field theo đường dẫn đầy đủ** | Sử dụng định dạng `dataSourceKey.collectionName.fieldPath` để lấy định nghĩa field xuyên data source |

> Lưu ý: Nếu chỉ thao tác data source hiện tại, ưu tiên sử dụng `ctx.dataSource`; chỉ sử dụng `ctx.dataSourceManager` khi cần liệt kê hoặc chuyển đổi data source.

## Định nghĩa kiểu

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

## Quan hệ với ctx.dataSource

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Data source duy nhất liên kết với ngữ cảnh hiện tại** | `ctx.dataSource` (như data source của trang/block hiện tại) |
| **Điểm vào tất cả data source** | `ctx.dataSourceManager` |
| **Liệt kê hoặc chuyển đổi data source** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Lấy collection trong data source hiện tại** | `ctx.dataSource.getCollection(name)` |
| **Lấy collection xuyên data source** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Lấy field trong data source hiện tại** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Lấy field xuyên data source** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Ví dụ

### Lấy data source chỉ định

```ts
// 获取名为 'main' 的数据源
const mainDS = ctx.dataSourceManager.getDataSource('main');

// 获取该数据源下所有数据表
const collections = mainDS?.getCollections();
```

### Truy cập metadata collection xuyên data source

```ts
// 按 dataSourceKey + collectionName 获取数据表
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// 获取数据表主键
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Lấy định nghĩa field theo đường dẫn đầy đủ

```ts
// 格式：dataSourceKey.collectionName.fieldPath
// 按「数据源.key.数据表.字段路径」获取字段定义
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// 支持关联字段路径
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Duyệt tất cả data source

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

### Chọn data source động dựa trên biến

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Lưu ý

- Định dạng đường dẫn của `getCollectionField` là `dataSourceKey.collectionName.fieldPath`, đoạn đầu là key data source, các đoạn sau là tên collection và đường dẫn field.
- `getDataSource(key)` trả về `undefined` nếu data source không tồn tại, khuyến nghị kiểm tra null trước khi sử dụng.
- `addDataSource` sẽ ném exception nếu key đã tồn tại; `upsertDataSource` thì ghi đè hoặc thêm mới.

## Liên quan

- [ctx.dataSource](./data-source.md): Instance data source hiện tại
- [ctx.collection](./collection.md): Collection liên kết với ngữ cảnh hiện tại
- [ctx.collectionField](./collection-field.md): Định nghĩa field collection của field hiện tại
