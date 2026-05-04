---
title: "nb license activate"
description: "Tài liệu lệnh nb license activate: kích hoạt giấy phép thương mại của NocoBase cho một env đã chọn."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Kích hoạt giấy phép thương mại cho một env đã chọn. Bạn có thể truyền trực tiếp license key hiện có, hoặc yêu cầu và kích hoạt giấy phép trực tuyến.

## Cách dùng

```bash
nb license activate [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua thì dùng env hiện tại |
| `--key` | string | Truyền trực tiếp license key hiện có |
| `--key-file` | string | Đọc license key từ file |
| `--online` | boolean | Yêu cầu giấy phép trực tuyến và kích hoạt nó |
| `--account` | string | Tài khoản dịch vụ cấp phép dùng cho kích hoạt trực tuyến |
| `--password` | string | Mật khẩu dịch vụ cấp phép dùng cho kích hoạt trực tuyến |
| `--desc` | string | Tên ứng dụng dùng cho kích hoạt trực tuyến |
| `--yes` | boolean | Xác nhận rằng thông tin đã gửi là đúng và chính xác |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Ghi chú

Khi dùng kích hoạt trực tuyến, CLI sẽ yêu cầu một license key từ dịch vụ cấp phép bằng instance ID và URL ứng dụng của env hiện tại.

## Lệnh liên quan

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
