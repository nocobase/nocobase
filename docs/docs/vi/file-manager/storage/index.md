:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan

## Giới thiệu

Công cụ lưu trữ được dùng để lưu trữ tệp tin vào các dịch vụ cụ thể, bao gồm lưu trữ cục bộ (lưu vào ổ cứng máy chủ), lưu trữ đám mây, v.v.

Trước khi tải lên bất kỳ tệp tin nào, bạn cần cấu hình công cụ lưu trữ. Hệ thống sẽ tự động thêm một công cụ lưu trữ cục bộ trong quá trình cài đặt, bạn có thể sử dụng ngay. Bạn cũng có thể thêm công cụ mới hoặc chỉnh sửa các tham số của công cụ hiện có.

## Các loại công cụ lưu trữ

Hiện tại, NocoBase hỗ trợ sẵn các loại công cụ sau:

- [Lưu trữ cục bộ](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Hệ thống sẽ tự động thêm một công cụ lưu trữ cục bộ trong quá trình cài đặt, bạn có thể sử dụng ngay. Bạn cũng có thể thêm công cụ mới hoặc chỉnh sửa các tham số của công cụ hiện có.

## Các tham số chung

Ngoài các tham số đặc trưng của từng loại công cụ, dưới đây là các tham số chung (lấy ví dụ về lưu trữ cục bộ):

![Ví dụ cấu hình công cụ lưu trữ tệp](https://static-docs.nocobase.com/20240529115151.png)

### Tiêu đề

Tên của công cụ lưu trữ, dùng để nhận diện thủ công.

### Tên hệ thống

Tên hệ thống của công cụ lưu trữ, dùng để hệ thống nhận diện. Tên này phải là duy nhất trong hệ thống. Nếu để trống, hệ thống sẽ tự động tạo ngẫu nhiên.

### Tiền tố URL công khai

Phần tiền tố của địa chỉ URL công khai mà tệp tin có thể truy cập được. Đây có thể là URL cơ sở của CDN, ví dụ: “`https://cdn.nocobase.com/app`” (không cần dấu “`/`” ở cuối).

### Đường dẫn

Đường dẫn tương đối được sử dụng khi lưu trữ tệp tin. Phần này cũng sẽ tự động được nối vào URL cuối cùng khi truy cập. Ví dụ: “`user/avatar`” (không cần dấu “`/`” ở đầu hoặc cuối).

### Giới hạn kích thước tệp

Giới hạn kích thước cho các tệp được tải lên công cụ lưu trữ này. Các tệp vượt quá kích thước đã cài đặt sẽ không thể tải lên. Giới hạn mặc định của hệ thống là 20MB và có thể điều chỉnh tối đa lên đến 1GB.

### Loại tệp

Bạn có thể giới hạn loại tệp được tải lên, sử dụng định dạng mô tả cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ví dụ: `image/*` đại diện cho các tệp hình ảnh. Nhiều loại có thể được phân tách bằng dấu phẩy, ví dụ: `image/*, application/pdf` có nghĩa là cho phép các tệp hình ảnh và tệp PDF.

### Công cụ lưu trữ mặc định

Khi được chọn, đây sẽ là công cụ lưu trữ mặc định của hệ thống. Khi trường đính kèm hoặc bộ sưu tập tệp không chỉ định công cụ lưu trữ, các tệp được tải lên sẽ được lưu vào công cụ lưu trữ mặc định. Công cụ lưu trữ mặc định không thể xóa.

### Giữ lại tệp khi xóa bản ghi

Khi được chọn, tệp đã tải lên trong công cụ lưu trữ sẽ được giữ lại ngay cả khi bản ghi dữ liệu trong bảng đính kèm hoặc bộ sưu tập tệp bị xóa. Mặc định không chọn, tức là khi xóa bản ghi, tệp trong công cụ lưu trữ cũng sẽ bị xóa.

:::info{title=Mẹo}
Sau khi tệp được tải lên, đường dẫn truy cập cuối cùng sẽ được ghép từ một số phần:

```
<Tiền tố URL công khai>/<Đường dẫn>/<Tên tệp><Phần mở rộng>
```

Ví dụ: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::