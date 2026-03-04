:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/collection-field).
:::

# ctx.collectionField

Thực thể trường của bộ sưu tập (CollectionField) liên kết với ngữ cảnh thực thi RunJS hiện tại, được sử dụng để truy cập siêu dữ liệu (metadata), kiểu dữ liệu, quy tắc kiểm tra (validation) và thông tin liên kết của trường. Chỉ tồn tại khi trường được liên kết với định nghĩa bộ sưu tập; các trường tùy chỉnh/ảo có thể là `null`.

## Các trường hợp sử dụng

| Tình huống | Mô tả |
|------|------|
| **JSField** | Thực hiện liên kết hoặc kiểm tra trong các trường biểu mẫu dựa trên `interface`, `enum`, `targetCollection`, v.v. |
| **JSItem** | Truy cập siêu dữ liệu của trường tương ứng với cột hiện tại trong các mục của bảng con (sub-table). |
| **JSColumn** | Chọn phương thức hiển thị dựa trên `collectionField.interface` hoặc truy cập `targetCollection` trong các cột của bảng. |

> Lưu ý: `ctx.collectionField` chỉ khả dụng khi trường được liên kết với định nghĩa bộ sưu tập (Collection); trong các tình huống như khối độc lập JSBlock hoặc các sự kiện thao tác không có liên kết trường, nó thường là `undefined`. Khuyến nghị kiểm tra giá trị null trước khi sử dụng.

## Định nghĩa kiểu

```ts
collectionField: CollectionField | null | undefined;
```

## Các thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `name` | `string` | Tên trường (ví dụ: `status`, `userId`) |
| `title` | `string` | Tiêu đề trường (bao gồm đa ngôn ngữ) |
| `type` | `string` | Kiểu dữ liệu của trường (`string`, `integer`, `belongsTo`, v.v.) |
| `interface` | `string` | Kiểu giao diện của trường (`input`, `select`, `m2o`, `o2m`, `m2m`, v.v.) |
| `collection` | `Collection` | Bộ sưu tập mà trường thuộc về |
| `targetCollection` | `Collection` | Bộ sưu tập đích của trường liên kết (chỉ có giá trị đối với các kiểu liên kết) |
| `target` | `string` | Tên bộ sưu tập đích (trường liên kết) |
| `enum` | `array` | Các tùy chọn enum (select, radio, v.v.) |
| `defaultValue` | `any` | Giá trị mặc định |
| `collectionName` | `string` | Tên của bộ sưu tập sở hữu |
| `foreignKey` | `string` | Tên trường khóa ngoại (belongsTo, v.v.) |
| `sourceKey` | `string` | Khóa nguồn liên kết (hasMany, v.v.) |
| `targetKey` | `string` | Khóa đích liên kết |
| `fullpath` | `string` | Đường dẫn đầy đủ (ví dụ: `main.users.status`), dùng cho API hoặc tham chiếu biến |
| `resourceName` | `string` | Tên tài nguyên (ví dụ: `users.status`) |
| `readonly` | `boolean` | Có phải là chỉ đọc hay không |
| `titleable` | `boolean` | Có thể dùng làm tiêu đề hiển thị hay không |
| `validation` | `object` | Cấu hình quy tắc kiểm tra |
| `uiSchema` | `object` | Cấu hình UI |
| `targetCollectionTitleField` | `CollectionField` | Trường tiêu đề của bộ sưu tập đích (trường liên kết) |

## Các phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `isAssociationField(): boolean` | Có phải là trường liên kết hay không (belongsTo, hasMany, hasOne, belongsToMany, v.v.) |
| `isRelationshipField(): boolean` | Có phải là trường quan hệ hay không (bao gồm o2o, m2o, o2m, m2m, v.v.) |
| `getComponentProps(): object` | Lấy các props mặc định của component trường |
| `getFields(): CollectionField[]` | Lấy danh sách trường của bộ sưu tập đích (chỉ dành cho trường liên kết) |
| `getFilterOperators(): object[]` | Lấy các toán tử lọc được hỗ trợ bởi trường này (ví dụ: `$eq`, `$ne`, v.v.) |

## Ví dụ

### Hiển thị rẽ nhánh dựa trên kiểu trường

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Trường liên kết: hiển thị các bản ghi liên kết
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Xác định xem có phải là trường liên kết và truy cập bộ sưu tập đích hay không

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Xử lý theo cấu trúc bộ sưu tập đích
}
```

### Lấy các tùy chọn enum

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Hiển thị có điều kiện dựa trên chế độ chỉ đọc/chỉ hiển thị

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Lấy trường tiêu đề của bộ sưu tập đích

```ts
// Khi hiển thị trường liên kết, có thể sử dụng targetCollectionTitleField để lấy tên trường tiêu đề
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Quan hệ với ctx.collection

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Bộ sưu tập của trường hiện tại** | `ctx.collectionField?.collection` hoặc `ctx.collection` |
| **Siêu dữ liệu của trường (tên, kiểu, giao diện, enum, v.v.)** | `ctx.collectionField` |
| **Bộ sưu tập đích** | `ctx.collectionField?.targetCollection` |

`ctx.collection` thường đại diện cho bộ sưu tập được liên kết với khối hiện tại; `ctx.collectionField` đại diện cho định nghĩa của trường hiện tại trong bộ sưu tập. Trong các tình huống như bảng con hoặc trường liên kết, hai giá trị này có thể khác nhau.

## Lưu ý

- Trong các tình huống như **JSBlock**, **JSAction (không có liên kết trường)**, `ctx.collectionField` thường là `undefined`, khuyến nghị sử dụng optional chaining trước khi truy cập.
- Nếu trường JS tùy chỉnh không được liên kết với trường bộ sưu tập, `ctx.collectionField` có thể là `null`.
- `targetCollection` chỉ tồn tại đối với các trường kiểu liên kết (như m2o, o2m, m2m); `enum` chỉ tồn tại đối với các trường có tùy chọn như select, radioGroup.

## Liên quan

- [ctx.collection](./collection.md): Bộ sưu tập liên kết với ngữ cảnh hiện tại
- [ctx.model](./model.md): Model nơi ngữ cảnh thực thi hiện tại tọa lạc
- [ctx.blockModel](./block-model.md): Khối cha chứa JS hiện tại
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Đọc và ghi giá trị trường hiện tại