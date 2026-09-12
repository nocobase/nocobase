---
title: 'NocoBase CLI'
description: 'Tài liệu tham khảo NocoBase CLI (lệnh nb): khởi tạo, sao lưu và khôi phục, cấu hình, quản lý môi trường, chạy ứng dụng, mã nguồn, cơ sở dữ liệu, plugin, giấy phép thương mại, API, tự cập nhật CLI và quản lý Skills.'
keywords: 'NocoBase CLI,nb,dòng lệnh,tài liệu lệnh,sao lưu,khôi phục,quản lý môi trường,quản lý plugin,giấy phép thương mại,API'
---

# NocoBase CLI

## Mô tả

NocoBase CLI (`nb`) là điểm vào dòng lệnh của NocoBase, dùng để khởi tạo, kết nối và quản lý các ứng dụng NocoBase trong không gian làm việc cục bộ.

Nó hỗ trợ hai cách khởi tạo phổ biến:

- Kết nối một ứng dụng NocoBase hiện có và lưu nó thành CLI env
- Cài đặt một ứng dụng NocoBase mới thông qua Docker, npm hoặc Git, rồi lưu nó thành CLI env

Khi tạo một ứng dụng cục bộ mới, [`nb init`](./init.md) cũng có thể cài đặt hoặc cập nhật các AI coding skills của NocoBase. Nếu cần bỏ qua bước này, bạn có thể dùng `--skip-skills`.

## Cách dùng

```bash
nb [command]
```

Bản thân lệnh gốc chủ yếu dùng để hiển thị trợ giúp và phân phối lời gọi đến các nhóm lệnh hoặc lệnh độc lập.

## Nhóm lệnh (Topics)

`nb --help` sẽ hiển thị các nhóm lệnh sau:

| Nhóm lệnh                            | Mô tả                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`nb api`](./api/index.md)           | Gọi API NocoBase thông qua CLI.                                                             |
| [`nb app`](./app/index.md)           | Quản lý trạng thái chạy của ứng dụng: khởi động, dừng, khởi động lại, nhật ký và nâng cấp.  |
| [`nb backup`](./backup/index.md)     | Tạo bản sao lưu và tải xuống cục bộ, hoặc khôi phục tệp sao lưu cục bộ vào env mục tiêu.    |
| [`nb config`](./config/index.md)     | Quản lý cấu hình mặc định của CLI.                                                          |
| [`nb db`](./db/index.md)             | Quản lý cơ sở dữ liệu tích hợp của env đã chọn.                                             |
| [`nb env`](./env/index.md)           | Quản lý môi trường dự án NocoBase, env hiện tại, trạng thái, chi tiết và các lệnh runtime.  |
| [`nb license`](./license/index.md)   | Quản lý giấy phép thương mại và các plugin được cấp phép.                                   |
| [`nb plugin`](./plugin/index.md)     | Quản lý các plugin của env NocoBase đã chọn.                                                |
| [`nb scaffold`](./scaffold/index.md) | Tạo scaffold phát triển plugin NocoBase.                                                    |
| [`nb self`](./self/index.md)         | Kiểm tra hoặc cập nhật chính NocoBase CLI.                                                  |
| [`nb session`](./session/index.md)   | Cấu hình `NB_SESSION_ID` để current env được tách biệt theo shell hoặc agent runtime.       |
| [`nb skills`](./skills/index.md)     | Kiểm tra hoặc đồng bộ các AI coding skills của NocoBase trong không gian làm việc hiện tại. |
| [`nb source`](./source/index.md)     | Quản lý dự án mã nguồn cục bộ: tải xuống, phát triển, build và kiểm thử.                    |

## Lệnh (Commands)

Các lệnh độc lập hiện được lệnh gốc hiển thị trực tiếp:

| Lệnh                   | Mô tả                                                          |
| ---------------------- | -------------------------------------------------------------- |
| [`nb init`](./init.md) | Khởi tạo NocoBase để coding agent có thể kết nối và hoạt động. |

## Xem trợ giúp

Xem trợ giúp của lệnh gốc:

```bash
nb --help
```

Xem trợ giúp của một lệnh hoặc nhóm lệnh:

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
```

## Ví dụ

Khởi tạo tương tác:

```bash
nb init
```

Khởi tạo bằng biểu mẫu trên trình duyệt:

```bash
nb init --ui
```

Tạo một ứng dụng Docker theo cách không tương tác:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Kết nối ứng dụng hiện có:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env status
```

Đồng bộ lại trạng thái env sau khi khởi động ứng dụng:

```bash
nb app start -e app1
nb env update app1
```

Gọi API:

```bash
nb api resource list --resource users -e app1
```

Xem cấu hình mặc định của CLI:

```bash
nb config list
nb config get docker.network
```

Xem trạng thái giấy phép thương mại:

```bash
nb license status -e app1
nb license plugins list -e app1
```

Tạo và tải xuống bản sao lưu:

```bash
nb backup create -e app1 --output ./backups
```

Khôi phục bản sao lưu cục bộ:

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Biến môi trường

Các biến môi trường sau sẽ ảnh hưởng đến hành vi của CLI:

| Biến            | Mô tả                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `NB_CLI_ROOT`   | Thư mục gốc nơi CLI lưu cấu hình `.nocobase` và các tệp ứng dụng cục bộ. Mặc định là thư mục home của người dùng hiện tại.       |
| `NB_LOCALE`     | Ngôn ngữ gợi ý của CLI và ngôn ngữ UI khởi tạo cục bộ, hỗ trợ `en-US` và `zh-CN`.                                                |
| `NB_SESSION_ID` | ID phiên của shell hiện tại hoặc agent runtime. Sau khi được đặt, `nb env use` và `nb env current` sẽ được tách biệt theo phiên. |

Ví dụ:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Tệp cấu hình

Tệp cấu hình mặc định:

```text
~/.nocobase/config.json
```

Sau khi đặt `NB_CLI_ROOT=/your/workspace`, đường dẫn tệp cấu hình sẽ trở thành:

```text
/your/workspace/.nocobase/config.json
```

CLI cũng tương thích với việc đọc cấu hình project cũ trong thư mục làm việc hiện tại.

Bộ nhớ đệm cấp phiên của env hiện tại được lưu tại:

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

Env được dùng gần nhất trên toàn cục được lưu trong trường `lastEnv` của `config.json`. Khi không có `NB_SESSION_ID`, CLI sẽ quay lại giá trị toàn cục này.

Bộ nhớ đệm lệnh runtime được lưu tại:

```text
.nocobase/versions/<hash>/commands.json
```

Tệp này được tạo hoặc làm mới bởi [`nb env update`](./env/update.md), dùng để lưu bộ nhớ đệm các lệnh runtime được đồng bộ từ ứng dụng đích.

## Liên kết liên quan

- [Bắt đầu nhanh](../../ai/quick-start.mdx)
- [Biến môi trường toàn cục](../app/env.md)
- [Xây dựng bằng AI](../../ai-builder/index.md)
- [Phát triển plugin](../../plugin-development/index.md)
