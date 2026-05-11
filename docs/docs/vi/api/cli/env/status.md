---
title: "nb env status"
description: "Tài liệu lệnh nb env status: hiển thị trạng thái của env hiện tại, một env hoặc tất cả env."
keywords: "nb env status,NocoBase CLI,trạng thái môi trường,API Base URL"
---

# nb env status

Hiển thị trạng thái env. Theo mặc định, lệnh kiểm tra env hiện tại. Bạn cũng có thể kiểm tra một env cụ thể, hoặc dùng `--all` để kiểm tra tất cả env.

Lệnh này in ra bảng trạng thái rút gọn gồm `Env`, `Status` và `API Base URL`.

## Cách dùng


nb env status [name] [flags]

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| [name] | string | Env name to inspect; uses the current env if omitted |
| --all | boolean | Show status for all configured envs |
| --json-output | boolean | Output the result as JSON |

`[name]` and `--all` cannot be used together.

## Status values

`Status` là kết quả sau khi CLI kiểm tra env đích. Các giá trị thường gặp gồm:

- `ok`: env có thể truy cập và xác thực thành công
- `auth failed`: có thể truy cập API nhưng xác thực thất bại
- `unreachable`: không thể kết nối tới địa chỉ đích
- `unconfigured`: cấu hình env chưa đầy đủ
- `missing`: ứng dụng được quản lý cho env này không còn tồn tại

## Ví dụ


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## Lệnh liên quan

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
