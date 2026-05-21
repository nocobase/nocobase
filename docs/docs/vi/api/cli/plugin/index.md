---
title: "nb plugin"
description: "Tài liệu lệnh nb plugin: quản lý plugin của env NocoBase đã chọn."
keywords: "nb plugin,NocoBase CLI,Quản lý plugin,enable,disable,list"
---

# nb plugin

Quản lý plugin của env NocoBase đã chọn. Env npm/Git sẽ chạy lệnh plugin cục bộ, env Docker sẽ chạy trong container ứng dụng đã lưu, env HTTP sẽ fallback sang API khi khả dụng.

## Cách dùng

```bash
nb plugin <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb plugin list`](./list.md) | Liệt kê các plugin đã cài |
| [`nb plugin enable`](./enable.md) | Bật một hoặc nhiều plugin |
| [`nb plugin disable`](./disable.md) | Tắt một hoặc nhiều plugin |

## Ví dụ

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Lệnh liên quan

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
