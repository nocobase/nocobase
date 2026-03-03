:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Resource hướng đối tượng bộ sưu tập (Collection): yêu cầu trả về một mảng, hỗ trợ phân trang, bộ lọc, sắp xếp và các thao tác CRUD (Thêm, Đọc, Sửa, Xóa). Phù hợp cho các kịch bản "nhiều bản ghi" như bảng, danh sách. Khác với [APIResource](./api-resource.md), MultiRecordResource chỉ định tên tài nguyên thông qua `setResourceName()`, tự động xây dựng các URL như `users:list`, `users:create`, đồng thời tích hợp sẵn các khả năng phân trang, bộ lọc, chọn dòng, v.v.

**Quan hệ kế thừa**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Cách tạo**: `ctx.makeResource('MultiRecordResource')` hoặc `ctx.initResource('MultiRecordResource')`. Trước khi sử dụng cần gọi `setResourceName('tên_bộ_sưu_tập')` (ví dụ: `'users'`); trong RunJS, `ctx.api` được cung cấp bởi môi trường thực thi.

---

## Kịch bản sử dụng

| Kịch bản | Mô tả |
|------|------|
| **Khối bảng (Table block)** | Các khối bảng và danh sách mặc định sử dụng MultiRecordResource, hỗ trợ phân trang, bộ lọc và sắp xếp. |
| **Danh sách JSBlock** | Tải dữ liệu từ các bộ sưu tập như người dùng, đơn hàng trong JSBlock và tùy chỉnh hiển thị. |
| **Thao tác hàng loạt** | Sử dụng `getSelectedRows()` để lấy các dòng đang chọn, `destroySelectedRows()` để xóa hàng loạt. |
| **Tài nguyên liên kết** | Sử dụng định dạng như `users.tags` để tải dữ liệu từ bộ sưu tập liên kết, cần kết hợp với `setSourceId(ID_bản_ghi_cha)`. |

---

## Định dạng dữ liệu

- `getData()` trả về **mảng các bản ghi**, tương ứng với trường `data` của giao diện list.
- `getMeta()` trả về thông tin meta như phân trang: `page`, `pageSize`, `count`, `totalPage`, v.v.

---

## Tên tài nguyên và Nguồn dữ liệu

| Phương thức | Mô tả |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Tên tài nguyên, ví dụ: `'users'`, `'users.tags'` (tài nguyên liên kết). |
| `setSourceId(id)` / `getSourceId()` | ID bản ghi cha khi sử dụng tài nguyên liên kết (ví dụ: `users.tags` cần truyền khóa chính của users). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Định danh nguồn dữ liệu (sử dụng khi có nhiều nguồn dữ liệu). |

---

## Tham số yêu cầu (Bộ lọc / Trường / Sắp xếp)

| Phương thức | Mô tả |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Lọc theo khóa chính (dùng cho get đơn lẻ, v.v.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Điều kiện lọc, hỗ trợ các toán tử như `$eq`, `$ne`, `$in`, v.v. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Nhóm bộ lọc (kết hợp nhiều điều kiện). |
| `setFields(fields)` / `getFields()` | Các trường yêu cầu (danh sách trắng). |
| `setSort(sort)` / `getSort()` | Sắp xếp, ví dụ: `['-createdAt']` nghĩa là sắp xếp ngược theo thời gian tạo. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Tải dữ liệu liên kết (ví dụ: `['user', 'tags']`). |

---

## Phân trang

| Phương thức | Mô tả |
|------|------|
| `setPage(page)` / `getPage()` | Trang hiện tại (bắt đầu từ 1). |
| `setPageSize(size)` / `getPageSize()` | Số lượng bản ghi mỗi trang, mặc định là 20. |
| `getTotalPage()` | Tổng số trang. |
| `getCount()` | Tổng số bản ghi (từ meta của máy chủ). |
| `next()` / `previous()` / `goto(page)` | Chuyển trang và kích hoạt `refresh`. |

---

## Dòng được chọn (Kịch bản bảng)

| Phương thức | Mô tả |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Dữ liệu các dòng hiện đang được chọn, dùng cho các thao tác như xóa hàng loạt. |

---

## CRUD và Thao tác danh sách

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Gửi yêu cầu list với các tham số hiện tại, cập nhật `getData()` và meta phân trang, kích hoạt sự kiện `'refresh'`. |
| `get(filterByTk)` | Yêu cầu một bản ghi duy nhất, trả về dữ liệu bản ghi đó (không ghi vào `getData`). |
| `create(data, options?)` | Tạo mới, tùy chọn `{ refresh: false }` để không tự động làm mới, kích hoạt `'saved'`. |
| `update(filterByTk, data, options?)` | Cập nhật theo khóa chính. |
| `destroy(target)` | Xóa; target có thể là khóa chính, đối tượng dòng hoặc mảng các khóa chính/đối tượng dòng (xóa hàng loạt). |
| `destroySelectedRows()` | Xóa các dòng hiện đang được chọn (ném ra lỗi nếu không có dòng nào được chọn). |
| `setItem(index, item)` | Thay thế cục bộ dữ liệu của một dòng nhất định (không gửi yêu cầu lên máy chủ). |
| `runAction(actionName, options)` | Gọi bất kỳ action nào của tài nguyên (ví dụ: action tùy chỉnh). |

---

## Cấu hình và Sự kiện

| Phương thức | Mô tả |
|------|------|
| `setRefreshAction(name)` | Action được gọi khi làm mới, mặc định là `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Cấu hình yêu cầu cho create/update. |
| `on('refresh', fn)` / `on('saved', fn)` | Kích hoạt sau khi làm mới hoàn tất hoặc sau khi lưu thành công. |

---

## Ví dụ

### Danh sách cơ bản

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Bộ lọc và Sắp xếp

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Tải dữ liệu liên kết

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Tạo mới và Chuyển trang

```js
await ctx.resource.create({ name: 'Nguyễn Văn A', email: 'nguyenvana@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Xóa hàng loạt các dòng được chọn

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Vui lòng chọn dữ liệu trước');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Đã xóa'));
```

### Lắng nghe sự kiện refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Tài nguyên liên kết (Bảng con)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Lưu ý

- **setResourceName là bắt buộc**: Phải gọi `setResourceName('tên_bộ_sưu_tập')` trước khi sử dụng, nếu không sẽ không thể xây dựng URL yêu cầu.
- **Tài nguyên liên kết**: Khi tên tài nguyên có dạng `parent.child` (ví dụ: `users.tags`), cần gọi `setSourceId(khóa_chính_cha)` trước.
- **Chống rung (Debounce) cho refresh**: Trong cùng một vòng lặp sự kiện (event loop), nhiều lần gọi `refresh()` sẽ chỉ thực hiện lần cuối cùng để tránh các yêu cầu trùng lặp.
- **getData là một mảng**: Dữ liệu trả về từ giao diện list chính là mảng các bản ghi, `getData()` sẽ trả về trực tiếp mảng này.

---

## Liên quan

- [ctx.resource](../context/resource.md) - Thực thể resource trong ngữ cảnh hiện tại
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và liên kết với ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Tạo mới thực thể resource, không liên kết
- [APIResource](./api-resource.md) - Tài nguyên API thông dụng, yêu cầu theo URL
- [SingleRecordResource](./single-record-resource.md) - Hướng tới một bản ghi duy nhất