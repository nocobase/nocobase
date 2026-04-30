---
title: "ctx.sql"
description: "ctx.sql là API thực thi SQL gốc, dùng để truy vấn trực tiếp data source, cần lưu ý quyền và bảo mật injection."
keywords: "ctx.sql,thực thi SQL,truy vấn dữ liệu,run,runById,runBySQL,RunJS,NocoBase"
---

# ctx.sql

`ctx.sql` cung cấp khả năng thực thi và quản lý SQL, thường dùng trong RunJS (như JSBlock, luồng sự kiện) để truy cập database trực tiếp. Hỗ trợ thực thi SQL tạm thời, thực thi template SQL đã lưu theo ID, bind tham số, biến template (`{{ctx.xxx}}`) và điều khiển kiểu kết quả.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Báo cáo thống kê tùy chỉnh, list filter phức tạp, truy vấn aggregate xuyên table |
| **Block chart** | Lưu template SQL điều khiển data source của chart |
| **Luồng sự kiện / liên kết** | Thực thi SQL được preset để lấy dữ liệu và tham gia logic tiếp theo |
| **SQLResource** | Kết hợp với `ctx.initResource('SQLResource')`, dùng cho các kịch bản như list phân trang |

> Lưu ý: `ctx.sql` truy cập database qua API `flowSql`, cần đảm bảo user hiện tại có quyền thực thi của data source tương ứng.

## Giải thích về quyền

| Quyền | Phương thức | Mô tả |
|------|------|------|
| **User đăng nhập** | `runById` | Thực thi theo ID template SQL đã cấu hình |
| **Quyền cấu hình SQL** | `run`, `save`, `destroy` | Thực thi SQL tạm thời, lưu/cập nhật/xóa template SQL |

Logic frontend hướng đến user thông thường có thể sử dụng `ctx.sql.runById(uid, options)`; khi cần SQL động hoặc quản lý template, cần đảm bảo role hiện tại có quyền cấu hình SQL.

## Định nghĩa kiểu

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Phương thức thường dùng

| Phương thức | Mô tả | Yêu cầu quyền |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Thực thi SQL tạm thời, hỗ trợ bind tham số và biến template | Cần quyền cấu hình SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Lưu/cập nhật template SQL theo ID để tái sử dụng | Cần quyền cấu hình SQL |
| `ctx.sql.runById(uid, options?)` | Thực thi template SQL đã lưu theo ID | User đăng nhập đều có thể |
| `ctx.sql.destroy(uid)` | Xóa template SQL của ID chỉ định | Cần quyền cấu hình SQL |

Lưu ý:

- `run` dùng để debug SQL, cần quyền cấu hình;
- `save`, `destroy` dùng để quản lý template SQL, cần quyền cấu hình;
- `runById` mở cho user thông thường, chỉ có thể thực thi theo template đã lưu, không thể debug hoặc sửa SQL;
- Khi template SQL có thay đổi, cần gọi `save` để lưu.

## Giải thích tham số

### options của run / runById

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `bind` | `Record<string, any>` | Biến binding. Trong SQL dùng `$name`, bind truyền object `{ name: value }` |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Kiểu kết quả: nhiều hàng, một hàng, một giá trị, mặc định `selectRows` |
| `dataSourceKey` | `string` | Định danh data source, mặc định sử dụng data source chính |
| `filter` | `Record<string, any>` | Điều kiện filter bổ sung (theo hỗ trợ của API) |

### options của save

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | Định danh duy nhất của template, sau khi lưu có thể dùng `runById(uid, ...)` để thực thi |
| `sql` | `string` | Nội dung SQL, hỗ trợ biến template `{{ctx.xxx}}` và placeholder `$name` |
| `dataSourceKey` | `string` | Tùy chọn, định danh data source |

## Biến template SQL và bind tham số

### Biến template `{{ctx.xxx}}`

Trong SQL có thể sử dụng `{{ctx.xxx}}` để tham chiếu biến ngữ cảnh, sẽ được parse thành giá trị thực trước khi thực thi:

```js
// 引用 ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Nguồn biến có thể tham chiếu giống với `ctx.getVar()` (như `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` tùy chỉnh, v.v.).

### Bind tham số

- **Tham số**: Trong SQL dùng `$name`, `bind` truyền object `{ name: value }`

```js
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = $status AND age > $minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);
```

## Ví dụ

### Thực thi SQL tạm thời (cần quyền cấu hình SQL)

```js
// 多行结果（默认）
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// 单行结果
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = $id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// 单值结果（如 COUNT、SUM）
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Sử dụng biến template

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Lưu template và tái sử dụng

```js
// 保存（需 SQL 配置权限）
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = $status ORDER BY created_at DESC',
});

// 登录用户均可执行
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// 删除模板（需 SQL 配置权限）
await ctx.sql.destroy('active-users-report');
```

### List phân trang (SQLResource)

```js
// 需要分页、筛选时，可使用 SQLResource
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // 已保存的 SQL 模板 ID
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // 含 page、pageSize 等
```

## Quan hệ với ctx.resource, ctx.request

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Thực thi truy vấn SQL** | `ctx.sql.run()` hoặc `ctx.sql.runById()` |
| **List phân trang SQL (block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **HTTP request thông dụng** | `ctx.request()` |

`ctx.sql` đóng gói API `flowSql`, chuyên dụng cho kịch bản SQL; `ctx.request` có thể gọi bất kỳ API nào.

## Lưu ý

- Sử dụng bind tham số (`$name`) thay vì nối chuỗi, tránh SQL injection
- Khi `type: 'selectVar'` trả về giá trị scalar, thường dùng cho `COUNT`, `SUM`, v.v.
- Biến template `{{ctx.xxx}}` được parse trước khi thực thi, đảm bảo biến tương ứng đã được định nghĩa trong ngữ cảnh

## Liên quan

- [ctx.resource](./resource.md): Resource dữ liệu, SQLResource nội bộ sẽ gọi API `flowSql`
- [ctx.initResource()](./init-resource.md): Khởi tạo SQLResource cho list phân trang, v.v.
- [ctx.request()](./request.md): HTTP request thông dụng
