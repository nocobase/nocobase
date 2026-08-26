---
title: "Field Attachment"
description: "Field attachment, liên kết với bảng file, lưu trữ các file như hình ảnh, tài liệu."
keywords: "Field attachment,field-attachment,liên kết file,hình ảnh,tài liệu,NocoBase"
---

# Field Attachment

## Giới thiệu

Field kiểu "Attachment" được tích hợp sẵn trong hệ thống, dùng để hỗ trợ người dùng upload file trong các Collection tùy chỉnh.

Về bản chất, field attachment là một field quan hệ ManyToMany trỏ đến một Collection file tích hợp sẵn của hệ thống tên là "Attachments" (`attachments`). Khi bất kỳ Collection nào tạo field attachment, một bảng trung gian ManyToMany với bảng attachments sẽ được tự động sinh ra. Metadata của các file được upload sẽ lưu trữ trong Collection "Attachments", và thông tin file được tham chiếu trong Collection sẽ được liên kết thông qua bảng trung gian này.

## Cấu hình Field

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Giới hạn kiểu MIME

Dùng để giới hạn các kiểu file được phép upload, sử dụng cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) để mô tả định dạng. Ví dụ: `image/*` đại diện cho các file kiểu hình ảnh. Có thể sử dụng dấu phẩy để phân tách nhiều kiểu, ví dụ: `image/*,application/pdf` cho phép các file kiểu hình ảnh và PDF.

### Storage engine

Chọn storage engine dùng để lưu trữ file được upload, nếu không điền sẽ sử dụng storage engine mặc định của hệ thống.
