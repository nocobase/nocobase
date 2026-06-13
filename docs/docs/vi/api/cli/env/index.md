---
title: "nb env"
description: "Tài liệu tham khảo lệnh nb env: quản lý các env đã lưu của NocoBase CLI, bao gồm thêm, xem env hiện tại, kiểm tra trạng thái, chuyển đổi, cập nhật, xác thực và xóa."
keywords: "nb env,NocoBase CLI,quản lý môi trường,env,current env,xác thực,OpenAPI"
---

# nb env

Quản lý các env đã lưu của NocoBase CLI. Một env lưu trữ thông tin kết nối và thông tin runtime cục bộ, như địa chỉ API, thông tin xác thực, đường dẫn ứng dụng cục bộ và cấu hình cơ sở dữ liệu.

Từ phiên bản này, CLI tách hai khái niệm:

- `current env`: env hiện đang được shell hoặc runtime agent hiện tại sử dụng, được cô lập bằng `NB_SESSION_ID` khi có thể
- `last env`: env cuối cùng được dùng ở phạm vi toàn cục, được dùng làm giá trị dự phòng khi session mode chưa được bật

## Cách dùng

```bash
nb env <command>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb env add`](./add.md) | Lưu một endpoint API của NocoBase và chuyển sang env này |
| [`nb env current`](./current.md) | Xem env hiện đang có hiệu lực |
| [`nb env update`](./update.md) | Cập nhật cấu hình của env đã lưu và tự động xử lý các bước đồng bộ tiếp theo khi cần |
| [`nb env list`](./list.md) | Liệt kê các env đã được cấu hình |
| [`nb env status`](./status.md) | Xem trạng thái của env hiện tại, một env được chỉ định hoặc tất cả env |
| [`nb env info`](./info.md) | Xem thông tin chi tiết của một env |
| [`nb env remove`](./remove.md) | Xóa cấu hình env sau khi dừng runtime được quản lý |
| [`nb env auth`](./auth.md) | Thực hiện đăng nhập OAuth cho một env đã lưu |
| [`nb env use`](./use.md) | Chuyển env hiện tại |

## Ví dụ

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

Thông thường nên bật session mode theo mặc định. Nhờ đó, `current env` trong các terminal, shell hoặc runtime agent khác nhau có thể được cô lập và không ảnh hưởng lẫn nhau khi chạy song song.

Nếu session mode chưa được bật, `nb env use` sẽ cập nhật `last env` toàn cục, và các phiên khác không có cơ chế cô lập session cũng sẽ bị ảnh hưởng.

Xem [`nb session setup`](../session/setup.md) để biết cách bật.

## Lệnh liên quan

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
