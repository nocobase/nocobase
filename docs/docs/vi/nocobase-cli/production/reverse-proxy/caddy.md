#Caddy

Nếu bạn đã có tên miền và muốn định cấu hình HTTPS càng sớm càng tốt thì `nb proxy caddy` thường là phương thức nhập an toàn nhất.

Thay vì tự mình duy trì cấu hình chứng chỉ của Nginx, Caddy giống lối tắt mặc định hơn để "chạy qua lớp mục nhập trước".

##Sử dụng Caddy khi nào thì hợp lý hơn?

Nói chung, Caddy được ưu tiên trong các trường hợp sau:

- Bạn đã có tên miền và muốn truy cập HTTPS càng sớm càng tốt
- Bạn không muốn tự mình lưu giữ quá nhiều chi tiết về chứng chỉ và TLS
- Tất cả những gì bạn cần là một lớp lối vào đơn giản và ổn định

Nếu bạn đã sử dụng Nginx để quản lý nhiều trang web trên máy chủ hoặc sau này bạn cần thực hiện nhiều quy tắc tùy chỉnh, kiểm soát truy cập và bộ đệm nặng hơn thì việc tiếp tục xem xét [Nginx](./nginx.md) sẽ mượt mà hơn.

## Trước tiên hãy làm theo ba lệnh sau.

Nếu bạn chỉ muốn chạy lớp mục nhập Caddy trước tiên, việc nhớ ba lệnh này theo mặc định là đủ:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

Nếu Caddy đã được cài đặt cục bộ, chỉ cần thay đổi mục nhập đầu tiên thành `nb proxy caddy use local`.

Trong hầu hết các trường hợp, chỉ cần thực thi `use` trước, sau đó là `generate` và cuối cùng là `reload` là đủ. Để biết các chi tiết khác và các lệnh khác, hãy xem các chương sau hoặc tài liệu tham khảo CLI.

## Bước 1: Chọn cách tự chạy Caddy

Nếu Caddy đã được cài đặt trên máy hiện tại, chỉ cần sử dụng `use local`.

Nếu bạn muốn sử dụng phiên bản Docker của Caddy, hãy sử dụng `use docker`.

`local` / `docker` ở đây đề cập đến cách **Caddy tự vận hành**.

Sử dụng phiên bản Docker của Caddy:

```bash
nb proxy caddy use docker
```

Sử dụng cài đặt cục bộ của Caddy:

```bash
nb proxy caddy use local
```

Nếu sau này bạn quên phương thức nào hiện được chọn, bạn có thể thực thi:

```bash
nb proxy caddy current
```

## Bước 2: Thực thi `generate`

`generate` được sử dụng để tạo cấu hình Caddy theo env được chỉ định. Cách phổ biến nhất để viết nó là:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Nếu bạn cũng muốn chỉ định cổng vào, bạn cũng có thể viết nó cùng nhau:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Ý nghĩa của các thông số ở đây là:

- `--env`: Chỉ định env CLI nào sẽ tạo cấu hình cho
- `--host`: Chỉ định tên miền để truy cập bên ngoài
- `--port`: Chỉ định cổng vào proxy

Đối với Caddy, `--host` đặc biệt quan trọng. Trong môi trường chính thức, hãy thử chuyển một tên miền đã được phân giải đến máy chủ hiện tại theo mặc định để việc truy cập HTTPS sẽ tự nhiên hơn.

Nếu lệnh nhắc rằng env bị thiếu `appPort`, hãy thực thi trước:

```bash
nb env update test2 --app-port 56575
```

Nếu sau này bạn thay đổi các cấu hình như `app-port` và `app-public-path` sẽ ảnh hưởng đến kết quả proxy, hãy nhớ thực hiện lại `generate`.

## Bước 3: Thực thi `reload`

Sau khi tạo cấu hình, thực hiện trực tiếp:

```bash
nb proxy caddy reload
```

Trong hầu hết các trường hợp, chỉ cần sử dụng lệnh này trực tiếp. Nếu nó chưa chạy, quá trình khởi động sẽ được xử lý nội bộ trước tiên; nếu nó đang chạy, nó sẽ được tải lại theo cấu hình mới nhất.

## CLI sẽ duy trì những tập tin nào?

Lấy `test2` làm ví dụ, các lệnh liên quan đến Caddy thường duy trì các tệp và thư mục này:

| con đường | chức năng |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Cấu hình trang web đầy đủ được tạo bởi CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Tệp nhập chung của caddie, chịu trách nhiệm nhập tất cả env `app.caddy` |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | Trang dự phòng SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | Trang dự phòng v2 SPA |
| `NB_CLI_ROOT/test2/storage/dist-client` | Thư mục sản phẩm xây dựng front-end hiện đang được sử dụng |
| `NB_CLI_ROOT/test2/storage/uploads` | Thư mục tải lên của ứng dụng hiện tại |

TRONG:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Sau đây là các tệp phụ trợ tác nhân được CLI duy trì
- `NB_CLI_ROOT/test2/storage/...` Sau đây là các tài nguyên tĩnh và thư mục tải lên của ứng dụng
- `nocobase.caddy` là tệp nhập cấp nhà cung cấp và thường không cần phải sửa đổi thủ công.
- `app.caddy` là cấu hình trang Caddy hoàn chỉnh của một môi trường nhất định. Việc thực hiện lại `generate` sẽ ghi đè lên toàn bộ

:::lưu ý cảnh báo

Nếu bạn muốn bù đắp cấu hình cấp trang Caddy, chẳng hạn như các tiêu đề bổ sung, xác thực, giới hạn tốc độ hoặc chiến lược nén, trước tiên bạn có thể điều chỉnh dựa trên `app.caddy`; tuy nhiên, hãy lưu ý rằng những lần thực thi lại `generate` sau này sẽ ghi đè lên tệp này.

:::

## Cấu hình viết tay: phải làm gì nếu không có CLI

Nếu ứng dụng của bạn không được lưu trữ CLI hoặc bạn muốn tự mình duy trì cấu hình Caddy hoàn chỉnh, bạn cũng có thể viết nó bằng tay.

Tuy nhiên, entry production của NocoBase thường không chỉ là một `reverse_proxy` đơn giản. Ngoài việc chuyển tiếp request API đến backend, cấu hình Caddy đầy đủ còn phải xử lý thư mục tải lên, tài nguyên tĩnh frontend, route truy cập file `/files/`, định tuyến `.well-known`, WebSocket và các trang fallback SPA.

Lấy `test2` làm ví dụ, các thư mục chính liên quan đến Caddy thường bao gồm:

- Thư mục trang dự phòng SPA: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Thư mục sản phẩm xây dựng front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Thư mục tải lên: `NB_CLI_ROOT/test2/storage/uploads`

Nói cách khác, cấu hình viết tay thường cần bao gồm ít nhất các loại mục sau:

- `v`: Chuyển hướng `/v` tới `/v/`
- `uploads`: Hiển thị thư mục tải lên
- `dist`: Hiển thị thư mục sản phẩm xây dựng front-end
- `oauth well-known`: Xử lý đường dẫn khám phá OAuth
- `openid well-known`: Xử lý đường dẫn khám phá OpenID
- `files`: chuyển tiếp request truy cập file dưới `/files/` đến ứng dụng backend
- `api`: chuyển tiếp yêu cầu `/api/` tới ứng dụng phụ trợ
- `ws`: chuyển tiếp các yêu cầu WebSocket tới ứng dụng phụ trợ
- `spa v2`: Cung cấp trang nhập và trả về giao diện người dùng cho `/v/`
- `spa v1`: Cung cấp trang nhập và trả về giao diện người dùng cho `/`

Vì vậy, một cấu hình Caddy hoàn chỉnh thường không chỉ được viết theo cách tổng quát sau:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Đối với ứng dụng được lưu trữ trên máy chủ CLI như `test2`, cấu trúc gần với triển khai thực tế hơn thường trông như thế này:

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /files/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

Ở đây cũng có hai điểm chính:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Sau đây là thư mục trang khôi phục SPA được CLI duy trì
- `NB_CLI_ROOT/test2/storage/...` Sau đây là cách sử dụng thư mục sản phẩm xây dựng và thư mục tải lên của riêng bạn

Nếu ứng dụng của bạn sử dụng triển khai đường dẫn phụ hoặc tài nguyên giao diện người dùng, thư mục tải lên và lớp mục nhập không nằm trong cùng một phối cảnh đường dẫn thì cấu hình viết tay sẽ dễ xảy ra lỗi hơn. Trong trường hợp này, thường nên thực hiện hơn:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Sau đó thực hiện điều chỉnh dựa trên kết quả được tạo ra.

Nếu bạn muốn để CLI giúp bạn chạy qua các đường dẫn và tuyến đường trước tiên thì cấu trúc được tạo thường sẽ là:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

TRONG:

- `nocobase.caddy` chịu trách nhiệm thống nhất `import */app.caddy`
- `test2/app.caddy` là cấu hình trang web hoàn chỉnh của env này `test2`
- `public/index-v1.html` và `public/index-v2.html` là các trang dự phòng SPA được CLI tạo

Một cách tiếp cận thận trọng hơn thường là:

1. Trước tiên hãy để CLI tạo cấu hình Caddy
2. Xác nhận cấu trúc định tuyến và đường dẫn thực tế dựa trên kết quả được tạo.
3. Sau đó thực hiện điều chỉnh thủ công theo tên miền, chế độ chạy và đường dẫn cài đặt của bạn.

Cách này thường ít bỏ sót các chi tiết liên quan đến `/files/`, WebSocket, tài nguyên tĩnh, thư mục tải lên, route `.well-known` hoặc trang fallback SPA hơn so với việc viết cấu hình từ đầu.

:::warning Lưu ý

`/files/` là route ứng dụng phải đi qua cơ chế xác thực của NocoBase. Không xử lý route này như thư mục tĩnh và không để nó rơi vào fallback SPA. Hãy chuyển tiếp đến backend NocoBase và đặt rule trước `handle_path /*` cùng các rule fallback frontend khác.

Nếu cấu hình `APP_PUBLIC_PATH=/nocobase/`, hãy chuyển tiếp thêm `/nocobase/files/*`. Giữ rule `/files/*` ở root để tương thích với các URL file hiện có.

:::

## Kiểm tra và tải lại cấu hình

Nếu bạn viết hoặc điều chỉnh cấu hình Caddy theo cách thủ công, hãy xác minh nó trước sau khi thực hiện các thay đổi, sau đó tải lại:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Nếu bạn không sử dụng `systemd` để quản lý Caddy, thay vào đó bạn có thể sử dụng các phương thức khởi động và tải lại của riêng mình.

Nếu bạn quản lý lớp mục nhập thông qua `nb proxy caddy`, lớp này thường được ưu tiên sử dụng:

```bash
nb proxy caddy reload
```

Nếu bạn muốn xem trình điều khiển hiện tại, đường dẫn tổng thể của tệp mục nhập, thư mục gốc thời gian chạy và vùng chứa hoặc thông tin nhị phân cục bộ, bạn có thể thực thi:

```bash
nb proxy caddy info
```

Nếu bạn chỉ muốn nhanh chóng xác nhận xem nó có đang chạy hay không, bạn có thể thực thi:

```bash
nb proxy caddy status
```

## Hướng dẫn chung

- `nb proxy caddy generate` dành cho các ứng dụng được cài đặt bởi `nb init`
- Nếu bạn đã có sẵn tên miền có thể phân giải lên máy chủ bình thường thì Caddy thường là cách nhanh nhất để có được HTTPS.
- Nếu sau đó bạn thay đổi cấu hình như `app-port` và `app-public-path` sẽ ảnh hưởng đến kết quả proxy, hãy nhớ thực hiện lại `generate`

## Các liên kết liên quan

- [Proxy ngược môi trường sản xuất](./index.md)
- [Nginx](./nginx.md)
- [Cài đặt bằng CLI (được khuyến nghị)](../../installation/cli.md)
- [Cấu hình ứng dụng với `.env`](../../installation/env.md)
- [`nb proxy caddy` Tham chiếu lệnh](../../../api/cli/proxy/caddy/index.md)
