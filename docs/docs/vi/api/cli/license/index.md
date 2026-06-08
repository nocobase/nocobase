---
title: "nb license"
description: "Tài liệu lệnh nb license: quản lý giấy phép thương mại và các plugin được cấp phép của NocoBase."
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

Quản lý giấy phép thương mại của NocoBase, bao gồm kích hoạt bằng license key hiện có, Instance ID, trạng thái giấy phép và các plugin được cấp phép.

## Cách dùng

```bash
nb license <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb license activate`](./activate.md) | Kích hoạt giấy phép thương mại cho env hiện tại bằng license key hiện có |
| [`nb license id`](./id.md) | Hiển thị hoặc tạo instance ID cho env hiện tại |
| [`nb license status`](./status.md) | Hiển thị trạng thái giấy phép thương mại của env hiện tại |
| [`nb license plugins`](./plugins/index.md) | Quản lý các plugin thương mại được giấy phép hiện tại cho phép |

## Ví dụ

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Lệnh liên quan

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
