---
title: "ctx.request()"
description: "ctx.request() gửi HTTP request có xác thực trong RunJS, tự động mang baseURL, Token, locale, kế thừa interceptor và xử lý lỗi của ứng dụng."
keywords: "ctx.request,HTTP request,baseURL,Token,xác thực,RunJS,NocoBase"
---

# ctx.request()

Gửi HTTP request có xác thực trong RunJS. Request sẽ tự động mang theo baseURL, Token, locale, role, v.v. của ứng dụng hiện tại, và kế thừa logic interceptor request và xử lý lỗi của ứng dụng.

## Kịch bản áp dụng

Tất cả các kịch bản trong RunJS cần gửi HTTP request từ xa đều có thể sử dụng, như JSBlock, JSField, JSItem, JSColumn, luồng sự kiện, liên kết, JSAction, v.v.

## Định nghĩa kiểu

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` mở rộng từ `AxiosRequestConfig` của Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // 请求失败时是否跳过全局错误提示
  skipAuth?: boolean;                                 // 是否跳过认证跳转（如 401 不跳转登录页）
};
```

## Tham số thường dùng

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `url` | string | URL request. Hỗ trợ kiểu resource (như `users:list`, `posts:create`), hoặc URL đầy đủ |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Phương thức HTTP, mặc định `'get'` |
| `params` | object | Tham số query, được serialize vào URL |
| `data` | any | Request body, dùng cho post/put/patch |
| `headers` | object | Header request tùy chỉnh |
| `skipNotify` | boolean \| (error) => boolean | Khi là true hoặc function trả về true, thất bại không hiển thị thông báo lỗi global |
| `skipAuth` | boolean | Khi là true, 401 không trigger điều hướng xác thực (như chuyển đến login page) |

## URL kiểu resource

API resource của NocoBase hỗ trợ dạng rút gọn `resource:action`:

| Định dạng | Mô tả | Ví dụ |
|------|------|------|
| `collection:action` | CRUD đơn collection | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Resource quan hệ (cần truyền primary key qua `resourceOf` hoặc URL) | `posts.comments:list` |

Path tương đối sẽ được nối với baseURL của ứng dụng (thường là `/api`); cross-domain cần dùng URL đầy đủ, service đích cần cấu hình CORS.

## Cấu trúc response

Giá trị trả về là object response của Axios, các trường thường dùng:

- `response.data`: response body
- API list thường là `data.data` (array bản ghi) + `data.meta` (phân trang, v.v.)
- API đơn/tạo/cập nhật thường có `data.data` là bản ghi đơn

## Ví dụ

### Truy vấn list

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // 分页等信息
```

### Submit dữ liệu

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: '张三', email: 'zhangsan@example.com' },
});

const newRecord = res?.data?.data;
```

### Với filter và sort

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Bỏ qua thông báo lỗi

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // 失败时不弹出全局 message
});

// 或按错误类型决定是否跳过
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Request cross-domain

Khi sử dụng URL đầy đủ để request đến domain khác, service đích cần cấu hình CORS cho phép nguồn ứng dụng hiện tại. Nếu API đích cần token riêng, có thể truyền qua headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <目标服务的 token>',
  },
});
```

### Hiển thị kết hợp với ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('用户列表') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Lưu ý

- **Xử lý lỗi**: Request thất bại sẽ ném exception, mặc định sẽ hiển thị thông báo lỗi global. Sử dụng `skipNotify: true` để tự bắt và xử lý.
- **Xác thực**: Request cùng domain sẽ tự động mang Token, locale, role của user hiện tại; cross-domain cần đích hỗ trợ CORS, và truyền token vào headers theo nhu cầu.
- **Quyền resource**: Request bị ràng buộc bởi ACL, chỉ có thể truy cập các resource mà user hiện tại có quyền.

## Liên quan

- [ctx.message](./message.md) - Hiển thị thông báo nhẹ sau khi request hoàn thành
- [ctx.notification](./notification.md) - Hiển thị notification sau khi request hoàn thành
- [ctx.render](./render.md) - Render kết quả request lên giao diện
- [ctx.makeResource](./make-resource.md) - Xây dựng object resource, dùng cho tải dữ liệu chuỗi (chọn một trong hai với `ctx.request` trực tiếp)
