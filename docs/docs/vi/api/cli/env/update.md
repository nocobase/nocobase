---
title: "nb env update"
description: "Tài liệu tham khảo lệnh nb env update: cập nhật cấu hình API, xác thực, mã nguồn, ứng dụng và cơ sở dữ liệu đã lưu."
keywords: "nb env update,NocoBase CLI,cấu hình env,xác thực,cơ sở dữ liệu,mã nguồn"
---

# nb env update

`nb env update` cập nhật cấu hình của một env đã lưu. Bạn có thể dùng nó để điều chỉnh địa chỉ API, phương thức xác thực, nguồn mã nguồn, đường dẫn ứng dụng cục bộ, public path, cổng, tham số cơ sở dữ liệu và nhiều thứ khác. Sau khi cập nhật xong, CLI sẽ tự động xử lý các bước tiếp theo cần thiết theo đúng những thay đổi đó.

Nếu bạn không truyền bất kỳ tham số cấu hình nào, CLI vẫn sẽ thực hiện đồng bộ lại dựa trên trạng thái hiện tại của env.

## Cách dùng

```bash
nb env update [name] [flags]
```

## Tùy chọn chung

| Tùy chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên env đã cấu hình cần cập nhật. Nếu bỏ qua, env hiện tại sẽ được dùng |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết |

## Tùy chọn API và xác thực

| Tùy chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | URL API của NocoBase, bao gồm tiền tố `/api` |
| `--auth-type` | string | Phương thức xác thực: `basic`, `token`, hoặc `oauth` |
| `--access-token`, `--token`, `-t` | string | API key hoặc access token dùng cho xác thực `token`. Khi lưu, kiểu xác thực cũng sẽ chuyển sang `token` |
| `--username` | string | Tên người dùng được lưu cho xác thực `basic`. Chỉ dùng khi env hiện tại đã dùng `basic`, hoặc dùng cùng `--auth-type basic` |

## Tùy chọn nguồn và tải xuống

| Tùy chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `--source` | string | Nguồn ứng dụng đã lưu: `docker`, `git`, `local`, hoặc `npm` |
| `--download-version`, `--version` | string | Bộ chọn phiên bản đã lưu: Docker tag, phiên bản gói npm, hoặc Git ref |
| `--docker-registry` | string | Tên registry của image Docker, không kèm tag |
| `--docker-platform` | string | Nền tảng image Docker: `auto`, `linux/amd64`, hoặc `linux/arm64` |
| `--git-url` | string | URL repository Git |
| `--npm-registry` | string | Registry dùng cho tải npm hoặc Git và cài dependency |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Có cài `devDependencies` cho nguồn npm hoặc Git hay không |
| `--build` / `--no-build` | boolean | Có tự động build sau khi tải npm hoặc Git hay không |
| `--build-dts` / `--no-build-dts` | boolean | Có sinh file khai báo TypeScript trong lúc build hay không |

## Tùy chọn ứng dụng

| Tùy chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `--app-path` | string | Thư mục ứng dụng. Đây hiện là cách được khuyến nghị để quản lý đường dẫn ứng dụng cục bộ |
| `--app-public-path` | string | Public path của ứng dụng (`APP_PUBLIC_PATH`), chẳng hạn `/` hoặc `/nocobase/` |
| `--app-port` | string | Cổng HTTP của ứng dụng |
| `--cdn-base-url` | string | URL gốc CDN cho static asset phía client (`CDN_BASE_URL`) |
| `--app-key` | string | Khóa ứng dụng (`APP_KEY`) |
| `--timezone` | string | Múi giờ của ứng dụng (`TZ`) |

## Tùy chọn cơ sở dữ liệu

| Tùy chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Có dùng cơ sở dữ liệu tích hợp do CLI quản lý hay không |
| `--db-dialect` | string | Loại cơ sở dữ liệu: `postgres`, `mysql`, `mariadb`, hoặc `kingbase` |
| `--builtin-db-image` | string | Image container dùng cho cơ sở dữ liệu tích hợp |
| `--db-host` | string | Host của cơ sở dữ liệu |
| `--db-port` | string | Cổng của cơ sở dữ liệu |
| `--db-database` | string | Tên cơ sở dữ liệu |
| `--db-user` | string | Tên người dùng cơ sở dữ liệu |
| `--db-password` | string | Mật khẩu cơ sở dữ liệu |
| `--db-schema` | string | Schema của cơ sở dữ liệu. Thông thường chỉ dùng với PostgreSQL |
| `--db-table-prefix` | string | Tiền tố bảng |
| `--db-underscored` / `--no-db-underscored` | boolean | Có dùng kiểu đặt tên có dấu gạch dưới cho bảng và trường hay không |

## Dọn dẹp cấu hình

| Tùy chọn | Kiểu | Mô tả |
| --- | --- | --- |
| `--unset` | string[] | Xóa một hoặc nhiều trường đã lưu theo tên flag. Bạn có thể lặp lại tùy chọn này hoặc truyền danh sách phân tách bằng dấu phẩy, chẳng hạn `--unset git-url,username` |

## Ghi chú

:::tip

Nếu bạn chỉ muốn CLI đồng bộ lại theo trạng thái mới nhất của env hiện tại, chỉ cần chạy `nb env update` hoặc `nb env update <name>` mà không cần thêm tùy chọn nào.

:::

- Sau khi cập nhật xong, CLI sẽ tự động xử lý các bước đồng bộ tiếp theo cần thiết dựa trên những thay đổi vừa thực hiện
- Các tùy chọn khác chỉ cập nhật cấu hình env đã lưu. Chúng không tự động restart ứng dụng hay thay thế mã nguồn cục bộ hoặc image Docker
- Sau khi sửa các thiết lập như `app-path`, `app-port`, `timezone`, hoặc `db-*`, CLI thường sẽ nhắc bạn chạy `nb app restart --env <name>`; nếu thay đổi liên quan đến cơ sở dữ liệu tích hợp do CLI quản lý, CLI sẽ nhắc dùng `nb app restart --env <name> --with-db`
- Sau khi sửa các thiết lập như `app-port`, `app-public-path`, hoặc `cdn-base-url` ảnh hưởng đến kết quả reverse proxy, hãy chạy lại `nb proxy nginx generate` hoặc `nb proxy caddy generate` nếu bạn đang dùng cấu hình proxy được sinh ra
- Khi cập nhật các thiết lập nguồn như `source`, `download-version`, `docker-registry`, `git-url`, hoặc `npm-registry`, chỉ các giá trị đã lưu được thay đổi. Mã nguồn cục bộ, dependency và image hiện có sẽ không tự động bị thay thế
- `--access-token` không thể dùng cùng `--auth-type basic` hoặc `--auth-type oauth`
- Không thể dùng cùng một trường vừa với `--unset` vừa với giá trị tường minh. Ví dụ, đừng dùng `--unset git-url` cùng với `--git-url ...`
- Nếu bạn chuyển phương thức xác thực sang `basic` hoặc `oauth`, hoặc xóa token, sau đó bạn thường cần chạy `nb env auth <name>`

## Ví dụ

```bash
# Đồng bộ lại env hiện tại theo trạng thái đã lưu mới nhất
nb env update

# Đồng bộ lại một env cụ thể
nb env update prod

# Cập nhật URL API
nb env update prod --api-base-url http://localhost:13000/api

# Cập nhật token và chuyển kiểu xác thực sang token
nb env update prod --access-token <token>

# Chuyển sang xác thực basic, lưu tên người dùng và chạy nb env auth sau
nb env update prod --auth-type basic --username admin

# Cập nhật nguồn và phiên bản đã lưu mà chưa thay thế mã cục bộ ngay
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Điều chỉnh cổng ứng dụng và múi giờ, rồi restart sau
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Điều chỉnh public path và sinh lại proxy sau nếu cần
nb env update local --app-public-path /nocobase/

# Lưu URL gốc CDN cho asset phía client
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

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
