---
title: "nb license activate"
description: "Tài liệu lệnh nb license activate: kích hoạt license key thương mại NocoBase hiện có cho một env đã chọn."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Kích hoạt license key thương mại hiện có cho một env đã chọn. Bạn có thể truyền trực tiếp, đọc từ file, hoặc dán nó trong một terminal tương tác.

## Cách dùng

```bash
nb license activate [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua thì dùng env hiện tại |
| `--key` | string | Truyền trực tiếp license key thương mại hiện có |
| `--key-file` | string | Đọc license key thương mại hiện có từ file |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Ghi chú

Khi chạy ở chế độ tương tác, CLI sẽ hiển thị Hostname và Instance ID hiện tại trước, rồi yêu cầu bạn dán trực tiếp license key hoặc nhập đường dẫn tới file key. Thông tin đó giúp bạn xác nhận giấy phép đang được gắn với đúng instance.

Sau khi kích hoạt thành công, hãy khởi động lại ứng dụng để giấy phép và trạng thái plugin thương mại thực sự có hiệu lực; trước khi khởi động lại, CLI sẽ tự động đồng bộ các plugin thương mại được giấy phép hiện tại cho phép:

```bash
nb app restart
```

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

## Lệnh liên quan

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
