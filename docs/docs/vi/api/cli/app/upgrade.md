---
title: "nb app upgrade"
description: "Tài liệu lệnh nb app upgrade: cập nhật source code hoặc image rồi khởi động lại ứng dụng NocoBase được chỉ định."
keywords: "nb app upgrade,NocoBase CLI,Nâng cấp,Cập nhật,Docker image"
---

# nb app upgrade

Nâng cấp ứng dụng NocoBase được chỉ định. Cài đặt npm/Git sẽ làm mới source code đã lưu và khởi động lại bằng quickstart; cài đặt Docker sẽ làm mới image đã lưu và rebuild container ứng dụng.

## Cách dùng

```bash
nb app upgrade [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn nâng cấp, bỏ qua thì dùng env hiện tại |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
| `--skip-code-update`, `-s` | boolean | Khởi động lại bằng source code hoặc Docker image đã lưu, không tải bản cập nhật mới |
| `--version` | string | Ghi đè `downloadVersion` đã lưu; khi nâng cấp thành công, phiên bản mới sẽ được ghi ngược lại vào cấu hình env |
| `--verbose` | boolean | Hiển thị output của lệnh update và restart bên dưới |

## Ví dụ

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

## Lệnh liên quan

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
