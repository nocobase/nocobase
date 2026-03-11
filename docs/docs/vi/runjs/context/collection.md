:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/collection).
:::

# ctx.collection

Thực thể bộ sưu tập (Collection) liên kết với ngữ cảnh thực thi RunJS hiện tại, được sử dụng để truy cập siêu dữ liệu (metadata), định nghĩa trường và cấu hình khóa chính của bộ sưu tập. Thông thường nó bắt nguồn từ `ctx.blockModel.collection` hoặc `ctx.collectionField?.collection`.

##适用场景

| Tình huống | Mô tả |
|------|------|
| **JSBlock** | Bộ sưu tập được liên kết với block; có thể truy cập `name`, `getFields`, `filterTargetKey`, v.v. |
| **JSField / JSItem / JSColumn** | Bộ sưu tập mà trường hiện tại thuộc về (hoặc bộ sưu tập của block cha), được sử dụng để lấy danh sách trường, khóa chính, v.v. |
| **Cột của bảng / Block chi tiết** | Dùng để hiển thị dựa trên cấu trúc bộ sưu tập hoặc truyền `filterByTk` khi mở cửa sổ bật lên (popup). |

> Lưu ý: `ctx.collection` khả dụng trong các trường hợp block dữ liệu, block biểu mẫu hoặc block bảng được liên kết với một bộ sưu tập. Trong một JSBlock độc lập không được liên kết với bộ sưu tập, giá trị này có thể là `null`. Khuyến nghị nên kiểm tra giá trị null trước khi sử dụng.

## Định nghĩa kiểu

```ts
collection: Collection | null | undefined;
```

## Thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `name` | `string` | Tên bộ sưu tập (ví dụ: `users`, `orders`) |
| `title` | `string` | Tiêu đề bộ sưu tập (bao gồm đa ngôn ngữ) |
| `filterTargetKey` | `string \| string[]` | Tên trường khóa chính, được sử dụng cho `filterByTk` và `getFilterByTK` |
| `dataSourceKey` | `string` | Key của nguồn dữ liệu (ví dụ: `main`) |
| `dataSource` | `DataSource` | Thực thể nguồn dữ liệu mà nó thuộc về |
| `template` | `string` | Bản mẫu bộ sưu tập (ví dụ: `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Danh sách các trường có thể hiển thị dưới dạng tiêu đề |
| `titleCollectionField` | `CollectionField` | Thực thể trường tiêu đề |

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `getFields(): CollectionField[]` | Lấy tất cả các trường (bao gồm cả các trường được kế thừa) |
| `getField(name: string): CollectionField \| undefined` | Lấy một trường duy nhất theo tên trường |
| `getFieldByPath(path: string): CollectionField \| undefined` | Lấy một trường theo đường dẫn (hỗ trợ liên kết, ví dụ: `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Lấy các trường liên kết; `types` có thể là `['one']`, `['many']`, v.v. |
| `getFilterByTK(record): any` | Trích xuất giá trị khóa chính từ một bản ghi, được sử dụng cho `filterByTk` của API |

## Quan hệ với ctx.collectionField và ctx.blockModel

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Bộ sưu tập liên kết với ngữ cảnh hiện tại** | `ctx.collection` (tương đương với `ctx.blockModel?.collection` hoặc `ctx.collectionField?.collection`) |
| **Định nghĩa bộ sưu tập của trường hiện tại** | `ctx.collectionField?.collection` (bộ sưu tập mà trường thuộc về) |
| **Bộ sưu tập đích của liên kết** | `ctx.collectionField?.targetCollection` (bộ sưu tập đích của một trường liên kết) |

Trong các trường hợp như bảng con (sub-table), `ctx.collection` có thể là bộ sưu tập đích của liên kết; trong các biểu mẫu/bảng tiêu chuẩn, nó thường là bộ sưu tập được liên kết với block.

## Ví dụ

### Lấy khóa chính và mở cửa sổ bật lên

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Duyệt qua các trường để xác thực hoặc liên kết dữ liệu

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} là bắt buộc`);
    return;
  }
}
```

### Lấy các trường liên kết

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Dùng để xây dựng bảng con, tài nguyên liên kết, v.v.
```

## Lưu ý

- `filterTargetKey` là tên trường khóa chính của bộ sưu tập. Một số bộ sưu tập có thể sử dụng `string[]` cho khóa chính phức hợp. Nếu không được cấu hình, `'id'` thường được sử dụng làm giá trị dự phòng.
- Trong các trường hợp như **bảng con hoặc trường liên kết**, `ctx.collection` có thể trỏ đến bộ sưu tập đích của liên kết, điều này khác với `ctx.blockModel.collection`.
- `getFields()` sẽ hợp nhất các trường từ các bộ sưu tập được kế thừa; các trường nội tại sẽ ghi đè các trường kế thừa có cùng tên.

## Liên quan

- [ctx.collectionField](./collection-field.md): Định nghĩa trường của bộ sưu tập cho trường hiện tại
- [ctx.blockModel](./block-model.md): Block cha chứa JS hiện tại, bao gồm `collection`
- [ctx.model](./model.md): Model hiện tại, có thể bao gồm `collection`