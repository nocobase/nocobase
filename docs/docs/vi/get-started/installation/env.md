---
title: "Cấu hình biến môi trường NocoBase"
description: "Biến môi trường NocoBase: Hướng dẫn cấu hình TZ múi giờ, APP_KEY, DB database, CACHE, FILE_STORAGE, cách thiết lập với Docker và create-nocobase-app."
keywords: "biến môi trường, APP_KEY, TZ, cấu hình DB, CACHE, FILE_STORAGE, biến môi trường Docker, NocoBase"
---

# Biến môi trường

## Cách thiết lập biến môi trường?

### Cài đặt qua Git source code hoặc create-nocobase-app

Thiết lập biến môi trường trong file `.env` ở thư mục gốc của dự án, sau khi sửa biến môi trường cần kill tiến trình ứng dụng và khởi động lại.

### Cài đặt qua Docker

Sửa cấu hình `docker-compose.yml`, thiết lập biến môi trường trong tham số `enviroment`. Ví dụ:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Cũng có thể dùng `env_file`, để thiết lập biến môi trường trong file `.env`. Ví dụ:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Sau khi sửa biến môi trường, cần build lại container app.

```yml
docker compose up -d app
```

## Biến môi trường toàn cục

### TZ

Dùng để thiết lập múi giờ của ứng dụng, mặc định là múi giờ của hệ điều hành.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Các thao tác liên quan đến thời gian sẽ xử lý dựa trên múi giờ này, sửa TZ có thể ảnh hưởng đến giá trị ngày tháng trong cơ sở dữ liệu, xem chi tiết tại "[Tổng quan ngày & giờ](/data-sources/data-modeling/collection-fields/datetime)"
:::

### APP_ENV

Môi trường ứng dụng, giá trị mặc định `development`, các tùy chọn bao gồm:

- `production` Môi trường production
- `development` Môi trường phát triển

```bash
APP_ENV=production
```

### APP_KEY

Khóa ứng dụng, dùng để sinh user token, v.v. Hãy đổi thành khóa ứng dụng riêng của bạn và đảm bảo không tiết lộ ra ngoài

:::warning
Nếu APP_KEY bị thay đổi, các token cũ cũng sẽ mất hiệu lực
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Cổng ứng dụng, giá trị mặc định `13000`

```bash
APP_PORT=13000
```

### API_BASE_PATH

Tiền tố địa chỉ API NocoBase, giá trị mặc định `/api/`

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Chế độ khởi động đa nhân (cluster), nếu cấu hình biến này, sẽ được truyền tới lệnh `pm2 start` làm tham số `-i <instances>`. Tùy chọn giống tham số `-i` của pm2 (tham khảo [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), bao gồm:

- `max`: dùng số lõi CPU tối đa
- `-1`: dùng số lõi CPU tối đa trừ 1
- `<number>`: chỉ định số lõi

Mặc định để trống, nghĩa là không bật.

:::warning{title="Lưu ý"}
Chế độ này cần kết hợp với các plugin liên quan đến chế độ cluster, nếu không các tính năng của ứng dụng có thể hoạt động bất thường.
:::

Tham khảo thêm: [Chế độ cluster](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Tiền tố tên package của Plugin, mặc định: `@nocobase/plugin-,@nocobase/preset-`.

Ví dụ, thêm Plugin `hello` vào dự án `my-nocobase-app`, tên package đầy đủ của Plugin sẽ là `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX có thể cấu hình thành:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Tương ứng tên Plugin và tên package như sau:

- Tên package của Plugin `users` là `@nocobase/plugin-users`
- Tên package của Plugin `nocobase` là `@nocobase/preset-nocobase`
- Tên package của Plugin `hello` là `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Loại cơ sở dữ liệu, các tùy chọn bao gồm:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Host cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL)

Giá trị mặc định `localhost`

```bash
DB_HOST=localhost
```

### DB_PORT

Cổng cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL)

- MySQL, MariaDB cổng mặc định 3306
- PostgreSQL cổng mặc định 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Tên cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL)

```bash
DB_DATABASE=nocobase
```

### DB_USER

Người dùng cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL)

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Mật khẩu cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL)

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Tiền tố bảng dữ liệu

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Tên bảng và tên Field trong cơ sở dữ liệu có chuyển sang kiểu snake case không, mặc định là `false`. Nếu dùng MySQL (MariaDB), và `lower_case_table_names=1`, thì DB_UNDERSCORED bắt buộc phải là `true`

:::warning
Khi `DB_UNDERSCORED=true`, tên bảng và tên Field thực tế trong cơ sở dữ liệu không trùng với những gì thấy trên giao diện, ví dụ `orderDetails` trong cơ sở dữ liệu sẽ là `order_details`
:::

### DB_LOGGING

Bật/tắt log cơ sở dữ liệu, giá trị mặc định `off`, các tùy chọn bao gồm:

- `on` Bật
- `off` Tắt

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Số kết nối tối đa của connection pool cơ sở dữ liệu, giá trị mặc định `5`.

### DB_POOL_MIN

Số kết nối tối thiểu của connection pool cơ sở dữ liệu, giá trị mặc định `0`.

### DB_POOL_IDLE

Thời gian idle của connection pool cơ sở dữ liệu, giá trị mặc định `10000` (10 giây).

### DB_POOL_ACQUIRE

Thời gian chờ tối đa khi lấy kết nối từ connection pool cơ sở dữ liệu, giá trị mặc định `60000` (60 giây).

### DB_POOL_EVICT

Thời gian sống tối đa của kết nối trong connection pool cơ sở dữ liệu, giá trị mặc định `1000` (1 giây).

### DB_POOL_MAX_USES

Số lần một kết nối có thể được sử dụng trước khi bị loại bỏ và thay thế, giá trị mặc định `0` (không giới hạn).

### LOGGER_TRANSPORT

Cách xuất log, nhiều cái phân tách bằng `,`. Môi trường phát triển mặc định là `console`, môi trường production mặc định là `console,dailyRotateFile`.
Các tùy chọn:

- `console` - `console.log`
- `file` - `file`
- `dailyRotateFile` - `file rotate theo ngày`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Đường dẫn lưu trữ log dựa trên file, mặc định là `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Mức log xuất ra, môi trường phát triển mặc định là `debug`, môi trường production mặc định là `info`. Các tùy chọn:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Mức xuất log cơ sở dữ liệu là `debug`, được kiểm soát bật/tắt bởi `DB_LOGGING`, không bị ảnh hưởng bởi `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Số file log tối đa được giữ lại.

- Khi `LOGGER_TRANSPORT` là `file`, giá trị mặc định là `10`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`, dùng `[n]d` để biểu thị số ngày. Giá trị mặc định là `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotate log theo kích thước.

- Khi `LOGGER_TRANSPORT` là `file`, đơn vị là `byte`, giá trị mặc định là `20971520 (20 * 1024 * 1024)`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`, có thể dùng `[n]k`, `[n]m`, `[n]g`. Mặc định không cấu hình.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Format in log, môi trường phát triển mặc định `console`, môi trường production mặc định `json`. Các tùy chọn:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Tham khảo: [Format log](/log-and-monitor/logger/index.md#format-log)

### CACHE_DEFAULT_STORE

Định danh duy nhất của cách dùng cache, chỉ định cách cache mặc định phía server, giá trị mặc định `memory`, các tùy chọn tích hợp sẵn:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Số lượng item tối đa của memory cache, giá trị mặc định `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Kết nối Redis, tùy chọn. Ví dụ: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Bật thu thập dữ liệu telemetry, mặc định là `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Bộ thu thập metric đang bật, mặc định là `console`. Các giá trị khác cần tham khảo tên đăng ký của plugin thu thập tương ứng, ví dụ `prometheus`. Nhiều cái phân tách bằng `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Bộ xử lý dữ liệu trace đang bật, mặc định là `console`. Các giá trị khác cần tham khảo tên đăng ký của plugin processor tương ứng. Nhiều cái phân tách bằng `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

### WORKER_MODE

Dùng để cấu hình chế độ làm việc của các node khác nhau khi tách dịch vụ trong chế độ cluster, xem chi tiết tại "[Tách dịch vụ: Cách tách dịch vụ](/cluster-mode/services-splitting#cach-tach-dich-vu)".

### SERVER_REQUEST_WHITELIST

Whitelist mục tiêu cho các yêu cầu HTTP gửi ra ngoài từ server, dùng để chống tấn công SSRF (Server-Side Request Forgery). Phân tách bằng dấu phẩy, hỗ trợ IP chính xác, dải CIDR, tên miền chính xác và subdomain wildcard (một cấp).

```bash
SERVER_REQUEST_WHITELIST=1.2.3.4,10.0.0.0/8,api.example.com,*.trusted.com
```

**Phạm vi áp dụng**: Node "HTTP Request" của Workflow, "Custom Request" của nút Action tùy chỉnh. Đường dẫn tương đối (gọi API của chính NocoBase) không bị giới hạn này.

**Khi không cấu hình**: Tất cả yêu cầu `http`/`https` đều được cho qua (giữ hành vi cũ). **Sau khi cấu hình**: Chỉ cho phép các yêu cầu khớp với whitelist, các yêu cầu không khớp sẽ báo lỗi.

Các format được hỗ trợ:

| Format | Ví dụ | Quy tắc khớp |
| --- | --- | --- |
| IPv4 chính xác | `1.2.3.4` | Chỉ khớp IP đó |
| IPv4 CIDR | `10.0.0.0/8` | Khớp tất cả IP trong dải mạng đó |
| Tên miền chính xác | `api.example.com` | Chỉ khớp tên miền đó |
| Subdomain wildcard | `*.example.com` | Khớp subdomain một cấp, như `foo.example.com`, không khớp `example.com` hoặc `a.b.example.com` |

## Biến môi trường thử nghiệm

### APPEND_PRESET_LOCAL_PLUGINS

Dùng để thêm các Plugin được preset chưa được kích hoạt, giá trị là tên package của Plugin (tham số name của package.json), nhiều Plugin phân tách bằng dấu phẩy tiếng Anh.

:::info

1. Cần đảm bảo Plugin đã được tải về local, và có thể tìm thấy trong thư mục `node_modules`, xem thêm tại [Cách tổ chức Plugin](/plugin-development/project-structure).
2. Sau khi thêm biến môi trường, cần thực hiện cài đặt khởi tạo `nocobase install` hoặc nâng cấp `nocobase upgrade` thì mới hiển thị trên trang quản lý Plugin.
   :::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Dùng để thêm các Plugin được preset và cài đặt mặc định, giá trị là tên package của Plugin (tham số name của package.json), nhiều Plugin phân tách bằng dấu phẩy tiếng Anh.

:::info

1. Cần đảm bảo Plugin đã được tải về local, và có thể tìm thấy trong thư mục `node_modules`, xem thêm tại [Cách tổ chức Plugin](/plugin-development/project-structure).
2. Sau khi thêm biến môi trường, sẽ tự động cài đặt hoặc nâng cấp Plugin khi thực hiện cài đặt khởi tạo `nocobase install` hoặc nâng cấp `nocobase upgrade`.
   :::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Biến môi trường tạm thời

Khi cài đặt NocoBase, có thể thiết lập biến môi trường tạm thời để hỗ trợ cài đặt, ví dụ:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Tương đương
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Tương đương
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Ngôn ngữ khi cài đặt, giá trị mặc định `en-US`, các tùy chọn bao gồm:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Email Người dùng Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Mật khẩu Người dùng Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Biệt danh Người dùng Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```

## Biến môi trường do các Plugin khác cung cấp

### WORKFLOW_SCRIPT_MODULES

Danh sách module có thể dùng cho node JavaScript của Workflow, xem chi tiết tại "[Node JavaScript: Sử dụng module bên ngoài](/workflow/nodes/javascript#su-dung-module-ben-ngoai)".

### WORKFLOW_LOOP_LIMIT

Giới hạn số lần lặp tối đa của node loop trong Workflow, xem chi tiết tại "[Node Loop](/workflow/nodes/loop#WORKFLOW_LOOP_LIMIT)".
