:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/set-value).
:::

# ctx.setValue()

Trong các kịch bản trường có thể chỉnh sửa như JSField, JSItem, v.v., phương thức này dùng để thiết lập giá trị của trường hiện tại. Kết hợp với `ctx.getValue()`, nó cho phép thực hiện ràng buộc dữ liệu hai chiều (two-way binding) với biểu mẫu.

## Các kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Ghi các giá trị do người dùng chọn hoặc sau khi tính toán vào các trường tùy chỉnh có thể chỉnh sửa. |
| **JSItem** | Cập nhật giá trị ô hiện tại trong các mục có thể chỉnh sửa của bảng/bảng con. |
| **JSColumn** | Cập nhật giá trị trường của hàng tương ứng dựa trên logic khi hiển thị (render) cột của bảng. |

> **Lưu ý**: `ctx.setValue(v)` chỉ khả dụng trong ngữ cảnh RunJS có ràng buộc biểu mẫu; phương thức này không tồn tại trong các kịch bản không có ràng buộc trường như luồng công việc (workflow), quy tắc liên kết, JSBlock, v.v. Khuyến nghị sử dụng optional chaining trước khi dùng: `ctx.setValue?.(value)`.

## Định nghĩa kiểu

```ts
setValue<T = any>(value: T): void;
```

- **Tham số**: `value` là giá trị trường cần ghi, kiểu dữ liệu được quyết định bởi kiểu mục biểu mẫu (form item type) của trường đó.

## Hành vi

- `ctx.setValue(v)` sẽ cập nhật giá trị của trường hiện tại trong Ant Design Form, đồng thời kích hoạt các logic liên kết biểu mẫu và kiểm tra (validation) liên quan.
- Nếu biểu mẫu chưa hoàn tất hiển thị hoặc trường chưa được đăng ký, việc gọi phương thức có thể không hiệu quả. Khuyến nghị phối hợp với `ctx.getValue()` để xác nhận kết quả ghi.

## Ví dụ

### Phối hợp với getValue để thực hiện ràng buộc hai chiều

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

### Thiết lập giá trị mặc định dựa trên điều kiện

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Ghi lại giá trị vào trường hiện tại khi liên kết với các trường khác

```ts
// Cập nhật đồng bộ trường hiện tại khi một trường khác thay đổi
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Tùy chỉnh', value: 'custom' });
}
```

## Lưu ý

- Trong các trường không thể chỉnh sửa (ví dụ: chế độ chi tiết của JSField, JSBlock), `ctx.setValue` có thể là `undefined`. Khuyến nghị sử dụng `ctx.setValue?.(value)` để tránh lỗi.
- Khi thiết lập giá trị cho các trường liên kết (M2O, O2M, v.v.), cần truyền vào cấu trúc khớp với kiểu trường (ví dụ: `{ id, [titleField]: label }`), chi tiết dựa trên cấu hình của trường cụ thể.

## Liên quan

- [ctx.getValue()](./get-value.md) - Lấy giá trị trường hiện tại, phối hợp với setValue để thực hiện ràng buộc hai chiều.
- [ctx.form](./form.md) - Instance của Ant Design Form, có thể đọc và ghi các trường khác.
- `js-field:value-change` - Sự kiện container được kích hoạt khi giá trị bên ngoài thay đổi, dùng để cập nhật hiển thị.