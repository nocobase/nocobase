---
title: "Công cụ lưu trữ tệp"
description: "Công cụ lưu trữ cho trường tệp đính kèm: lưu trữ cục bộ, Alibaba Cloud OSS, Amazon S3, Tencent Cloud COS, S3 Pro; cấu hình tiêu đề, đường dẫn, URL truy cập, v.v."
keywords: "Lưu trữ tệp,Storage,OSS,S3,COS,Lưu trữ cục bộ,Lưu trữ đám mây,NocoBase"
---

# Tổng quan

## Công cụ tích hợp

Các loại công cụ lưu trữ được NocoBase tích hợp sẵn hiện nay gồm:

- [Lưu trữ cục bộ](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Khi cài đặt hệ thống, một công cụ lưu trữ cục bộ sẽ được tự động thêm vào và có thể sử dụng ngay. Bạn cũng có thể thêm công cụ mới hoặc chỉnh sửa các tham số của công cụ hiện có.

## Tham số chung của công cụ lưu trữ

Ngoài các tham số riêng của từng loại công cụ, những mục dưới đây là các tham số chung (lấy lưu trữ cục bộ làm ví dụ):

![Ví dụ cấu hình công cụ lưu trữ tệp](https://static-docs.nocobase.com/20240529115151.png)

### Tiêu đề

Tên của công cụ lưu trữ, dùng để nhận diện thủ công.

### Tên hệ thống

Tên hệ thống của công cụ lưu trữ, dùng để hệ thống nhận diện. Tên này phải là duy nhất trong hệ thống; nếu để trống, hệ thống sẽ tự động tạo ngẫu nhiên.

### Cơ sở URL truy cập

Phần tiền tố của địa chỉ URL mà tệp có thể được truy cập từ bên ngoài, có thể là cơ sở URL truy cập của CDN, chẳng hạn: “`https://cdn.nocobase.com/app`” (không cần “`/`” ở cuối).

### Đường dẫn

Đường dẫn tương đối được sử dụng khi lưu trữ tệp; khi truy cập, phần này cũng sẽ được tự động nối vào URL cuối cùng. Chẳng hạn: “`user/avatar`” (không cần “`/`” ở đầu và cuối).

### Giới hạn kích thước tệp

Giới hạn kích thước khi tải tệp lên công cụ lưu trữ này; các tệp vượt quá kích thước đã đặt sẽ không thể tải lên. Theo mặc định, hệ thống giới hạn ở 20MB; có thể điều chỉnh tối đa lên 1GB.

### Loại tệp

Có thể giới hạn loại tệp được tải lên bằng cách sử dụng cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ví dụ: `image/*` đại diện cho các tệp hình ảnh. Có thể phân tách nhiều loại bằng dấu phẩy tiếng Anh, chẳng hạn: `image/*, application/pdf` đại diện cho việc cho phép các tệp hình ảnh và PDF.

### Công cụ lưu trữ mặc định

Sau khi chọn, công cụ này sẽ được đặt làm công cụ lưu trữ mặc định của hệ thống. Khi trường tệp đính kèm hoặc bảng tệp không chỉ định công cụ lưu trữ, các tệp tải lên sẽ được lưu vào công cụ lưu trữ mặc định. Không thể xóa công cụ lưu trữ mặc định.

### Giữ lại tệp khi xóa bản ghi

Sau khi chọn, khi bản ghi dữ liệu trong bảng tệp đính kèm hoặc bảng tệp bị xóa, các tệp đã tải lên trong công cụ lưu trữ vẫn được giữ lại. Theo mặc định, tùy chọn này không được chọn, tức là khi xóa bản ghi, các tệp trong công cụ lưu trữ cũng sẽ bị xóa.

:::info{title=提示}
Sau khi tệp được tải lên, đường dẫn truy cập cuối cùng sẽ được ghép từ một số phần:

```
<访问 URL 基础>/<路径>/<文件名><后缀名>
```

Ví dụ: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::