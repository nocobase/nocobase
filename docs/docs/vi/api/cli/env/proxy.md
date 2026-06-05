---
title: 'nb env proxy'
description: 'Tài liệu tham khảo lệnh nb env proxy: tạo cấu hình proxy Nginx hoặc Caddy cho một env do CLI quản lý.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,cấu hình proxy'
---

# nb env proxy

Trong NocoBase CLI, `nb env proxy` dùng để tạo cấu hình reverse proxy cho một env do CLI quản lý. Mặc định, `nginx` là lựa chọn phù hợp trong hầu hết trường hợp. Chỉ chuyển sang `caddy` nếu bạn đã dùng Caddy hoặc thực sự cần Caddyfile.

Lệnh này chỉ áp dụng cho các env được quản lý mà runtime của chúng có thể truy cập từ máy hiện tại, tức là `local` hoặc `docker`. Hiện tại, lệnh chưa hỗ trợ env chỉ có kết nối API từ xa hoặc env SSH.

## Cách dùng

```bash
nb env proxy [name] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên env đã cấu hình cần tạo cấu hình proxy. Nếu bỏ qua thì dùng env hiện tại |
| `--output`, `-o` | string | Đường dẫn file đầu ra. Mặc định là `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Provider proxy: `nginx` hoặc `caddy` |
| `--host` | string | Host được ghi vào cấu hình entry, ví dụ `example.com` hoặc `localhost` |
| `--port` | string | Cổng được ghi vào cấu hình entry. Đây là cổng đầu vào của proxy, không phải cổng của ứng dụng NocoBase upstream |
| `--install` | boolean | Cài cấu hình proxy dùng chung vào cấu hình chính của provider |
| `--reload` | boolean | Kiểm tra và nạp lại provider sau khi ghi cấu hình |
| `--print` | boolean | In cấu hình đã tạo ra stdout thay vì ghi file |

## Các file đầu ra mặc định

Nếu bạn không truyền `--output`, CLI sẽ duy trì ba loại file dưới `~/.nocobase/proxy/<provider>/`:

| Provider | File generated | File entry có thể chỉnh sửa | Cấu hình chính dùng chung |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

Cụ thể:

- `generated.*` do CLI quản lý và sẽ bị ghi đè ở lần chạy `nb env proxy` tiếp theo
- `app.conf` / `app.caddy` là file entry có thể chỉnh sửa, nhưng bạn nên giữ lại tham chiếu đến cấu hình generated do CLI quản lý
- `nocobase.conf` / `nocobase.caddy` là cấu hình chính dùng chung, dùng để include file entry của tất cả env

Nếu bạn truyền `--output`, CLI chỉ ghi cấu hình generated vào file đó và sẽ không tạo hoặc cập nhật file entry hay cấu hình chính dùng chung.

## Các mục cấu hình liên quan

| Mục cấu hình | Giá trị mặc định | Mô tả |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Provider mặc định được `nb env proxy` sử dụng |
| `proxy.nb-cli-root` | Root của CLI, thường là thư mục home của người dùng hiện tại | Ánh xạ đường dẫn `.nocobase` sang root path mà tiến trình proxy thực sự nhìn thấy |
| `proxy.upstream-host` | `127.0.0.1` | Host mà proxy dùng khi chuyển tiếp lưu lượng trở lại ứng dụng NocoBase |
| `bin.caddy` | `caddy` | Đường dẫn executable Caddy dùng cho `--install` hoặc `--reload` |
| `bin.nginx` | `nginx` | Đường dẫn executable Nginx dùng cho `--install` hoặc `--reload` |

Trong phần lớn môi trường, bạn không cần đổi `proxy.nb-cli-root`. Thường chỉ cần đổi khi Nginx hoặc Caddy chạy trong một container khác, một root mount khác hoặc một góc nhìn path khác.

## Ghi chú

- `--port` phải là số nguyên trong khoảng từ `1` đến `65535`
- Cổng của ứng dụng NocoBase upstream lấy từ `appPort` đã lưu trong env, không lấy từ `--port`
- Nếu lệnh báo env thiếu `appPort`, hãy chạy `nb env update <name>` trước hoặc lưu rõ ràng bằng `nb env update <name> --app-port <port>`
- `--print` không thể dùng cùng `--install` hoặc `--reload`
- `--output` không thể dùng cùng `--install` hoặc `--reload`
- `--install` nối cấu hình dùng chung vào cấu hình chính của provider. `--reload` kiểm tra và nạp lại provider. Trong thực tế, hai cờ này thường được dùng cùng nhau

## Ví dụ

```bash
# Tạo cấu hình nginx mặc định cho env hiện tại
nb env proxy

# Tạo cấu hình cho một env cụ thể
nb env proxy demo

# In cấu hình generated mà không ghi file
nb env proxy demo --print

# Ghi host và cổng vào cấu hình entry
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Tạo cấu hình Caddy
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Đổi provider mặc định và upstream host
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Ánh xạ đường dẫn .nocobase khi provider chạy dưới một root path khác
nb config set proxy.nb-cli-root /workspace

# Cài cấu hình dùng chung vào cấu hình chính của provider rồi nạp lại provider
nb env proxy demo --install --reload
```

## Lệnh liên quan

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
