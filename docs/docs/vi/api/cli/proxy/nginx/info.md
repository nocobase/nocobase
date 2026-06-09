---
title: "nb proxy nginx info"
description: "Tài liệu tham khảo lệnh nb proxy nginx info: hiển thị driver provider Nginx hiện tại, các đường dẫn cấu hình và chi tiết runtime."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,đường dẫn,cấu hình"
---

# nb proxy nginx info

Hiển thị driver provider Nginx hiện tại, các đường dẫn cấu hình và chi tiết runtime.

## Cách dùng

```bash
nb proxy nginx info
```

## Kết quả đầu ra

Kết quả đầu ra thường bao gồm các trường sau:

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` hoặc `container`
- `image`

Trong đó:

- với driver `local`, kết quả sẽ hiển thị `nginxBinary`
- với driver `docker`, kết quả sẽ hiển thị `container` và `image`

## Ví dụ

```bash
nb proxy nginx info
```

## Lệnh liên quan

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
