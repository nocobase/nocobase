---
title: "nb self update"
description: "Tham khảo lệnh nb self update: cập nhật NocoBase CLI được cài qua npm global."
keywords: "nb self update,NocoBase CLI,cập nhật,tự cập nhật"
---

# nb self update

Khi CLI hiện tại được quản lý bởi cài đặt npm global tiêu chuẩn, lệnh này cập nhật NocoBase CLI đã cài.

## Cách dùng

```bash
nb self update [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--channel` | string | Channel phát hành để cập nhật, mặc định `auto`; có thể chọn `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận cập nhật |
| `--json` | boolean | Đầu ra dạng JSON |
| `--verbose` | boolean | Hiển thị thông tin cập nhật chi tiết |

## Ví dụ

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Lệnh liên quan

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
