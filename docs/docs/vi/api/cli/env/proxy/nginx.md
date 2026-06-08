---
title: 'nb env proxy nginx'
description: 'Tài liệu tham chiếu cho lệnh nb env proxy nginx: sinh cấu hình proxy Nginx và các tệp phụ trợ cho một env do CLI quản lý.'
keywords: 'nb env proxy nginx,NocoBase CLI,nginx,reverse proxy,cấu hình proxy'
---

# nb env proxy nginx

`nb env proxy nginx` sinh cấu hình proxy Nginx và các tệp phụ trợ cho một env do CLI quản lý. Lệnh này phù hợp nếu bạn đã dùng Nginx để quản lý site, hoặc vẫn muốn tự quản lý chứng chỉ, cache và kiểm soát truy cập.

Lệnh này chỉ hoạt động với env được quản lý mà runtime của chúng có thể truy cập từ máy hiện tại, tức là `local` hoặc `docker`. Hiện tại nó chưa hoạt động với env chỉ có kết nối API từ xa hoặc env SSH.

## Cách dùng

```bash
nb env proxy nginx [name] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên env đã cấu hình mà bạn muốn sinh cấu hình proxy cho nó. Nếu bỏ qua thì dùng env hiện tại |
| `--env`, `-e` | string | Chỉ định rõ tên env. Cách này thường được khuyến nghị hơn |
| `--host` | string | Host được ghi vào cấu hình đầu vào, ví dụ `example.com` hoặc `localhost` |
| `--port` | string | Port được ghi vào cấu hình đầu vào. Đây là port đầu vào của proxy, không phải port của ứng dụng NocoBase upstream |
| `--install` | boolean | Cài cấu hình proxy dùng chung vào cấu hình chính của Nginx |
| `--reload` | boolean | Kiểm tra và nạp lại Nginx sau khi ghi tệp |
| `--print` | boolean | In trực tiếp `app.conf` đã render ra thay vì ghi tệp |

## Đầu ra mặc định

`nb env proxy nginx` duy trì các tệp sau dưới `~/.nocobase/proxy/nginx/`:

| Tệp | Mục đích |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | Tệp đầu vào của site có thể chỉnh sửa. CLI sẽ làm mới khối được quản lý bên trong, và bạn có thể thêm cấu hình cấp site xung quanh khối đó |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | Trang fallback cho SPA v1 được tạo từ `index.html` của client đang hoạt động |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | Trang fallback cho SPA v2 được tạo từ `v/index.html` của client đang hoạt động |
| `~/.nocobase/proxy/nginx/nocobase.conf` | Cấu hình chính dùng chung, bao gồm tất cả các `app.conf` của các env |
| `~/.nocobase/proxy/nginx/snippets/` | Thư mục snippets dùng chung được sao chép từ các template tích hợp sẵn |

Cụ thể:

- `app.conf` có thể chỉnh sửa, nhưng bạn nên giữ nguyên khối được quản lý nằm giữa `# BEGIN NocoBase managed config` và `# END NocoBase managed config`
- `index-v1.html` và `index-v2.html` sẽ tự động viết lại URL của asset theo subpath env hiện tại, phiên bản client đang hoạt động và `CDN_BASE_URL`
- `nocobase.conf` chủ yếu được dùng bởi `--install`
- Các tệp trong `public/` và `snippets/` thường không dành cho chỉnh sửa thủ công và sẽ được đồng bộ lại ở lần chạy lệnh tiếp theo

:::warning Lưu ý

Nếu bạn cần thêm cấu hình Nginx cấp site, hãy chỉnh sửa `app.conf`. Đừng chỉnh thủ công các tệp được quản lý trong `public/` hoặc `snippets/`, vì chúng sẽ bị ghi đè vào lần tiếp theo bạn chạy `nb env proxy nginx`.

:::

## Các mục cấu hình liên quan

Các mục cấu hình CLI sau ảnh hưởng trực tiếp đến đầu ra Nginx được sinh ra:

| Mục cấu hình | Giá trị mặc định | Mô tả |
| --- | --- | --- |
| `proxy.nb-cli-root` | Thư mục gốc của CLI, thường là thư mục home của người dùng hiện tại | Ánh xạ đường dẫn `.nocobase` sang đường dẫn gốc mà Nginx thực sự nhìn thấy |
| `proxy.upstream-host` | `127.0.0.1` | Host mà proxy dùng để chuyển tiếp lưu lượng trở lại ứng dụng NocoBase |
| `bin.nginx` | `nginx` | Đường dẫn tới tệp thực thi Nginx dùng bởi `--install` hoặc `--reload` |

Hầu hết các thiết lập không cần thay đổi `proxy.nb-cli-root`. Thông thường bạn chỉ cần nó khi Nginx chạy trong một container khác, dưới một mount root khác hoặc với một góc nhìn đường dẫn khác.

## Ghi chú

- `--port` phải là số nguyên trong khoảng từ `1` đến `65535`
- Port upstream của ứng dụng NocoBase được lấy từ `appPort` đã lưu trong env, không phải từ `--port`
- Nếu lệnh báo env đang thiếu `appPort`, hãy chạy `nb env update <name>` trước, hoặc lưu rõ ràng bằng `nb env update <name> --app-port <port>`
- Nếu bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` bằng `nb env update`, thông thường bạn sẽ cần chạy lại `nb env proxy nginx`
- `--print` không thể dùng cùng `--install` hoặc `--reload`
- Provider Nginx không hỗ trợ `--output`

## Ví dụ

```bash
# Sinh cấu hình Nginx cho env hiện tại
nb env proxy nginx

# Sinh cấu hình cho một env cụ thể
nb env proxy nginx --env demo

# Ghi host và port public vào cấu hình đầu vào
nb env proxy nginx --env demo --host demo.local.nocobase.com --port 8080

# In app.conf đã render mà không ghi tệp
nb env proxy nginx --env demo --print

# Ánh xạ đường dẫn .nocobase khi Nginx chạy dưới một mount root khác
nb config set proxy.nb-cli-root /workspace

# Cài cấu hình dùng chung vào cấu hình chính của Nginx rồi nạp lại ngay
nb env proxy nginx --env demo --install --reload
```

## Các lệnh liên quan

- [`nb env proxy`](./index.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
