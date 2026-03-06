:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Trình quản lý nguồn dữ liệu (thể hiện của `DataSourceManager`), được sử dụng để quản lý và truy cập nhiều nguồn dữ liệu (ví dụ: cơ sở dữ liệu chính `main`, cơ sở dữ liệu nhật ký `logging`, v.v.). Nó được sử dụng khi tồn tại nhiều nguồn dữ liệu hoặc khi cần truy cập metadata liên nguồn dữ liệu.

## Các trường hợp sử dụng

| Tình huống | Mô tả |
|------|------|
| **Đa nguồn dữ liệu** | Liệt kê tất cả các nguồn dữ liệu hoặc lấy một nguồn dữ liệu cụ thể theo khóa (key). |
| **Truy cập liên nguồn dữ liệu** | Truy cập metadata bằng định dạng "khóa nguồn dữ liệu + tên bộ sưu tập" khi nguồn dữ liệu của ngữ cảnh hiện tại không xác định. |
| **Lấy trường theo đường dẫn đầy đủ** | Sử dụng định dạng `dataSourceKey.collectionName.fieldPath` để lấy định nghĩa trường trên các nguồn dữ liệu khác nhau. |

> Lưu ý: Nếu bạn chỉ thao tác trên nguồn dữ liệu hiện tại, hãy ưu tiên sử dụng `ctx.dataSource`. Chỉ sử dụng `ctx.dataSourceManager` khi bạn cần liệt kê hoặc chuyển đổi giữa các nguồn dữ liệu.

## Định nghĩa kiểu

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Quản lý nguồn dữ liệu
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Đọc nguồn dữ liệu
  getDataSources(): DataSource[];                     // Lấy tất cả nguồn dữ liệu
  getDataSource(key: string): DataSource | undefined;  // Lấy nguồn dữ liệu theo khóa

  // Truy cập metadata trực tiếp qua nguồn dữ liệu + bộ sưu tập
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Mối quan hệ với ctx.dataSource

| Nhu cầu | Cách sử dụng khuyến nghị |
|------|----------|
| **Nguồn dữ liệu duy nhất gắn với ngữ cảnh hiện tại** | `ctx.dataSource` (ví dụ: nguồn dữ liệu của trang/khối hiện tại) |
| **Điểm truy cập cho tất cả nguồn dữ liệu** | `ctx.dataSourceManager` |
| **Liệt kê hoặc chuyển đổi nguồn dữ liệu** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Lấy bộ sưu tập trong nguồn dữ liệu hiện tại** | `ctx.dataSource.getCollection(name)` |
| **Lấy bộ sưu tập giữa các nguồn dữ liệu** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Lấy trường trong nguồn dữ liệu hiện tại** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Lấy trường giữa các nguồn dữ liệu** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Ví dụ

### Lấy một nguồn dữ liệu cụ thể

```ts
// Lấy nguồn dữ liệu có tên là 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Lấy tất cả bộ sưu tập thuộc nguồn dữ liệu này
const collections = mainDS?.getCollections();
```

### Truy cập metadata của bộ sưu tập giữa các nguồn dữ liệu

```ts
// Lấy bộ sưu tập theo dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Lấy khóa chính của bộ sưu tập
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Lấy định nghĩa trường theo đường dẫn đầy đủ

```ts
// Định dạng: dataSourceKey.collectionName.fieldPath
// Lấy định nghĩa trường theo "khóa nguồn dữ liệu.tên bộ sưu tập.đường dẫn trường"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Hỗ trợ đường dẫn trường liên kết
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Duyệt qua tất cả các nguồn dữ liệu

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Nguồn dữ liệu: ${ds.key}, Tên hiển thị: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Bộ sưu tập: ${col.name}`);
  }
}
```

### Chọn nguồn dữ liệu động dựa trên biến

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

- Định dạng đường dẫn cho `getCollectionField` là `dataSourceKey.collectionName.fieldPath`, trong đó đoạn đầu tiên là khóa của nguồn dữ liệu, tiếp theo là tên bộ sưu tập và đường dẫn trường.
- `getDataSource(key)` trả về `undefined` nếu nguồn dữ liệu không tồn tại; khuyến nghị kiểm tra giá trị null trước khi sử dụng.
- `addDataSource` sẽ ném ra ngoại lệ nếu khóa đã tồn tại; `upsertDataSource` sẽ ghi đè lên cái hiện có hoặc thêm mới.

## Liên quan

- [ctx.dataSource](./data-source.md): Thể hiện nguồn dữ liệu hiện tại
- [ctx.collection](./collection.md): Bộ sưu tập liên kết với ngữ cảnh hiện tại
- [ctx.collectionField](./collection-field.md): Định nghĩa trường của bộ sưu tập cho trường hiện tại