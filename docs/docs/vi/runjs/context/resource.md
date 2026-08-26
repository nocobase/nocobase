---
title: "ctx.resource"
description: "ctx.resource là instance API resource liên kết với block hiện tại, dùng cho các thao tác dữ liệu như CRUD, refresh, lấy hàng đã chọn."
keywords: "ctx.resource,API resource,CRUD,getData,refresh,RunJS,NocoBase"
---

# ctx.resource

Instance **FlowResource** trong ngữ cảnh hiện tại, dùng để truy cập và thao tác dữ liệu. Trong đa số block (form, table, chi tiết, v.v.) và kịch bản popup, môi trường runtime sẽ bind sẵn `ctx.resource`; trong các kịch bản mặc định không có resource như JSBlock, cần gọi [ctx.initResource()](./init-resource.md) trước để khởi tạo, rồi sử dụng qua `ctx.resource`.

## Kịch bản áp dụng

Tất cả các kịch bản trong RunJS cần truy cập dữ liệu có cấu trúc (list, đơn, API tùy chỉnh, SQL) đều có thể sử dụng. Block form, table, chi tiết và popup thường đã được bind sẵn; JSBlock, JSField, JSItem, JSColumn nếu cần tải dữ liệu, có thể `ctx.initResource(type)` trước rồi truy cập `ctx.resource`.

## Định nghĩa kiểu

```ts
resource: FlowResource | undefined;
```

- Trong ngữ cảnh đã bind sẵn, `ctx.resource` là instance resource tương ứng;
- Trong kịch bản mặc định không có resource như JSBlock, là `undefined`, cần `ctx.initResource(type)` trước mới có giá trị.

## Phương thức thường gặp

Các kiểu resource khác nhau (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) expose phương thức hơi khác nhau, sau đây là các phương thức chung hoặc thường dùng:

| Phương thức | Mô tả |
|------|------|
| `getData()` | Lấy dữ liệu hiện tại (list hoặc đơn) |
| `setData(value)` | Đặt dữ liệu local |
| `refresh()` | Gửi request theo tham số hiện tại, refresh dữ liệu |
| `setResourceName(name)` | Đặt tên resource (như `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Đặt filter primary key (cho get đơn, v.v.) |
| `runAction(actionName, options)` | Gọi bất kỳ action resource nào (như `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Đăng ký/hủy đăng ký sự kiện (như `refresh`, `saved`) |

**Riêng MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, v.v.

## Ví dụ

### Dữ liệu list (cần initResource trước)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Kịch bản table (đã bind sẵn)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('已删除'));
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
await ctx.resource.runAction('create', { data: { name: '张三' } });
```

## Quan hệ với ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Nếu `ctx.resource` không tồn tại sẽ tạo và bind; nếu đã tồn tại trả về trực tiếp. Đảm bảo `ctx.resource` khả dụng.
- **ctx.makeResource(type)**: Tạo instance resource mới và trả về, **không** ghi vào `ctx.resource`. Phù hợp với kịch bản cần nhiều resource độc lập hoặc sử dụng tạm thời.
- **ctx.resource**: Truy cập resource đã bind trong ngữ cảnh hiện tại. Đa số block/popup đã được bind sẵn; khi không bind là `undefined`, cần `ctx.initResource` trước.

## Lưu ý

- Trước khi sử dụng khuyến nghị kiểm tra null: `ctx.resource?.refresh()`, đặc biệt trong các kịch bản có thể không bind sẵn như JSBlock.
- Sau khi khởi tạo cần gọi `setResourceName(name)` để chỉ định collection, rồi tải dữ liệu qua `refresh()`.
- API đầy đủ của các kiểu Resource xem các link bên dưới.

## Liên quan

- [ctx.initResource()](./init-resource.md) - Khởi tạo và bind resource vào ngữ cảnh hiện tại
- [ctx.makeResource()](./make-resource.md) - Tạo instance resource mới, không bind vào `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Nhiều bản ghi/list
- [SingleRecordResource](../resource/single-record-resource.md) - Bản ghi đơn
- [APIResource](../resource/api-resource.md) - Resource API thông dụng
- [SQLResource](../resource/sql-resource.md) - Resource truy vấn SQL
