---
title: 'nb env proxy'
description: 'Tài liệu tham chiếu cho chủ đề nb env proxy: xem các lệnh con Nginx và Caddy.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,cấu hình proxy'
---

# nb env proxy

Trong NocoBase CLI, `nb env proxy` hiện là một chủ đề. Bản thân lệnh này không còn tự sinh cấu hình nữa. Nó chủ yếu dùng để giúp bạn tìm các lệnh con provider cho Nginx và Caddy.

Nếu ứng dụng của bạn đã được lưu dưới dạng env do CLI quản lý và env đó là `local` hoặc `docker`, thông thường chỉ cần chọn một trong hai lệnh con provider là đủ.

## Cách dùng

```bash
nb env proxy
```

## Nên mở lệnh con nào trước

| Tôi muốn... | Xem tại đây |
| --- | --- |
| Tiếp tục dùng Nginx cho site, chứng chỉ, cache hoặc kiểm soát truy cập | [`nb env proxy nginx`](./nginx.md) |
| Bật HTTPS nhanh hơn và phải tự xử lý ít chi tiết TLS hơn | [`nb env proxy caddy`](./caddy.md) |
| Điều chỉnh các thiết lập env có thể ảnh hưởng đến đầu ra proxy, như `app-port` hoặc `app-public-path` | [`nb env update`](../update.md) |

## Ghi chú

- `nb env proxy` không có cờ riêng
- `nb env proxy nginx` và `nb env proxy caddy` mới là các lệnh thực sự sinh cấu hình
- Cả hai lệnh con chỉ hoạt động với env được quản lý mà runtime của chúng có thể truy cập từ máy hiện tại, tức là `local` hoặc `docker`
- Nếu bạn thay đổi các thiết lập như `app-port` hoặc `app-public-path` bằng `nb env update`, thông thường bạn sẽ cần chạy lại lệnh con proxy tương ứng
- Nhóm lệnh này hiện chưa hoạt động với env chỉ có kết nối API từ xa hoặc env SSH

## Ví dụ

```bash
# Hiển thị trợ giúp của chủ đề
nb env proxy

# Sinh cấu hình Nginx cho một env
nb env proxy nginx --env demo --host demo.local.nocobase.com

# Sinh cấu hình Caddy cho một env
nb env proxy caddy --env demo --host demo.local.nocobase.com
```

## Các lệnh liên quan

- [`nb env proxy nginx`](./nginx.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb env info`](../info.md)
- [`nb config`](../../config/index.md)
