---
title: "nb app autostart enable"
description: "Tài liệu tham khảo nb app autostart enable: bật tự khởi động ứng dụng cho một env local hoặc Docker."
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

Bật cờ tự khởi động ứng dụng cho một env.

Cờ này chỉ áp dụng cho env `local` hoặc `docker` có runtime được CLI quản lý trên máy hiện tại. Lệnh này không khởi động ứng dụng ngay lập tức. Thay vào đó, env sẽ được thêm vào tập hợp mà sau này có thể được khởi chạy bởi `nb app autostart run`.

## Cách dùng

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env sẽ được thêm vào tự khởi động. Nếu bỏ qua, sẽ dùng env hiện tại |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận tương tác khi `--env` được truyền rõ ràng và trỏ tới env khác env hiện tại |

## Ví dụ

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Ghi chú

CLI chỉ kiểm tra xem env đích có khác env hiện tại hay không khi bạn truyền `--env` một cách tường minh. Trong terminal tương tác, nó sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc các luồng AI agent, bạn cần tự thêm `--yes`, hoặc chuyển sang env đích trước bằng `nb env use <name>`.

Nếu env đích không phải runtime `local` hoặc `docker` do CLI quản lý trên máy hiện tại, lệnh sẽ thất bại và không lưu cờ tự khởi động.

## Lệnh liên quan

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
