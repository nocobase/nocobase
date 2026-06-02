---
title: "nb env"
description: "Tài liệu lệnh nb env: quản lý NocoBase CLI env, gồm thêm, xem env hiện tại, kiểm tra trạng thái, chuyển, xác thực và xóa."
keywords: "nb env,NocoBase CLI,Quản lý env,env,env hiện tại,Xác thực,OpenAPI"
---

# nb env

Quản lý các NocoBase CLI env đã lưu. Mỗi env lưu địa chỉ API, thông tin xác thực, đường dẫn ứng dụng cục bộ, cấu hình database và cache lệnh runtime.

Trong mô hình hiện tại, CLI tách thành hai khái niệm:

- `current env`: env đang được shell hoặc runtime agent hiện tại sử dụng, được cô lập bằng `NB_SESSION_ID` khi có sẵn
- `last env`: env được dùng gần nhất trên toàn cục, dùng làm fallback khi session mode chưa được bật

## Cách dùng


nb env <command>

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb env add`](./add.md) | Lưu một NocoBase API endpoint và chuyển sang env đó |
| [`nb env current`](./current.md) | Hiển thị env đang có hiệu lực |
| [`nb env update`](./update.md) | Làm mới OpenAPI Schema và cache lệnh runtime từ ứng dụng |
| [`nb env list`](./list.md) | Liệt kê các env đã cấu hình |
| [`nb env status`](./status.md) | Hiển thị trạng thái của env hiện tại, một env hoặc tất cả env |
| [`nb env info`](./info.md) | Xem thông tin chi tiết của một env |
| [`nb env remove`](./remove.md) | Dừng runtime được CLI quản lý nếu có, rồi xóa cấu hình env |
| [`nb env auth`](./auth.md) | Đăng nhập OAuth cho env đã lưu |
| [`nb env use`](./use.md) | Chuyển env hiện tại |

## Ví dụ


nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1

## Session mode

Session mode là khuyến nghị mặc định. Nó giữ `current env` tách biệt giữa các terminal, shell và runtime agent khác nhau, để công việc song song không ảnh hưởng lẫn nhau.

Khi session mode chưa được bật, `nb env use` sẽ cập nhật `last env` toàn cục, và các phiên khác không có cô lập cũng có thể bị ảnh hưởng.

Bật nó bằng [`nb session setup`](../session/setup.md).

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
