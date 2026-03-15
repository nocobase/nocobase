:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/request).
:::

# ctx.request()

Khởi tạo một yêu cầu HTTP có xác thực trong RunJS. Yêu cầu sẽ tự động mang theo `baseURL`, `Token`, `locale`, `role`, v.v. của ứng dụng hiện tại, đồng thời tuân theo logic chặn yêu cầu (request interception) và xử lý lỗi của ứng dụng.

## Trường hợp sử dụng

Áp dụng cho bất kỳ kịch bản nào trong RunJS cần khởi tạo yêu cầu HTTP từ xa, chẳng hạn như JSBlock, JSField, JSItem, JSColumn, luồng công việc, liên kết (linkage), JSAction, v.v.

## Định nghĩa kiểu dữ liệu

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` được mở rộng dựa trên `AxiosRequestConfig` của Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Liệu có bỏ qua thông báo lỗi toàn cục khi yêu cầu thất bại hay không
  skipAuth?: boolean;                                 // Liệu có bỏ qua việc chuyển hướng xác thực (ví dụ: không chuyển hướng đến trang đăng nhập khi gặp lỗi 401) hay không
};
```

## Các tham số thường dùng

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `url` | string | URL yêu cầu. Hỗ trợ định dạng tài nguyên (ví dụ: `users:list`, `posts:create`) hoặc URL đầy đủ |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Phương thức HTTP, mặc định là `'get'` |
| `params` | object | Các tham số truy vấn, được tuần tự hóa vào URL |
| `data` | any | Thân yêu cầu (request body), được sử dụng cho post/put/patch |
| `headers` | object | Các tiêu đề yêu cầu (request headers) tùy chỉnh |
| `skipNotify` | boolean \| (error) => boolean | Nếu là true hoặc hàm trả về true, thông báo lỗi toàn cục sẽ không hiển thị khi thất bại |
| `skipAuth` | boolean | Nếu là true, các lỗi như 401 sẽ không kích hoạt chuyển hướng xác thực (ví dụ: chuyển hướng đến trang đăng nhập) |

## URL theo định dạng tài nguyên

NocoBase Resource API hỗ trợ định dạng viết tắt `tài nguyên:hành động`:

| Định dạng | Mô tả | Ví dụ |
|------|------|------|
| `collection:action` | CRUD trên một bộ sưu tập đơn lẻ | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Tài nguyên liên kết (cần truyền khóa chính thông qua `resourceOf` hoặc URL) | `posts.comments:list` |

Đường dẫn tương đối sẽ được nối với `baseURL` của ứng dụng (thường là `/api`); đối với yêu cầu khác nguồn (cross-origin), cần sử dụng URL đầy đủ và dịch vụ đích phải được cấu hình CORS.

## Cấu trúc phản hồi

Giá trị trả về là một đối tượng phản hồi của Axios, các trường thường dùng bao gồm:

- `response.data`: Thân phản hồi (response body)
- Các giao diện danh sách thường trả về `data.data` (mảng các bản ghi) + `data.meta` (phân trang, v.v.)
- Các giao diện lấy một bản ghi/tạo mới/cập nhật thường trả về bản ghi trong `data.data`

## Ví dụ

### Truy vấn danh sách

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Thông tin phân trang, v.v.
```

### Gửi dữ liệu

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Nguyễn Văn A', email: 'nguyenvana@example.com' },
});

const newRecord = res?.data?.data;
```

### Kèm theo lọc và sắp xếp

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
  skipNotify: true,  // Không hiển thị message toàn cục khi thất bại
});

// Hoặc quyết định bỏ qua dựa trên loại lỗi
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Yêu cầu khác nguồn (Cross-Origin)

Khi sử dụng URL đầy đủ để yêu cầu các tên miền khác, dịch vụ đích phải được cấu hình CORS để cho phép nguồn gốc của ứng dụng hiện tại. Nếu giao diện đích yêu cầu token riêng, có thể truyền qua headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_của_dịch_vụ_đích>',
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
  '<h4>' + ctx.t('Danh sách người dùng') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Lưu ý

- **Xử lý lỗi**: Yêu cầu thất bại sẽ ném ra một ngoại lệ và mặc định sẽ hiển thị thông báo lỗi toàn cục. Sử dụng `skipNotify: true` để tự bắt và xử lý lỗi.
- **Xác thực**: Các yêu cầu cùng nguồn sẽ tự động mang theo Token, locale và role của người dùng hiện tại; yêu cầu khác nguồn cần dịch vụ đích hỗ trợ CORS và truyền token vào headers nếu cần.
- **Quyền hạn tài nguyên**: Các yêu cầu bị ràng buộc bởi ACL và chỉ có thể truy cập các tài nguyên mà người dùng hiện tại có quyền.

## Liên quan

- [ctx.message](./message.md) - Hiển thị thông báo nhẹ sau khi yêu cầu hoàn tất
- [ctx.notification](./notification.md) - Hiển thị thông báo sau khi yêu cầu hoàn tất
- [ctx.render](./render.md) - Hiển thị kết quả yêu cầu lên giao diện
- [ctx.makeResource](./make-resource.md) - Xây dựng đối tượng tài nguyên để tải dữ liệu theo chuỗi (lựa chọn thay thế cho `ctx.request`)