---
title: "Quản lý phát hành"
description: "Quy trình phát hành quản lý vận hành: triển khai đa môi trường development, staging, production, kết hợp plugin Variables & Secrets, Backup Manager, Migration Manager, quy trình phát hành môi trường development đơn/nhiều, cấu hình quy tắc migration."
keywords: "Quản lý phát hành,Release,triển khai đa môi trường,development staging production,quy tắc migration,quản lý vận hành,NocoBase"
---

# Quản lý phát hành

## Giới thiệu

Trong ứng dụng thực tế, để đảm bảo bảo mật dữ liệu và vận hành ổn định của ứng dụng, chúng ta thường cần triển khai nhiều môi trường, ví dụ môi trường development, môi trường staging và môi trường production. Tài liệu này sẽ lấy hai quy trình phát triển no-code phổ biến làm ví dụ để mô tả chi tiết cách thực hiện quản lý phát hành trong NocoBase.

## Cài đặt

Ba plugin cần thiết cho quản lý phát hành, vui lòng đảm bảo đã kích hoạt các plugin sau.

### Variables & Secrets

- Plugin tích hợp sẵn, mặc định cài đặt và kích hoạt.
- Cấu hình và quản lý tập trung biến môi trường và secret, dùng cho lưu trữ dữ liệu nhạy cảm, tái sử dụng cấu hình, cô lập cấu hình môi trường ([Xem tài liệu](../variables-and-secrets/index.md)).

### Backup Manager

- Plugin này chỉ khả dụng trong phiên bản chuyên nghiệp trở lên ([Tìm hiểu chi tiết](https://www.nocobase.com/en/commercial)).
- Cung cấp tính năng sao lưu và khôi phục, hỗ trợ sao lưu định kỳ, đảm bảo bảo mật dữ liệu và khôi phục nhanh ([Xem tài liệu](../backup-manager/index.mdx)).

### Migration Manager

- Plugin này chỉ khả dụng trong phiên bản chuyên nghiệp trở lên ([Tìm hiểu chi tiết](https://www.nocobase.com/en/commercial)).
- Dùng để migrate cấu hình ứng dụng từ một môi trường ứng dụng sang môi trường ứng dụng khác ([Xem tài liệu](../migration-manager/index.md)).

## Các quy trình phát triển no-code phổ biến

### Môi trường development đơn, phát hành một chiều

Phù hợp cho quy trình phát triển đơn giản. Mỗi môi trường development, staging và production chỉ có một, các thay đổi được phát hành lần lượt từ môi trường development đến môi trường staging, cuối cùng triển khai vào môi trường production. Trong quy trình này, chỉ môi trường development có thể sửa cấu hình, môi trường staging và production đều không cho phép sửa đổi.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Khi cấu hình quy tắc migration, các bảng tích hợp sẵn của kernel và plugin chọn quy tắc "Ưu tiên ghi đè", các bảng khác nếu không có nhu cầu đặc biệt có thể xử lý theo mặc định

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Nhiều môi trường development, phát hành hợp nhất

Phù hợp cho tình huống cộng tác nhiều người hoặc dự án phức tạp. Nhiều môi trường development song song có thể phát triển độc lập, tất cả các thay đổi được hợp nhất thống nhất vào môi trường staging để test và xác minh, cuối cùng phát hành vào môi trường production. Trong quy trình này, cũng chỉ môi trường development có thể sửa cấu hình, môi trường staging và production đều không cho phép sửa đổi.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Khi cấu hình quy tắc migration, các bảng tích hợp sẵn của kernel và plugin chọn quy tắc "Ưu tiên insert hoặc update", các bảng khác nếu không có nhu cầu đặc biệt có thể xử lý theo mặc định

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Rollback

Trước khi thực thi migration, sẽ tự động sao lưu ứng dụng hiện tại. Nếu migration thất bại hoặc kết quả không như mong đợi, có thể thông qua [Backup Manager](../backup-manager/index.mdx) để rollback khôi phục.

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)
