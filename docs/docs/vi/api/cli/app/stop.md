---
title: 'nb app stop'
description: 'Tham khảo lệnh nb app stop: dừng ứng dụng NocoBase của env được chỉ định, và nếu cần thì đồng thời dọn dẹp container cơ sở dữ liệu tích hợp do CLI quản lý.'
keywords: 'nb app stop,NocoBase CLI,dừng ứng dụng,Docker,with-db,cơ sở dữ liệu tích hợp'
---

# nb app stop

Dừng ứng dụng NocoBase của env được chỉ định. Với cài đặt npm/Git, lệnh này sẽ dừng tiến trình ứng dụng cục bộ; với cài đặt Docker, lệnh này sẽ dọn dẹp container ứng dụng đã lưu.

Nếu bạn truyền `--with-db` và env này sử dụng cơ sở dữ liệu tích hợp do CLI quản lý, lệnh cũng sẽ đồng thời dọn dẹp container cơ sở dữ liệu. Nếu env này dùng cơ sở dữ liệu bên ngoài, các tài nguyên cơ sở dữ liệu sẽ không bị tác động.

## Cách dùng

```bash
nb app stop [flags]
```

## Tham số

| Tham số       | Kiểu    | Mô tả                                                                                  |
| ------------- | ------- | -------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Tên CLI env cần dừng; nếu bỏ qua thì dùng env hiện tại                                 |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận tương tác khi env được chỉ định rõ bằng `--env` khác với env hiện tại  |
| `--with-db`   | boolean | Đồng thời dọn dẹp container cơ sở dữ liệu khi có cơ sở dữ liệu tích hợp do CLI quản lý |
| `--verbose`   | boolean | Hiển thị đầu ra của các lệnh local hoặc Docker nền tảng                                |

## Ví dụ

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Giải thích

CLI chỉ kiểm tra env được chỉ định có khớp với env hiện tại hay không khi bạn truyền `--env` một cách tường minh. Nếu bạn chỉ định rõ một env khác, terminal tương tác sẽ yêu cầu xác nhận trước; trong terminal không tương tác hoặc trong bối cảnh AI agent, bạn cần tự thêm rõ `--yes`, hoặc chạy `nb env use <name>` trước rồi thử lại.

`--with-db` chỉ ảnh hưởng đến các container cơ sở dữ liệu tích hợp do CLI quản lý. Thông thường, nếu bạn chỉ muốn dừng chính ứng dụng, bạn không cần thêm tham số này; chỉ thêm nó khi bạn cũng muốn dừng runtime cơ sở dữ liệu tích hợp trên máy hiện tại.

Lệnh này chỉ có thể thao tác với runtime local hoặc Docker trên máy hiện tại. Nếu một env chỉ là kết nối HTTP API, hoặc là một SSH env được dành sẵn, thì `nb app stop` không thể thay bạn dừng từ xa.

## Lệnh liên quan

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
