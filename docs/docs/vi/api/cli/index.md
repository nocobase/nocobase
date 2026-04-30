---
title: "NocoBase CLI"
description: "Tài liệu NocoBase CLI (lệnh nb): khởi tạo, quản lý env, chạy ứng dụng, source, database, plugin, API, tự cập nhật CLI và quản lý Skills."
keywords: "NocoBase CLI,nb,Dòng lệnh,Tham khảo lệnh,Quản lý env,Quản lý plugin,API"
---

# NocoBase CLI

## Mô tả

NocoBase CLI (`nb`) là điểm vào dòng lệnh của NocoBase, dùng để khởi tạo, kết nối và quản lý các ứng dụng NocoBase trong workspace cục bộ.

CLI hỗ trợ hai con đường khởi tạo phổ biến:

- Kết nối tới ứng dụng NocoBase có sẵn và lưu thành CLI env
- Cài đặt ứng dụng NocoBase mới qua Docker, npm hoặc Git rồi lưu thành CLI env

Khi tạo ứng dụng cục bộ mới, [`nb init`](./init.md) cũng có thể cài đặt hoặc cập nhật NocoBase AI coding skills. Nếu bạn muốn bỏ qua bước này, hãy dùng `--skip-skills`.

## Cách dùng

```bash
nb [command]
```

Lệnh gốc chủ yếu để hiển thị help và phân phối lời gọi tới các nhóm lệnh hoặc lệnh độc lập.

## Nhóm lệnh (Topics)

Các nhóm lệnh sau hiển thị trong `nb --help`:

| Nhóm lệnh | Mô tả |
| --- | --- |
| [`nb api`](./api/index.md) | Gọi NocoBase API thông qua CLI. |
| [`nb app`](./app/index.md) | Quản lý runtime ứng dụng: khởi động, dừng, khởi động lại, log và nâng cấp. |
| [`nb db`](./db/index.md) | Quản lý database tích hợp của env đã chọn. |
| [`nb env`](./env/index.md) | Quản lý môi trường, trạng thái, chi tiết và lệnh runtime của project NocoBase. |
| [`nb plugin`](./plugin/index.md) | Quản lý plugin của env NocoBase đã chọn. |
| [`nb scaffold`](./scaffold/index.md) | Sinh scaffold để phát triển plugin NocoBase. |
| [`nb self`](./self/index.md) | Kiểm tra hoặc cập nhật chính NocoBase CLI. |
| [`nb skills`](./skills/index.md) | Kiểm tra hoặc đồng bộ NocoBase AI coding skills cho workspace hiện tại. |
| [`nb source`](./source/index.md) | Quản lý dự án source code cục bộ: tải về, develop, build và test. |

## Lệnh (Commands)

Các lệnh độc lập do lệnh gốc trực tiếp đưa ra:

| Lệnh | Mô tả |
| --- | --- |
| [`nb init`](./init.md) | Khởi tạo NocoBase để coding agent có thể kết nối và làm việc. |

## Xem help

Xem help của lệnh gốc:

```bash
nb --help
```

Xem help của một lệnh hoặc nhóm lệnh:

```bash
nb init --help
nb app --help
nb api resource --help
```

## Ví dụ

Khởi tạo tương tác:

```bash
nb init
```

Khởi tạo bằng form trên trình duyệt:

```bash
nb init --ui
```

Tạo ứng dụng Docker không tương tác:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Kết nối ứng dụng có sẵn:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Khởi động ứng dụng và làm mới các lệnh runtime:

```bash
nb app start -e app1
nb env update app1
```

Gọi API:

```bash
nb api resource list --resource users -e app1
```

## Biến môi trường

Các biến môi trường sau ảnh hưởng đến hành vi CLI:

| Biến | Mô tả |
| --- | --- |
| `NB_CLI_ROOT` | Thư mục gốc nơi CLI lưu cấu hình `.nocobase` và file ứng dụng cục bộ. Mặc định là home directory của bạn. |
| `NB_LOCALE` | Ngôn ngữ của CLI prompt và UI khởi tạo cục bộ, hỗ trợ `en-US` và `zh-CN`. |

Ví dụ:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## File cấu hình

File cấu hình mặc định:

```text
~/.nocobase/config.json
```

Sau khi đặt `NB_CLI_ROOT=/your/workspace`, đường dẫn cấu hình sẽ thành:

```text
/your/workspace/.nocobase/config.json
```

CLI cũng đọc tương thích cấu hình project cũ trong thư mục làm việc hiện tại.

Cache lệnh runtime được lưu tại:

```text
.nocobase/versions/<hash>/commands.json
```

File này được [`nb env update`](./env/update.md) sinh ra hoặc làm mới, dùng để cache các lệnh runtime đồng bộ từ ứng dụng đích.

## Liên kết liên quan

- [Bắt đầu nhanh](../../ai/quick-start.mdx)
- [Cài đặt, nâng cấp và di chuyển](../../ai/install-upgrade-migration.mdx)
- [Biến môi trường toàn cục](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Phát triển plugin](../../plugin-development/index.md)
