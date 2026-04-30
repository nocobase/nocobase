---
title: "nb env use"
description: "Tài liệu lệnh nb env use: chuyển NocoBase CLI env hiện tại."
keywords: "nb env use,NocoBase CLI,Chuyển môi trường,current env"
---

# nb env use

Chuyển CLI env hiện tại. Sau đó các lệnh không truyền `--env` sẽ mặc định dùng env này.

## Cách dùng

```bash
nb env use <name>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<name>` | string | Tên môi trường đã cấu hình |

## Ví dụ

```bash
nb env use local
```

## Lệnh liên quan

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
