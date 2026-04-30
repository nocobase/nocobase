---
title: "nb api Lệnh động"
description: "Tài liệu nb api lệnh động: các lệnh CLI API được sinh từ OpenAPI Schema của NocoBase."
keywords: "nb api Lệnh động,NocoBase CLI,OpenAPI,swagger"
---

# nb api Lệnh động

Bên cạnh [`nb api resource`](./resource/index.md), trong `nb api` còn có một nhóm lệnh được sinh động từ OpenAPI Schema của ứng dụng NocoBase. Các lệnh này được sinh và cache lần đầu khi bạn chạy [`nb env add`](../env/add.md) hoặc [`nb env update`](../env/update.md).

## Các nhóm lệnh phổ biến

| Nhóm lệnh | Mô tả |
| --- | --- |
| `nb api acl` | Quản lý quyền: role, quyền tài nguyên và quyền thao tác |
| `nb api api-keys` | Quản lý API Key |
| `nb api app` | Quản lý ứng dụng |
| `nb api authenticators` | Quản lý xác thực: mật khẩu, SMS, SSO,... |
| `nb api data-modeling` | Mô hình dữ liệu: data source, bảng và field |
| `nb api file-manager` | Quản lý file: storage và attachment |
| `nb api flow-surfaces` | Bố cục trang: page, block, field và action |
| `nb api system-settings` | Cài đặt hệ thống: tiêu đề, Logo, ngôn ngữ,... |
| `nb api theme-editor` | Quản lý theme: màu sắc, kích thước và chuyển đổi theme |
| `nb api workflow` | Workflow: quản lý quy trình tự động hóa |

Các nhóm và lệnh khả dụng thực tế phụ thuộc vào phiên bản ứng dụng NocoBase và các plugin đã bật. Chạy lệnh dưới đây để xem các lệnh ứng dụng hiện đang hỗ trợ:

```bash
nb api --help
nb api <topic> --help
```

## Tham số request body

Lệnh động có request body hỗ trợ:

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--body` | string | Request body dạng chuỗi JSON |
| `--body-file` | string | Đường dẫn tới file JSON |

`--body` và `--body-file` loại trừ lẫn nhau.

## Lệnh liên quan

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
