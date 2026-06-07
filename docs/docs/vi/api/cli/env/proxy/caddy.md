---
title: 'nb env proxy caddy'
description: 'Tài liệu tham chiếu cho lệnh nb env proxy caddy: sinh cấu hình proxy Caddy cho một env do CLI quản lý.'
keywords: 'nb env proxy caddy,NocoBase CLI,caddy,reverse proxy,cấu hình proxy'
---

# nb env proxy caddy

`nb env proxy caddy` sinh cấu hình proxy Caddy cho một env do CLI quản lý. Lệnh này phù hợp nếu bạn đã có domain, muốn bật HTTPS nhanh và không muốn tự duy trì quá nhiều chi tiết TLS.

Lệnh này chỉ hoạt động với env được quản lý mà runtime của chúng có thể truy cập từ máy hiện tại, tức là `local` hoặc `docker`. Hiện tại nó chưa hoạt động với env chỉ có kết nối API từ xa hoặc env SSH.

## Cách dùng

```bash
nb env proxy caddy [name] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên env đã cấu hình mà bạn muốn sinh cấu hình proxy cho nó. Nếu bỏ qua thì dùng env hiện tại |
| `--env`, `-e` | string | Chỉ định rõ tên env. Cách này thường được khuyến nghị hơn |
| `--output`, `-o` | string | Đường dẫn tệp đầu ra. Chỉ ghi cấu hình route được sinh ra và không tạo thêm `app.caddy` hay cấu hình chính dùng chung |
| `--host` | string | Host được ghi vào cấu hình đầu vào, ví dụ `example.com` hoặc `localhost` |
| `--port` | string | Port được ghi vào cấu hình đầu vào. Đây là port đầu vào của proxy, không phải port của ứng dụng NocoBase upstream |
| `--install` | boolean | Cài cấu hình proxy dùng chung vào cấu hình chính của Caddy |
| `--reload` | boolean | Kiểm tra và nạp lại Caddy sau khi ghi tệp |
| `--print` | boolean | In trực tiếp cấu hình route đã sinh ra thay vì ghi tệp |

## Đầu ra mặc định

Nếu bạn không truyền `--output`, CLI sẽ duy trì các tệp sau dưới `~/.nocobase/proxy/caddy/`:

| Tệp | Mục đích |
| --- | --- |
| `~/.nocobase/proxy/caddy/<env>/generated.caddy` | Cấu hình reverse proxy thực tế do CLI quản lý và sẽ bị ghi đè ở mỗi lần chạy |
| `~/.nocobase/proxy/caddy/<env>/app.caddy` | Tệp đầu vào của site có thể chỉnh sửa, nơi bạn có thể thêm cấu hình cấp site |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | Cấu hình chính dùng chung, import tất cả các `app.caddy` của các env |

Cụ thể:

- `generated.caddy` chỉ nên được CLI quản lý và không nên chỉnh sửa thủ công
- `app.caddy` có thể chỉnh sửa, nhưng bạn nên giữ nguyên câu lệnh import được CLI chèn vào
- `nocobase.caddy` chủ yếu được dùng bởi `--install`

:::warning Lưu ý

Nếu bạn cần thêm cấu hình Caddy cấp site, hãy chỉnh sửa `app.caddy`. `generated.caddy` sẽ bị ghi đè ở lần tiếp theo bạn chạy `nb env proxy caddy`.

:::

Nếu bạn truyền `--output`, CLI chỉ ghi cấu hình đã sinh ra vào tệp đó và không tạo hay cập nhật `app.caddy` hoặc cấu hình chính dùng chung.

## Các mục cấu hình liên quan

Các mục cấu hình CLI sau ảnh hưởng trực tiếp đến đầu ra Caddy được sinh ra:

| Mục cấu hình | Giá trị mặc định | Mô tả |
| --- | --- | --- |
| `proxy.nb-cli-root` | Thư mục gốc của CLI, thường là thư mục home của người dùng hiện tại | Ánh xạ đường dẫn `.nocobase` sang đường dẫn gốc mà Caddy thực sự nhìn thấy |
| `proxy.upstream-host` | `127.0.0.1` | Host mà proxy dùng để chuyển tiếp lưu lượng trở lại ứng dụng NocoBase |
| `bin.caddy` | `caddy` | Đường dẫn tới tệp thực thi Caddy dùng bởi `--install` hoặc `--reload` |

Hầu hết các thiết lập không cần thay đổi `proxy.nb-cli-root`. Thông thường bạn chỉ cần nó khi Caddy chạy trong một container khác, dưới một mount root khác hoặc với một góc nhìn đường dẫn khác.

## Ghi chú

- `--host` rất quan trọng. Caddy quyết định có tự quản lý HTTPS hay không dựa trên địa chỉ site. Trong môi trường production, hãy cố gắng truyền vào một domain đã trỏ tới máy chủ hiện tại
- `--port` phải là số nguyên trong khoảng từ `1` đến `65535`
- Port upstream của ứng dụng NocoBase được lấy từ `appPort` đã lưu trong env, không phải từ `--port`
- Nếu lệnh báo env đang thiếu `appPort`, hãy chạy `nb env update <name>` trước, hoặc lưu rõ ràng bằng `nb env update <name> --app-port <port>`
- Nếu bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` bằng `nb env update`, thông thường bạn sẽ cần chạy lại `nb env proxy caddy`
- `--print` không thể dùng cùng `--install` hoặc `--reload`
- `--output` không thể dùng cùng `--install` hoặc `--reload`

## Ví dụ

```bash
# Sinh cấu hình Caddy cho env hiện tại
nb env proxy caddy

# Sinh cấu hình cho một env cụ thể
nb env proxy caddy --env demo

# Ghi host và port public vào cấu hình đầu vào
nb env proxy caddy --env demo --host demo.local.nocobase.com --port 8080

# In cấu hình route đã sinh mà không ghi tệp
nb env proxy caddy --env demo --print

# Ghi fragment route đã sinh vào một tệp tùy chỉnh
nb env proxy caddy --env demo --output ./generated.caddy

# Ánh xạ đường dẫn .nocobase khi Caddy chạy dưới một mount root khác
nb config set proxy.nb-cli-root /workspace

# Cài cấu hình dùng chung vào cấu hình chính của Caddy rồi nạp lại ngay
nb env proxy caddy --env demo --install --reload
```

## Các lệnh liên quan

- [`nb env proxy`](./index.md)
- [`nb env proxy nginx`](./nginx.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
