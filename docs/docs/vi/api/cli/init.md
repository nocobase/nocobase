---
title: 'nb init'
description: 'Tham chiếu lệnh nb init: cài đặt mới, tiếp quản ứng dụng cục bộ sẵn có hoặc kết nối tới ứng dụng từ xa và lưu thành CLI env.'
keywords: 'nb init,NocoBase CLI,khởi tạo,env,Docker,npm,Git,kết nối từ xa'
---

# nb init

Khởi tạo workspace hiện tại để coding agent có thể kết nối và sử dụng NocoBase.

`nb init` có thể cài đặt một ứng dụng NocoBase cục bộ mới, hoặc lưu thông tin kết nối của một ứng dụng đã có sẵn.

Ngoài ra, `nb init` mặc định cũng sẽ đồng bộ NocoBase AI coding skills. Chỉ khi bạn đã tự quản lý skills, hoặc đang chạy trong CI hay môi trường offline, bạn mới cần thêm `--skip-skills`.

## Cách dùng

```bash
nb init [flags]
```

## Chế độ tương tác

`nb init` hỗ trợ ba chế độ tương tác:

- `nb init`：hoàn tất hướng dẫn từng bước trong terminal
- `nb init --ui`：mở biểu mẫu trên trình duyệt cục bộ và hoàn tất setup bằng trình hướng dẫn trực quan
- `nb init --yes --env app1`：bỏ qua các lời nhắc và dùng trực tiếp flags; các tham số không được truyền rõ ràng sẽ được xử lý theo giá trị mặc định

Chế độ `--yes` phù hợp cho script, CI/CD hoặc các tình huống không tương tác khác. Ở chế độ này, `--env <envName>` là bắt buộc. Thông thường, nó sẽ mặc định cài đặt một ứng dụng cục bộ mới; nếu bạn không chỉ định `--source`, mặc định sẽ dùng `docker` làm nguồn cài đặt.

## Tiếp tục quá trình khởi tạo bị gián đoạn

Với các luồng cài đặt, env config sẽ được lưu trước, sau đó mới thực hiện tải xuống, cơ sở dữ liệu và cài đặt ứng dụng. Nếu thất bại giữa chừng, bạn có thể tiếp tục:

```bash
nb init --env app1 --resume
```

`--resume` chỉ áp dụng cho các luồng khởi tạo mà env config đã được lưu trước đó, và bắt buộc phải truyền rõ ràng `--env`.

## Chuẩn bị env trước, cài app sau

`--prepare-only` dành cho các luồng mà bạn cần chuẩn bị env trước, sau đó kích hoạt license, rồi mới cài đặt và khởi động app.

Nếu bạn muốn lưu cấu hình env trước, chuẩn bị source code hoặc image, đồng thời chuẩn bị sẵn cơ sở dữ liệu, nhưng tạm hoãn việc cài đặt app thực tế và lần khởi động đầu tiên, bạn có thể dùng:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

Chế độ này khả dụng cho các luồng cài đặt cục bộ, bao gồm cả trình hướng dẫn `--ui`. Nó không khả dụng cho các luồng kết nối từ xa. CLI sẽ lưu env hiện tại ở trạng thái prepared, để sau đó bạn có thể tiếp tục với luồng như sau:

```bash
nb license activate --env app1
nb app start --env app1
```

Sau đó, `nb app start` sẽ hoàn tất lần cài đặt đầu tiên và chuyển env từ trạng thái prepared sang trạng thái installed thông thường.

## Giải thích thư mục cài đặt

Bạn có thể xem đường dẫn đầy đủ bằng `nb env info app1 --field app.appPath`.

Theo mặc định, CLI sẽ tổ chức các tệp cục bộ dưới `app-path` theo quy ước sau:

```text
<app-path>/
├── source/   # Thư mục mặc định tương ứng với mã nguồn ứng dụng hoặc nội dung đã tải xuống
├── storage/  # Thư mục dữ liệu runtime
└── .env      # Tệp biến môi trường ứng dụng tùy chọn
```

Thông thường:

- `source/` chủ yếu tương ứng với thư mục ứng dụng cục bộ của env kiểu npm / Git. Với Docker env, CLI cũng giữ quy ước suy luận đường dẫn mặc định này, nhưng phần lớn trường hợp bạn không cần quan tâm thủ công đến nó. Hãy đặc biệt chú ý khi nâng cấp: thư mục `source/` sẽ bị xóa rồi tải lại, vì vậy đừng đặt các tệp cần giữ lại ở đây
- `storage/` dùng để lưu dữ liệu runtime, chẳng hạn như dữ liệu cơ sở dữ liệu tích hợp, plugin, log, v.v.
- `.env` là tệp biến môi trường ứng dụng tùy chọn. Chỉ khi bạn cần tùy chỉnh biến môi trường thì mới cần thêm nó vào `<app-path>/.env`; nếu tệp này tồn tại, các nguồn cài đặt Docker, npm và Git sẽ mặc định đọc nó

Đây là quy ước thư mục mặc định của CLI. Với các nguồn cài đặt, plugin và giai đoạn runtime khác nhau, nội dung thư mục thực tế được tạo ra có thể không hoàn toàn giống nhau.

## Lưu ý

:::warning Lưu ý

- `--ui` không thể dùng cùng với `--yes`
- `--ui` cũng không thể dùng cùng với `--resume`
- `--ui-host` và `--ui-port` chỉ có thể dùng cùng với `--ui`
- `--skip-auth` không thể dùng cùng với `--access-token` hoặc `--token`

:::

## Định vị nhanh theo Steps

Các Steps hiển thị sẽ không hoàn toàn giống nhau tùy theo đường dẫn setup. Ví dụ, khi kết nối tới ứng dụng đã có sẵn, thông thường chỉ dùng `Getting started` và `Remote connection`.

Nếu bạn đang thao tác từng bước theo trình hướng dẫn UI cục bộ, có thể dùng bảng dưới đây để định vị nhanh:

| Step                      | Các tham số cần chú ý chính                                                                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Tham số

Có khá nhiều tham số, nên sẽ dễ hiểu hơn nếu tách ra theo từng tình huống sử dụng.

“Giá trị mặc định” bên dưới là giá trị hoặc hành vi mà `nb init` thường sử dụng khi bạn bỏ qua tham số đó.

### Cơ bản và tương tác

| Tham số         | Kiểu    | Giá trị mặc định                                                                   | Mô tả                                                                                 |
| --------------- | ------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `--yes`, `-y`   | boolean | `false`                                                                            | Bỏ qua lời nhắc, dùng flags và giá trị mặc định                                       |
| `--env`, `-e`   | string  | Không có                                                                           | Tên env được lưu cho lần khởi tạo này; bắt buộc trong chế độ `--yes` và `--resume`    |
| `--ui`          | boolean | `false`                                                                            | Mở trình hướng dẫn trên trình duyệt cục bộ; không thể dùng cùng `--yes` và `--resume` |
| `--verbose`     | boolean | `false`                                                                            | Hiển thị đầu ra lệnh chi tiết                                                         |
| `--skip-skills` | boolean | `false`                                                                            | Bỏ qua đồng bộ NocoBase AI coding skills                                              |
| `--ui-host`     | string  | `127.0.0.1`                                                                        | Host có thể truy cập từ trình duyệt hiển thị trong URL wizard `--ui`; dịch vụ cục bộ luôn lắng nghe trên `0.0.0.0` |
| `--ui-port`     | integer | `0`                                                                                | Cổng dịch vụ cục bộ `--ui`; `0` nghĩa là tự động cấp phát                             |
| `--locale`      | string  | Theo `NB_LOCALE`, cấu hình CLI hoặc locale hệ thống; fallback cuối cùng là `en-US` | Ngôn ngữ của lời nhắc CLI và UI setup cục bộ: `en-US` hoặc `zh-CN`                    |
| `--resume`      | boolean | `false`                                                                            | Tiếp tục lần khởi tạo trước đó chưa hoàn tất, tái sử dụng workspace env config đã lưu |
| `--prepare-only` | boolean | `false`                                                                           | Lưu và chuẩn bị env cài đặt cục bộ, bao gồm các luồng `--ui`, nhưng chưa cài đặt hay khởi động app |

### Kết nối ứng dụng đã có sẵn

| Tham số                | Kiểu    | Giá trị mặc định | Mô tả                                                                                                                                                   |
| ---------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | Không có         | Địa chỉ gốc API, bắt buộc phải gồm tiền tố `/api`                                                                                                       |
| `--auth-type`, `-a`    | string  | `oauth`          | Phương thức xác thực: `basic`、`token` hoặc `oauth`. Thông thường chỉ cần dùng `oauth` mặc định; trong một số tình huống CI/CD cũng có thể dùng `basic` |
| `--access-token`, `-t` | string  | Không có         | API key hoặc access token dùng cho xác thực `token`                                                                                                     |
| `--username`           | string  | Không có         | Tên người dùng dùng cho xác thực `basic`                                                                                                                |
| `--password`           | string  | Không có         | Mật khẩu dùng cho xác thực `basic`                                                                                                                      |
| `--skip-auth`          | boolean | `false`          | Lưu env và phương thức xác thực trước, rồi hoàn tất đăng nhập sau bằng `nb env auth`                                                                    |

### Tham số cơ bản cho cài đặt cục bộ

| Tham số           | Kiểu    | Giá trị mặc định                       | Mô tả                                                                       |
| ----------------- | ------- | -------------------------------------- | --------------------------------------------------------------------------- |
| `--lang`, `-l`    | string  | `en-US`                                | Ngôn ngữ giao diện của ứng dụng mới cài đặt                                 |
| `--force`, `-f`   | boolean | `false`                                | Cấu hình lại env đã có, và thay thế các tài nguyên runtime xung đột khi cần |
| `--app-path`      | string  | `./<envName>/`                         | Thư mục ứng dụng cục bộ npm/Git                                             |
| `--app-port`      | string  | `13000`                                | Cổng HTTP của ứng dụng cục bộ; chế độ `--yes` sẽ tự động chọn cổng khả dụng |
| `--root-username` | string  | `nocobase`（chế độ `--yes`）           | Tên người dùng quản trị viên ban đầu                                        |
| `--root-email`    | string  | `admin@nocobase.com`（chế độ `--yes`） | Email quản trị viên ban đầu                                                 |
| `--root-password` | string  | `admin123`（chế độ `--yes`）           | Mật khẩu quản trị viên ban đầu                                              |
| `--root-nickname` | string  | `Super Admin`（chế độ `--yes`）        | Tên hiển thị của quản trị viên ban đầu                                      |

### Tham số cơ sở dữ liệu

| Tham số                                    | Kiểu    | Giá trị mặc định                                                                  | Mô tả                                                                       |
| ------------------------------------------ | ------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                                            | Có tạo và kết nối cơ sở dữ liệu tích hợp do CLI quản lý hay không           |
| `--db-dialect`                             | string  | `postgres`                                                                        | Loại cơ sở dữ liệu: `postgres`、`mysql`、`mariadb`、`kingbase`              |
| `--builtin-db-image`                       | string  | Theo `--db-dialect` và locale                                                     | Image container cơ sở dữ liệu tích hợp                                      |
| `--db-host`                                | string  | Là `postgres` với cơ sở dữ liệu tích hợp; `127.0.0.1` với cơ sở dữ liệu bên ngoài | Địa chỉ host cơ sở dữ liệu                                                  |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`                   | Cổng cơ sở dữ liệu                                                          |
| `--db-database`                            | string  | `nocobase`; với KingbaseES là `kingbase`                                          | Tên cơ sở dữ liệu                                                           |
| `--db-user`                                | string  | `nocobase`                                                                        | Tên người dùng cơ sở dữ liệu                                                |
| `--db-password`                            | string  | `nocobase`                                                                        | Mật khẩu cơ sở dữ liệu                                                      |
| `--db-schema`                              | string  | Không có                                                                          | Schema cơ sở dữ liệu; chỉ PostgreSQL sử dụng                                |
| `--db-table-prefix`                        | string  | Không có                                                                          | Tiền tố bảng dữ liệu                                                        |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                                           | Tên bảng và tên trường trong cơ sở dữ liệu có dùng kiểu gạch dưới hay không |

### Tham số tải xuống và mã nguồn

| Tham số                                              | Kiểu    | Giá trị mặc định                                                                                 | Mô tả                                                                           |
| ---------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                          | Bỏ qua tải xuống, tái sử dụng thư mục ứng dụng cục bộ hoặc image Docker hiện có |
| `--source`, `-s`                                     | string  | `docker`                                                                                         | Cách lấy NocoBase: `docker`、`npm` hoặc `git`                                   |
| `--version`, `-v`                                    | string  | `beta`                                                                                           | Tham số phiên bản: phiên bản gói npm, tag image Docker hoặc Git ref             |
| `--replace`, `-r`                                    | boolean | `false`                                                                                          | Thay thế nếu thư mục đích đã tồn tại                                            |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                          | Có cài devDependencies khi cài bằng npm/Git hay không                           |
| `--output-dir`, `-o`                                 | string  | Với npm/Git sẽ suy ra theo `--app-path`; với Docker + `--docker-save` là `./nocobase-<version>`  | Thư mục đích để tải xuống, hoặc thư mục lưu tarball khi bật `--docker-save`     |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                       | Địa chỉ kho Git                                                                 |
| `--docker-registry`                                  | string  | `nocobase/nocobase`; với locale `zh-CN` là `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Tên kho image Docker, không gồm tag                                             |
| `--docker-platform`                                  | string  | `auto`                                                                                           | Nền tảng image Docker: `auto`、`linux/amd64`、`linux/arm64`                     |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                          | Có lưu thêm image Docker thành tarball sau khi pull hay không                   |
| `--npm-registry`                                     | string  | Trống                                                                                            | Registry dùng để tải npm/Git và cài dependency                                  |
| `--build` / `--no-build`                             | boolean | `true`                                                                                           | Có build sau khi cài dependency npm/Git hay không                               |
| `--build-dts`                                        | boolean | `false`                                                                                          | Có tạo file khai báo TypeScript khi build npm/Git hay không                     |

## Ví dụ

Dưới đây là một số cách dùng phổ biến nhất.

### Hoàn tất hướng dẫn từng bước trong terminal

```bash
nb init
```

### Mở trình hướng dẫn trên trình duyệt cục bộ

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Chuẩn bị trước, rồi kích hoạt license và khởi động sau

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Cài đặt không tương tác một ứng dụng cục bộ mới

Nếu bạn không chỉ định `--source`, thông thường Docker sẽ được dùng làm nguồn cài đặt.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Cài nhanh và dùng xác thực basic

Nếu bạn muốn nhanh chóng cài một ứng dụng cục bộ trong chế độ không tương tác, đồng thời lưu luôn xác thực `basic` ngay sau khi cài xong, bạn có thể viết như sau. Khi đó sẽ không cần mở trình duyệt để hoàn tất OAuth nữa.

Nếu dùng tài khoản quản trị viên mặc định trong chế độ `--yes`, cách ngắn nhất là như sau.

Nếu không được chỉ định, tài khoản quản trị viên mặc định là `nocobase`, và mật khẩu mặc định là `admin123`:

```bash
nb init --env app1 --yes --auth-type basic
```

Nếu bạn muốn đồng thời tùy chỉnh tài khoản quản trị viên, cũng có thể viết như sau:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Kết nối một ứng dụng đã có sẵn

Thông thường chỉ cần dùng OAuth mặc định. Nếu trong một số tình huống CI/CD bạn không tiện mở trình duyệt, cũng có thể lưu trực tiếp xác thực `basic`; nếu bạn đã có API token, cũng có thể lưu trực tiếp xác thực `token`.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Tùy chỉnh quy ước đặt tên cơ sở dữ liệu

Nếu bạn cần chỉ định PostgreSQL schema, tiền tố bảng hoặc cách đặt tên với gạch dưới, có thể truyền tham số như sau:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Tiếp tục lần khởi tạo trước bị gián đoạn

```bash
nb init --env app1 --resume
```

### Hiển thị log chi tiết khi xử lý sự cố

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Lệnh liên quan

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
