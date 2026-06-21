---
pkg: '@nocobase/plugin-file-manager'
title: "Field Attachment"
description: "Field attachment dùng để hỗ trợ upload file trong bảng dữ liệu, bên dưới là quan hệ many-to-many trỏ đến bảng attachments, có thể cấu hình giới hạn loại MIME và storage engine."
keywords: "field attachment,field attachment,upload file,loại MIME,storage engine,attachments,NocoBase"
---

# Field Attachment

## Giới thiệu

Hệ thống có sẵn loại field "Attachment" để hỗ trợ người dùng upload file trong các bảng dữ liệu tùy chỉnh.

Bên dưới field attachment là một field quan hệ many-to-many, trỏ đến bảng file tích hợp sẵn của hệ thống là "Attachment" (`attachments`). Sau khi tạo field attachment trong bất kỳ bảng dữ liệu nào, một bảng trung gian quan hệ many-to-many với bảng attachment sẽ được tạo tự động. Metadata của file đã upload sẽ được lưu trong bảng "Attachment", thông tin file được tham chiếu trong bảng dữ liệu sẽ được liên kết qua bảng trung gian này.

## Cấu hình field

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Giới hạn loại MIME

Dùng để giới hạn các loại file được phép upload, sử dụng cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) để mô tả định dạng. Ví dụ: `image/*` đại diện cho các file hình ảnh. Nhiều loại có thể được phân tách bằng dấu phẩy, ví dụ: `image/*,application/pdf` cho phép cả file hình ảnh và file PDF.

### Storage engine

Chọn storage engine để lưu trữ file đã upload. Nếu không điền, hệ thống sẽ sử dụng storage engine mặc định.
