---
title: "Biến môi trường toàn cục"
description: "Biến môi trường của NocoBase: mô tả các tùy chọn cấu hình như TZ, APP_KEY, DB."
keywords: "biến môi trường,APP_KEY,TZ,cấu hình,NocoBase"
---

# Biến môi trường toàn cục

## TZ

Dùng để đặt múi giờ của ứng dụng, mặc định là múi giờ của hệ điều hành.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Các thao tác liên quan đến thời gian sẽ được xử lý theo múi giờ này. Sửa đổi TZ có thể ảnh hưởng đến giá trị ngày trong cơ sở dữ liệu, xem chi tiết trong "[Tổng quan về Date & Time](#)".
:::

## APP_ENV

Môi trường ứng dụng, giá trị mặc định `development`, các tùy chọn:

- `production` Môi trường production
- `development` Môi trường development

```bash
APP_ENV=production
```

## APP_KEY

Khóa bí mật của ứng dụng, dùng để sinh token người dùng, v.v. Đổi thành khóa bí mật của riêng bạn và đảm bảo không bị rò rỉ.

:::warning
Nếu APP_KEY được sửa đổi, các token cũ cũng sẽ hết hiệu lực.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Cổng ứng dụng, giá trị mặc định `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Tiền tố địa chỉ API của NocoBase, giá trị mặc định `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Chế độ khởi động đa lõi (cluster). Nếu được cấu hình, biến này sẽ được truyền vào lệnh `pm2 start` làm tham số `-i <instances>`. Các tùy chọn giống tham số `-i` của pm2 (tham khảo [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), gồm:

- `max`: Sử dụng số lõi CPU tối đa
- `-1`: Sử dụng số lõi CPU tối đa - 1
- `<number>`: Số lõi cụ thể

Giá trị mặc định để trống, nghĩa là không bật.

:::warning{title="Lưu ý"}
Chế độ này cần dùng kết hợp với các Plugin liên quan đến chế độ cluster, nếu không các tính năng của ứng dụng có thể hoạt động không bình thường.
:::

Tham khảo thêm: [Chế độ Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Tiền tố tên gói Plugin, mặc định: `@nocobase/plugin-,@nocobase/preset-`.

Ví dụ, thêm Plugin `hello` vào dự án `my-nocobase-app`, tên gói đầy đủ của Plugin là `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX có thể được cấu hình thành:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Khi đó tương ứng giữa tên Plugin và tên gói như sau:

- Plugin `users` có tên gói `@nocobase/plugin-users`
- Plugin `nocobase` có tên gói `@nocobase/preset-nocobase`
- Plugin `hello` có tên gói `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Loại cơ sở dữ liệu, các tùy chọn:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL).

Giá trị mặc định `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Cổng cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL).

- MySQL, MariaDB cổng mặc định 3306
- PostgreSQL cổng mặc định 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Tên cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

User cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Mật khẩu cơ sở dữ liệu (cần cấu hình khi dùng MySQL hoặc PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Tiền tố tên bảng dữ liệu.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Có chuyển tên bảng và tên cột sang phong cách snake case hay không, mặc định `false`. Nếu dùng MySQL (MariaDB) và `lower_case_table_names=1`, thì DB_UNDERSCORED phải là `true`.

:::warning
Khi `DB_UNDERSCORED=true`, tên bảng và tên cột thực tế trong cơ sở dữ liệu sẽ khác với những gì thấy trên giao diện. Ví dụ `orderDetails` trong cơ sở dữ liệu là `order_details`.
:::

## DB_LOGGING

Bật/tắt log cơ sở dữ liệu, giá trị mặc định `off`, các tùy chọn:

- `on` Bật
- `off` Tắt

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Phương thức xuất log, nhiều giá trị phân tách bằng `,`. Môi trường development mặc định `console`, môi trường production mặc định `console,dailyRotateFile`.
Các tùy chọn:

- `console` - `console.log`
- `file` - `file`
- `dailyRotateFile` - `file xoay theo ngày`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Đường dẫn lưu trữ log dạng file, mặc định `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Mức log xuất ra, môi trường development mặc định `debug`, môi trường production mặc định `info`. Các tùy chọn:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Mức log của cơ sở dữ liệu là `debug`, được điều khiển bởi `DB_LOGGING` để quyết định có xuất ra hay không, không bị ảnh hưởng bởi `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Số lượng file log tối đa được giữ lại.

- Khi `LOGGER_TRANSPORT` là `file`, giá trị mặc định `10`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`, dùng `[n]d` để biểu thị số ngày. Giá trị mặc định `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Xoay log theo kích thước.

- Khi `LOGGER_TRANSPORT` là `file`, đơn vị là `byte`, giá trị mặc định `20971520 (20 * 1024 * 1024)`.
- Khi `LOGGER_TRANSPORT` là `dailyRotateFile`, có thể dùng `[n]k`, `[n]m`, `[n]g`. Mặc định không cấu hình.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Định dạng in log, môi trường development mặc định `console`, môi trường production mặc định `json`. Các tùy chọn:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Tham khảo: [Định dạng log](#).

## CACHE_DEFAULT_STORE

Định danh duy nhất của phương thức cache, chỉ định phương thức cache mặc định của server, giá trị mặc định `memory`. Các tùy chọn có sẵn:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Số lượng item tối đa của bộ nhớ cache, giá trị mặc định `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Kết nối Redis, tùy chọn. Ví dụ: `redis://localhost:6379`.

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Bật thu thập dữ liệu telemetry, mặc định `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Trình thu thập chỉ số giám sát được bật, mặc định `console`. Các giá trị khác cần tham khảo tên đăng ký của Plugin trình thu thập tương ứng, ví dụ `prometheus`. Nhiều giá trị phân tách bằng `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Trình xử lý dữ liệu trace được bật, mặc định `console`. Các giá trị khác cần tham khảo tên đăng ký của Plugin xử lý tương ứng. Nhiều giá trị phân tách bằng `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
