---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Quản lý Thông báo

## Giới thiệu

Quản lý Thông báo là một dịch vụ tập trung tích hợp nhiều kênh thông báo, cung cấp cấu hình kênh, quản lý gửi và ghi nhật ký thống nhất, đồng thời hỗ trợ mở rộng linh hoạt.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Phần màu tím**: Quản lý Thông báo cung cấp dịch vụ quản lý toàn diện, bao gồm cấu hình kênh và ghi nhật ký, với tùy chọn mở rộng sang các kênh thông báo bổ sung.
- **Phần màu xanh lá**: Tin nhắn trong ứng dụng (In-App Message), một kênh tích hợp sẵn, cho phép người dùng nhận thông báo trực tiếp trong ứng dụng.
- **Phần màu đỏ**: Email, một kênh có thể mở rộng, cho phép người dùng nhận thông báo qua email.

## Quản lý Kênh

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Các kênh hiện được hỗ trợ bao gồm:

- [Tin nhắn trong ứng dụng](/notification-manager/notification-in-app-message)
- [Email](/notification-manager/notification-email) (sử dụng giao thức SMTP tích hợp sẵn)

Bạn cũng có thể mở rộng sang nhiều kênh thông báo hơn, tham khảo tài liệu [Mở rộng Kênh](/notification-manager/development/extension).

## Nhật ký Thông báo

Hệ thống ghi lại chi tiết thông tin gửi và trạng thái của từng thông báo, giúp dễ dàng phân tích và khắc phục sự cố.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Nút Thông báo trong Luồng Công việc

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)