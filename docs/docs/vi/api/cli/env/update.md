---
title: 'nb env update'
description: 'Tài liệu tham khảo lệnh nb env update: cập nhật cấu hình API, xác thực, mã nguồn, ứng dụng và cơ sở dữ liệu đã lưu.'
keywords: 'nb env update,NocoBase CLI,cấu hình env,xác thực,cơ sở dữ liệu,mã nguồn'
---

# nb env update

`nb env update` được dùng để cập nhật cấu hình của một env đã được lưu. Bạn có thể dùng lệnh này để điều chỉnh địa chỉ API, phương thức xác thực, nguồn mã nguồn, đường dẫn ứng dụng cục bộ, cổng, tham số cơ sở dữ liệu, v.v. Sau khi cập nhật xong, CLI sẽ tự động xử lý các bước tiếp theo dựa trên những thay đổi đó.

Nếu bạn không truyền tham số cấu hình nào, CLI cũng sẽ thực hiện đồng bộ lại theo trạng thái env hiện tại.

## Cách dùng

```bash
nb env update [name] [flags]
```

## Tham số chung

| Tham số     | Kiểu    | Mô tả                                                                      |
| ----------- | ------- | -------------------------------------------------------------------------- |
| `[name]`    | string  | Tên môi trường đã cấu hình cần cập nhật; nếu bỏ qua thì dùng env hiện tại. |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết.                                              |

## Tham số API và xác thực

| Tham số                           | Kiểu   | Mô tả                                                                                                                                                   |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | Địa chỉ API của NocoBase, bao gồm tiền tố `/api`.                                                                                                       |
| `--auth-type`                     | string | Phương thức xác thực: `basic`, `token`, `oauth`.                                                                                                        |
| `--access-token`, `--token`, `-t` | string | API key hoặc access token dùng cho xác thực `token`. Sau khi lưu, phương thức xác thực sẽ được chuyển sang `token`.                                     |
| `--username`                      | string | Tên người dùng được lưu cho xác thực `basic`. Chỉ dùng được khi env hiện tại đang dùng xác thực `basic`, hoặc khi đồng thời truyền `--auth-type basic`. |

## Tham số mã nguồn và tải xuống

| Tham số                                        | Kiểu    | Mô tả                                                                 |
| ---------------------------------------------- | ------- | --------------------------------------------------------------------- |
| `--source`                                     | string  | Nguồn ứng dụng đã lưu: `docker`, `git`, `local`, `npm`.               |
| `--download-version`, `--version`              | string  | Tham số phiên bản đã lưu: Docker tag, phiên bản gói npm hoặc Git ref. |
| `--docker-registry`                            | string  | Tên registry của image Docker, không bao gồm tag.                     |
| `--docker-platform`                            | string  | Nền tảng image Docker: `auto`, `linux/amd64`, `linux/arm64`.          |
| `--git-url`                                    | string  | Địa chỉ kho Git.                                                      |
| `--npm-registry`                               | string  | Registry dùng cho tải xuống npm/Git và cài đặt phụ thuộc.             |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Có cài đặt devDependencies khi cài đặt bằng npm/Git hay không.        |
| `--build` / `--no-build`                       | boolean | Có tự động build sau khi tải bằng npm/Git hay không.                  |
| `--build-dts` / `--no-build-dts`               | boolean | Có tạo file khai báo TypeScript khi build hay không.                  |

## Tham số ứng dụng

| Tham số      | Kiểu   | Mô tả                                                                                               |
| ------------ | ------ | --------------------------------------------------------------------------------------------------- |
| `--app-path` | string | Thư mục ứng dụng. Hiện tại mặc định khuyến nghị ưu tiên dùng tham số này để quản lý thư mục cục bộ. |
| `--app-port` | string | Cổng HTTP của ứng dụng.                                                                             |
| `--app-key`  | string | Khóa ứng dụng (`APP_KEY`).                                                                          |
| `--timezone` | string | Múi giờ ứng dụng (`TZ`).                                                                            |

## Tham số cơ sở dữ liệu

| Tham số                                    | Kiểu    | Mô tả                                                                  |
| ------------------------------------------ | ------- | ---------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | Có sử dụng cơ sở dữ liệu tích hợp do CLI quản lý hay không.            |
| `--db-dialect`                             | string  | Loại cơ sở dữ liệu: `postgres`, `mysql`, `mariadb`, `kingbase`.        |
| `--builtin-db-image`                       | string  | Image container của cơ sở dữ liệu tích hợp.                            |
| `--db-host`                                | string  | Địa chỉ máy chủ cơ sở dữ liệu.                                         |
| `--db-port`                                | string  | Cổng cơ sở dữ liệu.                                                    |
| `--db-database`                            | string  | Tên cơ sở dữ liệu.                                                     |
| `--db-user`                                | string  | Tên người dùng cơ sở dữ liệu.                                          |
| `--db-password`                            | string  | Mật khẩu cơ sở dữ liệu.                                                |
| `--db-schema`                              | string  | Schema cơ sở dữ liệu. Thường chỉ PostgreSQL mới dùng đến.              |
| `--db-table-prefix`                        | string  | Tiền tố bảng dữ liệu.                                                  |
| `--db-underscored` / `--no-db-underscored` | boolean | Tên bảng và tên trường cơ sở dữ liệu có dùng kiểu gạch dưới hay không. |

## Tham số dọn cấu hình

| Tham số   | Kiểu     | Mô tả                                                                                                                                                   |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--unset` | string[] | Xóa một hoặc nhiều trường đã lưu theo tên chuẩn của flag. Hỗ trợ truyền lặp lại, cũng hỗ trợ phân tách bằng dấu phẩy, ví dụ `--unset git-url,username`. |

## Giải thích

:::tip

Nếu bạn chỉ muốn CLI đồng bộ lại theo trạng thái mới nhất của env hiện tại, chỉ cần chạy `nb env update` hoặc `nb env update <name>` là đủ, không cần thêm tham số nào.

:::

- Sau khi cập nhật xong, CLI sẽ tự động xử lý các bước đồng bộ tiếp theo cần thiết dựa trên thay đổi lần này.
- Các tham số khác chỉ cập nhật cấu hình env đã lưu, sẽ không tự động khởi động lại ứng dụng, cũng không tự động thay thế mã nguồn cục bộ hay image Docker.
- Sau khi sửa các cấu hình như `app-path`, `app-port`, `timezone`, `db-*`, CLI thường sẽ nhắc bạn chạy `nb app restart --env <name>` ở bước tiếp theo; nếu thay đổi liên quan đến cơ sở dữ liệu tích hợp do CLI quản lý thì sẽ nhắc dùng `nb app restart --env <name> --with-db`.
- Khi cập nhật các thiết lập mã nguồn như `source`, `download-version`, `docker-registry`, `git-url`, `npm-registry`, chỉ giá trị đã lưu được thay đổi. Mã nguồn cục bộ, phụ thuộc và image hiện có sẽ không tự động được thay thế.
- `--access-token` không thể dùng cùng với `--auth-type basic` hoặc `--auth-type oauth`.
- Không thể vừa dùng `--unset` vừa gán giá trị tường minh cho cùng một trường. Ví dụ không thể đồng thời viết `--unset git-url` và `--git-url ...`.
- Nếu bạn chuyển phương thức xác thực sang `basic` hoặc `oauth`, hoặc xóa token, thì sau đó thường vẫn cần chạy `nb env auth <name>`.

## Ví dụ

```bash
# Đồng bộ lại env hiện tại theo trạng thái mới nhất
nb env update

# Đồng bộ lại env được chỉ định theo trạng thái mới nhất
nb env update prod

# Cập nhật địa chỉ API
nb env update prod --api-base-url http://localhost:13000/api

# Cập nhật token và chuyển phương thức xác thực sang token
nb env update prod --access-token <token>

# Chuyển sang xác thực basic, chỉ lưu tên người dùng, rồi chạy nb env auth sau
nb env update prod --auth-type basic --username admin

# Điều chỉnh nguồn mã và phiên bản, chỉ cập nhật cấu hình đã lưu
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Điều chỉnh cổng ứng dụng và múi giờ, rồi khởi động lại ứng dụng sau
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Xóa các trường đã lưu
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Lệnh liên quan

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
