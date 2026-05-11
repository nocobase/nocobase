---
title: "ctx.form"
description: "ctx.form là instance Ant Design Form trong block hiện tại, dùng để đọc/ghi field form, validate và submit, tương đương với ctx.blockModel?.form."
keywords: "ctx.form,Ant Design Form,form,validate,submit,field form,RunJS,NocoBase"
---

# ctx.form

Instance Ant Design Form trong block hiện tại, dùng để đọc/ghi field form, trigger validate và submit. Tương đương với `ctx.blockModel?.form`, có thể sử dụng trực tiếp trong block form (Form, EditForm, sub-form, v.v.).

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Đọc/ghi các field form khác để liên kết, tính toán hoặc validate dựa trên giá trị các field khác |
| **JSItem** | Trong item của sub-table, đọc/ghi field cùng hàng hoặc field khác để liên kết trong table |
| **JSColumn** | Trong column của table, đọc giá trị hàng đó hoặc field quan hệ để render |
| **Action form / luồng sự kiện** | Validate trước khi submit, cập nhật field hàng loạt, reset form, v.v. |

> Lưu ý: `ctx.form` chỉ khả dụng trong ngữ cảnh RunJS liên quan đến block form (Form, EditForm, sub-form, v.v.); trong các kịch bản không phải form (như JSBlock độc lập, block table) có thể không tồn tại, khuyến nghị kiểm tra null trước khi sử dụng: `ctx.form?.getFieldsValue()`.

## Định nghĩa kiểu

```ts
form: FormInstance<any>;
```

`FormInstance` là kiểu instance của Ant Design Form, các phương thức thường dùng như sau.

## Phương thức thường dùng

### Đọc giá trị form

```ts
// 读取当前已注册字段的值（默认仅包含已渲染的字段）
const values = ctx.form.getFieldsValue();

// 读取所有字段的值（包含已注册但未渲染的字段，如隐藏、折叠区内的）
const allValues = ctx.form.getFieldsValue(true);

// 读取单个字段
const email = ctx.form.getFieldValue('email');

// 读取嵌套字段（如子表格）
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Ghi giá trị form

```ts
// 批量更新（常用于联动）
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// 更新单个字段
ctx.form.setFieldValue('remark', '已备注');
```

### Validate và submit

```ts
// 触发表单校验
await ctx.form.validateFields();

// 触发表单提交
ctx.form.submit();
```

### Reset

```ts
// 重置全部字段
ctx.form.resetFields();

// 仅重置指定字段
ctx.form.resetFields(['status', 'remark']);
```

## Quan hệ với các context liên quan

### ctx.getValue / ctx.setValue

| Kịch bản | Cách dùng khuyến nghị |
|------|----------|
| **Đọc/ghi field hiện tại** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Đọc/ghi field khác** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Trong JS field hiện tại, ưu tiên dùng `getValue`/`setValue` để đọc/ghi field này; sử dụng `ctx.form` khi cần truy cập field khác.

### ctx.blockModel

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Đọc/ghi field form** | `ctx.form` (tương đương với `ctx.blockModel?.form`, tiện lợi hơn) |
| **Truy cập block cha** | `ctx.blockModel` (chứa `collection`, `resource`, v.v.) |

### ctx.getVar('ctx.formValues')

Giá trị form cần được lấy qua `await ctx.getVar('ctx.formValues')`, không trực tiếp expose ra `ctx.formValues`. Trong ngữ cảnh form, ưu tiên dùng `ctx.form.getFieldsValue()` để đọc giá trị mới nhất theo thời gian thực.

## Lưu ý

- `getFieldsValue()` mặc định chỉ trả về các field đã render; các field chưa render (như trong vùng thu gọn, ẩn theo điều kiện) cần truyền `true`: `getFieldsValue(true)`.
- Đường dẫn của các field lồng nhau như sub-table là array, ví dụ `['orders', 0, 'amount']`; có thể dùng `ctx.namePath` để lấy đường dẫn của field hiện tại, dùng để xây dựng đường dẫn của các column khác cùng hàng.
- `validateFields()` sẽ ném object lỗi, chứa `errorFields`, v.v.; khi validate trước khi submit thất bại có thể dùng `ctx.exit()` để kết thúc các bước tiếp theo.
- Trong các kịch bản bất đồng bộ như luồng sự kiện, quy tắc liên kết, `ctx.form` có thể chưa sẵn sàng, khuyến nghị dùng optional chaining hoặc kiểm tra null.

## Ví dụ

### Liên kết field: hiển thị nội dung khác nhau theo loại

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Tính toán field hiện tại dựa trên field khác

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Đọc/ghi column khác cùng hàng trong sub-table

```ts
// ctx.namePath 为当前字段在表单中的路径，如 ['orders', 0, 'amount']
// 读取同行 status：['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validate trước khi submit

```ts
try {
  await ctx.form.validateFields();
  // 校验通过，继续提交逻辑
} catch (e) {
  ctx.message.error('请检查表单填写');
  ctx.exit();
}
```

### Submit sau khi xác nhận

```ts
const confirmed = await ctx.modal.confirm({
  title: '确认提交',
  content: '提交后将无法修改，确定继续？',
  okText: '确定',
  cancelText: '取消',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // 用户取消时终止
}
```

## Liên quan

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Đọc/ghi giá trị field hiện tại
- [ctx.blockModel](./block-model.md): Model block cha, `ctx.form` tương đương với `ctx.blockModel?.form`
- [ctx.modal](./modal.md): Popup xác nhận, thường dùng kèm với `ctx.form.validateFields()`, `ctx.form.submit()`
- [ctx.exit()](./exit.md): Kết thúc luồng khi validate thất bại hoặc người dùng hủy
- `ctx.namePath`: Đường dẫn của field hiện tại trong form (array), khi field lồng nhau dùng để xây dựng name của `getFieldValue` / `setFieldValue`
