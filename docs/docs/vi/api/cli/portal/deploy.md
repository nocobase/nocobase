---
title: "nb portal deploy"
description: "Tham chiếu lệnh nb portal deploy: build và triển khai workspace Portal được chỉ định."
keywords: "nb portal deploy,NocoBase CLI,Portal,build,triển khai"
---

# nb portal deploy

Build và triển khai workspace Portal được chỉ định. Thường dùng sau khi hoàn tất phát triển cục bộ và cần cập nhật Portal vào env đích.

Khi chạy, lệnh sẽ làm mới `.env` và `.env.local` trong workspace trước, sau đó chạy `pnpm build`. Kết quả build cần bao gồm `dist/client/index.html`.

## Cách dùng

```bash
nb portal deploy <portal> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<portal>` | string | Tên hoặc slug của Portal |
| `--env`, `-e` | string | Tên env CLI. Nếu bỏ qua, dùng env hiện tại |
| `--no-install` | boolean | Bỏ qua `pnpm install` trước khi build |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận tương tác khi `--env` được chỉ định trỏ đến env khác với env hiện tại |

## Ví dụ

Triển khai Portal trong env hiện tại:

```bash
nb portal deploy customer
```

Triển khai Portal trong env chỉ định:

```bash
nb portal deploy customer --env dev --yes
```

Bỏ qua cài đặt dependency, chỉ build lại và triển khai:

```bash
nb portal deploy customer --no-install
```

## Ghi chú

`deploy` dành cho workspace phát triển Portal đã tồn tại. Nếu máy cục bộ chưa có workspace, hãy tạo trước bằng [`nb portal create`](./create.md) hoặc dùng [`nb portal pull`](./pull.md) để kéo từ source storage.

Quá trình triển khai sẽ build Portal từ đường dẫn phát triển được ghi trong cấu hình env CLI, rồi đồng bộ artefact build vào thư mục deploy trong storage của ứng dụng đích.

Triển khai không sửa source storage hoặc cấu hình Git. Các cấu hình này được [`nb portal config`](./config.md) cập nhật vào record Portal từ xa.

## Lệnh liên quan

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
