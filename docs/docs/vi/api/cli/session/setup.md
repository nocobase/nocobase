---
title: "nb session setup"
description: "Tài liệu lệnh nb session setup: cài đặt tích hợp shell hoặc runtime cho `NB_SESSION_ID`."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,tích hợp shell"
---

# nb session setup

Cài đặt tích hợp phiên cho `NB_SESSION_ID`.

Lệnh này sẽ phát hiện shell hiện tại, hoặc dùng shell bạn truyền qua `--shell`, rồi ghi file khởi tạo tương ứng để các phiên shell mới tự động nhận `NB_SESSION_ID`.

Nếu phát hiện cấu hình opencode trên máy, lệnh cũng sẽ ghi tích hợp plugin tương ứng để runtime agent có thể tự chèn `NB_SESSION_ID` của riêng nó.

## Cách dùng


nb session setup [flags]

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Ghi chú

Trong hầu hết trường hợp, bạn chỉ cần chạy lệnh này một lần.

Sau đó, hãy mở một phiên shell mới hoặc nạp lại profile để `NB_SESSION_ID` được khởi tạo tự động.

Trong các runtime agent như Codex, nếu đã có biến ngữ cảnh như `CODEX_THREAD_ID`, CLI sẽ ưu tiên tái sử dụng giá trị đó trước.

## Ví dụ


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## Lệnh liên quan

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
