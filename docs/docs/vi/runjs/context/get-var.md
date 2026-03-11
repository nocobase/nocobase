:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/get-var).
:::

# ctx.getVar()

Đọc giá trị biến một cách **bất đồng bộ** từ ngữ cảnh thực thi (runtime context) hiện tại. Việc phân giải biến nhất quán với `{{ctx.xxx}}` trong SQL và template, thường đến từ người dùng hiện tại, bản ghi hiện tại, tham số chế độ xem, ngữ cảnh cửa sổ bật lên (popup), v.v.

## Các trường hợp sử dụng

| Ngữ cảnh | Mô tả |
|------|------|
| **JSBlock / JSField** | Lấy thông tin về bản ghi hiện tại, người dùng, tài nguyên, v.v. để hiển thị hoặc xử lý logic. |
| **Quy tắc liên kết / Luồng sự kiện** | Đọc `ctx.record`, `ctx.formValues`, v.v. để thực hiện kiểm tra điều kiện. |
| **Công thức / Template** | Sử dụng cùng quy tắc phân giải biến như `{{ctx.xxx}}`. |

## Định nghĩa kiểu dữ liệu

```ts
getVar(path: string): Promise<any>;
```

| Tham số | Kiểu dữ liệu | Mô tả |
|------|------|------|
| `path` | `string` | Đường dẫn biến, **phải bắt đầu bằng `ctx.`**, hỗ trợ truy cập dạng dấu chấm (dot notation) và chỉ số mảng. |

**Giá trị trả về**: `Promise<any>`, cần sử dụng `await` để lấy giá trị đã phân giải; trả về `undefined` nếu biến không tồn tại.

> Nếu truyền một đường dẫn không bắt đầu bằng `ctx.`, một lỗi sẽ được ném ra: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Các đường dẫn biến thông dụng

| Đường dẫn | Mô tả |
|------|------|
| `ctx.record` | Bản ghi hiện tại (khả dụng khi khối biểu mẫu/chi tiết được liên kết với bản ghi) |
| `ctx.record.id` | Khóa chính của bản ghi hiện tại |
| `ctx.formValues` | Giá trị biểu mẫu hiện tại (thường dùng trong quy tắc liên kết và luồng sự kiện; trong ngữ cảnh biểu mẫu, ưu tiên dùng `ctx.form.getFieldsValue()` để đọc thời gian thực) |
| `ctx.user` | Người dùng hiện tại đang đăng nhập |
| `ctx.user.id` | ID người dùng hiện tại |
| `ctx.user.nickname` | Biệt danh người dùng hiện tại |
| `ctx.user.roles.name` | Tên vai trò của người dùng hiện tại (mảng) |
| `ctx.popup.record` | Bản ghi bên trong cửa sổ bật lên (popup) |
| `ctx.popup.record.id` | Khóa chính của bản ghi bên trong cửa sổ bật lên |
| `ctx.urlSearchParams` | Tham số truy vấn URL (được phân giải từ `?key=value`) |
| `ctx.token` | API Token hiện tại |
| `ctx.role` | Vai trò hiện tại |

## ctx.getVarInfos()

Lấy **thông tin cấu trúc** (kiểu dữ liệu, tiêu đề, thuộc tính con, v.v.) của các biến có thể phân giải trong ngữ cảnh hiện tại, giúp dễ dàng khám phá các đường dẫn khả dụng. Giá trị trả về là mô tả tĩnh dựa trên `meta`, không bao gồm giá trị thực tế khi chạy.

### Định nghĩa kiểu dữ liệu

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Trong giá trị trả về, mỗi key là một đường dẫn biến, và value là thông tin cấu trúc cho đường dẫn đó (bao gồm `type`, `title`, `properties`, v.v.).

### Tham số

| Tham số | Kiểu dữ liệu | Mô tả |
|------|------|------|
| `path` | `string \| string[]` | Đường dẫn cắt tỉa, chỉ thu thập cấu trúc biến dưới đường dẫn này. Hỗ trợ `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; mảng đại diện cho việc gộp nhiều đường dẫn. |
| `maxDepth` | `number` | Cấp độ mở rộng tối đa, mặc định là `3`. Khi không truyền `path`, thuộc tính cấp cao nhất có `depth=1`; khi truyền `path`, nút tương ứng với đường dẫn có `depth=1`. |

### Ví dụ

```ts
// Lấy cấu trúc biến dưới record (mở rộng tối đa 3 cấp)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Lấy cấu trúc của popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Lấy cấu trúc biến cấp cao nhất đầy đủ (mặc định maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Sự khác biệt với ctx.getValue

| Phương thức | Ngữ cảnh sử dụng | Mô tả |
|------|----------|------|
| `ctx.getValue()` | Các trường có thể chỉnh sửa như JSField hoặc JSItem | Lấy giá trị của **trường hiện tại** một cách đồng bộ; yêu cầu liên kết biểu mẫu. |
| `ctx.getVar(path)` | Bất kỳ ngữ cảnh RunJS nào | Lấy **bất kỳ biến ctx nào** một cách bất đồng bộ; đường dẫn phải bắt đầu bằng `ctx.`. |

Trong một JSField, sử dụng `getValue`/`setValue` để đọc/ghi trường hiện tại; sử dụng `getVar` để truy cập các biến ngữ cảnh khác (như `record`, `user`, `formValues`).

## Lưu ý

- **Đường dẫn phải bắt đầu bằng `ctx.`**: Ví dụ: `ctx.record.id`, nếu không sẽ ném ra lỗi.
- **Phương thức bất đồng bộ**: Bạn phải sử dụng `await` để lấy kết quả, ví dụ: `const id = await ctx.getVar('ctx.record.id')`.
- **Biến không tồn tại**: Trả về `undefined`. Bạn có thể sử dụng `??` sau kết quả để thiết lập giá trị mặc định: `(await ctx.getVar('ctx.user.nickname')) ?? 'Khách'`.
- **Giá trị biểu mẫu**: `ctx.formValues` phải được lấy thông qua `await ctx.getVar('ctx.formValues')`; nó không được để lộ trực tiếp dưới dạng `ctx.formValues`. Trong ngữ cảnh biểu mẫu, ưu tiên sử dụng `ctx.form.getFieldsValue()` để đọc các giá trị mới nhất theo thời gian thực.

## Ví dụ

### Lấy ID bản ghi hiện tại

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Bản ghi hiện tại: ${recordId}`);
}
```

### Lấy bản ghi bên trong cửa sổ bật lên (popup)

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Bản ghi cửa sổ bật lên hiện tại: ${recordId}`);
}
```

### Đọc các mục con của một trường mảng

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Trả về một mảng tên vai trò, ví dụ: ['admin', 'member']
```

### Thiết lập giá trị mặc định

```ts
// getVar không có tham số defaultValue; sử dụng ?? sau kết quả
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Khách';
```

### Đọc giá trị trường biểu mẫu

```ts
// Cả ctx.formValues và ctx.form đều dành cho ngữ cảnh biểu mẫu; sử dụng getVar để đọc các trường lồng nhau
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Đọc tham số truy vấn URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Tương ứng với ?id=xxx
```

### Khám phá các biến khả dụng

```ts
// Lấy cấu trúc biến dưới record (mở rộng tối đa 3 cấp)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars có dạng { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Liên quan

- [ctx.getValue()](./get-value.md) - Lấy giá trị trường hiện tại một cách đồng bộ (chỉ dành cho JSField/JSItem)
- [ctx.form](./form.md) - Thực thể biểu mẫu; `ctx.form.getFieldsValue()` có thể đọc giá trị biểu mẫu theo thời gian thực
- [ctx.model](./model.md) - Model nơi ngữ cảnh thực thi hiện tại cư trú
- [ctx.blockModel](./block-model.md) - Khối cha nơi JS hiện tại được đặt
- [ctx.resource](./resource.md) - Thực thể resource trong ngữ cảnh hiện tại
- `{{ctx.xxx}}` trong SQL / Template - Sử dụng cùng quy tắc phân giải như `ctx.getVar('ctx.xxx')`