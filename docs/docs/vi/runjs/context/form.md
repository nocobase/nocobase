:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/form).
:::

# ctx.form

Instance của Ant Design Form trong block hiện tại, được sử dụng để đọc/ghi các trường dữ liệu của biểu mẫu, kích hoạt kiểm tra tính hợp lệ (validation) và gửi biểu mẫu (submission). Nó tương đương với `ctx.blockModel?.form` và có thể được sử dụng trực tiếp trong các block liên quan đến biểu mẫu (Form, EditForm, biểu mẫu con, v.v.).

## Các kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Đọc/ghi các trường biểu mẫu khác để thực hiện liên kết (linkage), hoặc thực hiện tính toán và kiểm tra dựa trên giá trị của các trường khác. |
| **JSItem** | Đọc/ghi các trường cùng hàng hoặc các trường khác trong các mục của bảng con (sub-table) để thực hiện liên kết trong bảng. |
| **JSColumn** | Đọc giá trị của hàng hiện tại hoặc các trường liên kết trong một cột của bảng để hiển thị (rendering). |
| **Thao tác biểu mẫu / Luồng sự kiện** | Kiểm tra trước khi gửi, cập nhật hàng loạt các trường, đặt lại biểu mẫu, v.v. |

> Lưu ý: `ctx.form` chỉ khả dụng trong ngữ cảnh RunJS liên quan đến các block biểu mẫu (Form, EditForm, biểu mẫu con, v.v.). Nó có thể không tồn tại trong các tình huống không phải biểu mẫu (như các JSBlock độc lập hoặc block Bảng). Khuyến nghị nên kiểm tra giá trị null trước khi sử dụng: `ctx.form?.getFieldsValue()`.

## Định nghĩa kiểu

```ts
form: FormInstance<any>;
```

`FormInstance` là kiểu instance của Ant Design Form. Các phương thức phổ biến như sau.

## Các phương thức thường dùng

### Đọc giá trị biểu mẫu

```ts
// Đọc giá trị của các trường đã đăng ký hiện tại (mặc định chỉ bao gồm các trường đã hiển thị)
const values = ctx.form.getFieldsValue();

// Đọc giá trị của tất cả các trường (bao gồm cả các trường đã đăng ký nhưng chưa hiển thị, ví dụ: bị ẩn hoặc nằm trong các phần bị thu gọn)
const allValues = ctx.form.getFieldsValue(true);

// Đọc một trường duy nhất
const email = ctx.form.getFieldValue('email');

// Đọc các trường lồng nhau (ví dụ: trong bảng con)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Ghi giá trị biểu mẫu

```ts
// Cập nhật hàng loạt (thường dùng cho liên kết)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Cập nhật một trường duy nhất
ctx.form.setFieldValue('remark', 'Đã ghi chú');
```

### Kiểm tra và Gửi

```ts
// Kích hoạt kiểm tra tính hợp lệ của biểu mẫu
await ctx.form.validateFields();

// Kích hoạt gửi biểu mẫu
ctx.form.submit();
```

### Đặt lại (Reset)

```ts
// Đặt lại tất cả các trường
ctx.form.resetFields();

// Chỉ đặt lại các trường được chỉ định
ctx.form.resetFields(['status', 'remark']);
```

## Mối quan hệ với các context liên quan

### ctx.getValue / ctx.setValue

| Kịch bản | Cách dùng khuyến nghị |
|------|----------|
| **Đọc/ghi trường hiện tại** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Đọc/ghi các trường khác** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Trong trường JS hiện tại, ưu tiên sử dụng `getValue`/`setValue` để đọc/ghi chính trường đó; sử dụng `ctx.form` khi cần truy cập các trường khác.

### ctx.blockModel

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Đọc/ghi trường biểu mẫu** | `ctx.form` (Tương đương `ctx.blockModel?.form`, thuận tiện hơn) |
| **Truy cập block cha** | `ctx.blockModel` (Bao gồm `collection`, `resource`, v.v.) |

### ctx.getVar('ctx.formValues')

Giá trị biểu mẫu phải được lấy thông qua `await ctx.getVar('ctx.formValues')` và không được hiển thị trực tiếp dưới dạng `ctx.formValues`. Trong ngữ cảnh biểu mẫu, ưu tiên sử dụng `ctx.form.getFieldsValue()` để đọc các giá trị mới nhất trong thời gian thực.

## Lưu ý

- `getFieldsValue()` mặc định chỉ trả về các trường đã hiển thị; các trường chưa hiển thị (như trong vùng thu gọn, ẩn do điều kiện) cần truyền `true`: `getFieldsValue(true)`.
- Đường dẫn cho các trường lồng nhau như bảng con là một mảng, ví dụ: `['orders', 0, 'amount']`. Bạn có thể sử dụng `ctx.namePath` để lấy đường dẫn của trường hiện tại và xây dựng đường dẫn cho các cột khác trong cùng một hàng.
- `validateFields()` sẽ ném ra một đối tượng lỗi chứa thông tin `errorFields` và các thông tin khác. Nếu kiểm tra thất bại trước khi gửi, bạn có thể sử dụng `ctx.exit()` để chấm dứt các bước tiếp theo.
- Trong các kịch bản bất đồng bộ như luồng công việc hoặc quy tắc liên kết, `ctx.form` có thể chưa sẵn sàng. Khuyến nghị sử dụng optional chaining hoặc kiểm tra giá trị null.

## Ví dụ

### Liên kết trường: Hiển thị nội dung khác nhau dựa trên loại

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Tính toán trường hiện tại dựa trên các trường khác

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Đọc/ghi các cột khác trong cùng một hàng trong bảng con

```ts
// ctx.namePath là đường dẫn của trường hiện tại trong biểu mẫu, ví dụ: ['orders', 0, 'amount']
// Đọc 'status' cùng hàng: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Kiểm tra trước khi gửi

```ts
try {
  await ctx.form.validateFields();
  // Kiểm tra thông qua, tiếp tục logic gửi
} catch (e) {
  ctx.message.error('Vui lòng kiểm tra lại các trường trong biểu mẫu');
  ctx.exit();
}
```

### Gửi sau khi xác nhận

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Xác nhận gửi',
  content: 'Bạn sẽ không thể sửa đổi sau khi gửi. Tiếp tục?',
  okText: 'Xác nhận',
  cancelText: 'Hủy',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Chấm dứt nếu người dùng hủy
}
```

## Liên quan

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Đọc và ghi giá trị trường hiện tại.
- [ctx.blockModel](./block-model.md): Model của block cha; `ctx.form` tương đương với `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Hộp thoại xác nhận, thường dùng kết hợp với `ctx.form.validateFields()` và `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Chấm dứt quy trình khi kiểm tra thất bại hoặc người dùng hủy bỏ.
- `ctx.namePath`: Đường dẫn (mảng) của trường hiện tại trong biểu mẫu, dùng để xây dựng tên cho `getFieldValue` / `setFieldValue` trong các trường lồng nhau.