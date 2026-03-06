:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/resource/api-resource).
:::

# APIResource

Một **API resource thông dụng** dựa trên URL để thực hiện các yêu cầu, phù hợp với bất kỳ giao diện HTTP nào. Nó kế thừa từ lớp cơ sở `FlowResource` và mở rộng thêm cấu hình yêu cầu cùng phương thức `refresh()`. Khác với [MultiRecordResource](./multi-record-resource.md) và [SingleRecordResource](./single-record-resource.md), `APIResource` không phụ thuộc vào tên tài nguyên mà thực hiện yêu cầu trực tiếp theo URL, phù hợp cho các kịch bản như giao diện tùy chỉnh, API bên thứ ba, v.v.

**Cách tạo**: `ctx.makeResource('APIResource')` hoặc `ctx.initResource('APIResource')`. Bạn phải gọi `setURL()` trước khi sử dụng; trong ngữ cảnh RunJS, `ctx.api` (APIClient) sẽ được tự động chèn vào, do đó không cần gọi `setAPIClient` thủ công.

---

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Giao diện tùy chỉnh** | Gọi các API tài nguyên không tiêu chuẩn (ví dụ: `/api/custom/stats`, `/api/reports/summary`). |
| **API bên thứ ba** | Yêu cầu các dịch vụ bên ngoài thông qua URL đầy đủ (yêu cầu mục tiêu hỗ trợ CORS). |
| **Truy vấn một lần** | Lấy dữ liệu tạm thời, dùng xong rồi bỏ, không cần liên kết với `ctx.resource`. |
| **Lựa chọn giữa APIResource và ctx.request** | Sử dụng `APIResource` khi cần dữ liệu phản hồi (reactive), sự kiện hoặc trạng thái lỗi; sử dụng `ctx.request()` cho các yêu cầu đơn giản một lần. |

---

## Khả năng của lớp cơ sở (FlowResource)

Tất cả các Resource đều sở hữu các khả năng sau:

| Phương thức | Mô tả |
|------|------|
| `getData()` | Lấy dữ liệu hiện tại. |
| `setData(value)` | Thiết lập dữ liệu (chỉ cục bộ). |
| `hasData()` | Kiểm tra xem có dữ liệu hay không. |
| `getMeta(key?)` / `setMeta(meta)` | Đọc/ghi siêu dữ liệu (metadata). |
| `getError()` / `setError(err)` / `clearError()` | Quản lý trạng thái lỗi. |
| `on(event, callback)` / `once` / `off` / `emit` | Đăng ký và kích hoạt sự kiện. |

---

## Cấu hình yêu cầu

| Phương thức | Mô tả |
|------|------|
| `setAPIClient(api)` | Thiết lập thực thể APIClient (thường được tự động chèn trong RunJS). |
| `getURL()` / `setURL(url)` | URL yêu cầu. |
| `loading` | Đọc/ghi trạng thái đang tải (get/set). |
| `clearRequestParameters()` | Xóa các tham số yêu cầu. |
| `setRequestParameters(params)` | Hợp nhất và thiết lập các tham số yêu cầu. |
| `setRequestMethod(method)` | Thiết lập phương thức yêu cầu (ví dụ: `'get'`, `'post'`, mặc định là `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Tiêu đề yêu cầu (Request headers). |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Thêm, xóa hoặc tra cứu một tham số đơn lẻ. |
| `setRequestBody(data)` | Thân yêu cầu (sử dụng cho POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Các tùy chọn yêu cầu chung. |

---

## Định dạng URL

- **Phong cách tài nguyên (Resource Style)**: Hỗ trợ viết tắt tài nguyên NocoBase, ví dụ `users:list`, `posts:get`, các chuỗi này sẽ được nối với `baseURL`.
- **Đường dẫn tương đối**: Ví dụ `/api/custom/endpoint`, được nối với `baseURL` của ứng dụng.
- **URL đầy đủ**: Sử dụng địa chỉ đầy đủ cho các yêu cầu chéo tên miền (cross-origin); mục tiêu cần được cấu hình CORS.

---

## Lấy dữ liệu

| Phương thức | Mô tả |
|------|------|
| `refresh()` | Thực hiện yêu cầu dựa trên URL, phương thức, tham số, tiêu đề và dữ liệu hiện tại. Nó ghi dữ liệu phản hồi vào `setData(data)` và kích hoạt sự kiện `'refresh'`. Khi thất bại, nó thiết lập `setError(err)` và ném ra một `ResourceError`, đồng thời không kích hoạt sự kiện `refresh`. Yêu cầu phải được thiết lập `api` và URL trước đó. |

---

## Ví dụ

### Yêu cầu GET cơ bản

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL theo phong cách tài nguyên

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Yêu cầu POST (kèm thân yêu cầu)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'Thử nghiệm', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Lắng nghe sự kiện refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Thống kê: {JSON.stringify(data)}</div>);
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
  ctx.message.error(err?.message ?? 'Yêu cầu thất bại');
}
```

### Tiêu đề yêu cầu tùy chỉnh

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Lưu ý

- **Phụ thuộc vào ctx.api**: Trong RunJS, `ctx.api` được môi trường thực thi chèn vào; việc gọi `setAPIClient` thủ công thường là không cần thiết. Nếu sử dụng trong một kịch bản không có ngữ cảnh, bạn phải tự thiết lập nó.
- **Refresh nghĩa là thực hiện yêu cầu**: `refresh()` sẽ thực hiện một yêu cầu dựa trên cấu hình hiện tại; phương thức, tham số, dữ liệu, v.v., phải được cấu hình trước khi gọi.
- **Lỗi không cập nhật dữ liệu**: Khi thất bại, `getData()` giữ nguyên giá trị trước đó; thông tin lỗi có thể được lấy thông qua `getError()`.
- **So với ctx.request**: Sử dụng `ctx.request()` cho các yêu cầu đơn giản một lần; sử dụng `APIResource` khi cần quản lý dữ liệu phản hồi (reactive), sự kiện và trạng thái lỗi.

---

## Liên quan

- [ctx.resource](../context/resource.md) - Thực thể resource trong ngữ cảnh hiện tại
- [ctx.initResource()](../context/init-resource.md) - Khởi tạo và liên kết với `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Tạo một thực thể resource mới mà không liên kết
- [ctx.request()](../context/request.md) - Yêu cầu HTTP chung, phù hợp cho các cuộc gọi đơn giản một lần
- [MultiRecordResource](./multi-record-resource.md) - Dành cho bộ sưu tập/danh sách, hỗ trợ CRUD và phân trang
- [SingleRecordResource](./single-record-resource.md) - Dành cho các bản ghi đơn lẻ