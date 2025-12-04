---
pkg: "@nocobase/plugin-file-manager"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Trình quản lý tệp

## Giới thiệu

Plugin Trình quản lý tệp cung cấp bộ sưu tập tệp, trường đính kèm và các công cụ lưu trữ tệp để quản lý tệp hiệu quả. Tệp là các bản ghi trong một loại bộ sưu tập đặc biệt, được gọi là bộ sưu tập tệp, dùng để lưu trữ siêu dữ liệu của tệp và có thể được quản lý thông qua Trình quản lý tệp. Các trường đính kèm là các trường liên kết đặc biệt được liên kết với bộ sưu tập tệp. Plugin hỗ trợ nhiều phương thức lưu trữ. Các công cụ lưu trữ tệp hiện được hỗ trợ bao gồm lưu trữ cục bộ, Alibaba Cloud OSS, Amazon S3 và Tencent Cloud COS.

## Hướng dẫn sử dụng

### Bộ sưu tập tệp

Bộ sưu tập `attachments` được tích hợp sẵn để lưu trữ tất cả các tệp liên quan đến trường đính kèm. Ngoài ra, bạn cũng có thể tạo các bộ sưu tập tệp mới để lưu trữ các tệp cụ thể.

[Tìm hiểu thêm trong tài liệu Bộ sưu tập tệp](/data-sources/file-manager/file-collection)

### Trường đính kèm

Trường đính kèm là các trường liên kết đặc biệt liên quan đến bộ sưu tập tệp, có thể được tạo thông qua loại trường "Đính kèm" hoặc được cấu hình thông qua trường "Liên kết".

[Tìm hiểu thêm trong tài liệu Trường đính kèm](/data-sources/file-manager/field-attachment)

### Công cụ lưu trữ tệp

Công cụ lưu trữ tệp được dùng để lưu tệp vào các dịch vụ cụ thể, bao gồm lưu trữ cục bộ (lưu vào ổ cứng máy chủ), lưu trữ đám mây, v.v.

[Tìm hiểu thêm trong tài liệu Công cụ lưu trữ tệp](./storage/index.md)

### HTTP API

Tải tệp lên có thể được xử lý thông qua HTTP API, tham khảo [HTTP API](./http-api.md).

## Phát triển

*