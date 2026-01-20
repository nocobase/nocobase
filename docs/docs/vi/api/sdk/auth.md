:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Auth

## Tổng quan

Lớp `Auth` chủ yếu được sử dụng ở phía client để truy cập thông tin người dùng và gửi yêu cầu đến các API liên quan đến xác thực người dùng.

## Thuộc tính đối tượng

### `locale`

Ngôn ngữ mà người dùng hiện tại đang sử dụng.

### `role`

Vai trò mà người dùng hiện tại đang sử dụng.

### `token`

`token` của API.

### `authenticator`

Bộ xác thực được sử dụng để xác thực người dùng hiện tại. Tham khảo [Xác thực người dùng](/auth-verification/auth/).

## Phương thức lớp

### `signIn()`

Đăng nhập người dùng.

#### Chữ ký

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Chi tiết

| Tên tham số     | Kiểu     | Mô tả                                          |
| --------------- | -------- | ---------------------------------------------- |
| `values`        | `any`    | Các tham số yêu cầu cho API đăng nhập         |
| `authenticator` | `string` | Mã định danh của bộ xác thực được sử dụng để đăng nhập |

### `signUp()`

Đăng ký người dùng.

#### Chữ ký

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Chi tiết

| Tên tham số     | Kiểu     | Mô tả                                          |
| --------------- | -------- | ---------------------------------------------- |
| `values`        | `any`    | Các tham số yêu cầu cho API đăng ký           |
| `authenticator` | `string` | Mã định danh của bộ xác thực được sử dụng để đăng ký   |

### `signOut()`

Đăng xuất.

#### Chữ ký

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Chi tiết

| Tên tham số     | Kiểu     | Mô tả                                          |
| --------------- | -------- | ---------------------------------------------- |
| `values`        | `any`    | Các tham số yêu cầu cho API đăng xuất         |
| `authenticator` | `string` | Mã định danh của bộ xác thực được sử dụng để đăng xuất |