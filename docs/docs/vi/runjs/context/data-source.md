:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/data-source).
:::

# ctx.dataSource

Thực thể nguồn dữ liệu (`DataSource`) được liên kết với ngữ cảnh thực thi RunJS hiện tại, dùng để truy cập các bộ sưu tập, siêu dữ liệu trường (field metadata) và quản lý cấu hình bộ sưu tập **trong phạm vi nguồn dữ liệu hiện tại**. Thông thường, nó tương ứng với nguồn dữ liệu được chọn cho trang hoặc khối hiện tại (ví dụ: cơ sở dữ liệu chính `main`).

## Các trường hợp sử dụng

| Tình huống | Mô tả |
|------|------|
| **Thao tác trên một nguồn dữ liệu đơn lẻ** | Lấy siêu dữ liệu của bộ sưu tập và trường khi đã biết nguồn dữ liệu hiện tại. |
| **Quản lý bộ sưu tập** | Lấy, thêm, cập nhật hoặc xóa các bộ sưu tập thuộc nguồn dữ liệu hiện tại. |
| **Lấy trường theo đường dẫn** | Sử dụng định dạng `collectionName.fieldPath` để lấy định nghĩa trường (hỗ trợ đường dẫn liên kết). |

> Lưu ý: `ctx.dataSource` đại diện cho một nguồn dữ liệu duy nhất trong ngữ cảnh hiện tại; để liệt kê hoặc truy cập các nguồn dữ liệu khác, vui lòng sử dụng [ctx.dataSourceManager](./data-source-manager.md).

## Định nghĩa kiểu

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Các thuộc tính chỉ đọc
  get flowEngine(): FlowEngine;   // Thực thể FlowEngine hiện tại
  get displayName(): string;      // Tên hiển thị (hỗ trợ đa ngôn ngữ i18n)
  get key(): string;              // Khóa của nguồn dữ liệu, ví dụ: 'main'
  get name(): string;             // Giống như key

  // Đọc bộ sưu tập
  getCollections(): Collection[];                      // Lấy tất cả bộ sưu tập
  getCollection(name: string): Collection | undefined; // Lấy bộ sưu tập theo tên
  getAssociation(associationName: string): CollectionField | undefined; // Lấy trường liên kết (ví dụ: users.roles)

  // Quản lý bộ sưu tập
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Siêu dữ liệu trường
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Các thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `key` | `string` | Khóa của nguồn dữ liệu, ví dụ: `'main'` |
| `name` | `string` | Giống như key |
| `displayName` | `string` | Tên hiển thị (hỗ trợ i18n) |
| `flowEngine` | `FlowEngine` | Thực thể FlowEngine hiện tại |

## Các phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `getCollections()` | Lấy tất cả bộ sưu tập trong nguồn dữ liệu hiện tại (đã được sắp xếp và lọc bỏ các mục ẩn). |
| `getCollection(name)` | Lấy bộ sưu tập theo tên; `name` có thể là `collectionName.fieldName` để lấy bộ sưu tập đích của một liên kết. |
| `getAssociation(associationName)` | Lấy định nghĩa trường liên kết theo định dạng `collectionName.fieldName`. |
| `getCollectionField(fieldPath)` | Lấy định nghĩa trường theo `collectionName.fieldPath`, hỗ trợ các đường dẫn liên kết như `users.profile.avatar`. |

## Mối quan hệ với ctx.dataSourceManager

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Nguồn dữ liệu duy nhất gắn với ngữ cảnh hiện tại** | `ctx.dataSource` |
| **Điểm truy cập cho tất cả nguồn dữ liệu** | `ctx.dataSourceManager` |
| **Lấy bộ sưu tập trong nguồn dữ liệu hiện tại** | `ctx.dataSource.getCollection(name)` |
| **Lấy bộ sưu tập xuyên nguồn dữ liệu** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Lấy trường trong nguồn dữ liệu hiện tại** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Lấy trường xuyên nguồn dữ liệu** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Ví dụ

### Lấy bộ sưu tập và trường

```ts
// Lấy tất cả bộ sưu tập
const collections = ctx.dataSource.getCollections();

// Lấy bộ sưu tập theo tên
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Lấy định nghĩa trường theo "tên_bộ_sưu_tập.đường_dẫn_trường" (hỗ trợ liên kết)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Lấy trường liên kết

```ts
// Lấy định nghĩa trường liên kết theo collectionName.fieldName
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Xử lý dựa trên cấu trúc bộ sưu tập đích
}
```

### Duyệt qua các bộ sưu tập để xử lý động

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Dựa trên siêu dữ liệu trường để kiểm tra dữ liệu hoặc xử lý UI động

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Dựa trên interface, enum, validation, v.v. để xử lý logic UI hoặc kiểm tra dữ liệu
}
```

## Lưu ý

- Định dạng đường dẫn cho `getCollectionField(fieldPath)` là `collectionName.fieldPath`, trong đó đoạn đầu tiên là tên bộ sưu tập, các đoạn tiếp theo là đường dẫn trường (hỗ trợ liên kết, ví dụ `user.name`).
- `getCollection(name)` hỗ trợ định dạng `collectionName.fieldName`, trả về bộ sưu tập đích của trường liên kết đó.
- Trong ngữ cảnh RunJS, `ctx.dataSource` thường được quyết định bởi nguồn dữ liệu của khối hoặc trang hiện tại; nếu ngữ cảnh không liên kết với nguồn dữ liệu nào, nó có thể là `undefined`, do đó nên kiểm tra giá trị null trước khi sử dụng.

## Liên quan

- [ctx.dataSourceManager](./data-source-manager.md): Trình quản lý nguồn dữ liệu, quản lý tất cả các nguồn dữ liệu.
- [ctx.collection](./collection.md): Bộ sưu tập liên kết với ngữ cảnh hiện tại.
- [ctx.collectionField](./collection-field.md): Định nghĩa trường của bộ sưu tập cho trường hiện tại.