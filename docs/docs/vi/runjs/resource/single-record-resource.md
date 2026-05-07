---
title: "SingleRecordResource của RunJS"
description: "Resource bản ghi đơn của RunJS: getData trả về object đơn, setFilterByTk, save, create, update, destroy, phù hợp với block chi tiết, block form, resource quan hệ."
keywords: "SingleRecordResource,bản ghi đơn,setFilterByTk,save,block chi tiết,block form,RunJS,NocoBase"
---

# SingleRecordResource

Resource hướng đến **bản ghi đơn**: dữ liệu là object đơn, hỗ trợ get theo primary key, tạo/cập nhật (save) và xóa. Phù hợp với các kịch bản "bản ghi đơn" như chi tiết, form. Khác với [MultiRecordResource](./multi-record-resource.md), `getData()` của SingleRecordResource trả về object đơn, chỉ định primary key qua `setFilterByTk(id)`, `save()` sẽ tự động gọi create hoặc update dựa trên `isNewRecord`.

**Quan hệ kế thừa**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Cách tạo**: `ctx.makeResource('SingleRecordResource')` hoặc `ctx.initResource('SingleRecordResource')`. Trước khi sử dụng cần `setResourceName('tên collection')`; khi thao tác theo primary key cần `setFilterByTk(id)`; trong RunJS, `ctx.api` được inject bởi môi trường runtime.

---

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Block chi tiết** | Block chi tiết mặc định sử dụng SingleRecordResource, tải bản ghi đơn theo primary key |
| **Block form** | Form tạo mới/chỉnh sửa sử dụng SingleRecordResource, `save()` tự động phân biệt create/update |
| **JSBlock chi tiết** | Tải user, order đơn, v.v. trong JSBlock và hiển thị tùy chỉnh |
| **Resource quan hệ** | Tải bản ghi đơn quan hệ dưới dạng `users.profile`, v.v., cần kèm `setSourceId(ID bản ghi cha)` |

---

## Định dạng dữ liệu

- `getData()` trả về **object bản ghi đơn**, tức là trường `data` của API get
- `getMeta()` trả về metadata (nếu có)

---

## Tên resource và primary key

| Phương thức | Mô tả |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Tên resource, như `'users'`, `'users.profile'` (resource quan hệ) |
| `setSourceId(id)` / `getSourceId()` | ID bản ghi cha khi resource quan hệ (như `users.profile` cần truyền primary key của users) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Định danh data source (sử dụng khi đa data source) |
| `setFilterByTk(tk)` / `getFilterByTk()` | Primary key bản ghi hiện tại; sau khi đặt `isNewRecord` là false |

---

## Trạng thái

| Thuộc tính/Phương thức | Mô tả |
|----------|------|
| `isNewRecord` | Có phải trạng thái "tạo mới" hay không (chưa đặt filterByTk hoặc mới tạo là true) |

---

## Tham số request (filter / field)

| Phương thức | Mô tả |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filter (khả dụng khi không phải tạo mới) |
| `setFields(fields)` / `getFields()` | Field request |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Mở rộng quan hệ |

---

## CRUD

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Yêu cầu get theo `filterByTk` hiện tại, cập nhật `getData()`; trạng thái tạo mới không request |
| `save(data, options?)` | Tạo mới gọi create, ngược lại gọi update; tùy chọn `{ refresh: false }` không tự động refresh |
| `destroy(options?)` | Xóa theo `filterByTk` hiện tại, và xóa dữ liệu local |
| `runAction(actionName, options)` | Gọi bất kỳ action resource nào |

---

## Cấu hình và sự kiện

| Phương thức | Mô tả |
|------|------|
| `setSaveActionOptions(options)` | Cấu hình request khi save |
| `on('refresh', fn)` / `on('saved', fn)` | Trigger sau khi refresh hoàn tất, sau khi save |

---

## Ví dụ

### Get và update cơ bản

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// 更新
await ctx.resource.save({ name: '李四' });
```

### Tạo bản ghi mới

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: '王五', email: 'wangwu@example.com' });
```

### Xóa bản ghi

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// destroy 后 getData() 为 null
```

### Mở rộng quan hệ và field

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Resource quan hệ (như users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // 父记录主键
res.setFilterByTk(profileId);    // 若 profile 为 hasOne 可省略 filterByTk
await res.refresh();
const profile = res.getData();
```

### save không tự động refresh

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// 保存后不触发 refresh，getData() 保持旧值
```

### Lắng nghe sự kiện refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>用户: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('保存成功');
});
await ctx.resource?.refresh?.();
```

---

## Lưu ý

- **setResourceName bắt buộc**: Trước khi sử dụng phải gọi `setResourceName('tên collection')`, nếu không sẽ không thể xây dựng URL request.
- **filterByTk và isNewRecord**: Khi chưa đặt `setFilterByTk`, `isNewRecord` là true, `refresh()` sẽ không gửi request; `save()` sẽ đi qua create.
- **Resource quan hệ**: Khi tên resource là `parent.child` (như `users.profile`), cần `setSourceId(primary key bản ghi cha)` trước.
- **getData là object**: `data` được trả về bởi API đơn là object bản ghi, `getData()` trả về trực tiếp object đó; sau `destroy()` là null.

---

## Liên quan

- [ctx.resource](../context/resource.md) - Instance resource trong ngữ cảnh hiện tại
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và bind vào ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Tạo instance resource mới, không bind
- [APIResource](./api-resource.md) - Resource API thông dụng, request theo URL
- [MultiRecordResource](./multi-record-resource.md) - Hướng đến collection/list, hỗ trợ CRUD, phân trang
