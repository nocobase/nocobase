---
title: "nb proxy caddy info"
description: "Tài liệu tham khảo lệnh nb proxy caddy info: hiển thị driver provider Caddy hiện tại, các đường dẫn cấu hình và chi tiết runtime."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,đường dẫn,cấu hình"
---

# nb proxy caddy info

Hiển thị driver provider Caddy hiện tại, các đường dẫn cấu hình và chi tiết runtime.

## Cách dùng

```bash
nb proxy caddy info
```

## Kết quả đầu ra

Kết quả đầu ra thường bao gồm các trường sau:

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` hoặc `container`
- `image`

Trong đó:

- với driver `local`, kết quả sẽ hiển thị `caddyBinary`
- với driver `docker`, kết quả sẽ hiển thị `container` và `image`

## Ví dụ

```bash
nb proxy caddy info
```

## Lệnh liên quan

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
