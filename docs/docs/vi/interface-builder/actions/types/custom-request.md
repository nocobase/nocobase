# Yêu cầu tùy chỉnh

## Giới thiệu

Khi cần gọi API bên ngoài hoặc dịch vụ bên thứ ba trong quy trình, có thể kích hoạt một yêu cầu HTTP tùy chỉnh thông qua Custom request. Các trường hợp sử dụng phổ biến bao gồm:

* Gọi API hệ thống bên ngoài (như CRM, dịch vụ AI, v.v.)
* Lấy dữ liệu từ xa và xử lý trong các bước quy trình tiếp theo
* Đẩy dữ liệu đến hệ thống bên thứ ba (Webhook, thông báo tin nhắn, v.v.)
* Kích hoạt quy trình tự động hóa của dịch vụ nội bộ hoặc bên ngoài

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## Cấu hình Action

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

Trong Cài đặt nút bấm -> Yêu cầu tùy chỉnh, có thể cấu hình các nội dung sau:

* HTTP method: Phương thức yêu cầu HTTP, ví dụ GET, POST, PUT, DELETE, v.v.
* URL: Địa chỉ đích của yêu cầu, có thể điền URL API đầy đủ, cũng có thể nối động qua biến.
* Headers: Thông tin header yêu cầu, dùng để truyền thông tin xác thực hoặc cấu hình API, ví dụ Authorization, Content-Type, v.v.
* Parameters: Tham số truy vấn URL (Query Parameters), thường dùng cho yêu cầu GET.
* Body: Nội dung body yêu cầu, thường dùng cho yêu cầu POST, PUT, có thể điền JSON, dữ liệu Form, v.v.
* Timeout config: Cấu hình thời gian timeout của yêu cầu, dùng để giới hạn thời gian chờ tối đa của yêu cầu, tránh quy trình bị chặn lâu.
* Response type: Loại dữ liệu phản hồi của yêu cầu.
* JSON: API trả về dữ liệu JSON, kết quả trả về sẽ được inject vào ngữ cảnh quy trình, có thể lấy thông qua ctx.steps trong các bước tiếp theo.
* Stream: API trả về luồng dữ liệu (Stream), sau khi yêu cầu thành công sẽ tự động kích hoạt tải tập tin.
* Access control: Kiểm soát truy cập, dùng để giới hạn vai trò nào có thể kích hoạt bước yêu cầu này, đảm bảo an toàn cho cuộc gọi API.

## Tùy chọn cấu hình Action khác

Ngoài cài đặt yêu cầu, nút yêu cầu tùy chỉnh còn hỗ trợ các cấu hình phổ biến này:

- [Chỉnh sửa nút bấm](/interface-builder/actions/action-settings/edit-button): Cấu hình tiêu đề, kiểu, biểu tượng nút bấm, v.v.;
- [Quy tắc liên kết Action](/interface-builder/actions/action-settings/linkage-rule): Kiểm soát động hiển thị/ẩn, vô hiệu hóa, v.v. của nút bấm theo điều kiện;
- [Xác nhận lần hai](/interface-builder/actions/action-settings/double-check): Sau khi nhấp sẽ hiện hộp xác nhận trước, sau đó mới thực sự gửi yêu cầu;
