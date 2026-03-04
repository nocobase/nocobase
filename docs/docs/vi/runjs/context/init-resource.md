:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/init-resource).
:::

# ctx.initResource()

**Khởi tạo** resource cho ngữ cảnh hiện tại: Nếu `ctx.resource` chưa tồn tại, nó sẽ tạo một resource theo loại được chỉ định và liên kết với ngữ cảnh; nếu đã tồn tại, nó sẽ được sử dụng trực tiếp. Sau đó, bạn có thể truy cập thông qua `ctx.resource`.

## Kịch bản áp dụng

Thường chỉ được sử dụng trong các kịch bản **JSBlock** (khối độc lập). Hầu hết các khối, cửa sổ bật lên (popups) và các thành phần khác đều đã được liên kết sẵn `ctx.resource` và không cần gọi thủ công; JSBlock mặc định không có resource, vì vậy bạn cần gọi `ctx.initResource(type)` trước khi tải dữ liệu thông qua `ctx.resource`.

## Định nghĩa kiểu

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Tham số | Loại | Mô tả |
|---------|------|-------|
| `type` | `string` | Loại tài nguyên: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Giá trị trả về**: Thực thể (instance) resource trong ngữ cảnh hiện tại (tức là `ctx.resource`).

## Khác biệt so với ctx.makeResource()

| Phương thức | Hành vi |
|-------------|---------|
| `ctx.initResource(type)` | Tạo và liên kết nếu `ctx.resource` không tồn tại; trả về thực thể hiện có nếu đã tồn tại. Đảm bảo `ctx.resource` luôn sẵn dụng. |
| `ctx.makeResource(type)` | Chỉ tạo và trả về một thực thể mới, **không** ghi vào `ctx.resource`. Phù hợp cho các kịch bản cần nhiều resource độc lập hoặc sử dụng tạm thời. |

## Ví dụ

### Dữ liệu danh sách (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Bản ghi đơn lẻ (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Chỉ định khóa chính
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Chỉ định nguồn dữ liệu

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Lưu ý

- Trong hầu hết các kịch bản khối (Biểu mẫu, Bảng, Chi tiết, v.v.) và cửa sổ bật lên, `ctx.resource` đã được môi trường thực thi liên kết sẵn, do đó không cần gọi `ctx.initResource`.
- Chỉ cần khởi tạo thủ công trong các ngữ cảnh như JSBlock nơi không có resource mặc định.
- Sau khi khởi tạo, bạn phải gọi `setResourceName(name)` để chỉ định bộ sưu tập, sau đó gọi `refresh()` để tải dữ liệu.

## Tài liệu liên quan

- [ctx.resource](./resource.md) — Thực thể resource trong ngữ cảnh hiện tại
- [ctx.makeResource()](./make-resource.md) — Tạo một thực thể resource mới mà không liên kết với `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Nhiều bản ghi/Danh sách
- [SingleRecordResource](../resource/single-record-resource.md) — Bản ghi đơn lẻ
- [APIResource](../resource/api-resource.md) — Tài nguyên API chung
- [SQLResource](../resource/sql-resource.md) — Tài nguyên truy vấn SQL