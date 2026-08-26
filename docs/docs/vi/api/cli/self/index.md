---
title: "nb self"
description: "Tham khảo lệnh nb self: kiểm tra hoặc cập nhật NocoBase CLI đã cài."
keywords: "nb self,NocoBase CLI,tự cập nhật,kiểm tra phiên bản"
---

# nb self

Kiểm tra hoặc cập nhật NocoBase CLI đã cài.

## Cách dùng

```bash
nb self <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb self check`](./check.md) | Kiểm tra phiên bản CLI hiện tại và khả năng tự cập nhật |
| [`nb self update`](./update.md) | Cập nhật NocoBase CLI cài qua npm global |

## Ví dụ

```bash
nb self check
nb self check --json
nb self update --yes
```

## Lệnh liên quan

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
