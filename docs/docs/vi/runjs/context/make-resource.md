:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Tạo mới** một instance resource và trả về kết quả, **không** ghi đè hoặc thay đổi `ctx.resource`. Thích hợp cho các tình huống cần nhiều resource độc lập hoặc sử dụng tạm thời.

## Các trường hợp sử dụng

| Tình huống | Mô tả |
|------|------|
| **Nhiều resource** | Tải đồng thời nhiều nguồn dữ liệu (ví dụ: danh sách người dùng + danh sách đơn hàng), mỗi nguồn sử dụng một resource độc lập. |
| **Truy vấn tạm thời** | Truy vấn một lần, dùng xong rồi bỏ, không cần liên kết với `ctx.resource`. |
| **Dữ liệu bổ trợ** | Sử dụng `ctx.resource` cho dữ liệu chính và `makeResource` để tạo instance cho dữ liệu bổ sung. |

Nếu bạn chỉ cần một resource duy nhất và muốn liên kết nó với `ctx.resource`, việc sử dụng [ctx.initResource()](./init-resource.md) sẽ phù hợp hơn.

## Định nghĩa kiểu

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `resourceType` | `string` | Loại tài nguyên: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Giá trị trả về**: Instance resource mới được tạo.

## Sự khác biệt với ctx.initResource()

| Phương thức | Hành vi |
|------|------|
| `ctx.makeResource(type)` | Chỉ tạo và trả về một instance mới, **không** ghi vào `ctx.resource`. Có thể gọi nhiều lần để lấy nhiều resource độc lập. |
| `ctx.initResource(type)` | Nếu `ctx.resource` chưa tồn tại, nó sẽ tạo và liên kết; nếu đã tồn tại, nó sẽ trả về trực tiếp. Đảm bảo `ctx.resource` luôn khả dụng. |

## Ví dụ

### Một resource đơn lẻ

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource vẫn giữ nguyên giá trị ban đầu (nếu có)
```

### Nhiều resource

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Số lượng người dùng: {usersRes.getData().length}</p>
    <p>Số lượng đơn hàng: {ordersRes.getData().length}</p>
  </div>
);
```

### Truy vấn tạm thời

```ts
// Truy vấn một lần, không làm ảnh hưởng đến ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Lưu ý

- Resource mới tạo cần gọi `setResourceName(name)` để chỉ định bộ sưu tập, sau đó tải dữ liệu thông qua `refresh()`.
- Mỗi instance resource là độc lập và không ảnh hưởng lẫn nhau; phù hợp để tải song song nhiều nguồn dữ liệu.

## Liên quan

- [ctx.initResource()](./init-resource.md): Khởi tạo và liên kết với `ctx.resource`
- [ctx.resource](./resource.md): Instance resource trong ngữ cảnh hiện tại
- [MultiRecordResource](../resource/multi-record-resource) — Nhiều bản ghi/Danh sách
- [SingleRecordResource](../resource/single-record-resource) — Bản ghi đơn
- [APIResource](../resource/api-resource) — Tài nguyên API chung
- [SQLResource](../resource/sql-resource) — Tài nguyên truy vấn SQL