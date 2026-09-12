---
title: "nb app autostart disable"
description: "Tài liệu tham khảo nb app autostart disable: tắt tự khởi động ứng dụng cho một env."
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

Tắt cờ tự khởi động ứng dụng cho một env.

Sau khi tắt, env đó sẽ không còn tham gia vào `nb app autostart run`. Lệnh này không trực tiếp dừng một ứng dụng đang chạy sẵn. Nếu bạn cũng muốn dừng runtime hiện tại, hãy dùng `nb app stop` riêng.

## Cách dùng

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env sẽ bị loại khỏi tự khởi động. Nếu bỏ qua, sẽ dùng env hiện tại |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận tương tác khi `--env` được truyền rõ ràng và trỏ tới env khác env hiện tại |

## Ví dụ

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Ghi chú

Lệnh này chỉ thay đổi cờ tự khởi động đã lưu. Nó không trực tiếp dừng ứng dụng. Nếu một env vốn đã không bật tự khởi động, lệnh này chỉ giữ nguyên trạng thái đã tắt đó.

Giống như `enable`, CLI chỉ kiểm tra xác nhận khác env khi `--env` được truyền tường minh. Trong terminal không tương tác hoặc luồng AI agent, hãy tự thêm `--yes` khi cần.

## Lệnh liên quan

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
