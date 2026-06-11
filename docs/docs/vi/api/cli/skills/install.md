---
title: "nb skills install"
description: "Tài liệu lệnh nb skills install: cài đặt NocoBase AI coding skills toàn cục."
keywords: "nb skills install,NocoBase CLI,Cài đặt skills"
---

# nb skills install

Cài đặt NocoBase AI coding skills toàn cục. Nếu skills đã được cài, lệnh sẽ không cập nhật.

## Cách dùng

```bash
nb skills install [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận cài đặt |
| `--json` | boolean | Output dạng JSON |
| `--verbose` | boolean | Hiển thị output cài đặt chi tiết |

## Ví dụ

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Lệnh liên quan

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
