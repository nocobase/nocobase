---
title: "ctx.blockModel"
description: "ctx.blockModel là model của block cha nơi JS field/block hiện tại đang nằm, có thể truy cập form, collection, resource, dùng cho liên kết JSField, JSItem, JSColumn."
keywords: "ctx.blockModel,BlockModel,form,collection,resource,JSField,JSItem,RunJS,NocoBase"
---

# ctx.blockModel

Model block cha (instance BlockModel) nơi JS field / JS block hiện tại đang nằm. Trong các kịch bản như JSField, JSItem, JSColumn, `ctx.blockModel` trỏ tới block form hoặc block table chứa logic JS hiện tại; trong block JSBlock độc lập có thể là `null` hoặc giống với `ctx.model`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Trong field của form, truy cập `form`, `collection`, `resource` của block form cha để thực hiện liên kết hoặc validate |
| **JSItem** | Trong item của sub-table, truy cập resource, thông tin collection của block table/form cha |
| **JSColumn** | Trong column của table, truy cập `resource` (như `getSelectedRows`), `collection` của block table cha |
| **Action form / luồng sự kiện** | Truy cập `form` để validate trước khi submit, `resource` để refresh, v.v. |

> Lưu ý: `ctx.blockModel` chỉ khả dụng trong ngữ cảnh RunJS có block cha; với JSBlock độc lập (không có block form/table cha) có thể là `null`, khuyến nghị kiểm tra null trước khi sử dụng.

## Định nghĩa kiểu

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Kiểu cụ thể tùy thuộc vào kiểu block cha: block form thường là `FormBlockModel`, `EditFormModel`, block table thường là `TableBlockModel`.

## Thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | Định danh duy nhất của model block |
| `collection` | `Collection` | Collection được liên kết với block hiện tại |
| `resource` | `Resource` | Instance resource được block sử dụng (`SingleRecordResource` / `MultiRecordResource`, v.v.) |
| `form` | `FormInstance` | Block form: instance Ant Design Form, hỗ trợ `getFieldsValue`, `validateFields`, `setFieldsValue`, v.v. |
| `emitter` | `EventEmitter` | Bộ phát sự kiện, có thể lắng nghe `formValuesChange`, `onFieldReset`, v.v. |

## Quan hệ với ctx.model, ctx.form

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Block cha nơi JS hiện tại đang nằm** | `ctx.blockModel` |
| **Đọc/ghi field của form** | `ctx.form` (tương đương với `ctx.blockModel?.form`, tiện lợi hơn trong block form) |
| **Model nơi ngữ cảnh thực thi hiện tại đang nằm** | `ctx.model` (trong JSField là model field, trong JSBlock là model block) |

Trong JSField, `ctx.model` là model field, `ctx.blockModel` là block form/table chứa field đó; `ctx.form` thường là `ctx.blockModel.form`.

## Ví dụ

### Table: lấy hàng đã chọn và xử lý

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('请先选择数据');
  return;
}
```

### Kịch bản form: validate và refresh

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Lắng nghe thay đổi form

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Thực hiện liên kết hoặc render lại theo giá trị form mới nhất
});
```

### Trigger render lại block

```ts
ctx.blockModel?.rerender?.();
```

## Lưu ý

- `ctx.blockModel` có thể là `null` trong **JSBlock độc lập** (không có block form/table cha), khuyến nghị sử dụng optional chaining khi truy cập thuộc tính: `ctx.blockModel?.resource?.refresh?.()`.
- Trong **JSField / JSItem / JSColumn**, `ctx.blockModel` là block form hoặc table chứa field hiện tại; trong **JSBlock**, có thể là chính nó hoặc block cấp trên, tùy thuộc vào cấp bậc thực tế.
- `resource` chỉ tồn tại trong block dữ liệu; `form` chỉ tồn tại trong block form, block table thường không có `form`.

## Liên quan

- [ctx.model](./model.md): Model nơi ngữ cảnh thực thi hiện tại đang nằm
- [ctx.form](./form.md): Instance form, thường dùng trong block form
- [ctx.resource](./resource.md): Instance resource (tương đương với `ctx.blockModel?.resource`, sử dụng trực tiếp nếu có)
- [ctx.getModel()](./get-model.md): Lấy model block khác theo uid
