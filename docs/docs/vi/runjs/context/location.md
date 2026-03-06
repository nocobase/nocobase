:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/location).
:::

# ctx.location

Thông tin vị trí định tuyến hiện tại, tương đương với đối tượng `location` của React Router. Thường được sử dụng kết hợp với `ctx.router` và `ctx.route` để đọc đường dẫn hiện tại, chuỗi truy vấn (query string), hash và state được truyền qua định tuyến.

## Các trường hợp sử dụng

| Ngữ cảnh | Mô tả |
|------|------|
| **JSBlock / JSField** | Thực hiện kết xuất có điều kiện hoặc phân nhánh logic dựa trên đường dẫn hiện tại, tham số truy vấn hoặc hash. |
| **Quy tắc liên kết / Sự kiện luồng** | Đọc tham số truy vấn URL để lọc liên kết, hoặc dựa vào `location.state` để xác định nguồn gốc. |
| **Xử lý sau khi chuyển hướng** | Nhận dữ liệu được truyền từ trang trước thông qua `ctx.router.navigate` bằng cách sử dụng `ctx.location.state` tại trang đích. |

> Lưu ý: `ctx.location` chỉ khả dụng trong môi trường RunJS có ngữ cảnh định tuyến (như JSBlock trong trang, sự kiện luồng, v.v.); nó có thể để trống trong các ngữ cảnh thuần backend hoặc không có định tuyến (như luồng công việc).

## Định nghĩa kiểu

```ts
location: Location;
```

`Location` đến từ `react-router-dom`, nhất quán với giá trị trả về của `useLocation()` trong React Router.

## Các trường phổ biến

| Trường | Kiểu | Mô tả |
|------|------|------|
| `pathname` | `string` | Đường dẫn hiện tại, bắt đầu bằng `/` (ví dụ: `/admin/users`) |
| `search` | `string` | Chuỗi truy vấn, bắt đầu bằng `?` (ví dụ: `?page=1&status=active`) |
| `hash` | `string` | Phân đoạn hash, bắt đầu bằng `#` (ví dụ: `#section-1`) |
| `state` | `any` | Dữ liệu bất kỳ được truyền qua `ctx.router.navigate(path, { state })`, không hiển thị trên URL |
| `key` | `string` | Mã định danh duy nhất cho vị trí này; trang khởi tạo là `"default"` |

## Mối quan hệ với ctx.router và ctx.urlSearchParams

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Đọc đường dẫn, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Đọc tham số truy vấn (dạng đối tượng)** | `ctx.urlSearchParams`, có thể nhận trực tiếp đối tượng đã được phân giải |
| **Phân giải chuỗi search** | `new URLSearchParams(ctx.location.search)` hoặc dùng trực tiếp `ctx.urlSearchParams` |

`ctx.urlSearchParams` được phân giải từ `ctx.location.search`. Nếu bạn chỉ cần tham số truy vấn, sử dụng `ctx.urlSearchParams` sẽ tiện lợi hơn.

## Ví dụ

### Phân nhánh dựa trên đường dẫn

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Hiện đang ở trang quản lý người dùng');
}
```

### Phân giải tham số truy vấn

```ts
// Cách 1: Sử dụng ctx.urlSearchParams (Khuyên dùng)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Cách 2: Sử dụng URLSearchParams để phân giải search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Nhận state truyền từ chuyển hướng định tuyến

```ts
// Khi chuyển hướng từ trang trước: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Được chuyển hướng từ bảng điều khiển');
}
```

### Xác định điểm neo qua hash

```ts
const hash = ctx.location.hash; // Ví dụ: "#edit"
if (hash === '#edit') {
  // Cuộn đến khu vực chỉnh sửa hoặc thực hiện logic tương ứng
}
```

## Liên quan

- [ctx.router](./router.md): Điều hướng định tuyến; `state` từ `ctx.router.navigate` có thể được lấy qua `ctx.location.state` tại trang đích.
- [ctx.route](./route.md): Thông tin khớp định tuyến hiện tại (tham số, cấu hình, v.v.), thường được sử dụng kết hợp với `ctx.location`.