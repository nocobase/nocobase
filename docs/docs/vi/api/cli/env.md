:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Biến Môi Trường Toàn Cầu

## TZ

Dùng để thiết lập múi giờ cho ứng dụng. Mặc định là múi giờ của hệ điều hành.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Các thao tác liên quan đến thời gian sẽ được xử lý dựa trên múi giờ này. Việc thay đổi TZ có thể ảnh hưởng đến các giá trị ngày tháng trong cơ sở dữ liệu. Để biết thêm chi tiết, vui lòng xem '[Tổng quan về Ngày & Giờ](#)'.
:::

## APP_ENV

Môi trường ứng dụng, giá trị mặc định là `development`. Các tùy chọn bao gồm:

- `production` Môi trường sản xuất
- `development` Môi trường phát triển

```bash
APP_ENV=production
```

## APP_KEY

Khóa bí mật của ứng dụng, dùng để tạo token người dùng, v.v. Hãy thay đổi thành khóa ứng dụng của riêng bạn và đảm bảo không tiết lộ ra bên ngoài.

:::warning
Nếu APP_KEY bị thay đổi, các token cũ cũng sẽ không còn hiệu lực.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Cổng ứng dụng, giá trị mặc định là `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Tiền tố địa chỉ API của NocoBase, giá trị mặc định là `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Chế độ khởi động đa nhân (cluster). Nếu biến này được cấu hình, nó sẽ được truyền vào lệnh `pm2 start` dưới dạng tham số `-i <instances>`. Các tùy chọn tương tự với tham số `-i` của pm2 (xem [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), bao gồm:

- `max`: sử dụng số nhân CPU tối đa
- `-1`: sử dụng số nhân CPU tối đa trừ 1
- `<number>`: chỉ định số nhân

Giá trị mặc định là trống, có nghĩa là không bật chế độ này.

:::warning{title="Lưu ý"}
Chế độ này cần được sử dụng cùng với các plugin liên quan đến chế độ cluster, nếu không chức năng của ứng dụng có thể gặp sự cố.
:::

Để biết thêm thông tin, vui lòng xem: [Chế độ Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Tiền tố tên gói plugin, mặc định là: `@nocobase/plugin-,@nocobase/preset-`.

Ví dụ, để thêm `plugin` `hello` vào dự án `my-nocobase-app`, tên gói đầy đủ của `plugin` sẽ là `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX có thể được cấu hình như sau:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Khi đó, mối quan hệ giữa tên `plugin` và tên gói như sau:

- Tên gói của `plugin` `users` là `@nocobase/plugin-users`
- Tên gói của `plugin` `nocobase` là `@nocobase/preset-nocobase`
- Tên gói của `plugin` `hello` là `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Loại cơ sở dữ liệu, các tùy chọn bao gồm:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Máy chủ cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

Giá trị mặc định là `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Cổng cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

- Cổng mặc định của MySQL, MariaDB là 3306
- Cổng mặc định của PostgreSQL là 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Tên cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Người dùng cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Mật khẩu cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Tiền tố bảng dữ liệu.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Có chuyển đổi tên bảng và tên trường cơ sở dữ liệu sang kiểu snake case hay không, mặc định là `false`. Nếu bạn đang sử dụng cơ sở dữ liệu MySQL (MariaDB) và `lower_case_table_names=1`, thì DB_UNDERSCORED phải là `true`.

:::warning
Khi `DB_UNDERSCORED=true`, tên bảng và tên trường thực tế trong cơ sở dữ liệu sẽ không khớp với những gì hiển thị trên giao diện. Ví dụ, `orderDetails` trong cơ sở dữ liệu sẽ là `order_details`.
:::

## DB_LOGGING

Công tắc ghi nhật ký cơ sở dữ liệu, giá trị mặc định là `off`. Các tùy chọn bao gồm:

- `on` Bật
- `off` Tắt

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Phương thức xuất nhật ký, nhiều giá trị được phân tách bằng dấu phẩy `,`. Giá trị mặc định trong môi trường phát triển là `console`, và trong môi trường sản xuất là `console,dailyRotateFile`. Các tùy chọn:

- `console` - `console.log`
- `file` - `Tệp`
- `dailyRotateFile` - `Tệp xoay theo ngày`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Đường dẫn lưu trữ nhật ký dựa trên tệp, mặc định là `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Cấp độ nhật ký đầu ra. Giá trị mặc định trong môi trường phát triển là `debug`, và trong môi trường sản xuất là `info`. Các tùy chọn:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Cấp độ xuất nhật ký cơ sở dữ liệu là `debug`, và việc có xuất hay không được kiểm soát bởi `DB_LOGGING`, không bị ảnh hưởng bởi `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Số lượng tệp nhật ký tối đa được giữ lại.

- Khi `LOGGER_TRANSPORT` là `file`, giá trị mặc định là `10`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`, sử dụng `[n]d` để biểu thị số ngày. Giá trị mặc định là `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Xoay nhật ký theo kích thước.

- Khi `LOGGER_TRANSPORT` là `file`, đơn vị là `byte`, và giá trị mặc định là `20971520 (20 * 1024 * 1024)`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`, bạn có thể sử dụng `[n]k`, `[n]m`, `[n]g`. Mặc định không cấu hình.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Định dạng in nhật ký. Mặc định trong môi trường phát triển là `console`, và trong môi trường sản xuất là `json`. Các tùy chọn:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Tham khảo: [Định dạng Nhật ký](#)

## CACHE_DEFAULT_STORE

Mã định danh duy nhất cho phương thức lưu trữ bộ nhớ đệm được sử dụng, chỉ định phương thức bộ nhớ đệm mặc định phía máy chủ. Giá trị mặc định là `memory`. Các tùy chọn tích hợp sẵn:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Số lượng mục tối đa trong bộ nhớ đệm, giá trị mặc định là `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Kết nối Redis, tùy chọn. Ví dụ: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Bật thu thập dữ liệu đo từ xa (telemetry), mặc định là `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Trình đọc chỉ số giám sát được bật, mặc định là `console`. Các giá trị khác cần tham khảo tên đã đăng ký của các `plugin` trình đọc tương ứng, ví dụ như `prometheus`. Nhiều giá trị được phân tách bằng dấu phẩy `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Trình xử lý dữ liệu dấu vết (trace) được bật, mặc định là `console`. Các giá trị khác cần tham khảo tên đã đăng ký của các `plugin` trình xử lý tương ứng. Nhiều giá trị được phân tách bằng dấu phẩy `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```