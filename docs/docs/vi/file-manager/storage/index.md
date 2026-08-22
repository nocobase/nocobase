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
Khi chọn "URL gốc", địa chỉ storage cuối cùng được ghép từ nhiều phần:

```
<URL truy cập cơ sở>/<đường dẫn>/<tên file><phần mở rộng>
```

Ví dụ: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.

Khi chọn "URL NocoBase", bản ghi file trả về đường dẫn NocoBase theo định dạng `/files/...`. Cấu hình phía trên vẫn được sử dụng khi truy cập dịch vụ storage.
:::

## URL file và kiểm soát truy cập

Storage engine có thể trả về URL NocoBase hoặc URL gốc của dịch vụ storage. URL NocoBase được dùng mặc định. Chỉ chọn URL gốc khi một dịch vụ bên ngoài bắt buộc phải sử dụng trực tiếp địa chỉ storage.

Cấu hình này áp dụng theo từng storage engine. Sau khi lưu, cả file hiện có và file mới upload trong engine đó đều trả về URL theo định dạng đã chọn. File không bị di chuyển hoặc upload lại.

![Cấu hình URL file](https://static-docs.nocobase.com/20260723221234.png)

### URL NocoBase

Bản ghi file trả về đường dẫn truy cập do NocoBase cung cấp, ví dụ:

```text
/files/main/main/attachments/1.png
```

Request đến URL này trước tiên đi qua NocoBase và tuân theo quyền xem được cấu hình cho bản ghi file tương ứng. Chỉ sau khi kiểm tra quyền thành công, NocoBase mới đọc file hoặc chuyển hướng đến địa chỉ do dịch vụ storage tạo ra.

Đây là lựa chọn mặc định được khuyến nghị. Bản ghi file trả về đường dẫn NocoBase, vì vậy bên gọi không cần biết đang sử dụng Local Storage hay cloud storage.

### URL gốc

Bản ghi file trả về trực tiếp địa chỉ do dịch vụ storage tạo ra, ví dụ:

```text
https://storage.example.com/path/to/file.png
```

URL này không đi qua NocoBase và không kiểm tra quyền xem của bản ghi file. Với Local Storage, đây là địa chỉ file tĩnh cục bộ. Với cloud storage, đây thường là địa chỉ Object Storage hoặc CDN.

Chỉ chọn URL gốc khi Markdown, trang bên ngoài hoặc dịch vụ bên thứ ba bắt buộc phải sử dụng trực tiếp địa chỉ storage.

:::warning Lưu ý

Sau khi chọn URL gốc, bất kỳ ai có URL hợp lệ đều có thể bỏ qua kiểm tra quyền của NocoBase và truy cập file. Nếu URL không có chữ ký hoặc thời hạn, hãy đảm bảo bucket và file cho phép đọc công khai.

:::

### Cho phép truy cập công khai

"Cho phép truy cập công khai" chỉ có hiệu lực khi chọn "URL NocoBase". Khi tích chọn, storage engine vẫn trả về URL NocoBase nhưng NocoBase không còn kiểm tra quyền của bản ghi file khi URL được truy cập. Bất kỳ ai có URL đều có thể truy cập file.

Tùy chọn này không thay đổi cấu hình đọc công khai của chính dịch vụ storage. Nó chỉ kiểm soát việc NocoBase có kiểm tra quyền của bản ghi file hay không.

### Cách chọn

| Tình huống sử dụng | URL file | Cho phép truy cập công khai |
| --- | --- | --- |
| File cần tuân theo quyền role và quyền dữ liệu | URL NocoBase | Không tích chọn |
| Cần địa chỉ file NocoBase có thể chia sẻ công khai | URL NocoBase | Tích chọn |
| Markdown, trang bên ngoài hoặc dịch vụ bên thứ ba phải đọc trực tiếp địa chỉ storage | URL gốc | Không áp dụng |

:::warning Lưu ý

[Local Storage](./local), [Amazon S3](./amazon-s3), [Aliyun OSS](./aliyun-oss) và [Tencent COS](./tencent-cos) không tạo URL có chữ ký tạm thời. Ngay cả khi sử dụng URL NocoBase và quyền của bản ghi file, người đã có địa chỉ gốc của dịch vụ storage vẫn có thể truy cập trực tiếp file.

Với hợp đồng, giấy tờ định danh, tài liệu nội bộ hoặc file không nên công khai, hãy dùng [S3 Pro](./s3-pro) và tham khảo cấu hình kiểm soát truy cập riêng của nó.

:::

Nếu bạn đang sử dụng storage engine công khai và muốn di chuyển file hiện có sang S3 Pro, hãy xem [Di chuyển sang S3 Pro](./migrate-to-s3-pro.md).
