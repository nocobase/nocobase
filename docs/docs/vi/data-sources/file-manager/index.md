---
title: "Trình quản lý tệp"
description: "Bảng tệp, trường tệp đính kèm và công cụ lưu trữ tệp, hỗ trợ lưu trữ cục bộ, Alibaba Cloud OSS, Amazon S3, Tencent Cloud COS, quản lý siêu dữ liệu và tải tệp lên."
keywords: "Trình quản lý tệp,Bảng tệp,Trường tệp đính kèm,Công cụ lưu trữ,OSS,S3,COS,NocoBase"
---

# Trình quản lý tệp

<PluginInfo name="file-manager"></PluginInfo>

## Giới thiệu

Plugin trình quản lý tệp cung cấp bảng tệp, trường tệp đính kèm và công cụ lưu trữ tệp để quản lý tệp một cách hiệu quả. Tệp là bản ghi của một bảng dữ liệu có cấu trúc cụ thể; bảng dữ liệu có cấu trúc này được gọi là bảng tệp, dùng để lưu trữ siêu dữ liệu của tệp và có thể được quản lý thông qua trình quản lý tệp. Trường tệp đính kèm là một trường quan hệ cụ thể liên kết với bảng tệp. Tệp hỗ trợ nhiều phương thức lưu trữ; các công cụ lưu trữ tệp hiện được hỗ trợ bao gồm lưu trữ cục bộ, Alibaba Cloud OSS, Amazon S3 và Tencent Cloud COS.

## Hướng dẫn sử dụng

### Bảng tệp

Bảng attachments được tích hợp sẵn để lưu trữ các tệp liên kết với tất cả các trường tệp đính kèm. Ngoài ra, bạn cũng có thể tạo các bảng tệp mới để lưu trữ những tệp cụ thể.

[Xem thêm cách sử dụng trong tài liệu giới thiệu bảng tệp](/data-sources/file-manager/file-collection)

### Trường tệp đính kèm

Trường tệp đính kèm là một trường quan hệ cụ thể liên kết với bảng tệp. Bạn có thể tạo trường này thông qua「trường loại tệp đính kèm」hoặc cấu hình thông qua「trường quan hệ」.

[Xem thêm cách sử dụng trong tài liệu giới thiệu trường tệp đính kèm](/data-sources/file-manager/field-attachment)

### Công cụ lưu trữ tệp

Công cụ lưu trữ tệp được dùng để lưu tệp vào các dịch vụ cụ thể, bao gồm lưu trữ cục bộ (lưu vào ổ cứng máy chủ), lưu trữ đám mây, v.v.

[Xem thêm nội dung trong phần giới thiệu về công cụ lưu trữ tệp](./storage/index.md)

### API HTTP

Có thể xử lý việc tải tệp lên thông qua API HTTP, tham khảo [API HTTP](./http-api.md)。

## Phát triển mở rộng

*