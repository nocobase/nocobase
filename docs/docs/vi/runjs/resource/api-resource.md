---
title: "APIResource của RunJS"
description: "APIResource của RunJS là resource thông dụng gửi HTTP request theo URL, phù hợp với API tùy chỉnh, third-party API, setURL, refresh, getData, kế thừa FlowResource."
keywords: "APIResource,ctx.makeResource,setURL,FlowResource,API tùy chỉnh,RunJS,NocoBase"
---

# APIResource

**Resource API thông dụng** gửi request theo URL, phù hợp với bất kỳ HTTP API nào. Kế thừa từ class cơ sở FlowResource và mở rộng cấu hình request và `refresh()`. Khác với [MultiRecordResource](./multi-record-resource.md), [SingleRecordResource](./single-record-resource.md), APIResource không phụ thuộc vào tên resource, gửi request trực tiếp theo URL, phù hợp với các kịch bản như API tùy chỉnh, third-party API.

**Cách tạo**: `ctx.makeResource('APIResource')` hoặc `ctx.initResource('APIResource')`. Trước khi sử dụng cần đặt `setURL()`; trong ngữ cảnh RunJS sẽ tự động inject `ctx.api` (APIClient), không cần `setAPIClient` thủ công.

---

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **API tùy chỉnh** | Gọi API resource phi tiêu chuẩn (như `/api/custom/stats`, `/api/reports/summary`) |
| **Third-party API** | Yêu cầu service bên ngoài qua URL đầy đủ (đích cần hỗ trợ CORS) |
| **Truy vấn một lần** | Lấy dữ liệu tạm thời, dùng xong là bỏ, không cần bind vào `ctx.resource` |
| **Lựa chọn với ctx.request** | Khi cần dữ liệu reactive, sự kiện, trạng thái lỗi dùng APIResource; request đơn giản một lần dùng `ctx.request()` |

---

## Khả năng class cơ sở (FlowResource)

Tất cả Resource đều có:

| Phương thức | Mô tả |
|------|------|
| `getData()` | Lấy dữ liệu hiện tại |
| `setData(value)` | Đặt dữ liệu (chỉ local) |
| `hasData()` | Có dữ liệu hay không |
| `getMeta(key?)` / `setMeta(meta)` | Đọc/ghi metadata |
| `getError()` / `setError(err)` / `clearError()` | Trạng thái lỗi |
| `on(event, callback)` / `once` / `off` / `emit` | Đăng ký và trigger sự kiện |

---

## Cấu hình request

| Phương thức | Mô tả |
|------|------|
| `setAPIClient(api)` | Đặt instance APIClient (trong RunJS thường được tự động inject bởi ngữ cảnh) |
| `getURL()` / `setURL(url)` | URL request |
| `loading` | Đọc/ghi trạng thái loading (get/set) |
| `clearRequestParameters()` | Xóa tham số request |
| `setRequestParameters(params)` | Merge đặt tham số request |
| `setRequestMethod(method)` | Đặt phương thức request (như `'get'`, `'post'`, mặc định `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Header request |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Thêm/xóa/tìm tham số đơn |
| `setRequestBody(data)` | Body request (dùng khi POST/PUT/PATCH) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Tùy chọn request thông dụng |

---

## Định dạng URL

- **Kiểu resource**: Hỗ trợ rút gọn resource NocoBase, như `users:list`, `posts:get`, sẽ được nối với baseURL
- **Path tương đối**: Như `/api/custom/endpoint`, được nối với baseURL của ứng dụng
- **URL đầy đủ**: Sử dụng địa chỉ đầy đủ khi cross-domain, đích cần cấu hình CORS

---

## Lấy dữ liệu

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Gửi request theo URL, method, params, headers, data hiện tại, ghi `data` response vào `setData(data)` và trigger sự kiện `'refresh'`. Khi thất bại đặt `setError(err)` và ném `ResourceError`, không trigger sự kiện refresh. Cần đã đặt `api` và URL. |

---

## Ví dụ

### GET request cơ bản

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL kiểu resource

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST request (với request body)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: '测试', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Lắng nghe sự kiện refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>统计: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Xử lý lỗi

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? '请求失败');
}
```

### Header request tùy chỉnh

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Lưu ý

- **Phụ thuộc ctx.api**: Trong RunJS, `ctx.api` được inject bởi môi trường runtime, thường không cần `setAPIClient` thủ công; nếu sử dụng trong kịch bản không có ngữ cảnh, cần tự đặt.
- **refresh tức request**: `refresh()` sẽ gửi một request theo cấu hình hiện tại, method, params, data, v.v. cần được cấu hình trước khi gọi.
- **Lỗi không cập nhật data**: Khi request thất bại, `getData()` giữ giá trị gốc, có thể lấy thông tin lỗi qua `getError()`.
- **Với ctx.request**: Request đơn giản một lần dùng `ctx.request()`; khi cần dữ liệu reactive, sự kiện, quản lý trạng thái lỗi dùng APIResource.

---

## Liên quan

- [ctx.resource](../context/resource.md) - Instance resource trong ngữ cảnh hiện tại
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và bind vào ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Tạo instance resource mới, không bind
- [ctx.request()](../context/request.md) - HTTP request thông dụng, phù hợp với gọi đơn giản một lần
- [MultiRecordResource](./multi-record-resource.md) - Hướng đến collection/list, hỗ trợ CRUD, phân trang
- [SingleRecordResource](./single-record-resource.md) - Hướng đến bản ghi đơn
