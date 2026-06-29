---
title: "nb config"
description: "Tài liệu tham khảo nb config: quản lý các giá trị cấu hình mặc định của NocoBase CLI."
keywords: "nb config,NocoBase CLI,cấu hình,cấu hình mặc định"
---

# nb config

Quản lý các giá trị cấu hình mặc định của CLI. Các khóa hiện được hỗ trợ chủ yếu được chia thành các nhóm sau:

- Bản thân CLI: `locale`, `update.policy`, `license.pkg-url`
- Runtime Docker: `docker.network`, `docker.container-prefix`
- Tệp thực thi bên ngoài: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.pnpm`, `bin.yarn`
- Sinh proxy: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

Phần lớn dự án chỉ cần một vài khóa trong số này. Trên thực tế, các khóa được dùng nhiều nhất là:

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` hoặc `bin.caddy`
- `proxy.nginx-driver` hoặc `proxy.caddy-driver`

## Các khóa cấu hình thường dùng

| Khóa | Mặc định | Mô tả |
| --- | --- | --- |
| `locale` | được phân giải theo quy tắc CLI hiện tại | Ghi đè ngôn ngữ mà CLI sử dụng |
| `update.policy` | `prompt` | Chính sách cập nhật khi khởi động: `prompt`, `auto`, hoặc `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Ghi đè URL tải về của các gói extension thương mại |
| `docker.network` | `nocobase` | Mạng mặc định cho các ứng dụng Docker do CLI quản lý |
| `docker.container-prefix` | `nb` | Tiền tố mặc định cho các container Docker do CLI quản lý |
| `bin.docker` | `docker` | Ghi đè đường dẫn thực thi Docker |
| `bin.caddy` | `caddy` | Ghi đè đường dẫn thực thi Caddy |
| `bin.git` | `git` | Ghi đè đường dẫn thực thi Git |
| `bin.nginx` | `nginx` | Ghi đè đường dẫn thực thi Nginx |
| `bin.pnpm` | `pnpm` | Ghi đè đường dẫn thực thi pnpm |
| `bin.yarn` | `yarn` | Ghi đè đường dẫn thực thi Yarn |
| `proxy.nb-cli-root` | root của CLI, thường là thư mục home của người dùng hiện tại | Ghi đè root path mà cấu hình proxy được sinh ra nhìn thấy khi tiến trình proxy và CLI không nhìn cùng một root filesystem |
| `proxy.upstream-host` | `127.0.0.1` | Ghi đè host mà proxy dùng để chuyển tiếp lưu lượng trở lại ứng dụng NocoBase |
| `proxy.nginx-driver` | `local` | Driver runtime mặc định dùng bởi `nb proxy nginx` |
| `proxy.caddy-driver` | `local` | Driver runtime mặc định dùng bởi `nb proxy caddy` |

## Cách dùng

```bash
nb config <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb config get`](./get.md) | Đọc giá trị hiệu lực của một khóa cấu hình |
| [`nb config set`](./set.md) | Thiết lập một khóa cấu hình |
| [`nb config delete`](./delete.md) | Xóa một khóa cấu hình đã được đặt tường minh |
| [`nb config list`](./list.md) | Liệt kê các khóa cấu hình hiện đang được đặt tường minh |

## Ví dụ

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config set bin.pnpm /usr/local/bin/pnpm
nb config delete docker.container-prefix
```

## Ghi chú

- `bin.nginx` và `bin.caddy` chỉ ảnh hưởng tới driver `local` của `nb proxy nginx` và `nb proxy caddy`
- `bin.pnpm` được dùng khi lệnh cần chạy pnpm trực tiếp, chẳng hạn cập nhật cài đặt CLI global do pnpm quản lý bằng `nb self update`
- `proxy.nginx-driver` và `proxy.caddy-driver` lưu driver mặc định mà từng provider sử dụng
- `proxy.nb-cli-root` và `proxy.upstream-host` là các thiết lập override proxy nâng cao. Với hầu hết env `local` hoặc `docker` do CLI quản lý, giá trị mặc định là đủ
- Nếu bạn chỉ muốn đổi driver proxy đang hoạt động, dùng `nb proxy nginx use` hoặc `nb proxy caddy use` thường rõ ràng hơn là tự đặt khóa cấu hình

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
