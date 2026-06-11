#Nginx

Nếu bạn đã sử dụng Nginx để quản lý trang web trên máy chủ hoặc sau này bạn cần xử lý chứng chỉ, bộ đệm và kiểm soát truy cập thì `nb proxy nginx` là đường dẫn được đề xuất mặc định.

Nếu bạn chỉ muốn định cấu hình HTTPS càng sớm càng tốt và không muốn tự mình duy trì quá nhiều chi tiết proxy thì [Caddy](./caddy.md) sẽ an tâm hơn. Nhưng miễn là bạn đang sử dụng Nginx thì tài liệu này là đường dẫn mặc định.

## Khi nào thì sử dụng Nginx phù hợp hơn?

Nói chung, các tình huống sau đây ưu tiên tiếp tục sử dụng Nginx:

- Bạn đã sử dụng Nginx để quản lý nhiều site trên server.
- Sau này, bạn sẽ cần phải tự mình duy trì chứng chỉ, bộ đệm, kiểm soát truy cập hoặc nhiều quy tắc tùy chỉnh hơn
- Bạn muốn lớp đầu vào tiếp tục sử dụng phương thức vận hành và bảo trì Nginx hiện có

Nếu mục tiêu của bạn chỉ là đưa HTTPS đi qua nhanh nhất có thể và bạn không muốn tự mình duy trì quá nhiều chi tiết TLS thì [Caddy](./caddy.md) sẽ an tâm hơn.

## Trước tiên hãy làm theo ba lệnh sau.

Nếu bạn chỉ muốn chạy lớp nhập Nginx trước, thì việc nhớ ba lệnh này theo mặc định là đủ:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Nếu Nginx đã được cài đặt cục bộ, chỉ cần thay đổi mục nhập đầu tiên thành `nb proxy nginx use local`.

Trong hầu hết các trường hợp, chỉ cần thực thi `use` trước, sau đó là `generate` và cuối cùng là `reload` là đủ. Để biết các chi tiết khác và các lệnh khác, hãy xem các chương sau hoặc tài liệu tham khảo CLI.

## Bước 1: Đầu tiên chọn cách tự chạy Nginx

Nếu Nginx đã được cài đặt trên máy hiện tại, chỉ cần sử dụng `use local`.

Nếu bạn muốn sử dụng phiên bản Docker của Nginx, hãy sử dụng `use docker`.

`local` / `docker` ở đây đề cập đến chế độ chạy của **Nginx**.

Sử dụng phiên bản Docker của Nginx:

```bash
nb proxy nginx use docker
```

Sử dụng Nginx được cài đặt cục bộ:

```bash
nb proxy nginx use local
```

Nếu sau này bạn quên phương thức nào hiện được chọn, bạn có thể thực thi:

```bash
nb proxy nginx current
```

## Bước 2: Thực thi `generate`

`generate` được sử dụng để tạo cấu hình mục nhập Nginx theo env được chỉ định. Cách phổ biến nhất để viết nó là:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Nếu bạn cũng muốn chỉ định cổng vào, bạn cũng có thể viết nó cùng nhau:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Ý nghĩa của các thông số ở đây là:

- `--env`: Chỉ định env CLI nào sẽ tạo cấu hình cho
- `--host`: Chỉ định tên miền để truy cập bên ngoài
- `--port`: Chỉ định cổng vào proxy, không phải `appPort` của chính ứng dụng NocoBase

Cổng ứng dụng ngược dòng đến từ `appPort` đã lưu của env này. Nếu lệnh nhắc rằng env bị thiếu `appPort`, hãy thực thi:

```bash
nb env update test2 --app-port 56575
```

Nếu sau này bạn thay đổi các cấu hình như `app-port` và `app-public-path` sẽ ảnh hưởng đến kết quả proxy, hãy nhớ thực hiện lại `generate`.

## Bước 3: Thực thi `reload`

Sau khi tạo cấu hình, thực hiện trực tiếp:

```bash
nb proxy nginx reload
```

Trong hầu hết các trường hợp, chỉ cần sử dụng lệnh này trực tiếp. Nếu nó chưa chạy, quá trình khởi động sẽ được xử lý nội bộ trước tiên; nếu nó đang chạy, nó sẽ được tải lại theo cấu hình mới nhất.

## CLI sẽ duy trì những tập tin nào?

Lấy `test2` làm ví dụ, các lệnh liên quan đến Nginx thường duy trì các tệp và thư mục này:

| con đường | chức năng |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Thư mục đoạn chia sẻ Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Cấu hình mục nhập trang web có thể chỉnh sửa |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | Trang dự phòng SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | Trang dự phòng v2 SPA |
| `NB_CLI_ROOT/test2/storage/dist-client` | Thư mục sản phẩm xây dựng front-end hiện đang được sử dụng |
| `NB_CLI_ROOT/test2/storage/uploads` | Thư mục tải lên của ứng dụng hiện tại |

TRONG:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Sau đây là các tệp phụ trợ tác nhân được CLI duy trì
- `NB_CLI_ROOT/test2/storage/...` Sau đây là các tài nguyên tĩnh và thư mục tải lên của ứng dụng
- `app.conf` có thể thay đổi nhưng khối được quản lý NocoBase phải được giữ lại
- `index-v1.html` và `index-v2.html` sẽ tự động ghi lại địa chỉ tài nguyên theo đường dẫn con env hiện tại, phiên bản máy khách đang hoạt động và `CDN_BASE_URL`

:::lưu ý cảnh báo

Nếu bạn muốn thêm cấu hình Nginx cấp trang web, chẳng hạn như giới hạn hiện tại, tiêu đề bổ sung và kiểm soát quyền truy cập, chỉ cần thay đổi `app.conf`. Các tệp phụ trợ do CLI quản lý được cập nhật đồng bộ trong các lần xây dựng lại tiếp theo.

:::

## Cấu hình viết tay: phải làm gì nếu không có CLI

Nếu ứng dụng của bạn không được lưu trữ CLI hoặc bạn muốn tự mình duy trì cấu hình Nginx hoàn chỉnh, bạn cũng có thể viết nó bằng tay.

Tuy nhiên, đối với NocoBase, proxy ngược sản xuất thường không chỉ đơn giản là `proxy_pass`. Ngoài việc chuyển tiếp các yêu cầu API đến ứng dụng phụ trợ, một cấu hình hoàn chỉnh và có thể sử dụng được thường cần xử lý thư mục tải lên, tài nguyên tĩnh giao diện người dùng, WebSocket, tuyến `.well-known` và trang dự phòng SPA.

Lấy `test2` làm ví dụ, các tệp và thư mục chính liên quan đến Nginx thường bao gồm:

- Đoạn Nginx: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Cấu hình mục nhập có thể chỉnh sửa: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Trang dự phòng SPA (v1): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Trang dự phòng SPA (v2): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Thư mục sản phẩm xây dựng front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Thư mục tải lên: `NB_CLI_ROOT/test2/storage/uploads`

Nói cách khác, cấu hình viết tay thường cần bao gồm ít nhất các loại mục sau:

- `uploads`: Hiển thị thư mục tải lên thông qua `alias`
- `dist`: Hiển thị thư mục sản phẩm xây dựng giao diện người dùng thông qua `alias`
- `well-known`: Xử lý các đường dẫn khám phá liên quan đến OAuth/OpenID
- `api`: chuyển tiếp yêu cầu `/api/` tới ứng dụng phụ trợ
- `ws`: chuyển tiếp các yêu cầu WebSocket tới ứng dụng phụ trợ
- `spa`: Cung cấp mục nhập giao diện người dùng và dự phòng `try_files` cho `/` và `/v/`

Do đó, cấu hình Nginx hoàn chỉnh thường không chỉ là phương pháp viết proxy ngược chung sau đây:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Đối với ứng dụng được lưu trữ trên máy chủ CLI như `test2`, cấu trúc gần với triển khai thực tế hơn thường trông như thế này:

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

Có hai điểm chính ở đây:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Sau đây là các tệp phụ trợ tác nhân được CLI duy trì
- `NB_CLI_ROOT/test2/storage/...` Sau đây là sử dụng thư mục sản phẩm và thư mục tải lên của riêng bạn

Nếu ứng dụng của bạn sử dụng triển khai đường dẫn phụ hoặc tài nguyên giao diện người dùng, thư mục tải lên và proxy ngược không nằm trong cùng một phối cảnh đường dẫn thì cấu hình viết tay sẽ dễ xảy ra lỗi hơn. Trong trường hợp này, thường nên thực hiện hơn:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Sau đó thực hiện điều chỉnh dựa trên kết quả được tạo ra.

Một cách tiếp cận thận trọng hơn thường là:

1. Trước tiên hãy để CLI tạo cấu hình Nginx
2. Xác nhận cấu trúc định tuyến và đường dẫn thực tế dựa trên kết quả được tạo.
3. Sau đó thực hiện điều chỉnh thủ công theo tên miền, chế độ chạy và đường dẫn cài đặt của bạn.

Điều này thường ít có khả năng bỏ lỡ các chi tiết liên quan đến WebSockets, tài nguyên tĩnh, thư mục tải lên hoặc trang dự phòng SPA so với việc viết cấu hình từ đầu.

## Cách xử lý HTTPS

Nếu bạn quyết định tiếp tục sử dụng Nginx, HTTPS cũng có thể tiếp tục được định cấu hình trong Nginx. Một phương pháp phổ biến là mở rộng `listen 80` thành `80/443` mục nhập kép, sau đó thêm đường dẫn chứng chỉ và cấu hình TLS.

Tuy nhiên, nếu bạn chỉ muốn nhận được HTTPS có sẵn càng sớm càng tốt và không muốn tự mình xử lý đơn đăng ký chứng chỉ và gia hạn, thì bạn sẽ yên tâm hơn khi sử dụng trực tiếp [Caddy](./caddy.md).

## Hướng dẫn chung

- `nb proxy nginx generate` dành cho các ứng dụng được cài đặt bởi `nb init`
- Nếu sau đó bạn thay đổi cấu hình như `app-port` và `app-public-path` sẽ ảnh hưởng đến kết quả proxy, hãy nhớ thực hiện lại `generate`

## Các liên kết liên quan

- [Proxy ngược môi trường sản xuất](./index.md)
- [Caddy](./caddy.md)
- [Cài đặt bằng CLI (được khuyến nghị)](../../installation/cli.md)
- [Cấu hình ứng dụng với `.env`](../../installation/env.md)
- [`nb proxy nginx` Tham chiếu lệnh](../../../api/cli/proxy/nginx/index.md)
