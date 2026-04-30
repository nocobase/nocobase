---
title: "nb env add"
description: "Tài liệu lệnh nb env add: lưu địa chỉ API NocoBase và phương thức xác thực, sau đó đặt làm env hiện tại."
keywords: "nb env add,NocoBase CLI,Thêm môi trường,Địa chỉ API,Xác thực"
---

# nb env add

Lưu một NocoBase API endpoint có tên và chuyển CLI sang dùng env đó. Khi chọn phương thức xác thực `oauth`, lệnh sẽ tự động chuyển vào quy trình đăng nhập [`nb env auth`](./auth.md).

## Cách dùng

```bash
nb env add [name] [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `[name]` | string | Tên môi trường; trong TTY nếu bỏ qua sẽ hỏi, ngoài TTY thì bắt buộc |
| `--verbose` | boolean | Hiển thị tiến trình chi tiết khi ghi cấu hình |
| `--locale` | string | Ngôn ngữ CLI prompt: `en-US` hoặc `zh-CN` |
| `--api-base-url`, `-u` | string | Địa chỉ API NocoBase, bao gồm tiền tố `/api` |
| `--auth-type`, `-a` | string | Phương thức xác thực: `token` hoặc `oauth` |
| `--access-token`, `-t` | string | API key hoặc access token dùng cho phương thức `token` |

## Ví dụ

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Lệnh liên quan

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
