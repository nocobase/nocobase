---
title: "nb env use"
description: "Tài liệu lệnh nb env use: chuyển NocoBase CLI env hiện tại."
keywords: "nb env use,NocoBase CLI,Chuyển môi trường,current env"
---

# nb env use

Chuyển CLI env hiện tại. Sau đó các lệnh không truyền `--env` sẽ mặc định dùng env này.

Khi session mode đã bật cho shell hoặc runtime hiện tại, thay đổi này chỉ ảnh hưởng tới phiên hiện tại.

Khi session mode chưa bật, thay đổi này sẽ fallback sang việc cập nhật `last env` toàn cục. Trong trường hợp đó, các terminal hoặc runtime agent khác không có cô lập phiên cũng có thể bị ảnh hưởng.

## Cách dùng

```bash
nb env use <name>
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<name>` | string | Tên env đã cấu hình để chuyển sang |

## Ví dụ

```bash
nb env use local
```

## Lệnh liên quan

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
