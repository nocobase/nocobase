---
title: "Tổng quan về triển khai môi trường sản xuất"
description: "Hướng dẫn chung về triển khai môi trường sản xuất: Sau khi xác nhận rằng ứng dụng đang chạy bình thường, hãy thêm các mục nhập proxy tự động khởi động và đảo ngược ứng dụng."
keywords: "NocoBase, triển khai môi trường sản xuất, tổng quan, tự khởi động ứng dụng, proxy ngược, Nginx, Caddy"
---


# Tổng quan về triển khai môi trường sản xuất

Nếu NocoBase của bạn đã có thể chạy bình thường trên máy chủ, bạn thường cần thêm hai khả năng nữa trước khi nó được ra mắt chính thức:

1. Cho phép ứng dụng tự động tiếp tục chạy sau khi khởi động lại máy.
2. Kết nối lối vào proxy ngược với ứng dụng để cung cấp quyền truy cập ổn định ra thế giới bên ngoài.

Tương ứng với NocoBase CLI, nó chủ yếu bao gồm hai bộ lệnh sau:

- `nb app autostart`
- `nb proxy`

Bộ tài liệu này chủ yếu được chia thành hai phần:

1. Tự khởi động ứng dụng: Cho phép ứng dụng tiếp tục chạy sau khi máy khởi động lại
2. Proxy ngược: Cung cấp lối vào truy cập bên ngoài ổn định cho các ứng dụng

Trước tiên, bạn có thể xem hiện tại bạn cần phần nào hơn, sau đó nhập trang tương ứng.

## Hai phần này giải quyết vấn đề gì trong môi trường sản xuất?

Tức là:

- `nb app autostart` giải quyết vấn đề "làm thế nào để tiếp tục hoạt động của ứng dụng sau khi khởi động hệ thống"
- `nb proxy` giải quyết vấn đề "làm thế nào để cung cấp khả năng truy cập ổn định ra thế giới bên ngoài"

:::tip Tại sao bạn không trực tiếp sử dụng cấu hình tự khởi động của Docker, PM2 hoặc Người giám sát tại đây?

`nb app autostart` không bỏ qua các phương pháp quản lý quy trình này mà điều chỉnh thống nhất các phương pháp quản lý quy trình khác nhau, sau đó hội tụ chúng thành một tập hợp ổn định các lối vào quản lý tự khởi động. Bằng cách này, bạn không cần phải nhớ một bộ cấu hình tự khởi động khác vì lớp bên dưới là Docker, PM2 hoặc Trình giám sát có thể được hỗ trợ trong tương lai.

Khi hệ thống khởi động lớp này, nó sẽ tiếp tục được xử lý bởi `systemd`, `launchd` hoặc tập lệnh khởi động máy chủ. Họ có trách nhiệm thực thi một lần khi máy khởi động:

```bash
nb app autostart run
```

Lệnh này sau đó sẽ hiển thị tất cả các ứng dụng đã bật tính năng tự động khởi động.

Đây là hai lớp không nên trộn lẫn với nhau:

- Các khả năng như Docker, PM2 và Giám sát gần hơn với "cách các ứng dụng thường chạy và cách quản lý quy trình ứng dụng".
- Các khả năng như `systemd`, `launchd` và tập lệnh khởi động máy chủ gần với "lệnh nào sẽ thực thi khi hệ thống khởi động"

Nếu bạn tình cờ bị mắc kẹt ở đây "Tại sao bạn cần `nb app autostart`", bạn chỉ cần tiếp tục đọc [Tự động khởi động ứng dụng](./autostart.md) và [nb ý định thiết kế ứng dụng](../cli-design/nb-app-design-intent.md).

:::

## Tôi nên xem trang nào bây giờ?

| Tôi muốn... | Tìm ở đâu |
| --- | --- |
| Hãy để máy chủ khởi động lại trước và sau đó ứng dụng có thể tự động tiếp tục chạy | [Tự động khởi động ứng dụng](./autostart.md) |
| Trước tiên hãy hiểu mối quan hệ đầu vào của Nginx/Caddy trong CLI này | [Proxy ngược](./reverse-proxy/index.md) |
| Tiếp tục sử dụng Nginx để quản lý lối vào trang web | [Nginx](./reverse-proxy/nginx.md) |
| Kết nối HTTPS càng sớm càng tốt và duy trì ít chi tiết TLS hơn | [Caddy](./reverse-proxy/caddy.md) |
| Xem quá trình khởi động, dừng, ghi nhật ký và nâng cấp của chính ứng dụng | [Quản lý ứng dụng](../Operations/manage-app.md) |

## Trước khi vào môi trường production, hãy xác nhận các điều kiện tiên quyết này

- Ứng dụng đã được lưu dưới dạng CLI env
- Ứng dụng có thể được khởi động bình thường trên chính máy chủ
- Nếu bạn định kết nối với proxy ngược, `appPort` đã được lưu trong env
- Nếu bạn đã sẵn sàng chính thức mở cửa với thế giới bên ngoài thì bạn đã lên kế hoạch về tên miền, cổng vào và giải pháp HTTPS.

Nếu bạn chưa hoàn tất quá trình cài đặt CLI hoặc khởi tạo env, hãy quay lại [Cài đặt bằng CLI (được khuyến nghị)](../installation/cli.md).

Nếu lệnh nhắc rằng env bị thiếu `appPort`, trước tiên hãy thực thi [`nb env update`](../../api/cli/env/update.md) để điền vào.

## Các liên kết liên quan

- [Tự khởi động ứng dụng](./autostart.md)
- [Proxy ngược](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [Quản lý ứng dụng](../Operations/manage-app.md)
