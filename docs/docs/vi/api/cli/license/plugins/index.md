---
title: "nb license plugins"
description: "Tài liệu lệnh nb license plugins: kiểm tra hoặc đồng bộ các plugin thương mại được giấy phép hiện tại cho phép."
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

Kiểm tra hoặc đồng bộ các plugin thương mại được giấy phép hiện tại cho phép.

## Cách dùng

```bash
nb license plugins <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb license plugins list`](./list.md) | Hiển thị các plugin thương mại gắn với giấy phép hiện tại |
| [`nb license plugins sync`](./sync.md) | Đồng bộ các plugin thương mại được giấy phép hiện tại cho phép |
| [`nb license plugins clean`](./clean.md) | Xóa các plugin thương mại đã tải về cho env hiện tại |

## Ví dụ

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Lệnh liên quan

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
