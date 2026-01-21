:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan

## Các công cụ tích hợp

Hiện tại, NocoBase hỗ trợ các loại công cụ tích hợp sau:

- [Lưu trữ cục bộ](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Khi cài đặt hệ thống, một công cụ lưu trữ cục bộ sẽ được tự động thêm vào và có thể sử dụng ngay lập tức. Bạn cũng có thể thêm các công cụ mới hoặc chỉnh sửa các tham số của công cụ hiện có.

## Các tham số chung của công cụ

Ngoài các tham số đặc thù cho từng loại công cụ, các phần sau đây là các tham số chung (lấy ví dụ là lưu trữ cục bộ):

![Ví dụ cấu hình công cụ lưu trữ tệp](https://static-docs.nocobase.com/20240529115151.png)

### Tiêu đề

Tên của công cụ lưu trữ, dùng để nhận diện.

### Tên hệ thống

Tên hệ thống của công cụ lưu trữ, dùng để hệ thống nhận diện. Tên này phải là duy nhất trong toàn hệ thống. Nếu để trống, hệ thống sẽ tự động tạo ngẫu nhiên.

### URL cơ sở truy cập

Đây là phần tiền tố của địa chỉ URL để truy cập tệp từ bên ngoài. Nó có thể là URL cơ sở của CDN, ví dụ: “`https://cdn.nocobase.com/app`” (không cần dấu “`/`” ở cuối).

### Đường dẫn

Đường dẫn tương đối được sử dụng khi lưu trữ tệp. Khi truy cập, phần này cũng sẽ được tự động nối vào URL cuối cùng. Ví dụ: “`user/avatar`” (không cần dấu “`/`” ở đầu hoặc cuối).

### Giới hạn kích thước tệp

Giới hạn kích thước cho các tệp được tải lên công cụ lưu trữ này. Các tệp vượt quá kích thước đã đặt sẽ không thể tải lên. Giới hạn mặc định của hệ thống là 20MB và có thể điều chỉnh tối đa lên đến 1GB.

### Loại tệp

Bạn có thể giới hạn các loại tệp được tải lên, sử dụng định dạng mô tả cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ví dụ: `image/*` đại diện cho các tệp hình ảnh. Nhiều loại có thể được phân tách bằng dấu phẩy, ví dụ: `image/*, application/pdf` để cho phép cả tệp hình ảnh và tệp PDF.

### Công cụ lưu trữ mặc định

Khi được chọn, công cụ này sẽ được đặt làm công cụ lưu trữ mặc định của hệ thống. Khi một trường đính kèm hoặc **bộ sưu tập** tệp không chỉ định công cụ lưu trữ, tất cả các tệp được tải lên sẽ được lưu vào công cụ lưu trữ mặc định. Công cụ lưu trữ mặc định không thể xóa.

### Giữ lại tệp khi xóa bản ghi

Khi được chọn, các tệp đã tải lên trong công cụ lưu trữ sẽ được giữ lại ngay cả khi các bản ghi dữ liệu trong bảng đính kèm hoặc **bộ sưu tập** tệp bị xóa. Theo mặc định, tùy chọn này không được chọn, nghĩa là các tệp trong công cụ lưu trữ sẽ bị xóa cùng với các bản ghi.

:::info{title=Mẹo}
Sau khi tệp được tải lên, đường dẫn truy cập cuối cùng sẽ được tạo thành từ việc nối ghép nhiều phần:

```
<URL cơ sở truy cập>/<Đường dẫn>/<Tên tệp><Phần mở rộng>
```

Ví dụ: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::