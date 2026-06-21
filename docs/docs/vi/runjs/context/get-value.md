---
title: "ctx.getValue()"
description: "ctx.getValue() lấy giá trị field form hoặc biến, hỗ trợ path, scope, dùng cho liên kết, tính toán, validate."
keywords: "ctx.getValue,field form,path,scope,liên kết,tính toán,validate,RunJS,NocoBase"
---

# ctx.getValue()

Trong các kịch bản field có thể chỉnh sửa như JSField, JSItem, lấy giá trị mới nhất của field hiện tại. Kết hợp với `ctx.setValue(v)` có thể thực hiện two-way binding với form.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Đọc input của người dùng hoặc giá trị form hiện tại trong field tùy chỉnh có thể chỉnh sửa |
| **JSItem** | Đọc giá trị ô hiện tại trong item có thể chỉnh sửa của table/sub-table |
| **JSColumn** | Đọc giá trị field của hàng tương ứng khi render column của table |

> Lưu ý: `ctx.getValue()` chỉ khả dụng trong ngữ cảnh RunJS có liên kết form; trong các kịch bản không có liên kết field như luồng sự kiện, quy tắc liên kết, phương thức này không tồn tại.

## Định nghĩa kiểu

```ts
getValue<T = any>(): T | undefined;
```

- **Giá trị trả về**: Giá trị field hiện tại, kiểu được xác định bởi kiểu form item của field; có thể là `undefined` khi field chưa đăng ký hoặc chưa điền.

## Thứ tự lấy giá trị

`ctx.getValue()` lấy giá trị theo thứ tự sau:

1. **Trạng thái form**: Ưu tiên đọc từ trạng thái hiện tại của Ant Design Form
2. **Giá trị fallback**: Nếu không có field này trong form, fallback về giá trị khởi tạo hoặc props của field

> Khi form chưa render xong hoặc field chưa đăng ký, có thể trả về `undefined`.

## Ví dụ

### Render dựa trên giá trị hiện tại

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>请先输入内容</span>);
} else {
  ctx.render(<span>当前值：{current}</span>);
}
```

### Kết hợp với setValue để thực hiện two-way binding

```tsx
const { Input } = ctx.libs.antd;

// 读取当前值作为默认值
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Liên quan

- [ctx.setValue()](./set-value.md) - Đặt giá trị field hiện tại, kết hợp với `getValue` để thực hiện two-way binding
- [ctx.form](./form.md) - Instance Ant Design Form, có thể đọc/ghi các field khác
- `js-field:value-change` - Sự kiện container được trigger khi giá trị bên ngoài thay đổi, dùng để cập nhật hiển thị
