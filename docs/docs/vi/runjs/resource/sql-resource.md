---
title: "SQLResource của RunJS"
description: "Resource SQL của RunJS: thực thi template SQL hoặc SQL gốc, setFilterByTk, setSQL, runById, runBySQL, hỗ trợ phân trang, phù hợp với báo cáo, thống kê, data source chart."
keywords: "SQLResource,resource SQL,runById,runBySQL,báo cáo,thống kê,RunJS,NocoBase"
---

# SQLResource

Resource thực thi truy vấn dựa trên **cấu hình SQL đã lưu** hoặc **SQL động**, nguồn dữ liệu là các API như `flowSql:run` / `flowSql:runById`. Phù hợp với các kịch bản như báo cáo, thống kê, list SQL tùy chỉnh. Khác với [MultiRecordResource](./multi-record-resource.md), SQLResource không phụ thuộc vào collection, thực thi truy vấn SQL trực tiếp, hỗ trợ phân trang, bind tham số, biến template (`{{ctx.xxx}}`) và điều khiển kiểu kết quả.

**Quan hệ kế thừa**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Cách tạo**: `ctx.makeResource('SQLResource')` hoặc `ctx.initResource('SQLResource')`. Khi thực thi theo cấu hình đã lưu cần `setFilterByTk(uid)` (uid của template SQL); khi debug có thể dùng `setDebug(true)` + `setSQL(sql)` để thực thi SQL trực tiếp; trong RunJS, `ctx.api` được inject bởi môi trường runtime.

---

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Báo cáo / thống kê** | Aggregate phức tạp, truy vấn xuyên table, chỉ số thống kê tùy chỉnh |
| **List tùy chỉnh JSBlock** | Sử dụng SQL để thực hiện filter, sort hoặc quan hệ đặc biệt và render tùy chỉnh |
| **Block chart** | Lưu template SQL điều khiển data source của chart, hỗ trợ phân trang |
| **Lựa chọn với ctx.sql** | Khi cần phân trang, sự kiện, dữ liệu reactive dùng SQLResource; truy vấn đơn giản một lần dùng `ctx.sql.run()` / `ctx.sql.runById()` |

---

## Định dạng dữ liệu

- `getData()` trả về định dạng khác nhau dựa trên `setSQLType()`:
  - `selectRows` (mặc định): **array**, kết quả nhiều hàng
  - `selectRow`: **object đơn**
  - `selectVar`: **giá trị scalar** (như COUNT, SUM)
- `getMeta()` trả về metadata phân trang, v.v.: `page`, `pageSize`, `count`, `totalPage`, v.v.

---

## Cấu hình SQL và chế độ thực thi

| Phương thức | Mô tả |
|------|------|
| `setFilterByTk(uid)` | Đặt uid của template SQL cần thực thi (tương ứng với runById, cần lưu trên admin trước) |
| `setSQL(sql)` | Đặt SQL gốc (chỉ chế độ debug `setDebug(true)` mới dùng cho runBySQL) |
| `setSQLType(type)` | Kiểu kết quả: `'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | Khi true, refresh đi qua `runBySQL()`, ngược lại đi qua `runById()` |
| `run()` | Gọi `runBySQL()` hoặc `runById()` dựa trên debug |
| `runBySQL()` | Thực thi với SQL của `setSQL` hiện tại (cần `setDebug(true)` trước) |
| `runById()` | Thực thi template SQL đã lưu với uid hiện tại |

---

## Tham số và ngữ cảnh

| Phương thức | Mô tả |
|------|------|
| `setBind(bind)` | Bind biến. Dạng object dùng với `:name`, dạng array dùng với `?` |
| `setLiquidContext(ctx)` | Ngữ cảnh template (Liquid), dùng để parse `{{ctx.xxx}}` |
| `setFilter(filter)` | Điều kiện filter bổ sung (truyền vào data của request) |
| `setDataSourceKey(key)` | Định danh data source (sử dụng khi đa data source) |

---

## Phân trang

| Phương thức | Mô tả |
|------|------|
| `setPage(page)` / `getPage()` | Trang hiện tại (mặc định 1) |
| `setPageSize(size)` / `getPageSize()` | Số bản ghi mỗi trang (mặc định 20) |
| `next()` / `previous()` / `goto(page)` | Lật trang và trigger refresh |

Trong SQL có thể sử dụng `{{ctx.limit}}`, `{{ctx.offset}}` để tham chiếu tham số phân trang, SQLResource sẽ inject `limit`, `offset` vào ngữ cảnh.

---

## Lấy dữ liệu và sự kiện

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Thực thi SQL (runById hoặc runBySQL), ghi kết quả vào `setData(data)` và cập nhật meta, trigger sự kiện `'refresh'` |
| `runAction(actionName, options)` | Gọi API nền tảng (như `getBind`, `run`, `runById`) |
| `on('refresh', fn)` / `on('loading', fn)` | Trigger khi refresh hoàn tất, bắt đầu loading |

---

## Ví dụ

### Thực thi theo template đã lưu (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // 已保存的 SQL 模板 uid
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page、pageSize、count 等
```

### Chế độ debug: thực thi SQL trực tiếp (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Phân trang và lật trang

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// 翻页
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Kiểu kết quả

```js
// 多行（默认）
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// 单行
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// 单值（如 COUNT）
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Sử dụng biến template

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Lắng nghe sự kiện refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Lưu ý

- **runById cần lưu template trước**: uid của `setFilterByTk(uid)` phải là ID template SQL đã lưu trên admin, có thể lưu qua `ctx.sql.save({ uid, sql })`.
- **Chế độ debug cần quyền**: Khi `setDebug(true)` đi qua `flowSql:run`, cần role hiện tại có quyền cấu hình SQL; `runById` chỉ cần đăng nhập là được.
- **Debounce refresh**: Nhiều lần gọi `refresh()` trong cùng event loop chỉ thực thi lần cuối, tránh request trùng lặp.
- **Bind tham số chống injection**: Sử dụng `setBind()` kèm placeholder `:name` / `?`, tránh nối chuỗi gây SQL injection.

---

## Liên quan

- [ctx.sql](../context/sql.md) - Thực thi và quản lý SQL, `ctx.sql.runById` phù hợp với truy vấn đơn giản một lần
- [ctx.resource](../context/resource.md) - Instance resource trong ngữ cảnh hiện tại
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và bind vào ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Tạo instance resource mới, không bind
- [APIResource](./api-resource.md) - Resource API thông dụng
- [MultiRecordResource](./multi-record-resource.md) - Hướng đến collection/list
