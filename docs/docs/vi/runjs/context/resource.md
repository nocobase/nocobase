:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/resource).
:::

# ctx.resource

Thể hiện (instance) **FlowResource** trong ngữ cảnh hiện tại, được sử dụng để truy cập và thao tác dữ liệu. Trong hầu hết các khối (Biểu mẫu, Bảng, Chi tiết, v.v.) và các kịch bản cửa sổ bật lên (pop-up), môi trường thực thi sẽ liên kết sẵn `ctx.resource`. Đối với các kịch bản như JSBlock vốn mặc định không có resource, bạn cần gọi [ctx.initResource()](./init-resource.md) để khởi tạo trước khi sử dụng thông qua `ctx.resource`.

## Kịch bản áp dụng

Có thể sử dụng trong bất kỳ kịch bản RunJS nào cần truy cập dữ liệu có cấu trúc (danh sách, bản ghi đơn, API tùy chỉnh, SQL). Các khối Biểu mẫu, Bảng, Chi tiết và cửa sổ bật lên thường đã được liên kết sẵn; đối với JSBlock, JSField, JSItem, JSColumn, v.v., nếu cần tải dữ liệu, bạn có thể gọi `ctx.initResource(type)` trước rồi mới truy cập `ctx.resource`.

## Định nghĩa kiểu

```ts
resource: FlowResource | undefined;
```

- Trong ngữ cảnh có liên kết sẵn, `ctx.resource` là thể hiện resource tương ứng;
- JSBlock và các thành phần tương tự mặc định không có resource, giá trị là `undefined`, cần gọi `ctx.initResource(type)` trước khi có giá trị.

## Các phương thức thường dùng

Các phương thức được cung cấp bởi các loại resource khác nhau (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) có sự khác biệt nhỏ, dưới đây là các phương thức chung hoặc thường dùng:

| Phương thức | Mô tả |
|------|------|
| `getData()` | Lấy dữ liệu hiện tại (danh sách hoặc bản ghi đơn) |
| `setData(value)` | Thiết lập dữ liệu cục bộ |
| `refresh()` | Gửi yêu cầu dựa trên các tham số hiện tại để làm mới dữ liệu |
| `setResourceName(name)` | Thiết lập tên tài nguyên (ví dụ: `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Thiết lập bộ lọc theo khóa chính (cho bản ghi đơn get, v.v.) |
| `runAction(actionName, options)` | Gọi bất kỳ action nào của tài nguyên (ví dụ: `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Đăng ký/Hủy đăng ký sự kiện (ví dụ: `refresh`, `saved`) |

Đặc thù của **MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, v.v.

## Ví dụ

### Dữ liệu danh sách (cần initResource trước)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Kịch bản Bảng (đã liên kết sẵn)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Đã xóa'));
```

### Bản ghi đơn

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Gọi action tùy chỉnh

```js
await ctx.resource.runAction('create', { data: { name: 'Trần Văn A' } });
```

## Mối quan hệ với ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Nếu `ctx.resource` không tồn tại, nó sẽ tạo và liên kết; nếu đã tồn tại, nó sẽ trả về trực tiếp. Đảm bảo `ctx.resource` luôn khả dụng.
- **ctx.makeResource(type)**: Tạo một thể hiện resource mới và trả về, **không** ghi vào `ctx.resource`. Thích hợp cho các kịch bản cần nhiều resource độc lập hoặc sử dụng tạm thời.
- **ctx.resource**: Truy cập resource đã được liên kết trong ngữ cảnh hiện tại. Hầu hết các khối/cửa sổ bật lên đã được liên kết sẵn; khi không có liên kết, giá trị là `undefined` và cần gọi `ctx.initResource`.

## Lưu ý

- Khuyến nghị kiểm tra giá trị rỗng trước khi sử dụng: `ctx.resource?.refresh()`, đặc biệt là trong các kịch bản như JSBlock có thể không có liên kết sẵn.
- Sau khi khởi tạo, cần gọi `setResourceName(name)` để chỉ định bộ sưu tập dữ liệu, sau đó mới tải dữ liệu qua `refresh()`.
- Xem liên kết bên dưới để biết API đầy đủ của từng loại Resource.

## Liên quan

- [ctx.initResource()](./init-resource.md) - Khởi tạo và liên kết resource vào ngữ cảnh hiện tại
- [ctx.makeResource()](./make-resource.md) - Tạo thể hiện resource mới, không liên kết với `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Nhiều bản ghi/Danh sách
- [SingleRecordResource](../resource/single-record-resource.md) - Bản ghi đơn
- [APIResource](../resource/api-resource.md) - Tài nguyên API chung
- [SQLResource](../resource/sql-resource.md) - Tài nguyên truy vấn SQL