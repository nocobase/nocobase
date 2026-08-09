---
title: "nb portal dev"
description: "Tài liệu tham khảo lệnh nb portal dev: khởi động chế độ phát triển cho thư mục mã nguồn cục bộ của Portal."
keywords: "nb portal dev,NocoBase CLI,Portal,chế độ phát triển,phát triển cục bộ"
---

# nb portal dev

Khởi động chế độ phát triển cho thư mục mã nguồn cục bộ của Portal đã chỉ định. Thường dùng sau khi chạy [`nb portal create`](./create.md) hoặc [`nb portal pull`](./pull.md).

Khi chạy, lệnh sẽ làm mới `.env` và `.env.local` trong thư mục mã nguồn cục bộ, sau đó chạy `pnpm dev` ngay trong thư mục đó.

## Cách dùng

```bash
nb portal dev <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<portal>` | string | Tên hoặc slug của Portal |
| `--env`, `-e` | string | Tên CLI env. Nếu bỏ qua sẽ dùng env hiện tại |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận tương tác khi `--env` được chỉ định khác với env hiện tại |

## Ví dụ

Khởi động chế độ phát triển cho Portal trong env hiện tại:

```bash
nb portal dev customer
```

Khởi động chế độ phát triển cho Portal trong env đã chỉ định:

```bash
nb portal dev customer --env dev --yes
```

## Ghi chú

`dev` khởi động dịch vụ phát triển từ thư mục mã nguồn cục bộ của Portal. Nó không tạo bản ghi Portal, cũng không kéo mã nguồn từ xa; nếu thư mục mã nguồn cục bộ chưa tồn tại, hãy dùng [`nb portal create`](./create.md) hoặc [`nb portal pull`](./pull.md) trước.

Thư mục mã nguồn cục bộ phải chứa `package.json`. Env kiểu `ssh` hiện chưa hỗ trợ khởi động chế độ phát triển của Portal.

## Lệnh liên quan

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
