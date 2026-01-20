:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trường Tệp đính kèm

## Giới thiệu

Hệ thống tích hợp sẵn trường loại "Tệp đính kèm" để hỗ trợ người dùng tải tệp lên trong các bộ sưu tập tùy chỉnh.

Về cơ bản, trường Tệp đính kèm là một trường quan hệ nhiều-nhiều, trỏ đến bộ sưu tập tệp tích hợp sẵn của hệ thống có tên "Attachments" (`attachments`). Khi một trường Tệp đính kèm được tạo trong bất kỳ bộ sưu tập nào, một bảng trung gian cho quan hệ nhiều-nhiều của bảng tệp đính kèm sẽ tự động được tạo. Siêu dữ liệu của các tệp được tải lên sẽ được lưu trữ trong bộ sưu tập "Attachments", và thông tin tệp được tham chiếu trong bộ sưu tập sẽ được liên kết thông qua bảng trung gian này.

## Cấu hình Trường

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Hạn chế Loại MIME

Dùng để giới hạn các loại tệp được phép tải lên, sử dụng định dạng mô tả cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ví dụ: `image/*` đại diện cho các tệp hình ảnh. Nhiều loại có thể được phân tách bằng dấu phẩy, ví dụ: `image/*,application/pdf` cho phép cả tệp hình ảnh và tệp PDF.

### Công cụ Lưu trữ

Chọn công cụ lưu trữ để lưu trữ các tệp đã tải lên. Nếu để trống, công cụ lưu trữ mặc định của hệ thống sẽ được sử dụng.