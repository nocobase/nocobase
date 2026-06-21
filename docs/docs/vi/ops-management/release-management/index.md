---
title: "Quản lý phát hành"
description: "Thực hành phát hành: quản lý phiên bản, multi-app, Backup Manager và Migration Manager cho development, staging và production."
keywords: "Quản lý phát hành,Release,quản lý phiên bản,multi-app,Backup Manager,Migration Manager,NocoBase"
---

# Quản lý phát hành

## Giới thiệu

Quản lý phát hành định nghĩa quy trình đưa ứng dụng từ development đến production theo cách có thể lặp lại, kiểm chứng và khôi phục. Hoàn tất thay đổi ở development, kiểm tra ở staging, rồi mới phát hành lên production. Cần lưu file migration, bản backup, log thực thi và kết quả kiểm tra.

~~~text
Development -> Staging -> Production
~~~

## Mô hình phát hành

| Năng lực | Mục đích | Giai đoạn |
| --- | --- | --- |
| Quản lý phiên bản | Lưu checkpoint trong quá trình phát triển | Development |
| Biến và secret | Tách cấu hình và thông tin nhạy cảm theo môi trường | Tất cả môi trường |
| Multi-app | Tách module nghiệp vụ | Kiến trúc và cộng tác |
| Backup Manager | Lưu trạng thái production có thể khôi phục | Trước phát hành và vận hành |
| Migration Manager | Phát hành cấu hình và cấu trúc | Staging và production |

## Cấu hình môi trường

Kết nối database, địa chỉ dịch vụ bên thứ ba, tài khoản test, token, API Key và Webhook không nên hardcode trong page, workflow hoặc cấu hình plugin. Hãy dùng biến và secret riêng cho từng môi trường.

Tài liệu liên quan: [Biến và Secret](../variables-and-secrets/index.md).

## Giai đoạn phát triển

Tạo phiên bản trước và sau các thay đổi lớn về data model, page, permission, workflow hoặc plugin. Khi phát hành giữa các môi trường, dùng Migration Manager. Khi cần khôi phục production, dùng Backup Manager.

Tài liệu liên quan: [Quản lý phiên bản](../version-control/index.md).

## Tách module

Hệ thống nhỏ có thể bắt đầu bằng một app. Khi phức tạp hơn, hãy tách CRM, ticket, tài sản, HR, báo cáo hoặc backend vận hành thành app độc lập. Cần quy hoạch user, tổ chức, xác thực, permission và dữ liệu dùng chung trước.

~~~text
CRM: Development -> Staging -> Production
Ticket: Development -> Staging -> Production
Tài sản: Development -> Staging -> Production
~~~

Tài liệu liên quan: [Quản lý multi-app](../../multi-app/multi-app/index.md).

## Chuẩn bị

Trước khi phát hành production, tạo backup. Với phát hành quan trọng, kiểm tra restore ở môi trường độc lập. Backup cần bao gồm database, file upload và storage cần thiết để ứng dụng chạy.

Tài liệu liên quan: [Quản lý sao lưu](../backup-manager/index.mdx).

## Thực thi phát hành

Phát hành lên staging trước. Sau khi kiểm tra đạt, dùng cùng file migration cho production.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)

Khi phát hành production, đặt maintenance window, thông báo người dùng và tránh ghi dữ liệu mới. Với multi-node, scale down về một node trước khi migration. Sau đó kiểm tra luồng chính và mở lại truy cập.

### Quy tắc migration

Chiến lược phổ biến gồm ghi đè, chỉ cấu trúc và bỏ qua. Bảng tích hợp thường dùng chiến lược mặc định. Bảng dữ liệu nghiệp vụ do người dùng tạo thường chỉ migration cấu trúc. Bảng metadata có thể ghi đè tùy bối cảnh.

Xem: [Bảng tích hợp của ứng dụng và plugin chính](../migration-manager/built-in-tables.md).

Tài liệu liên quan: [Quản lý Migration](../migration-manager/index.md).

## Rollback và khôi phục

Nếu phát hành thất bại, ưu tiên dùng backup trước phát hành. Nếu môi trường hiện tại còn ổn định, restore tại đó. Nếu không, restore ở môi trường độc lập, kiểm tra luồng chính rồi chuyển traffic.

## Tài liệu liên quan

- [Biến và Secret](../variables-and-secrets/index.md)
- [Quản lý phiên bản](../version-control/index.md)
- [Quản lý multi-app](../../multi-app/multi-app/index.md)
- [Quản lý sao lưu](../backup-manager/index.mdx)
- [Quản lý Migration](../migration-manager/index.md)
