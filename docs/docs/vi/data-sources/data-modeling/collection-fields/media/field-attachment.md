:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trường Tệp đính kèm

## Giới thiệu

Hệ thống tích hợp sẵn loại trường "Tệp đính kèm" để hỗ trợ người dùng tải tệp lên trong các bộ sưu tập tùy chỉnh.

Về bản chất, trường tệp đính kèm là một trường quan hệ nhiều-nhiều, trỏ đến bộ sưu tập tích hợp sẵn của hệ thống là "Attachments" (`attachments`). Khi bạn tạo một trường tệp đính kèm trong bất kỳ bộ sưu tập nào, một bảng trung gian quan hệ nhiều-nhiều sẽ tự động được tạo. Siêu dữ liệu của các tệp được tải lên sẽ được lưu trữ trong bộ sưu tập "Attachments", và thông tin tệp được tham chiếu trong bộ sưu tập của bạn sẽ được liên kết thông qua bảng trung gian này.

## Cấu hình Trường

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Danh sách cho phép Loại MIME

Dùng để giới hạn các loại tệp được phép tải lên, sử dụng cú pháp [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) để mô tả định dạng. Ví dụ: `image/*` đại diện cho các tệp hình ảnh. Nhiều loại có thể được phân tách bằng dấu phẩy, ví dụ: `image/*,application/pdf` cho phép cả tệp hình ảnh và tệp PDF.

### Công cụ lưu trữ

Chọn công cụ lưu trữ để lưu trữ các tệp đã tải lên. Nếu để trống, công cụ lưu trữ mặc định của hệ thống sẽ được sử dụng.