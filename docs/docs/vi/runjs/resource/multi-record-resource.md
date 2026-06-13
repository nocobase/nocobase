---
title: "MultiRecordResource của RunJS"
description: "Resource nhiều bản ghi của RunJS: phân trang/filter/sort table/list, refresh, create, update, destroy, destroySelectedRows, phù hợp với block table, list JSBlock, resource quan hệ."
keywords: "MultiRecordResource,resource nhiều bản ghi,phân trang,filter,sort,block table,RunJS,NocoBase"
---

# MultiRecordResource

Resource hướng đến collection: request trả về array, hỗ trợ phân trang, filter, sort và CRUD. Phù hợp với các kịch bản "nhiều bản ghi" như table, list. Khác với [APIResource](./api-resource.md), MultiRecordResource chỉ định tên resource qua `setResourceName()`, tự động xây dựng URL như `users:list`, `users:create`, và có sẵn các khả năng phân trang, filter, hàng được chọn, v.v.

**Quan hệ kế thừa**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Cách tạo**: `ctx.makeResource('MultiRecordResource')` hoặc `ctx.initResource('MultiRecordResource')`. Trước khi sử dụng cần `setResourceName('tên collection')` (như `'users'`); trong RunJS, `ctx.api` được inject bởi môi trường runtime.

---

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Block table** | Block table, list mặc định sử dụng MultiRecordResource, hỗ trợ phân trang, filter, sort |
| **List JSBlock** | Tải dữ liệu collection user, order, v.v. trong JSBlock và render tùy chỉnh |
| **Thao tác hàng loạt** | Lấy hàng đã chọn qua `getSelectedRows()`, xóa hàng loạt qua `destroySelectedRows()` |
| **Resource quan hệ** | Tải collection quan hệ dưới dạng `users.tags`, v.v., cần kèm `setSourceId(ID bản ghi cha)` |

---

## Định dạng dữ liệu

- `getData()` trả về **array bản ghi**, tức là trường `data` của API list
- `getMeta()` trả về metadata phân trang, v.v.: `page`, `pageSize`, `count`, `totalPage`, v.v.

---

## Tên resource và data source

| Phương thức | Mô tả |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Tên resource, như `'users'`, `'users.tags'` (resource quan hệ) |
| `setSourceId(id)` / `getSourceId()` | ID bản ghi cha khi resource quan hệ (như `users.tags` cần truyền primary key của users) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Định danh data source (sử dụng khi đa data source) |

---

## Tham số request (filter / field / sort)

| Phương thức | Mô tả |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filter primary key (cho get đơn, v.v.) |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Điều kiện filter, hỗ trợ các operator như `$eq`, `$ne`, `$in` |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Group filter (kết hợp nhiều điều kiện) |
| `setFields(fields)` / `getFields()` | Field request (whitelist) |
| `setSort(sort)` / `getSort()` | Sort, như `['-createdAt']` biểu thị sort theo thời gian tạo giảm dần |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Mở rộng quan hệ (như `['user', 'tags']`) |

---

## Phân trang

| Phương thức | Mô tả |
|------|------|
| `setPage(page)` / `getPage()` | Trang hiện tại (bắt đầu từ 1) |
| `setPageSize(size)` / `getPageSize()` | Số bản ghi mỗi trang, mặc định 20 |
| `getTotalPage()` | Tổng số trang |
| `getCount()` | Tổng số bản ghi (từ meta của server) |
| `next()` / `previous()` / `goto(page)` | Lật trang và trigger `refresh` |

---

## Hàng đã chọn (kịch bản table)

| Phương thức | Mô tả |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Dữ liệu hàng đang được chọn, dùng cho các thao tác như xóa hàng loạt |

---

## CRUD và thao tác list

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Yêu cầu list theo tham số hiện tại, cập nhật `getData()` và meta phân trang, trigger sự kiện `'refresh'` |
| `get(filterByTk)` | Yêu cầu một bản ghi, trả về dữ liệu đó (không ghi vào getData) |
| `create(data, options?)` | Tạo, tùy chọn `{ refresh: false }` không tự động refresh, trigger `'saved'` |
| `update(filterByTk, data, options?)` | Cập nhật theo primary key |
| `destroy(target)` | Xóa; target có thể là primary key, object hàng hoặc array primary key/hàng (xóa hàng loạt) |
| `destroySelectedRows()` | Xóa hàng đã chọn hiện tại (ném lỗi khi không có chọn) |
| `setItem(index, item)` | Thay thế dữ liệu một hàng local (không gửi request) |
| `runAction(actionName, options)` | Gọi bất kỳ action resource nào (như action tùy chỉnh) |

---

## Cấu hình và sự kiện

| Phương thức | Mô tả |
|------|------|
| `setRefreshAction(name)` | Action được gọi khi refresh, mặc định `'list'` |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Cấu hình request của create/update |
| `on('refresh', fn)` / `on('saved', fn)` | Trigger sau khi refresh hoàn tất, sau khi save |

---

## Ví dụ

### List cơ bản

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filter và sort

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Mở rộng quan hệ

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Tạo và lật trang

```js
await ctx.resource.create({ name: '张三', email: 'zhangsan@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Xóa hàng loạt hàng đã chọn

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('请先选择数据');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('已删除'));
```

### Lắng nghe sự kiện refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Resource quan hệ (sub-table)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Lưu ý

- **setResourceName bắt buộc**: Trước khi sử dụng phải gọi `setResourceName('tên collection')`, nếu không sẽ không thể xây dựng URL request.
- **Resource quan hệ**: Khi tên resource là `parent.child` (như `users.tags`), cần `setSourceId(primary key bản ghi cha)` trước.
- **Debounce refresh**: Nhiều lần gọi `refresh()` trong cùng event loop chỉ thực thi lần cuối, tránh request trùng lặp.
- **getData là array**: `data` được trả về bởi API list chính là array bản ghi, `getData()` trả về trực tiếp array đó.

---

## Liên quan

- [ctx.resource](../context/resource.md) - Instance resource trong ngữ cảnh hiện tại
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và bind vào ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Tạo instance resource mới, không bind
- [APIResource](./api-resource.md) - Resource API thông dụng, request theo URL
- [SingleRecordResource](./single-record-resource.md) - Hướng đến bản ghi đơn
