:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/get-value).
:::

# ctx.getValue()

Trong các tình huống trường có thể chỉnh sửa như JSField và JSItem, sử dụng phương thức này để lấy giá trị mới nhất của trường hiện tại. Khi kết hợp với `ctx.setValue(v)`, nó cho phép thực hiện liên kết hai chiều (two-way binding) với biểu mẫu.

## Các tình huống áp dụng

| Tình huống | Mô tả |
|------|------|
| **JSField** | Đọc dữ liệu nhập từ người dùng hoặc giá trị hiện tại của biểu mẫu trong các trường tùy chỉnh có thể chỉnh sửa. |
| **JSItem** | Đọc giá trị ô hiện tại trong các mục có thể chỉnh sửa của bảng/bảng con. |
| **JSColumn** | Đọc giá trị trường của hàng tương ứng khi hiển thị cột của bảng. |

> **Lưu ý**: `ctx.getValue()` chỉ khả dụng trong ngữ cảnh RunJS có liên kết với biểu mẫu; phương thức này không tồn tại trong các tình huống không có liên kết trường như luồng công việc (workflow) hoặc quy tắc liên kết.

## Định nghĩa kiểu dữ liệu

```ts
getValue<T = any>(): T | undefined;
```

- **Giá trị trả về**: Giá trị hiện tại của trường, kiểu dữ liệu được quyết định bởi kiểu mục biểu mẫu của trường; có thể là `undefined` nếu trường chưa được đăng ký hoặc chưa được điền.

## Thứ tự lấy giá trị

`ctx.getValue()` lấy giá trị theo thứ tự sau:

1. **Trạng thái biểu mẫu**: Ưu tiên đọc từ trạng thái hiện tại của Ant Design Form.
2. **Giá trị dự phòng**: Nếu trường không tồn tại trong biểu mẫu, nó sẽ quay lại giá trị khởi tạo hoặc props của trường.

> Nếu biểu mẫu chưa hoàn tất hiển thị hoặc trường chưa được đăng ký, phương thức có thể trả về `undefined`.

## Ví dụ

### Hiển thị dựa trên giá trị hiện tại

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Vui lòng nhập nội dung trước</span>);
} else {
  ctx.render(<span>Giá trị hiện tại: {current}</span>);
}
```

### Kết hợp với setValue để thực hiện liên kết hai chiều

```tsx
const { Input } = ctx.libs.antd;

// Đọc giá trị hiện tại làm giá trị mặc định
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Liên quan

- [ctx.setValue()](./set-value.md) - Thiết lập giá trị trường hiện tại, kết hợp với `getValue` để thực hiện liên kết hai chiều.
- [ctx.form](./form.md) - Thực thể (instance) Ant Design Form, có thể đọc và ghi các trường khác.
- `js-field:value-change` - Sự kiện container được kích hoạt khi giá trị bên ngoài thay đổi, dùng để cập nhật hiển thị.