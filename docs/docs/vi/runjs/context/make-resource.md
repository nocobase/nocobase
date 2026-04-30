---
title: "ctx.makeResource()"
description: "ctx.makeResource() tạo instance API resource, dùng cho CRUD tùy chỉnh, thao tác quan hệ, dùng kèm initResource."
keywords: "ctx.makeResource,initResource,API resource,CRUD,MultiRecordResource,SingleRecordResource,RunJS,NocoBase"
---

# ctx.makeResource()

**Tạo mới** một instance resource và trả về, **không** ghi vào hoặc thay đổi `ctx.resource`. Phù hợp với kịch bản cần nhiều resource độc lập hoặc sử dụng tạm thời.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Nhiều resource** | Tải nhiều data source cùng lúc (như list user + list order), mỗi cái dùng resource độc lập |
| **Truy vấn tạm thời** | Truy vấn một lần, dùng xong là bỏ, không cần bind vào `ctx.resource` |
| **Dữ liệu phụ trợ** | Dữ liệu chính dùng `ctx.resource`, dữ liệu thêm dùng `makeResource` để tạo mới |

Nếu chỉ cần một resource duy nhất và muốn bind vào `ctx.resource`, sử dụng [ctx.initResource()](./init-resource.md) phù hợp hơn.

## Định nghĩa kiểu

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `resourceType` | `string` | Kiểu resource: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Giá trị trả về**: Instance resource mới được tạo.

## Khác biệt với ctx.initResource()

| Phương thức | Hành vi |
|------|------|
| `ctx.makeResource(type)` | Chỉ tạo instance mới và trả về, **không** ghi vào `ctx.resource`. Có thể gọi nhiều lần để có nhiều resource độc lập |
| `ctx.initResource(type)` | Nếu `ctx.resource` không tồn tại sẽ tạo và bind; nếu đã tồn tại trả về trực tiếp. Đảm bảo `ctx.resource` khả dụng |

## Ví dụ

### Một resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource 仍为原来的值（若有）
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
    <p>用户数：{usersRes.getData().length}</p>
    <p>订单数：{ordersRes.getData().length}</p>
  </div>
);
```

### Truy vấn tạm thời

```ts
// 一次性查询，不污染 ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Lưu ý

- Resource mới tạo cần gọi `setResourceName(name)` để chỉ định collection, rồi tải dữ liệu qua `refresh()`.
- Mỗi instance resource độc lập, không ảnh hưởng lẫn nhau; phù hợp với việc tải nhiều data source song song.

## Liên quan

- [ctx.initResource()](./init-resource.md): Khởi tạo và bind vào `ctx.resource`
- [ctx.resource](./resource.md): Instance resource trong ngữ cảnh hiện tại
- [MultiRecordResource](../resource/multi-record-resource) — Nhiều bản ghi/list
- [SingleRecordResource](../resource/single-record-resource) — Bản ghi đơn
- [APIResource](../resource/api-resource) — Resource API thông dụng
- [SQLResource](../resource/sql-resource) — Resource truy vấn SQL
