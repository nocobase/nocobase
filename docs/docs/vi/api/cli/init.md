---
title: "nb init"
description: "Tài liệu lệnh nb init: khởi tạo NocoBase, kết nối ứng dụng có sẵn hoặc cài đặt ứng dụng mới và lưu thành CLI env."
keywords: "nb init,NocoBase CLI,Khởi tạo,env,Docker,npm,Git"
---

# nb init

Khởi tạo workspace hiện tại để coding agent có thể kết nối và sử dụng NocoBase. `nb init` có thể kết nối đến ứng dụng có sẵn hoặc cài đặt một ứng dụng mới qua Docker, npm hoặc Git.

## Cách dùng

```bash
nb init [flags]
```

## Mô tả

`nb init` hỗ trợ ba chế độ tương tác:

- Chế độ mặc định: bạn nhập từng bước trong terminal.
- `--ui`: mở form trên trình duyệt cục bộ để hoàn tất quá trình khởi tạo.
- `--yes`: bỏ qua các câu hỏi và dùng giá trị mặc định. Chế độ này bắt buộc truyền `--env <envName>` và sẽ tạo một ứng dụng cục bộ mới.

Mặc định, `nb init` sẽ cài đặt hoặc cập nhật NocoBase AI coding skills khi khởi tạo hoặc khôi phục khởi tạo. Nếu bạn đã tự quản lý skills hoặc đang chạy trong môi trường CI, offline, hãy dùng `--skip-skills` để bỏ qua bước này.

Nếu quá trình khởi tạo bị gián đoạn sau khi cấu hình env đã được lưu, bạn có thể dùng `--resume` để tiếp tục:

```bash
nb init --env app1 --resume
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Bỏ qua câu hỏi, dùng flags và giá trị mặc định |
| `--env`, `-e` | string | Tên env cho lần khởi tạo này, bắt buộc với chế độ `--yes` và `--resume` |
| `--ui` | boolean | Mở wizard trực quan trên trình duyệt, không thể dùng cùng `--yes` |
| `--verbose` | boolean | Hiển thị output chi tiết của lệnh |
| `--skip-skills` | boolean | Bỏ qua việc cài đặt hoặc cập nhật NocoBase AI coding skills trong quá trình khởi tạo |
| `--ui-host` | string | Địa chỉ bind cho service cục bộ của `--ui`, mặc định `127.0.0.1` |
| `--ui-port` | integer | Port cho service cục bộ của `--ui`, `0` nghĩa là tự chọn |
| `--locale` | string | Ngôn ngữ của CLI prompt và UI: `en-US` hoặc `zh-CN` |
| `--api-base-url`, `-u` | string | Địa chỉ API NocoBase, bao gồm tiền tố `/api` |
| `--auth-type`, `-a` | string | Phương thức xác thực: `token` hoặc `oauth` |
| `--access-token`, `-t` | string | API key hoặc access token dùng cho phương thức `token` |
| `--resume` | boolean | Dùng lại workspace env config đã lưu để tiếp tục khởi tạo |
| `--lang`, `-l` | string | Ngôn ngữ của ứng dụng NocoBase sau khi cài đặt |
| `--force`, `-f` | boolean | Cấu hình lại env có sẵn và thay thế tài nguyên runtime xung đột nếu cần |
| `--app-root-path` | string | Thư mục source code của ứng dụng cục bộ npm/Git, mặc định `./<envName>/source/` |
| `--app-port` | string | Port của ứng dụng cục bộ, mặc định `13000`, chế độ `--yes` sẽ tự chọn port khả dụng |
| `--storage-path` | string | Thư mục lưu file upload và data của database, mặc định `./<envName>/storage/` |
| `--root-username` | string | Tên đăng nhập admin ban đầu |
| `--root-email` | string | Email admin ban đầu |
| `--root-password` | string | Mật khẩu admin ban đầu |
| `--root-nickname` | string | Biệt danh admin ban đầu |
| `--builtin-db`, `--no-builtin-db` | boolean | Có tạo database tích hợp do CLI quản lý hay không |
| `--db-dialect` | string | Loại database: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Image container cho database tích hợp |
| `--db-host` | string | Địa chỉ database |
| `--db-port` | string | Port database |
| `--db-database` | string | Tên database |
| `--db-user` | string | Tên người dùng database |
| `--db-password` | string | Mật khẩu database |
| `--fetch-source` | boolean | Tải file ứng dụng hoặc Docker image trước khi cài đặt |
| `--source`, `-s` | string | Cách lấy NocoBase: `docker`, `npm` hoặc `git` |
| `--version`, `-v` | string | Tham số phiên bản: phiên bản npm, tag Docker image hoặc Git ref |
| `--replace`, `-r` | boolean | Thay thế khi thư mục đích đã tồn tại |
| `--dev-dependencies`, `-D` | boolean | Có cài devDependencies khi dùng npm/Git hay không |
| `--output-dir`, `-o` | string | Thư mục đích để tải về, hoặc thư mục lưu Docker tarball |
| `--git-url` | string | Địa chỉ Git repository |
| `--docker-registry` | string | Tên Docker registry, không bao gồm tag |
| `--docker-platform` | string | Platform Docker image: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Có lưu Docker image thành tarball sau khi pull hay không |
| `--npm-registry` | string | Registry npm cho việc tải xuống và cài đặt dependency của npm/Git |
| `--build`, `--no-build` | boolean | Có build sau khi cài đặt dependency npm/Git hay không |
| `--build-dts` | boolean | Có sinh file khai báo TypeScript khi build npm/Git hay không |

## Ví dụ

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Lệnh liên quan

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
