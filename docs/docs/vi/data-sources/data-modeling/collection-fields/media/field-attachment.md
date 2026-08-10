---
title: "Trường tệp đính kèm"
description: "Trường tệp đính kèm liên kết với bảng tệp để lưu trữ hình ảnh, tài liệu và các tệp khác."
keywords: "Trường tệp đính kèm,field-attachment,liên kết tệp,hình ảnh,tài liệu,NocoBase"
---

# Trường tệp đính kèm

## Giới thiệu

Hệ thống tích hợp sẵn trường kiểu "tệp đính kèm", dùng để hỗ trợ người dùng tải tệp lên trong các bảng dữ liệu tùy chỉnh.

Về bản chất, trường tệp đính kèm là một trường quan hệ nhiều-nhiều, trỏ đến bảng tệp tích hợp sẵn của hệ thống có tên "Tệp đính kèm" (`attachments`). Sau khi tạo trường tệp đính kèm cho bất kỳ bảng dữ liệu nào, hệ thống sẽ tự động tạo một bảng trung gian cho quan hệ nhiều-nhiều với bảng tệp đính kèm. Siêu dữ liệu của các tệp đã tải lên sẽ được lưu trong bảng "Tệp đính kèm", còn thông tin tệp được tham chiếu trong bảng dữ liệu sẽ được liên kết thông qua bảng trung gian này.

## Cấu hình trường

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Giới hạn loại MIME

Dùng để giới hạn loại tệp được phép tải lên, với định dạng mô tả theo cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ví dụ: `image/*` đại diện cho các tệp hình ảnh. Có thể phân tách nhiều loại bằng dấu phẩy tiếng Anh, chẳng hạn: `image/*,application/pdf` đại diện cho việc cho phép các tệp hình ảnh và tệp PDF.

### Công cụ lưu trữ

Chọn công cụ lưu trữ dùng để lưu các tệp đã tải lên; nếu để trống, hệ thống sẽ sử dụng công cụ lưu trữ mặc định.
