---
title: "Storage Engine"
description: "Storage engine cho field attachment: Local Storage, Aliyun OSS, Amazon S3, Tencent COS, S3 Pro, cấu hình title, đường dẫn, URL truy cập, v.v."
keywords: "File Storage,Storage,OSS,S3,COS,Local Storage,Cloud storage,NocoBase"
---

# Tổng quan

## Engine tích hợp sẵn

Hiện tại các kiểu engine được NocoBase tích hợp sẵn như sau:

- [Local Storage](./local.md)
- [Aliyun OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent COS](./tencent-cos.md)

Khi cài đặt hệ thống sẽ tự động thêm một Local Storage engine, có thể sử dụng trực tiếp. Cũng có thể thêm engine mới hoặc chỉnh sửa tham số của engine hiện có.

## Tham số chung của engine

Ngoài các tham số đặc thù của các loại engine khác nhau, các phần sau là tham số chung (lấy Local Storage làm ví dụ):

![Ví dụ cấu hình Storage Engine](https://static-docs.nocobase.com/20240529115151.png)

### Title

Tên của storage engine, dùng để nhận biết bằng mắt thường.

### System name

Tên hệ thống của storage engine, dùng để hệ thống nhận biết. Phải là duy nhất trong hệ thống, nếu không điền sẽ được hệ thống tự động sinh ngẫu nhiên.

### Base URL truy cập

Phần tiền tố URL có thể truy cập file ra bên ngoài, có thể là base URL truy cập của CDN, ví dụ: "`https://cdn.nocobase.com/app`" (không cần "`/`" ở cuối).

### Đường dẫn

Đường dẫn tương đối được dùng khi lưu trữ file, phần này cũng sẽ được tự động ghép vào URL cuối cùng khi truy cập. Ví dụ: "`user/avatar`" (không cần "`/`" ở đầu và cuối).

### Giới hạn kích thước file

Giới hạn kích thước khi upload file vào storage engine này, file vượt quá kích thước cài đặt sẽ không thể upload. Giới hạn mặc định của hệ thống là 20MB, có thể điều chỉnh đến giới hạn tối đa là 1GB.

### Kiểu file

Có thể giới hạn kiểu file được upload, sử dụng cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) để mô tả định dạng. Ví dụ: `image/*` đại diện cho file kiểu hình ảnh. Có thể sử dụng dấu phẩy để phân tách nhiều kiểu, ví dụ: `image/*, application/pdf` cho phép file kiểu hình ảnh và PDF.

### Storage engine mặc định

Khi tích chọn sẽ đặt thành storage engine mặc định của hệ thống, khi field attachment hoặc file collection chưa chỉ định storage engine, file được upload sẽ được lưu vào storage engine mặc định. Storage engine mặc định không thể xóa.

### Giữ lại file khi xóa bản ghi

Khi tích chọn, khi bản ghi của bảng attachments hoặc file collection bị xóa, vẫn giữ lại file đã upload trong storage engine. Mặc định không tích chọn, tức là file trong storage engine cũng sẽ bị xóa khi xóa bản ghi.

:::info{title=Mẹo}
Sau khi upload file, đường dẫn truy cập cuối cùng sẽ được ghép từ một số phần:

```
<Base URL truy cập>/<Đường dẫn>/<Tên file><Phần mở rộng>
```

Ví dụ: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::
