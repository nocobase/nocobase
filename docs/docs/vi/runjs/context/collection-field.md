---
title: "ctx.collectionField"
description: "ctx.collectionField là instance Collection Field tương ứng với field hiện tại, dùng để lấy metadata field, cấu hình quan hệ."
keywords: "ctx.collectionField,Collection Field,metadata field,cấu hình quan hệ,RunJS,NocoBase"
---

# ctx.collectionField

Instance field collection (CollectionField) liên kết với ngữ cảnh thực thi RunJS hiện tại, dùng để truy cập metadata, kiểu, quy tắc validate và thông tin quan hệ của field. Chỉ tồn tại khi field được liên kết với định nghĩa collection; field tùy chỉnh/ảo có thể là `null`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Trong field của form, thực hiện liên kết hoặc validate dựa trên `interface`, `enum`, `targetCollection`, v.v. |
| **JSItem** | Trong item của sub-table, truy cập metadata của field tương ứng với column hiện tại |
| **JSColumn** | Trong column của table, chọn cách render theo `collectionField.interface`, hoặc truy cập `targetCollection` |

> Lưu ý: `ctx.collectionField` chỉ khả dụng khi field được liên kết với định nghĩa collection (Collection); trong JSBlock độc lập, sự kiện action không có liên kết field, v.v., thường là `undefined`, khuyến nghị kiểm tra null trước khi sử dụng.

## Định nghĩa kiểu

```ts
collectionField: CollectionField | null | undefined;
```

## Thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `name` | `string` | Tên field (như `status`, `userId`) |
| `title` | `string` | Tiêu đề field (có hỗ trợ i18n) |
| `type` | `string` | Kiểu dữ liệu của field (`string`, `integer`, `belongsTo`, v.v.) |
| `interface` | `string` | Kiểu giao diện của field (`input`, `select`, `m2o`, `o2m`, `m2m`, v.v.) |
| `collection` | `Collection` | Collection mà field thuộc về |
| `targetCollection` | `Collection` | Collection đích của field quan hệ (chỉ có giá trị với kiểu quan hệ) |
| `target` | `string` | Tên collection đích (field quan hệ) |
| `enum` | `array` | Tùy chọn enum (select, radio, v.v.) |
| `defaultValue` | `any` | Giá trị mặc định |
| `collectionName` | `string` | Tên collection mà field thuộc về |
| `foreignKey` | `string` | Tên field khóa ngoại (belongsTo, v.v.) |
| `sourceKey` | `string` | Khóa nguồn của quan hệ (hasMany, v.v.) |
| `targetKey` | `string` | Khóa đích của quan hệ |
| `fullpath` | `string` | Đường dẫn đầy đủ (như `main.users.status`), dùng cho API hoặc tham chiếu biến |
| `resourceName` | `string` | Tên resource (như `users.status`) |
| `readonly` | `boolean` | Có chỉ đọc hay không |
| `titleable` | `boolean` | Có thể dùng làm tiêu đề hiển thị hay không |
| `validation` | `object` | Cấu hình quy tắc validate |
| `uiSchema` | `object` | Cấu hình UI |
| `targetCollectionTitleField` | `CollectionField` | Field tiêu đề của collection đích (field quan hệ) |

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `isAssociationField(): boolean` | Có phải field quan hệ không (belongsTo, hasMany, hasOne, belongsToMany, v.v.) |
| `isRelationshipField(): boolean` | Có phải field kiểu quan hệ không (bao gồm o2o, m2o, o2m, m2m, v.v.) |
| `getComponentProps(): object` | Lấy props mặc định của component field |
| `getFields(): CollectionField[]` | Lấy danh sách field của collection đích quan hệ (chỉ với field quan hệ) |
| `getFilterOperators(): object[]` | Lấy các toán tử filter mà field hỗ trợ (như `$eq`, `$ne`, v.v.) |

## Ví dụ

### Render phân nhánh theo kiểu field

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Field quan hệ: hiển thị bản ghi liên quan
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Kiểm tra có phải field quan hệ và truy cập collection đích

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Xử lý theo cấu trúc collection đích
}
```

### Lấy tùy chọn enum

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Render có điều kiện theo chế độ chỉ đọc/chỉ hiển thị

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Lấy field tiêu đề của collection đích quan hệ

```ts
// Khi hiển thị field quan hệ, có thể dùng titleCollectionField của collection đích để lấy tên field tiêu đề
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Quan hệ với ctx.collection

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Collection mà field hiện tại thuộc về** | `ctx.collectionField?.collection` hoặc `ctx.collection` |
| **Metadata field (tên, kiểu, interface, enum, v.v.)** | `ctx.collectionField` |
| **Collection đích quan hệ** | `ctx.collectionField?.targetCollection` |

`ctx.collection` thường biểu thị collection được liên kết với block hiện tại; `ctx.collectionField` biểu thị định nghĩa field hiện tại trong collection. Trong các kịch bản như sub-table, field quan hệ, hai cái này có thể khác nhau.

## Lưu ý

- Trong các kịch bản như **JSBlock**, **JSAction (không có liên kết field)**, `ctx.collectionField` thường là `undefined`, khuyến nghị sử dụng optional chaining khi truy cập.
- JS field tùy chỉnh nếu chưa được liên kết với field collection, `ctx.collectionField` có thể là `null`.
- `targetCollection` chỉ tồn tại với field kiểu quan hệ (như m2o, o2m, m2m); `enum` chỉ tồn tại với field có tùy chọn như select, radioGroup.

## Liên quan

- [ctx.collection](./collection.md): Collection được liên kết với ngữ cảnh hiện tại
- [ctx.model](./model.md): Model nơi ngữ cảnh thực thi hiện tại đang nằm
- [ctx.blockModel](./block-model.md): Block cha chứa JS hiện tại
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Đọc/ghi giá trị field hiện tại
