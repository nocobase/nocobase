---
title: "ctx.setValue()"
description: "ctx.setValue() đặt giá trị field form hoặc biến, hỗ trợ path, scope, silent, dùng cho liên kết, điền sẵn, cập nhật động."
keywords: "ctx.setValue,field form,path,scope,silent,liên kết,điền sẵn,RunJS,NocoBase"
---

# ctx.setValue()

Trong các kịch bản field có thể chỉnh sửa như JSField, JSItem, đặt giá trị của field hiện tại. Kết hợp với `ctx.getValue()` có thể thực hiện two-way binding với form.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Ghi giá trị người dùng chọn hoặc giá trị đã tính toán trong field tùy chỉnh có thể chỉnh sửa |
| **JSItem** | Cập nhật giá trị ô hiện tại trong item có thể chỉnh sửa của table/sub-table |
| **JSColumn** | Cập nhật giá trị field của hàng tương ứng dựa trên logic khi render column của table |

> Lưu ý: `ctx.setValue(v)` chỉ khả dụng trong ngữ cảnh RunJS có liên kết form; trong các kịch bản không có liên kết field như luồng sự kiện, quy tắc liên kết, JSBlock, phương thức này không tồn tại, khuyến nghị dùng optional chaining khi sử dụng: `ctx.setValue?.(value)`.

## Định nghĩa kiểu

```ts
setValue<T = any>(value: T): void;
```

- **Tham số**: `value` là giá trị field cần ghi, kiểu được xác định bởi kiểu form item của field.

## Giải thích về hành vi

- `ctx.setValue(v)` sẽ cập nhật giá trị của field hiện tại trong Ant Design Form, và trigger logic liên kết và validate form liên quan.
- Khi form chưa render xong hoặc field chưa đăng ký, gọi có thể không hiệu quả, khuyến nghị kết hợp với `ctx.getValue()` để xác nhận kết quả ghi.

## Ví dụ

### Kết hợp với getValue để two-way binding

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Đặt giá trị mặc định theo điều kiện

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Ghi lại field hiện tại khi liên kết với field khác

```ts
// 当某字段变更时，同步更新当前字段
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: '自定义', value: 'custom' });
}
```

## Lưu ý

- Trong các field không thể chỉnh sửa (như JSField chế độ chi tiết, JSBlock), `ctx.setValue` có thể là `undefined`, khuyến nghị dùng `ctx.setValue?.(value)` để tránh báo lỗi.
- Khi đặt giá trị cho field quan hệ (m2o, o2m, v.v.), cần truyền cấu trúc khớp với kiểu field (như `{ id, [titleField]: label }`), cụ thể tham khảo cấu hình field.

## Liên quan

- [ctx.getValue()](./get-value.md) - Lấy giá trị field hiện tại, kết hợp với setValue để two-way binding
- [ctx.form](./form.md) - Instance Ant Design Form, có thể đọc/ghi các field khác
- `js-field:value-change` - Sự kiện container được trigger khi giá trị bên ngoài thay đổi, dùng để cập nhật hiển thị
