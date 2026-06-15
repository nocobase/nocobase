---
title: "ctx.getVar()"
description: "ctx.getVar() lấy giá trị biến được định nghĩa trong workflow hoặc quy tắc liên kết, hỗ trợ scope."
keywords: "ctx.getVar,biến,biến workflow,scope,quy tắc liên kết,RunJS,NocoBase"
---

# ctx.getVar()

Đọc giá trị biến **bất đồng bộ** từ ngữ cảnh runtime hiện tại. Nguồn biến giống với cách parse `{{ctx.xxx}}` trong SQL, template, thường đến từ user hiện tại, bản ghi hiện tại, tham số view, ngữ cảnh popup, v.v.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField** | Lấy thông tin bản ghi, user, resource hiện tại để render hoặc xét điều kiện logic |
| **Quy tắc liên kết / luồng sự kiện** | Đọc `ctx.record`, `ctx.formValues`, v.v. để xét điều kiện |
| **Công thức / template** | Sử dụng cùng quy tắc parse biến với `{{ctx.xxx}}` |

## Định nghĩa kiểu

```ts
getVar(path: string): Promise<any>;
```

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `path` | `string` | Đường dẫn biến, **phải bắt đầu bằng `ctx.`**, hỗ trợ truy cập dấu chấm và chỉ số array |

**Giá trị trả về**: `Promise<any>`, cần dùng `await` để lấy giá trị đã parse; trả về `undefined` khi biến không tồn tại.

> Nếu truyền vào đường dẫn không bắt đầu bằng `ctx.`, sẽ ném lỗi: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Đường dẫn biến thường dùng

| Đường dẫn | Mô tả |
|------|------|
| `ctx.record` | Bản ghi hiện tại (khả dụng khi form/chi tiết liên kết bản ghi) |
| `ctx.record.id` | Primary key của bản ghi hiện tại |
| `ctx.formValues` | Giá trị form hiện tại (thường dùng trong quy tắc liên kết, luồng sự kiện; trong kịch bản form ưu tiên dùng `ctx.form.getFieldsValue()` để đọc theo thời gian thực) |
| `ctx.user` | User đăng nhập hiện tại |
| `ctx.user.id` | ID user hiện tại |
| `ctx.user.nickname` | Nickname user hiện tại |
| `ctx.user.roles.name` | Tên role user hiện tại (array) |
| `ctx.popup.record` | Bản ghi trong popup |
| `ctx.popup.record.id` | Primary key bản ghi trong popup |
| `ctx.urlSearchParams` | Tham số query của URL (parse từ `?key=value`) |
| `ctx.token` | API Token hiện tại |
| `ctx.role` | Role hiện tại |

## ctx.getVarInfos()

Lấy **thông tin cấu trúc** (kiểu, tiêu đề, sub-property, v.v.) của các biến có thể parse trong ngữ cảnh hiện tại, tiện cho việc khám phá các đường dẫn khả dụng. Giá trị trả về là mô tả tĩnh dựa trên `meta`, không chứa giá trị runtime thực tế.

### Định nghĩa kiểu

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Mỗi key trong giá trị trả về là đường dẫn biến, value là thông tin cấu trúc tương ứng với đường dẫn đó (chứa `type`, `title`, `properties`, v.v.).

### Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `path` | `string \| string[]` | Đường dẫn cắt, chỉ thu thập cấu trúc biến trong đường dẫn này. Hỗ trợ `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; array biểu thị nhiều đường dẫn được gộp |
| `maxDepth` | `number` | Cấp độ mở rộng tối đa, mặc định `3`. Khi không truyền path, depth của thuộc tính top-level=1; khi truyền path, depth của node tương ứng path=1 |

### Ví dụ

```ts
// 获取 record 下的变量结构（最多展开 3 层）
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// 获取 popup.record 的结构
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// 获取完整顶层变量结构（默认 maxDepth=3）
const vars = await ctx.getVarInfos();
```

## Khác biệt với ctx.getValue

| Phương thức | Kịch bản áp dụng | Mô tả |
|------|----------|------|
| `ctx.getValue()` | JSField, JSItem, v.v. - field có thể chỉnh sửa | Lấy đồng bộ giá trị **field hiện tại**, cần liên kết form |
| `ctx.getVar(path)` | Bất kỳ ngữ cảnh RunJS nào | Lấy bất đồng bộ **bất kỳ biến ctx**, path cần bắt đầu bằng `ctx.` |

Trong JSField, đọc/ghi field này dùng `getValue`/`setValue`; truy cập biến ngữ cảnh khác (như record, user, formValues) dùng `getVar`.

## Lưu ý

- **path phải bắt đầu bằng `ctx.`**: như `ctx.record.id`, nếu không sẽ ném lỗi.
- **Phương thức bất đồng bộ**: phải dùng `await` để lấy kết quả, như `const id = await ctx.getVar('ctx.record.id')`.
- **Biến không tồn tại**: trả về `undefined`, có thể dùng `??` sau kết quả để đặt giá trị mặc định: `(await ctx.getVar('ctx.user.nickname')) ?? '访客'`.
- **Giá trị form**: `ctx.formValues` cần được lấy qua `await ctx.getVar('ctx.formValues')`, không trực tiếp expose ra `ctx.formValues`. Trong ngữ cảnh form ưu tiên dùng `ctx.form.getFieldsValue()` để đọc giá trị mới nhất theo thời gian thực.

## Ví dụ

### Lấy ID bản ghi hiện tại

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`当前记录：${recordId}`);
}
```

### Lấy bản ghi trong popup

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`当前弹窗记录：${recordId}`);
}
```

### Đọc sub-item của field array

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// 返回角色名数组，如 ['admin', 'member']
```

### Đặt giá trị mặc định

```ts
// getVar 无 defaultValue 参数，可在结果后使用 ??
const userName = (await ctx.getVar('ctx.user.nickname')) ?? '访客';
```

### Đọc giá trị field form

```ts
// ctx.formValues 与 ctx.form 同为表单场景，可用 getVar 读取嵌套字段
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Đọc tham số query của URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // 对应 ?id=xxx
```

### Khám phá biến khả dụng

```ts
// 获取 record 下的变量结构（最多展开 3 层）
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars 形如 { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Liên quan

- [ctx.getValue()](./get-value.md) - Lấy đồng bộ giá trị field hiện tại (chỉ JSField/JSItem, v.v.)
- [ctx.form](./form.md) - Instance form, `ctx.form.getFieldsValue()` có thể đọc giá trị form theo thời gian thực
- [ctx.model](./model.md) - Model nơi ngữ cảnh thực thi hiện tại đang nằm
- [ctx.blockModel](./block-model.md) - Block cha nơi JS hiện tại đang nằm
- [ctx.resource](./resource.md) - Instance resource trong ngữ cảnh hiện tại
- `{{ctx.xxx}}` trong SQL / template - Sử dụng cùng quy tắc parse với `ctx.getVar('ctx.xxx')`
