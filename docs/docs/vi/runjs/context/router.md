:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/router).
:::

# ctx.router

Một instance router dựa trên React Router, được sử dụng để điều hướng thông qua mã nguồn trong RunJS. Thường được sử dụng kết hợp với `ctx.route` và `ctx.location`.

## Các trường hợp sử dụng

| Ngữ cảnh | Mô tả |
|------|------|
| **JSBlock / JSField** | Chuyển hướng đến trang chi tiết, trang danh sách hoặc liên kết ngoài sau khi nhấp vào nút. |
| **Quy tắc liên kết / Luồng sự kiện** | Thực hiện `navigate` đến danh sách hoặc chi tiết sau khi gửi thành công, hoặc truyền `state` đến trang đích. |
| **JSAction / Xử lý sự kiện** | Thực hiện điều hướng route trong các logic như gửi biểu mẫu hoặc nhấp vào liên kết. |
| **Điều hướng View** | Cập nhật URL thông qua `navigate` khi chuyển đổi ngăn xếp chế độ xem (view stack) nội bộ. |

> Lưu ý: `ctx.router` chỉ khả dụng trong môi trường RunJS có ngữ cảnh định tuyến (ví dụ: JSBlock trong trang, trang Flow, luồng sự kiện, v.v.); nó có thể bị null trong các ngữ cảnh thuần backend hoặc không có định tuyến (ví dụ: luồng công việc).

## Định nghĩa kiểu

```typescript
router: Router
```

`Router` được kế thừa từ `@remix-run/router`. Trong RunJS, các thao tác điều hướng như chuyển hướng, quay lại và làm mới được thực hiện thông qua `ctx.router.navigate()`.

## Phương thức

### ctx.router.navigate()

Chuyển hướng đến đường dẫn đích, hoặc thực hiện quay lại/làm mới.

**Cấu trúc:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Tham số:**

- `to`: Đường dẫn đích (string), vị trí lịch sử tương đối (number, ví dụ `-1` để quay lại) hoặc `null` (để làm mới trang hiện tại).
- `options`: Cấu hình tùy chọn.
  - `replace?: boolean`: Có thay thế bản ghi lịch sử hiện tại hay không (mặc định là `false`, tức là push một bản ghi mới).
  - `state?: any`: Dữ liệu truyền đến route đích. Dữ liệu này không xuất hiện trong URL và có thể truy cập qua `ctx.location.state` ở trang đích. Thích hợp cho thông tin nhạy cảm, dữ liệu tạm thời hoặc thông tin không nên đặt trong URL.

## Ví dụ

### Điều hướng cơ bản

```ts
// Chuyển hướng đến danh sách người dùng (push lịch sử mới, có thể quay lại)
ctx.router.navigate('/admin/users');

// Chuyển hướng đến trang chi tiết
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Thay thế lịch sử (không thêm bản ghi mới)

```ts
// Chuyển hướng đến trang chủ sau khi đăng nhập; người dùng quay lại sẽ không về trang đăng nhập
ctx.router.navigate('/admin', { replace: true });

// Thay thế trang hiện tại bằng trang chi tiết sau khi gửi biểu mẫu thành công
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Truyền state

```ts
// Mang theo dữ liệu khi điều hướng; trang đích lấy dữ liệu qua ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Quay lại và làm mới

```ts
// Quay lại một trang
ctx.router.navigate(-1);

// Quay lại hai trang
ctx.router.navigate(-2);

// Làm mới trang hiện tại
ctx.router.navigate(null);
```

## Quan hệ với ctx.route và ctx.location

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Điều hướng/Chuyển hướng** | `ctx.router.navigate(path)` |
| **Đọc đường dẫn hiện tại** | `ctx.route.pathname` hoặc `ctx.location.pathname` |
| **Đọc state được truyền khi điều hướng** | `ctx.location.state` |
| **Đọc tham số route** | `ctx.route.params` |

`ctx.router` chịu trách nhiệm cho "hành động điều hướng", trong khi `ctx.route` và `ctx.location` chịu trách nhiệm về "trạng thái route hiện tại".

## Lưu ý

- `navigate(path)` mặc định sẽ push bản ghi lịch sử mới, người dùng có thể quay lại qua nút quay lại của trình duyệt.
- `replace: true` sẽ thay thế bản ghi lịch sử hiện tại mà không thêm mới, phù hợp cho các kịch bản như chuyển hướng sau đăng nhập hoặc điều hướng sau khi gửi thành công.
- **Về tham số `state`**:
  - Dữ liệu truyền qua `state` không xuất hiện trong URL, phù hợp cho dữ liệu nhạy cảm hoặc tạm thời.
  - Có thể truy cập qua `ctx.location.state` tại trang đích.
  - `state` được lưu trong lịch sử trình duyệt và vẫn có thể truy cập khi tiến hoặc lùi.
  - `state` sẽ bị mất sau khi làm mới trang (refresh).

## Liên quan

- [ctx.route](./route.md): Thông tin khớp route hiện tại (pathname, params, v.v.).
- [ctx.location](./location.md): Vị trí URL hiện tại (pathname, search, hash, state); `state` được đọc tại đây sau khi điều hướng.