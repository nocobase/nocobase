---
pkg: '@nocobase/plugin-notification-manager'
title: "Tổng quan Quản lý Thông báo"
description: "Quản lý Thông báo NocoBase: trung tâm thông báo đa kênh, hỗ trợ in-app message, Email, WeCom, cấu hình kênh thống nhất, quản lý gửi, log thông báo, có thể mở rộng các kênh SMS, DingTalk, Lark."
keywords: "Quản lý thông báo,in-app message,thông báo email,WeCom,cấu hình kênh,log thông báo,thông báo workflow,NocoBase"
---

# Quản lý Thông báo

## Giới thiệu

Quản lý Thông báo là dịch vụ tập trung tích hợp nhiều phương thức thông báo qua các kênh, cung cấp cấu hình kênh thống nhất, quản lý gửi và ghi log, hỗ trợ mở rộng linh hoạt.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- Phần màu tím: Quản lý thông báo, cung cấp dịch vụ quản lý thống nhất, bao gồm cấu hình kênh, ghi log và các tính năng khác, các kênh thông báo có thể mở rộng;
- Phần màu xanh: In-App Message, kênh tích hợp sẵn, hỗ trợ người dùng nhận thông báo trong ứng dụng;
- Phần màu đỏ: Email, kênh mở rộng, hỗ trợ người dùng nhận thông báo qua Email.

## Quản lý kênh

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Hiện tại các kênh đã được hỗ trợ:

- [In-App Message](/notification-manager/notification-in-app-message)
- [Email](/notification-manager/notification-email) (tích hợp sẵn phương thức truyền tải SMTP)

Cũng có thể mở rộng thêm các kênh thông báo khác, tham khảo tài liệu [Mở rộng kênh](/notification-manager/development/extension)

## Log thông báo

Ghi lại chi tiết và trạng thái gửi của từng thông báo, thuận tiện cho việc phân tích và xử lý sự cố.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Node thông báo workflow

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)
