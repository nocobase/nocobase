:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/block-model).
:::

# ctx.blockModel

Mô hình khối cha (thực thể BlockModel) nơi trường JS / khối JS hiện tại tọa lạc. Trong các kịch bản như JSField, JSItem, và JSColumn, `ctx.blockModel` trỏ đến khối biểu mẫu (form block) hoặc khối bảng (table block) chứa logic JS hiện tại; trong khối JSBlock độc lập, nó có thể là `null` hoặc giống với `ctx.model`.

## Scenarios (Sử dụng trong các trường hợp)

| Kịch bản | Mô tả |
|------|------|
| **JSField** | Truy cập `form`, `collection`, và `resource` của khối biểu mẫu cha bên trong một trường biểu mẫu để thực hiện liên kết hoặc xác thực. |
| **JSItem** | Truy cập thông tin tài nguyên và bộ sưu tập của khối bảng/biểu mẫu cha bên trong một mục của bảng con. |
| **JSColumn** | Truy cập `resource` (ví dụ: `getSelectedRows`) và `collection` của khối bảng cha bên trong một cột của bảng. |
| **Thao tác biểu mẫu / Luồng sự kiện** | Truy cập `form` để thực hiện xác thực trước khi gửi, `resource` để làm mới, v.v. |

> Lưu ý: `ctx.blockModel` chỉ khả dụng trong ngữ cảnh RunJS có tồn tại khối cha. Trong các JSBlock độc lập (không có biểu mẫu/bảng cha), nó có thể là `null`. Khuyến nghị nên kiểm tra giá trị null trước khi sử dụng.

## Định nghĩa kiểu dữ liệu

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Cụ thể kiểu dữ liệu phụ thuộc vào loại khối cha: khối biểu mẫu thường là `FormBlockModel` hoặc `EditFormModel`, trong khi khối bảng thường là `TableBlockModel`.

## Các thuộc tính thường dùng

| Thuộc tính | Kiểu dữ liệu | Mô tả |
|------|------|------|
| `uid` | `string` | Định danh duy nhất của mô hình khối. |
| `collection` | `Collection` | Bộ sưu tập được liên kết với khối hiện tại. |
| `resource` | `Resource` | Thực thể tài nguyên được khối sử dụng (`SingleRecordResource` / `MultiRecordResource`, v.v.). |
| `form` | `FormInstance` | Khối biểu mẫu: Thực thể Ant Design Form, hỗ trợ `getFieldsValue`, `validateFields`, `setFieldsValue`, v.v. |
| `emitter` | `EventEmitter` | Bộ phát sự kiện, dùng để lắng nghe `formValuesChange`, `onFieldReset`, v.v. |

## Mối quan hệ với ctx.model và ctx.form

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Khối cha của JS hiện tại** | `ctx.blockModel` |
| **Đọc/Ghi các trường biểu mẫu** | `ctx.form` (tương đương với `ctx.blockModel?.form`, thuận tiện hơn trong các khối biểu mẫu) |
| **Mô hình của ngữ cảnh thực thi hiện tại** | `ctx.model` (Mô hình trường trong JSField, mô hình khối trong JSBlock) |

Trong JSField, `ctx.model` là mô hình trường, và `ctx.blockModel` là khối biểu mẫu hoặc khối bảng chứa trường đó; `ctx.form` thường là `ctx.blockModel.form`.

## Ví dụ

### Bảng: Lấy các hàng đã chọn và xử lý

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Vui lòng chọn dữ liệu trước');
  return;
}
```

### Kịch bản biểu mẫu: Xác thực và Làm mới

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Lắng nghe thay đổi biểu mẫu

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Thực hiện liên kết hoặc render lại dựa trên giá trị biểu mẫu mới nhất
});
```

### Kích hoạt render lại khối

```ts
ctx.blockModel?.rerender?.();
```

## Lưu ý

- Trong một **JSBlock độc lập** (không có khối biểu mẫu hoặc khối bảng cha), `ctx.blockModel` có thể là `null`. Khuyến nghị sử dụng optional chaining khi truy cập các thuộc tính của nó: `ctx.blockModel?.resource?.refresh?.()`.
- Trong **JSField / JSItem / JSColumn**, `ctx.blockModel` đề cập đến khối biểu mẫu hoặc khối bảng chứa trường hiện tại. Trong một **JSBlock**, nó có thể là chính nó hoặc một khối cấp trên, tùy thuộc vào phân cấp thực tế.
- `resource` chỉ tồn tại trong các khối dữ liệu; `form` chỉ tồn tại trong các khối biểu mẫu. Các khối bảng thường không có `form`.

## Liên quan

- [ctx.model](./model.md): Mô hình của ngữ cảnh thực thi hiện tại.
- [ctx.form](./form.md): Thực thể biểu mẫu, thường dùng trong các khối biểu mẫu.
- [ctx.resource](./resource.md): Thực thể tài nguyên (tương đương với `ctx.blockModel?.resource`, sử dụng trực tiếp nếu có).
- [ctx.getModel()](./get-model.md): Lấy các mô hình khối khác theo UID.