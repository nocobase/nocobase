---
title: "ctx.initResource()"
description: "ctx.initResource() khởi tạo resource RunJS, tạo instance API resource có thể tái sử dụng."
keywords: "ctx.initResource,makeResource,API resource,MultiRecordResource,SingleRecordResource,RunJS,NocoBase"
---

# ctx.initResource()

**Khởi tạo** resource của ngữ cảnh hiện tại: nếu chưa tồn tại `ctx.resource`, sẽ tạo một instance theo kiểu chỉ định và bind vào ngữ cảnh; nếu đã tồn tại thì sử dụng trực tiếp. Sau đó có thể truy cập qua `ctx.resource`.

## Kịch bản áp dụng

Thường chỉ sử dụng trong kịch bản **JSBlock** (block độc lập). Đa số block, popup, v.v. đã bind sẵn `ctx.resource`, không cần gọi thủ công; JSBlock mặc định không có resource, cần `ctx.initResource(type)` trước rồi tải dữ liệu qua `ctx.resource`.

## Định nghĩa kiểu

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `type` | `string` | Kiểu resource: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Giá trị trả về**: Instance resource trong ngữ cảnh hiện tại (tức `ctx.resource`).

## Khác biệt với ctx.makeResource()

| Phương thức | Hành vi |
|------|------|
| `ctx.initResource(type)` | Nếu `ctx.resource` không tồn tại sẽ tạo và bind; nếu đã tồn tại trả về trực tiếp. Đảm bảo `ctx.resource` khả dụng |
| `ctx.makeResource(type)` | Chỉ tạo instance mới và trả về, **không** ghi vào `ctx.resource`. Phù hợp với kịch bản cần nhiều resource độc lập hoặc sử dụng tạm thời |

## Ví dụ

### Dữ liệu list (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Bản ghi đơn (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // 指定主键
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Chỉ định data source

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Lưu ý

- Trong đa số block (form, table, chi tiết, v.v.) và kịch bản popup, `ctx.resource` đã được môi trường runtime bind sẵn, không cần gọi `ctx.initResource`.
- Chỉ trong các ngữ cảnh mặc định không có resource như JSBlock mới cần khởi tạo thủ công.
- Sau khi khởi tạo cần gọi `setResourceName(name)` để chỉ định collection, rồi tải dữ liệu qua `refresh()`.

## Liên quan

- [ctx.resource](./resource.md): Instance resource trong ngữ cảnh hiện tại
- [ctx.makeResource()](./make-resource.md): Tạo instance resource mới, không bind vào `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Nhiều bản ghi/list
- [SingleRecordResource](../resource/single-record-resource.md) — Bản ghi đơn
- [APIResource](../resource/api-resource.md) — Resource API thông dụng
- [SQLResource](../resource/sql-resource.md) — Resource truy vấn SQL
