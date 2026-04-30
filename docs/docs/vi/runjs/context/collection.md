---
title: "ctx.collection"
description: "ctx.collection là instance collection được liên kết với ngữ cảnh RunJS hiện tại, truy cập metadata như name, getFields, filterTargetKey."
keywords: "ctx.collection,Collection,collection,getFields,filterTargetKey,metadata,RunJS,NocoBase"
---

# ctx.collection

Instance collection (Collection) được liên kết với ngữ cảnh thực thi RunJS hiện tại, dùng để truy cập metadata, định nghĩa field và cấu hình primary key của collection. Thường đến từ `ctx.blockModel.collection` hoặc `ctx.collectionField?.collection`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Collection liên kết với block, có thể truy cập `name`, `getFields`, `filterTargetKey`, v.v. |
| **JSField / JSItem / JSColumn** | Collection mà field hiện tại thuộc về (hoặc collection của block cha), dùng để lấy danh sách field, primary key, v.v. |
| **Column của table / block chi tiết** | Render theo cấu trúc collection, truyền `filterByTk` khi mở popup, v.v. |

> Lưu ý: `ctx.collection` khả dụng trong các kịch bản block dữ liệu, block form, block table có liên kết collection; JSBlock độc lập nếu không liên kết collection có thể là `null`, khuyến nghị kiểm tra null trước khi sử dụng.

## Định nghĩa kiểu

```ts
collection: Collection | null | undefined;
```

## Thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `name` | `string` | Tên collection (như `users`, `orders`) |
| `title` | `string` | Tiêu đề collection (có hỗ trợ i18n) |
| `filterTargetKey` | `string \| string[]` | Tên field primary key, dùng cho `filterByTk`, `getFilterByTK` |
| `dataSourceKey` | `string` | Key data source (như `main`) |
| `dataSource` | `DataSource` | Instance data source mà collection thuộc về |
| `template` | `string` | Template collection (như `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Danh sách field có thể dùng làm tiêu đề hiển thị |
| `titleCollectionField` | `CollectionField` | Instance field tiêu đề |

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `getFields(): CollectionField[]` | Lấy tất cả field (bao gồm kế thừa) |
| `getField(name: string): CollectionField \| undefined` | Lấy một field theo tên |
| `getFieldByPath(path: string): CollectionField \| undefined` | Lấy field theo đường dẫn (hỗ trợ quan hệ, như `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Lấy field quan hệ, `types` có thể là `['one']`, `['many']`, v.v. |
| `getFilterByTK(record): any` | Trích xuất giá trị primary key từ bản ghi, dùng cho `filterByTk` của API |

## Quan hệ với ctx.collectionField, ctx.blockModel

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Collection được liên kết với ngữ cảnh hiện tại** | `ctx.collection` (tương đương với `ctx.blockModel?.collection` hoặc `ctx.collectionField?.collection`) |
| **Định nghĩa collection của field hiện tại** | `ctx.collectionField?.collection` (collection mà field thuộc về) |
| **Collection đích quan hệ** | `ctx.collectionField?.targetCollection` (collection đích của field quan hệ) |

Trong các kịch bản như sub-table, `ctx.collection` có thể là collection đích quan hệ; trong form/table thông thường, thường là collection liên kết với block.

## Ví dụ

### Lấy primary key và mở popup

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

### Duyệt field để validate hoặc liên kết

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} 为必填`);
    return;
  }
}
```

### Lấy field quan hệ

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Dùng để xây dựng sub-table, resource quan hệ, v.v.
```

## Lưu ý

- `filterTargetKey` là tên field primary key của collection; một số collection có thể có primary key phức hợp dạng `string[]`; khi chưa cấu hình, thường dùng `'id'` làm fallback.
- Trong các kịch bản như **sub-table, field quan hệ**, `ctx.collection` có thể trỏ đến collection đích quan hệ, khác với `ctx.blockModel.collection`.
- `getFields()` sẽ gộp các field của collection kế thừa, field của bản thân ghi đè field cùng tên kế thừa.

## Liên quan

- [ctx.collectionField](./collection-field.md): Định nghĩa field collection của field hiện tại
- [ctx.blockModel](./block-model.md): Block cha chứa JS hiện tại, có chứa `collection`
- [ctx.model](./model.md): Model hiện tại, có thể chứa `collection`
