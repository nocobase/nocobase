---
pkg: '@nocobase/plugin-file-manager'
title: "Tổng quan Storage Engine"
description: "Storage engine lưu file vào local hoặc cloud storage, hỗ trợ Local, Amazon S3, Aliyun OSS, Tencent COS, S3 Pro, cấu hình đường dẫn, URL truy cập, giới hạn kích thước, loại MIME, v.v."
keywords: "Storage engine,Storage,Local Storage,S3,OSS,COS,giới hạn kích thước file,loại MIME,NocoBase"
---

# Tổng quan

## Giới thiệu

Storage engine dùng để lưu file vào dịch vụ cụ thể, bao gồm Local Storage (lưu vào ổ cứng server), cloud storage, v.v.

Trước khi sử dụng bất kỳ tính năng upload file nào, cần phải cấu hình storage engine trước. Khi cài đặt hệ thống, một Local Storage engine sẽ được tự động thêm và có thể sử dụng ngay. Bạn cũng có thể thêm engine mới hoặc chỉnh sửa các tham số của engine đã có.

## Loại Storage Engine

Hiện tại NocoBase tích hợp sẵn các loại engine sau:

- [Local Storage](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Khi cài đặt hệ thống, một Local Storage engine sẽ được tự động thêm và có thể sử dụng ngay. Bạn cũng có thể thêm engine mới hoặc chỉnh sửa các tham số của engine đã có.

## Tham số chung

Ngoài các tham số riêng của từng loại engine, các phần dưới đây là tham số chung (lấy Local Storage làm ví dụ):

![Ví dụ cấu hình storage engine file](https://static-docs.nocobase.com/20240529115151.png)

### Tiêu đề

Tên của storage engine, dùng để nhận biết bằng mắt thường.

### Tên hệ thống

Tên hệ thống của storage engine, dùng để hệ thống nhận biết. Phải là duy nhất trong hệ thống. Nếu không điền, hệ thống sẽ tự động sinh ngẫu nhiên.

### Tiền tố URL truy cập

Phần tiền tố địa chỉ URL có thể truy cập đến file đó, có thể là URL truy cập cơ sở của CDN, ví dụ: "`https://cdn.nocobase.com/app`" (không cần "`/`" ở cuối).

### Đường dẫn

Đường dẫn tương đối được sử dụng khi lưu file, phần này cũng sẽ được tự động nối vào URL cuối cùng khi truy cập. Ví dụ: "`user/avatar`" (không cần "`/`" ở đầu và cuối).

### Giới hạn kích thước file

Giới hạn kích thước khi upload file vào storage engine này, các file vượt quá kích thước cài đặt sẽ không thể upload được. Hệ thống mặc định giới hạn 20MB, có thể điều chỉnh tối đa lên 1GB.

### Loại file

Có thể giới hạn loại file được upload, sử dụng cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) để mô tả định dạng. Ví dụ: `image/*` đại diện cho file hình ảnh. Nhiều loại có thể được phân tách bằng dấu phẩy, ví dụ: `image/*, application/pdf` cho phép cả file hình ảnh và file PDF.

### Storage engine mặc định

Sau khi tích chọn sẽ được đặt làm storage engine mặc định của hệ thống. Khi field attachment hoặc bảng file không chỉ định storage engine, file được upload sẽ đều được lưu vào storage engine mặc định. Storage engine mặc định không thể xóa.

### Giữ file khi xóa bản ghi

Sau khi tích chọn, khi bản ghi dữ liệu của bảng attachment hoặc bảng file bị xóa, file đã upload trong storage engine vẫn được giữ lại. Mặc định không tích chọn, tức là khi xóa bản ghi sẽ xóa file trong storage engine cùng lúc.

:::info{title=Mẹo}
Sau khi upload file, đường dẫn truy cập cuối cùng sẽ được nối từ một số phần:

```
<URL truy cập cơ sở>/<đường dẫn>/<tên file><phần mở rộng>
```

Ví dụ: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::
