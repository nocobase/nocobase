:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Resource hướng đến **một bản ghi duy nhất**: dữ liệu là một đối tượng đơn lẻ, hỗ trợ lấy theo khóa chính, tạo/cập nhật (save) và xóa. Thích hợp cho các kịch bản "một bản ghi" như chi tiết, biểu mẫu. Khác với [MultiRecordResource](./multi-record-resource.md), phương thức `getData()` của `SingleRecordResource` trả về một đối tượng duy nhất, chỉ định khóa chính thông qua `setFilterByTk(id)`, và `save()` sẽ tự động gọi create hoặc update dựa trên trạng thái `isNewRecord`.

**Quan hệ kế thừa**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Cách thức khởi tạo**: `ctx.makeResource('SingleRecordResource')` hoặc `ctx.initResource('SingleRecordResource')`. Trước khi sử dụng cần gọi `setResourceName('tên_bộ_sưu_tập')`; khi thao tác theo khóa chính cần gọi `setFilterByTk(id)`; trong RunJS, `ctx.api` được tiêm (inject) bởi môi trường thực thi.

---

## Kịch bản sử dụng

| Kịch bản | Mô tả |
|------|------|
| **Block chi tiết** | Block chi tiết mặc định sử dụng SingleRecordResource, tải một bản ghi duy nhất theo khóa chính |
| **Block biểu mẫu** | Biểu mẫu tạo mới/chỉnh sửa sử dụng SingleRecordResource, `save()` tự động phân biệt giữa create/update |
| **Chi tiết JSBlock** | Tải thông tin một người dùng, đơn hàng, v.v. trong JSBlock và tùy chỉnh hiển thị |
| **Resource liên kết** | Sử dụng định dạng `users.profile` để tải bản ghi liên kết đơn lẻ, cần kết hợp với `setSourceId(ID_bản_ghi_cha)` |

---

## Định dạng dữ liệu

- `getData()` trả về **đối tượng bản ghi duy nhất**, tương ứng với trường `data` của giao diện get.
- `getMeta()` trả về thông tin meta (nếu có).

---

## Tên Resource và Khóa chính

| Phương thức | Mô tả |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Tên resource, ví dụ: `'users'`, `'users.profile'` (resource liên kết) |
| `setSourceId(id)` / `getSourceId()` | ID bản ghi cha khi thao tác với resource liên kết (ví dụ: `users.profile` cần truyền khóa chính của users) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Mã định danh nguồn dữ liệu (sử dụng khi có nhiều nguồn dữ liệu) |
| `setFilterByTk(tk)` / `getFilterByTk()` | Khóa chính của bản ghi hiện tại; sau khi thiết lập, `isNewRecord` sẽ là false |

---

## Trạng thái

| Thuộc tính/Phương thức | Mô tả |
|----------|------|
| `isNewRecord` | Có phải là trạng thái "tạo mới" hay không (true nếu chưa thiết lập filterByTk hoặc vừa mới được tạo) |

---

## Tham số yêu cầu (Lọc / Trường dữ liệu)

| Phương thức | Mô tả |
|------|------|
| `setFilter(filter)` / `getFilter()` | Bộ lọc (có thể sử dụng khi không phải trạng thái tạo mới) |
| `setFields(fields)` / `getFields()` | Các trường dữ liệu yêu cầu |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Mở rộng liên kết (appends) |

---

## CRUD

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Gửi yêu cầu get theo `filterByTk` hiện tại, cập nhật `getData()`; không gửi yêu cầu khi ở trạng thái tạo mới |
| `save(data, options?)` | Gọi create khi tạo mới, nếu không sẽ gọi update; tùy chọn `{ refresh: false }` để không tự động làm mới |
| `destroy(options?)` | Xóa theo `filterByTk` hiện tại và xóa sạch dữ liệu cục bộ |
| `runAction(actionName, options)` | Gọi bất kỳ action nào của resource |

---

## Cấu hình và Sự kiện

| Phương thức | Mô tả |
|------|------|
| `setSaveActionOptions(options)` | Cấu hình yêu cầu khi thực hiện save |
| `on('refresh', fn)` / `on('saved', fn)` | Kích hoạt sau khi hoàn tất làm mới hoặc sau khi lưu |

---

## Ví dụ

### Lấy và cập nhật cơ bản

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Cập nhật
await ctx.resource.save({ name: 'Lý Tứ' });
```

### Tạo bản ghi mới

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Vương Ngũ', email: 'wangwu@example.com' });
```

### Xóa bản ghi

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Sau khi destroy, getData() sẽ là null
```

### Mở rộng liên kết và trường dữ liệu

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Resource liên kết (ví dụ: users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Khóa chính bản ghi cha
res.setFilterByTk(profileId);    // Nếu profile là quan hệ hasOne có thể bỏ qua filterByTk
await res.refresh();
const profile = res.getData();
```

### save không tự động làm mới

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// Sau khi lưu không kích hoạt refresh, getData() giữ giá trị cũ
```

### Lắng nghe sự kiện refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Người dùng: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Lưu thành công');
});
await ctx.resource?.refresh?.();
```

---

## Lưu ý

- **setResourceName là bắt buộc**: Phải gọi `setResourceName('tên_bộ_sưu_tập')` trước khi sử dụng, nếu không sẽ không thể xây dựng URL yêu cầu.
- **filterByTk và isNewRecord**: Khi chưa thiết lập `setFilterByTk`, `isNewRecord` là true, `refresh()` sẽ không gửi yêu cầu; `save()` sẽ thực hiện hành động create.
- **Resource liên kết**: Khi tên resource có định dạng `parent.child` (ví dụ: `users.profile`), cần gọi `setSourceId(khóa_chính_cha)` trước.
- **getData là một đối tượng**: Dữ liệu trả về từ giao diện bản ghi đơn lẻ là một đối tượng bản ghi, `getData()` trả về trực tiếp đối tượng đó; sau khi `destroy()` sẽ là null.

---

## Liên quan

- [ctx.resource](../context/resource.md) - Thực thể resource trong ngữ cảnh hiện tại
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và liên kết vào ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Tạo mới thực thể resource, không liên kết
- [APIResource](./api-resource.md) - Resource API thông thường, yêu cầu theo URL
- [MultiRecordResource](./multi-record-resource.md) - Hướng đến bộ sưu tập/danh sách, hỗ trợ CRUD, phân trang