---
title: "nb skills update"
description: "Tài liệu lệnh nb skills update: cập nhật NocoBase AI coding skills toàn cục."
keywords: "nb skills update,NocoBase CLI,Cập nhật skills"
---

# nb skills update

Cập nhật NocoBase AI coding skills đã cài toàn cục. Lệnh này chỉ cập nhật cài đặt `@nocobase/skills` đã có.

## Cách dùng

```bash
nb skills update [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận cập nhật |
| `--json` | boolean | Output dạng JSON |
| `--verbose` | boolean | Hiển thị output cập nhật chi tiết |

## Ví dụ

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## Lệnh liên quan

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
