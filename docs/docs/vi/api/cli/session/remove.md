---
title: "nb session remove"
description: "Tài liệu lệnh nb session remove: gỡ tích hợp shell hoặc runtime cho `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,gỡ tích hợp phiên"
---

# nb session remove

Gỡ tích hợp phiên cho `NB_SESSION_ID`.

Lệnh này dọn sạch cấu hình shell đã được ghi trước đó bởi [`nb session setup`](./setup.md). Nếu phát hiện tích hợp plugin của opencode, tích hợp đó cũng sẽ bị gỡ.

## Cách dùng


nb session remove [flags]

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Ví dụ


nb session remove
nb session remove --shell zsh

## Lệnh liên quan

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
