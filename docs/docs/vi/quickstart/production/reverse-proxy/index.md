---
title: 'Reverse Proxy cho Production'
description: 'Dùng nb env proxy nginx và nb env proxy caddy để sinh cấu hình reverse proxy cho các env NocoBase do CLI quản lý.'
keywords: 'NocoBase,nb env proxy nginx,nb env proxy caddy,reverse proxy,Nginx,Caddy,production'
---

# Reverse Proxy cho Production

Trong NocoBase CLI, có hai điểm bắt đầu được khuyến nghị để đặt reverse proxy phía trước một ứng dụng production:

- `nb env proxy nginx`
- `nb env proxy caddy`

Miễn là ứng dụng của bạn đã được lưu thành CLI env và loại env là `local` hoặc `docker`, thông thường chỉ cần để CLI sinh cấu hình là đủ. Cách này giúp CLI đồng bộ các chi tiết dễ rối như xử lý WebSocket, subpath, trang fallback cho SPA và các lần cập nhật về sau. Bạn chỉ cần quyết định lớp entry nên tiếp tục dùng Nginx hay chuyển sang Caddy.

Nếu ứng dụng của bạn không được CLI quản lý, hoặc nếu bạn thật sự muốn tự viết toàn bộ cấu hình proxy, hãy đi thẳng tới phần cấu hình viết tay trong các trang provider.

## Kiểm tra xem hướng đi này có phù hợp với thiết lập của bạn không

- Ứng dụng của bạn đã có thể truy cập qua một địa chỉ nội bộ như `http://127.0.0.1:13000`
- Ứng dụng đã được lưu thành CLI env và loại env là `local` hoặc `docker`
- Env đó đã lưu `appPort`

Nếu lệnh báo thiếu `appPort`, hãy chạy [`nb env update`](../../../api/cli/env/update.md) trước rồi lưu giá trị này.

Nếu sau đó bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` có ảnh hưởng đến đầu ra proxy, hãy nhớ chạy lại lệnh con proxy tương ứng.

## Đường đi mặc định: trước tiên để CLI sinh cấu hình

Nếu bạn đã biết muốn tiếp tục dùng provider entry nào, hãy đi thẳng tới lệnh con tương ứng:

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy caddy --env demo --host demo.example.com
```

Nếu bạn đã chuyển sang env hiện tại, bạn cũng có thể bỏ `--env`:

```bash
nb env proxy nginx --host demo.example.com
```

Cụ thể:

- Nếu bạn đã dùng Nginx để quản lý site, cache, kiểm soát truy cập hoặc chứng chỉ, hãy bắt đầu với [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- Nếu bạn muốn bật HTTPS nhanh và không muốn tự duy trì quá nhiều chi tiết TLS, hãy bắt đầu với [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- `--port` là port đầu vào của proxy, không phải `appPort` của ứng dụng

Nếu bạn muốn CLI đồng thời nối cấu hình dùng chung vào cấu hình chính của provider và nạp lại sau khi kiểm tra, hãy thêm:

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

Tài liệu tham chiếu đầy đủ nằm ở [`nb env proxy`](../../../api/cli/env/proxy/index.md).

## CLI sẽ đồng bộ giúp bạn những gì

CLI không chỉ sinh ra một đoạn proxy duy nhất. Nó còn duy trì các tệp phụ trợ theo từng provider. Hình dạng đầu ra khác nhau giữa hai provider:

- Nginx duy trì `app.conf`, `public/index-v1.html`, `public/index-v2.html`, tệp dùng chung `nocobase.conf` và thư mục dùng chung `snippets/`
- Caddy duy trì `generated.caddy`, `app.caddy` và tệp dùng chung `nocobase.caddy`

:::warning Lưu ý

Nếu bạn cần thêm cấu hình cấp site, hãy chỉnh sửa `app.conf` hoặc `app.caddy`. Đừng chỉnh thủ công các tệp phụ trợ do CLI quản lý, vì chúng sẽ bị ghi đè ở lần chạy lệnh tiếp theo.

:::

## Nên mở trang nào trước

| Tôi muốn... | Xem tại đây |
| --- | --- |
| Tiếp tục dùng Nginx cho site, chứng chỉ, cache hoặc kiểm soát truy cập | [Nginx](./nginx.md) |
| Bật HTTPS nhanh hơn và phải tự quản lý ít chi tiết chứng chỉ, TLS hơn | [Caddy](./caddy.md) |
| Xem cây lệnh trước rồi mới chọn provider | [`nb env proxy`](../../../api/cli/env/proxy/index.md) |
| Xem trước các tùy chọn, tệp đầu ra và ví dụ của lệnh con Nginx | [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md) |
| Xem trước các tùy chọn, tệp đầu ra và ví dụ của lệnh con Caddy | [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md) |
| Điều chỉnh các thiết lập env có thể ảnh hưởng đến đầu ra proxy, như `app-port` hoặc `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Cài ứng dụng thành CLI env được quản lý trước | [Cài bằng CLI (khuyến nghị)](../../installation/cli.md) |

## Khi nào đường đi do CLI sinh ra không phải lựa chọn phù hợp nhất

Các trường hợp sau thường phù hợp hơn với phần cấu hình viết tay trong các trang provider:

- Ứng dụng của bạn không được CLI quản lý
- Env chỉ có kết nối API từ xa, hoặc là env SSH
- Bạn muốn tự duy trì toàn bộ cấu hình Nginx hoặc toàn bộ `Caddyfile`

Tuy vậy, miễn là ứng dụng đã được lưu thành CLI env và máy hiện tại có thể truy cập runtime của nó, khuyến nghị mặc định vẫn là bắt đầu từ các lệnh này. Cách đó giúp việc đổi domain, chỉnh cấu hình cấp site và sinh lại cấu hình về sau dễ quản lý hơn nhiều.

## Liên kết liên quan

- [`nb env proxy`](../../../api/cli/env/proxy/index.md)
- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [Biến môi trường của ứng dụng](../../installation/env.md)
- [Cài bằng CLI (khuyến nghị)](../../installation/cli.md)
