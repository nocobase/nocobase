:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Biến Môi Trường

## Cách Thiết Lập Biến Môi Trường?

### Cài đặt từ mã nguồn Git hoặc `create-nocobase-app`

Thiết lập các biến môi trường trong tệp `.env` ở thư mục gốc của dự án. Sau khi thay đổi biến môi trường, bạn cần dừng tiến trình ứng dụng và khởi động lại.

### Cài đặt bằng Docker

Sửa đổi cấu hình `docker-compose.yml` và thiết lập các biến môi trường trong tham số `environment`. Ví dụ:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Bạn cũng có thể sử dụng `env_file` để thiết lập biến môi trường trong tệp `.env`. Ví dụ:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Sau khi thay đổi biến môi trường, bạn cần xây dựng lại container của ứng dụng.

```yml
docker compose up -d app
```

## Biến Môi Trường Toàn Cục

### TZ

Dùng để thiết lập múi giờ cho ứng dụng, mặc định là múi giờ của hệ điều hành.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Các thao tác liên quan đến thời gian sẽ được xử lý dựa trên múi giờ này. Việc thay đổi TZ có thể ảnh hưởng đến các giá trị ngày tháng trong cơ sở dữ liệu. Để biết thêm chi tiết, hãy tham khảo mục "[Tổng quan về Ngày & Giờ](/data-sources/data-modeling/collection-fields/datetime)".
:::

### APP_ENV

Môi trường ứng dụng, giá trị mặc định là `development`, các tùy chọn bao gồm:

- `production` môi trường sản phẩm
- `development` môi trường phát triển

```bash
APP_ENV=production
```

### APP_KEY

Khóa bí mật của ứng dụng, dùng để tạo token người dùng, v.v. Hãy thay đổi thành khóa ứng dụng của riêng bạn và đảm bảo không để lộ ra bên ngoài.

:::warning
Nếu APP_KEY bị thay đổi, các token cũ cũng sẽ không còn hiệu lực.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Cổng ứng dụng, giá trị mặc định là `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Tiền tố địa chỉ API của NocoBase, giá trị mặc định là `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Chế độ khởi động đa lõi (cluster). Nếu biến này được cấu hình, nó sẽ được truyền vào lệnh `pm2 start` dưới dạng tham số `-i <instances>`. Các tùy chọn tương tự như tham số `-i` của pm2 (tham khảo [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), bao gồm:

- `max`: Sử dụng số lõi CPU tối đa
- `-1`: Sử dụng số lõi CPU tối đa trừ một
- `<number>`: Chỉ định số lõi

Giá trị mặc định là trống, có nghĩa là tính năng này không được bật.

:::warning{title="Lưu ý"}
Chế độ này yêu cầu sử dụng các plugin liên quan đến chế độ cluster. Nếu không, chức năng của ứng dụng có thể gặp sự cố bất thường.
:::

Để biết thêm thông tin, xem thêm: [Chế độ Cluster](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Tiền tố tên gói của plugin, mặc định là: `@nocobase/plugin-,@nocobase/preset-`.

Ví dụ, để thêm `plugin` `hello` vào dự án `my-nocobase-app`, tên gói đầy đủ của `plugin` sẽ là `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX có thể được cấu hình như sau:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Khi đó, mối quan hệ giữa tên `plugin` và tên gói như sau:

- Tên gói của `plugin` `users` là `@nocobase/plugin-users`
- Tên gói của `plugin` `nocobase` là `@nocobase/preset-nocobase`
- Tên gói của `plugin` `hello` là `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Loại cơ sở dữ liệu, các tùy chọn bao gồm:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Máy chủ cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

Mặc định là `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Cổng cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

- Cổng mặc định cho MySQL và MariaDB là 3306
- Cổng mặc định cho PostgreSQL là 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Tên cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Người dùng cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Mật khẩu cơ sở dữ liệu (cần cấu hình khi sử dụng cơ sở dữ liệu MySQL hoặc PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Tiền tố bảng dữ liệu.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Liệu tên bảng và tên trường trong cơ sở dữ liệu có được chuyển đổi sang kiểu snake case hay không. Mặc định là `false`. Nếu sử dụng cơ sở dữ liệu MySQL (MariaDB) và `lower_case_table_names=1`, thì `DB_UNDERSCORED` phải được đặt là `true`.

:::warning
Khi `DB_UNDERSCORED=true`, tên bảng và tên trường thực tế trong cơ sở dữ liệu sẽ không khớp với những gì hiển thị trên giao diện người dùng. Ví dụ, `orderDetails` sẽ được lưu trữ dưới dạng `order_details` trong cơ sở dữ liệu.
:::

### DB_LOGGING

Công tắc nhật ký cơ sở dữ liệu, giá trị mặc định là `off`, các tùy chọn bao gồm:

- `on` bật
- `off` tắt

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Số lượng kết nối tối đa trong nhóm kết nối cơ sở dữ liệu, giá trị mặc định là `5`.

### DB_POOL_MIN

Số lượng kết nối tối thiểu trong nhóm kết nối cơ sở dữ liệu, giá trị mặc định là `0`.

### DB_POOL_IDLE

Thời gian chờ tối đa (tính bằng mili giây) mà một kết nối có thể ở trạng thái rảnh trước khi được giải phóng. Giá trị mặc định là `10000` (10 giây).

### DB_POOL_ACQUIRE

Thời gian chờ tối đa (tính bằng mili giây) mà nhóm kết nối sẽ cố gắng lấy một kết nối trước khi báo lỗi. Giá trị mặc định là `60000` (60 giây).

### DB_POOL_EVICT

Khoảng thời gian (tính bằng mili giây) sau đó nhóm kết nối sẽ loại bỏ các kết nối rảnh. Giá trị mặc định là `1000` (1 giây).

### DB_POOL_MAX_USES

Số lần một kết nối có thể được sử dụng trước khi nó bị loại bỏ và thay thế. Giá trị mặc định là `0` (không giới hạn).

### LOGGER_TRANSPORT

Phương thức xuất nhật ký, nhiều giá trị được phân tách bằng dấu `,`. Mặc định là `console` trong môi trường phát triển, `console,dailyRotateFile` trong môi trường sản phẩm.
Các tùy chọn:

- `console` - `console.log`
- `file` - Xuất ra tệp
- `dailyRotateFile` - Xuất ra các tệp xoay vòng hàng ngày

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Đường dẫn lưu trữ nhật ký dựa trên tệp, mặc định là `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Mức độ nhật ký đầu ra. Mặc định là `debug` trong môi trường phát triển và `info` trong môi trường sản phẩm. Các tùy chọn:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Mức độ nhật ký đầu ra của cơ sở dữ liệu là `debug`, được kiểm soát bởi `DB_LOGGING` và không bị ảnh hưởng bởi `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Số lượng tệp nhật ký tối đa được giữ lại.

- Khi `LOGGER_TRANSPORT` là `file`: Mặc định là `10`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`: Sử dụng `[n]d` để biểu thị số ngày. Mặc định là `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Xoay vòng nhật ký theo kích thước.

- Khi `LOGGER_TRANSPORT` là `file`: Đơn vị là `byte`. Mặc định là `20971520 (20 * 1024 * 1024)`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`: Có thể sử dụng `[n]k`, `[n]m`, `[n]g`. Mặc định không được cấu hình.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Định dạng in nhật ký. Mặc định là `console` trong môi trường phát triển và `json` trong môi trường sản phẩm. Các tùy chọn:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Tham khảo: [Định dạng Nhật ký](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Mã định danh duy nhất cho phương thức lưu trữ bộ nhớ đệm, chỉ định phương thức bộ nhớ đệm mặc định của máy chủ. Mặc định là `memory`. Các tùy chọn tích hợp bao gồm:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Số lượng mục tối đa trong bộ nhớ đệm, giá trị mặc định là `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL kết nối Redis, tùy chọn. Ví dụ: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Bật thu thập dữ liệu đo từ xa. Mặc định là `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Các bộ thu thập chỉ số giám sát được bật. Mặc định là `console`. Các giá trị khác cần tham khảo tên đã đăng ký của các `plugin` thu thập tương ứng, ví dụ `prometheus`. Nhiều giá trị được phân tách bằng dấu `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Các bộ xử lý dữ liệu theo dõi được bật. Mặc định là `console`. Các giá trị khác cần tham khảo tên đã đăng ký của các `plugin` xử lý tương ứng. Nhiều giá trị được phân tách bằng dấu `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Biến Môi Trường Thử Nghiệm

### APPEND_PRESET_LOCAL_PLUGINS

Dùng để thêm các `plugin` cục bộ được cài đặt sẵn nhưng chưa kích hoạt. Giá trị là tên gói của `plugin` (tham số `name` trong `package.json`), nhiều `plugin` được phân tách bằng dấu phẩy.

:::info

1. Đảm bảo `plugin` đã được tải xuống cục bộ và có thể tìm thấy trong thư mục `node_modules`. Để biết thêm chi tiết, xem [Cấu trúc Tổ chức của Plugin](/plugin-development/project-structure).
2. Sau khi thêm biến môi trường, `plugin` sẽ chỉ hiển thị trên trang quản lý `plugin` sau khi cài đặt ban đầu (`nocobase install`) hoặc nâng cấp (`nocobase upgrade`).
   :::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Dùng để thêm các `plugin` tích hợp được cài đặt mặc định. Giá trị là tên gói của `plugin` (tham số `name` trong `package.json`), nhiều `plugin` được phân tách bằng dấu phẩy.

:::info

1. Đảm bảo `plugin` đã được tải xuống cục bộ và có thể tìm thấy trong thư mục `node_modules`. Để biết thêm chi tiết, xem [Cấu trúc Tổ chức của Plugin](/plugin-development/project-structure).
2. Sau khi thêm biến môi trường, `plugin` sẽ tự động được cài đặt hoặc nâng cấp trong quá trình cài đặt ban đầu (`nocobase install`) hoặc nâng cấp (`nocobase upgrade`).
   :::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Biến Môi Trường Tạm Thời

Khi cài đặt NocoBase, bạn có thể thiết lập các biến môi trường tạm thời để hỗ trợ quá trình cài đặt, ví dụ:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Tương đương với
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Tương đương với
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Ngôn ngữ khi cài đặt. Mặc định là `en-US`. Các tùy chọn bao gồm:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Email người dùng Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Mật khẩu người dùng Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Biệt danh người dùng Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```