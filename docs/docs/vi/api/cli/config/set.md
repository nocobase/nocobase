---
title: "nb config set"
description: "Tài liệu lệnh nb config set: thiết lập một giá trị cấu hình CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Thiết lập một giá trị cấu hình CLI. Các khóa được hỗ trợ là `license.pkg-url`, `docker.network` và `docker.container-prefix`.

## Cách dùng

```bash
nb config set <key> <value>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<key>` | string | Khóa cấu hình: `license.pkg-url`, `docker.network` hoặc `docker.container-prefix` |
| `<value>` | string | Giá trị cấu hình; không được để trống |

## Ví dụ

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Ghi chú

Khi đặt `license.pkg-url`, CLI sẽ chuẩn hóa URL để luôn kết thúc bằng `/`.

## Lệnh liên quan

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
