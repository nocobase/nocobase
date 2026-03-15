:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` cung cấp khả năng thực thi và quản lý SQL, thường được sử dụng trong RunJS (như JSBlock, luồng công việc) để truy cập trực tiếp vào cơ sở dữ liệu. Nó hỗ trợ thực thi SQL tạm thời, thực thi các mẫu SQL đã lưu theo ID, liên kết tham số (parameter binding), biến mẫu (`{{ctx.xxx}}`) và kiểm soát loại kết quả trả về.

## Các trường hợp sử dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Báo cáo thống kê tùy chỉnh, danh sách lọc phức tạp, truy vấn tổng hợp liên bảng. |
| **Biểu đồ (Chart Block)** | Lưu các mẫu SQL để làm nguồn dữ liệu cho biểu đồ. |
| **Luồng công việc / Liên kết** | Thực thi SQL được thiết lập sẵn để lấy dữ liệu phục vụ cho các logic tiếp theo. |
| **SQLResource** | Kết hợp với `ctx.initResource('SQLResource')`, dùng cho các kịch bản như danh sách phân trang. |

> Lưu ý: `ctx.sql` truy cập cơ sở dữ liệu thông qua API `flowSql`. Hãy đảm bảo người dùng hiện tại có quyền thực thi đối với nguồn dữ liệu tương ứng.

## Giải thích quyền hạn

| Quyền hạn | Phương thức | Mô tả |
|------|------|------|
| **Người dùng đã đăng nhập** | `runById` | Thực thi dựa trên ID mẫu SQL đã được cấu hình. |
| **Quyền cấu hình SQL** | `run`, `save`, `destroy` | Thực thi SQL tạm thời, hoặc lưu/cập nhật/xóa mẫu SQL. |

Logic phía frontend dành cho người dùng thông thường nên sử dụng `ctx.sql.runById(uid, options)`. Khi cần SQL động hoặc quản lý mẫu, hãy đảm bảo vai trò hiện tại có quyền cấu hình SQL.

## Định nghĩa kiểu dữ liệu

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

## Các phương thức thường dùng

| Phương thức | Mô tả | Yêu cầu quyền hạn |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Thực thi SQL tạm thời; hỗ trợ liên kết tham số và biến mẫu. | Quyền cấu hình SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Lưu hoặc cập nhật mẫu SQL theo ID để tái sử dụng. | Quyền cấu hình SQL |
| `ctx.sql.runById(uid, options?)` | Thực thi mẫu SQL đã lưu trước đó theo ID. | Mọi người dùng đã đăng nhập |
| `ctx.sql.destroy(uid)` | Xóa mẫu SQL được chỉ định theo ID. | Quyền cấu hình SQL |

Lưu ý:

- `run` được sử dụng để gỡ lỗi SQL và yêu cầu quyền cấu hình.
- `save` và `destroy` được sử dụng để quản lý các mẫu SQL và yêu cầu quyền cấu hình.
- `runById` mở cho người dùng thông thường; nó chỉ có thể thực thi các mẫu đã lưu và không thể gỡ lỗi hoặc sửa đổi SQL.
- Khi mẫu SQL thay đổi, phải gọi `save` để lưu lại các thay đổi.

## Giải thích tham số

### options cho run / runById

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Biến liên kết. Sử dụng đối tượng cho `:name` hoặc mảng cho `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Loại kết quả: nhiều dòng, một dòng, hoặc một giá trị đơn. Mặc định là `selectRows`. |
| `dataSourceKey` | `string` | Mã định danh nguồn dữ liệu. Mặc định sử dụng nguồn dữ liệu chính. |
| `filter` | `Record<string, any>` | Điều kiện lọc bổ sung (tùy thuộc vào sự hỗ trợ của giao diện). |

### options cho save

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | Mã định danh duy nhất cho mẫu. Sau khi lưu, có thể thực thi qua `runById(uid, ...)`. |
| `sql` | `string` | Nội dung SQL. Hỗ trợ biến mẫu `{{ctx.xxx}}` và các trình giữ chỗ `:name` / `?`. |
| `dataSourceKey` | `string` | Tùy chọn. Mã định danh nguồn dữ liệu. |

## Biến mẫu SQL và Liên kết tham số

### Biến mẫu `{{ctx.xxx}}`

Bạn có thể sử dụng `{{ctx.xxx}}` trong SQL để tham chiếu các biến ngữ cảnh. Chúng sẽ được phân giải thành giá trị thực tế trước khi thực thi:

```js
// Tham chiếu ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Nguồn của các biến có thể tham chiếu giống với `ctx.getVar()` (ví dụ: `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` tùy chỉnh, v.v.).

### Liên kết tham số (Parameter Binding)

- **Tham số có tên**: Sử dụng `:name` trong SQL và truyền một đối tượng `{ name: value }` vào `bind`.
- **Tham số theo vị trí**: Sử dụng `?` trong SQL và truyền một mảng `[value1, value2]` vào `bind`.

```js
// Tham số có tên
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Tham số theo vị trí
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Hanoi', 'active'], type: 'selectVar' }
);
```

## Ví dụ

### Thực thi SQL tạm thời (Yêu cầu quyền cấu hình SQL)

```js
// Kết quả nhiều dòng (mặc định)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Kết quả một dòng
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Kết quả một giá trị đơn (ví dụ: COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Sử dụng biến mẫu

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Lưu và tái sử dụng mẫu

```js
// Lưu (Yêu cầu quyền cấu hình SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Mọi người dùng đã đăng nhập đều có thể thực thi lệnh này
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Xóa mẫu (Yêu cầu quyền cấu hình SQL)
await ctx.sql.destroy('active-users-report');
```

### Danh sách phân trang (SQLResource)

```js
// Sử dụng SQLResource khi cần phân trang hoặc lọc
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID của mẫu SQL đã lưu
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Bao gồm page, pageSize, v.v.
```

## Mối quan hệ với ctx.resource và ctx.request

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Thực thi truy vấn SQL** | `ctx.sql.run()` hoặc `ctx.sql.runById()` |
| **Danh sách phân trang SQL (Block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Yêu cầu HTTP chung** | `ctx.request()` |

`ctx.sql` bao bọc API `flowSql` và chuyên dùng cho các kịch bản SQL; `ctx.request` có thể được sử dụng để gọi bất kỳ API nào.

## Lưu ý

- Sử dụng liên kết tham số (`:name` / `?`) thay vì nối chuỗi để tránh tấn công SQL injection.
- `type: 'selectVar'` trả về một giá trị vô hướng (scalar), thường được dùng cho `COUNT`, `SUM`, v.v.
- Biến mẫu `{{ctx.xxx}}` được phân giải trước khi thực thi; hãy đảm bảo các biến tương ứng đã được định nghĩa trong ngữ cảnh.

## Liên quan

- [ctx.resource](./resource.md): Nguồn dữ liệu, SQLResource gọi API `flowSql` bên trong.
- [ctx.initResource()](./init-resource.md): Khởi tạo SQLResource cho danh sách phân trang, v.v.
- [ctx.request()](./request.md): Yêu cầu HTTP thông thường.