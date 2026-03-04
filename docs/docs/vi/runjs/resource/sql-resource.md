:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/resource/sql-resource).
:::

# SQLResource

Resource thực thi truy vấn dựa trên **cấu hình SQL đã lưu** hoặc **SQL động**, nguồn dữ liệu đến từ các giao diện như `flowSql:run` / `flowSql:runById`. Thích hợp cho các kịch bản như báo cáo, thống kê, danh sách SQL tùy chỉnh, v.v. Khác với [MultiRecordResource](./multi-record-resource.md), SQLResource không phụ thuộc vào bộ sưu tập (collection), nó thực thi truy vấn SQL trực tiếp, hỗ trợ phân trang, ràng buộc tham số (parameter binding), biến mẫu (`{{ctx.xxx}}`) và kiểm soát loại kết quả trả về.

**Quan hệ kế thừa**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Cách thức khởi tạo**: `ctx.makeResource('SQLResource')` hoặc `ctx.initResource('SQLResource')`. Khi thực thi theo cấu hình đã lưu, cần sử dụng `setFilterByTk(uid)` (uid của mẫu SQL); khi gỡ lỗi, có thể sử dụng `setDebug(true)` + `setSQL(sql)` để thực thi SQL trực tiếp; trong RunJS, `ctx.api` được tiêm vào bởi môi trường thực thi.

---

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Báo cáo / Thống kê** | Các phép tổng hợp phức tạp, truy vấn liên bảng, các chỉ số thống kê tùy chỉnh. |
| **Danh sách tùy chỉnh JSBlock** | Sử dụng SQL để thực hiện lọc, sắp xếp hoặc liên kết đặc biệt và tùy chỉnh hiển thị. |
| **Khối biểu đồ (Chart Block)** | Lưu trữ các mẫu SQL để điều khiển nguồn dữ liệu biểu đồ, hỗ trợ phân trang. |
| **Lựa chọn giữa SQLResource và ctx.sql** | Sử dụng SQLResource khi cần phân trang, sự kiện, dữ liệu phản hồi (reactive); sử dụng `ctx.sql.run()` / `ctx.sql.runById()` cho các truy vấn đơn giản một lần. |

---

## Định dạng dữ liệu

- `getData()` trả về các định dạng khác nhau tùy thuộc vào `setSQLType()`:
  - `selectRows` (mặc định): **Mảng**, kết quả nhiều dòng.
  - `selectRow`: **Một đối tượng duy nhất**.
  - `selectVar`: **Giá trị đơn** (ví dụ: COUNT, SUM).
- `getMeta()` trả về thông tin siêu dữ liệu như phân trang: `page`, `pageSize`, `count`, `totalPage`, v.v.

---

## Cấu hình SQL và Chế độ thực thi

| Phương thức | Mô tả |
|------|------|
| `setFilterByTk(uid)` | Thiết lập uid của mẫu SQL cần thực thi (tương ứng với runById, cần được lưu trong giao diện quản trị trước). |
| `setSQL(sql)` | Thiết lập SQL thô (chỉ dùng cho runBySQL khi chế độ gỡ lỗi `setDebug(true)` được bật). |
| `setSQLType(type)` | Loại kết quả: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Nếu là true, `refresh` sẽ gọi `runBySQL()`, ngược lại sẽ gọi `runById()`. |
| `run()` | Gọi `runBySQL()` hoặc `runById()` tùy theo trạng thái debug. |
| `runBySQL()` | Thực thi bằng SQL hiện tại trong `setSQL` (yêu cầu `setDebug(true)`). |
| `runById()` | Thực thi mẫu SQL đã lưu bằng uid hiện tại. |

---

## Tham số và Ngữ cảnh

| Phương thức | Mô tả |
|------|------|
| `setBind(bind)` | Ràng buộc biến. Dạng đối tượng kết hợp với `:name`, dạng mảng kết hợp với `?`. |
| `setLiquidContext(ctx)` | Ngữ cảnh mẫu (Liquid), dùng để phân giải `{{ctx.xxx}}`. |
| `setFilter(filter)` | Điều kiện lọc bổ sung (truyền vào dữ liệu yêu cầu). |
| `setDataSourceKey(key)` | Mã định danh nguồn dữ liệu (sử dụng khi có nhiều nguồn dữ liệu). |

---

## Phân trang

| Phương thức | Mô tả |
|------|------|
| `setPage(page)` / `getPage()` | Trang hiện tại (mặc định là 1). |
| `setPageSize(size)` / `getPageSize()` | Số lượng bản ghi mỗi trang (mặc định là 20). |
| `next()` / `previous()` / `goto(page)` | Chuyển trang và kích hoạt `refresh`. |

Trong SQL, có thể sử dụng `{{ctx.limit}}`, `{{ctx.offset}}` để tham chiếu các tham số phân trang, SQLResource sẽ tự động tiêm `limit`, `offset` vào ngữ cảnh.

---

## Lấy dữ liệu và Sự kiện

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Thực thi SQL (runById hoặc runBySQL), ghi kết quả vào `setData(data)` và cập nhật meta, kích hoạt sự kiện `'refresh'`. |
| `runAction(actionName, options)` | Gọi các giao diện bên dưới (như `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Kích hoạt khi hoàn tất làm mới hoặc khi bắt đầu tải. |

---

## Ví dụ

### Thực thi theo mẫu đã lưu (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // uid của mẫu SQL đã lưu
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, v.v.
```

### Chế độ gỡ lỗi: Thực thi SQL trực tiếp (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Phân trang và Chuyển trang

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Chuyển trang
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Loại kết quả

```js
// Nhiều dòng (mặc định)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Một dòng
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Một giá trị (ví dụ: COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Sử dụng biến mẫu

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

- **runById yêu cầu lưu mẫu trước**: uid trong `setFilterByTk(uid)` phải là ID của mẫu SQL đã được lưu trong giao diện quản trị, có thể lưu thông qua `ctx.sql.save({ uid, sql })`.
- **Chế độ gỡ lỗi yêu cầu quyền hạn**: Khi `setDebug(true)`, hệ thống sẽ gọi `flowSql:run`, yêu cầu vai trò hiện tại có quyền cấu hình SQL; `runById` chỉ yêu cầu người dùng đã đăng nhập.
- **Chống rung (Debounce) refresh**: Nhiều lần gọi `refresh()` trong cùng một vòng lặp sự kiện (event loop) sẽ chỉ thực thi lần cuối cùng để tránh các yêu cầu trùng lặp.
- **Ràng buộc tham số để chống Injection**: Sử dụng `setBind()` kết hợp với các trình giữ chỗ `:name` / `?` để tránh lỗi bảo mật SQL Injection do nối chuỗi.

---

## Liên quan

- [ctx.sql](../context/sql.md) - Thực thi và quản lý SQL, `ctx.sql.runById` phù hợp cho các truy vấn đơn giản một lần.
- [ctx.resource](../context/resource.md) - Thực thể resource trong ngữ cảnh hiện tại.
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và liên kết vào `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Tạo mới thực thể resource, không liên kết.
- [APIResource](./api-resource.md) - Tài nguyên API chung.
- [MultiRecordResource](./multi-record-resource.md) - Hướng tới bộ sưu tập/danh sách dữ liệu.