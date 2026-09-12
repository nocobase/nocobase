---
title: "nb env auth"
description: "Tài liệu lệnh nb env auth: xác thực NocoBase env đã lưu bằng basic, token hoặc OAuth."
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,Đăng nhập,Xác thực"
---

# nb env auth

Xác thực lại NocoBase env đã lưu, hoặc cập nhật thông tin xác thực đã lưu cho env đó. Khi bỏ qua tên môi trường, lệnh sẽ dùng env hiện tại.

`nb env auth` hỗ trợ ba phương thức xác thực: `basic`, `token` và `oauth`. Nếu bỏ qua `--auth-type`, CLI trước tiên sẽ suy luận phương thức từ các tùy chọn xác thực bạn truyền vào. Nếu vẫn không suy luận được, CLI sẽ dùng phương thức xác thực đã lưu trong env.

## Cách dùng

```bash
nb env auth [name] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên env đã cấu hình để đăng nhập; nếu bỏ qua, dùng env hiện tại |
| `--auth-type`, `-a` | string | Phương thức xác thực: `basic`, `token` hoặc `oauth` |
| `--access-token`, `-t` | string | API key hoặc access token dùng với xác thực `token` |
| `--username` | string | Tên người dùng dùng với xác thực `basic`; sẽ được hỏi trong TTY nếu bỏ qua |
| `--password` | string | Mật khẩu dùng với xác thực `basic`; sẽ được hỏi trong TTY nếu bỏ qua |

## Tùy chọn tương thích

| Tùy chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên môi trường, tương đương `[name]`. Tùy chọn ẩn này được giữ để tương thích với các lệnh khác; thông thường chỉ cần đối số vị trí |

## Mô tả

Các phương thức xác thực hoạt động như sau:

- `basic`: đăng nhập vào NocoBase bằng tên người dùng và mật khẩu, sau đó lưu access token được trả về và tên người dùng
- `token`: lưu API key hoặc access token được truyền qua `--access-token`
- `oauth`: khởi động luồng xác thực trên trình duyệt, sau đó lưu access token sau khi xác thực hoàn tất

Trong terminal tương tác, CLI sẽ hỏi `--auth-type`, `--username`, `--password` hoặc `--access-token` khi cần. Ở chế độ không tương tác, xác thực `basic` yêu cầu cả `--username` và `--password`.

Xác thực `oauth` trước tiên sẽ thử Device Authorization Grant. Khi server OAuth hỗ trợ luồng này, lệnh sẽ in URL xác minh và mã người dùng, rồi polling cho đến khi quá trình phê duyệt trên trình duyệt hoàn tất. Cách này dùng được trên server từ xa hoặc headless vì không cần listener callback cục bộ.

Nếu server OAuth không cung cấp device authorization endpoint, lệnh sẽ quay về luồng PKCE loopback: khởi động service callback cục bộ, mở trình duyệt để cấp quyền, trao đổi token và lưu token vào file cấu hình.

Sau khi xác thực thành công, CLI tự động chạy `nb env update <name>` để đồng bộ lại trạng thái env.

## Giới hạn

- `[name]` và `--env` không được đồng thời cung cấp hai tên môi trường khác nhau
- `--access-token` không được dùng cùng `--username` hoặc `--password`
- `--auth-type oauth` không được dùng cùng `--access-token`, `--username` hoặc `--password`
- `--auth-type token` không được dùng cùng `--username` hoặc `--password`
- `--auth-type basic` không được dùng cùng `--access-token`
- `--access-token`, `--username` và `--password` không được rỗng sau khi đã cung cấp

## Ví dụ

```bash
# Xác thực env hiện tại bằng phương thức xác thực đã lưu
nb env auth

# Xác thực một env cụ thể
nb env auth prod

# Dùng đăng nhập OAuth trên trình duyệt
nb env auth prod --auth-type oauth

# Đăng nhập bằng tên người dùng và mật khẩu
nb env auth prod --auth-type basic --username admin --password secret

# Lưu API key hoặc access token
nb env auth prod --auth-type token --access-token <api-key>
```

Với device authorization, hãy mở URL mà lệnh in ra và nhập code được hiển thị trong trình duyệt.

## Lệnh liên quan

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
