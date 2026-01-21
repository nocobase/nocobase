---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Webhook

## Giới thiệu

Bộ kích hoạt Webhook cung cấp một URL mà các hệ thống bên thứ ba có thể gọi thông qua các yêu cầu HTTP. Khi một sự kiện từ bên thứ ba xảy ra, hệ thống sẽ gửi yêu cầu HTTP đến URL này để kích hoạt việc thực thi luồng công việc. Tính năng này phù hợp cho các thông báo được khởi tạo từ hệ thống bên ngoài, chẳng hạn như callback thanh toán hoặc tin nhắn.

## Tạo luồng công việc

Khi tạo một luồng công việc, hãy chọn loại "Sự kiện Webhook":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Lưu ý"}
Sự khác biệt giữa các luồng công việc "đồng bộ" và "bất đồng bộ" là luồng công việc đồng bộ sẽ chờ cho đến khi hoàn tất việc thực thi rồi mới trả về phản hồi. Ngược lại, luồng công việc bất đồng bộ sẽ trả về phản hồi đã được cấu hình trong cài đặt trigger ngay lập tức và xếp hàng thực thi ở chế độ nền.
:::

## Cấu hình Trigger

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### URL Webhook

URL của trigger Webhook được hệ thống tự động tạo và liên kết với luồng công việc này. Bạn có thể nhấp vào nút ở bên phải để sao chép và dán vào hệ thống bên thứ ba.

Trong đó, phương thức HTTP chỉ hỗ trợ POST; các phương thức khác sẽ trả về lỗi `405`.

### Bảo mật

Hiện tại, hệ thống hỗ trợ xác thực cơ bản HTTP (HTTP Basic Authentication). Bạn có thể bật tùy chọn này và thiết lập tên người dùng cùng mật khẩu. Sau đó, hãy bao gồm phần tên người dùng và mật khẩu trong URL Webhook của hệ thống bên thứ ba để thực hiện xác thực bảo mật cho Webhook (Chi tiết tiêu chuẩn xem tại: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Khi tên người dùng và mật khẩu đã được thiết lập, hệ thống sẽ kiểm tra xem tên người dùng và mật khẩu trong yêu cầu có khớp hay không. Nếu không được cung cấp hoặc không khớp, hệ thống sẽ trả về lỗi `401`.

### Phân tích dữ liệu yêu cầu

Khi bên thứ ba gọi Webhook, dữ liệu được gửi trong yêu cầu cần được phân tích cú pháp trước khi có thể sử dụng trong luồng công việc. Sau khi phân tích, dữ liệu này sẽ trở thành biến của trigger và có thể được tham chiếu trong các node tiếp theo.

Việc phân tích yêu cầu HTTP được chia thành ba phần:

1.  Header yêu cầu

    Header yêu cầu thường là các cặp khóa-giá trị dạng chuỗi đơn giản. Các trường header yêu cầu bạn cần sử dụng có thể được cấu hình trực tiếp, ví dụ như `Date`, `X-Request-Id`, v.v.

2.  Tham số yêu cầu

    Tham số yêu cầu là phần tham số truy vấn trong URL, ví dụ như tham số `query` trong `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Bạn có thể dán một URL mẫu đầy đủ hoặc chỉ phần tham số truy vấn mẫu, sau đó nhấp vào nút phân tích để tự động phân tích các cặp khóa-giá trị.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Phân tích tự động sẽ chuyển đổi phần tham số trong URL thành một cấu trúc JSON và tạo ra các đường dẫn như `query[0]`, `query[0].a`, v.v., dựa trên cấp độ tham số. Tên đường dẫn này có thể được sửa đổi thủ công nếu không đáp ứng yêu cầu, nhưng thông thường không cần thiết. Bí danh là tên hiển thị của biến khi được sử dụng, đây là một tùy chọn. Đồng thời, quá trình phân tích sẽ tạo ra bảng đầy đủ các tham số từ mẫu; bạn có thể xóa bất kỳ tham số nào không cần thiết.

3.  Phần thân yêu cầu

    Phần thân yêu cầu là phần Body của yêu cầu HTTP. Hiện tại, chỉ hỗ trợ phần thân yêu cầu có định dạng `Content-Type` là `application/json`. Bạn có thể cấu hình trực tiếp các đường dẫn cần phân tích, hoặc nhập một mẫu JSON và nhấp vào nút phân tích để tự động phân tích.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Phân tích tự động sẽ chuyển đổi các cặp khóa-giá trị trong cấu trúc JSON thành các đường dẫn. Ví dụ, `{"a": 1, "b": {"c": 2}}` sẽ tạo ra các đường dẫn như `a`, `b`, và `b.c`. Bí danh là tên hiển thị của biến khi được sử dụng, đây là một tùy chọn. Đồng thời, quá trình phân tích sẽ tạo ra bảng đầy đủ các tham số từ mẫu; bạn có thể xóa bất kỳ tham số nào không cần thiết.

### Cài đặt phản hồi

Phần phản hồi của Webhook có cách cấu hình khác nhau giữa các luồng công việc đồng bộ và bất đồng bộ. Đối với luồng công việc bất đồng bộ, phản hồi được cấu hình trực tiếp trong trigger; sau khi nhận được yêu cầu Webhook, nó sẽ ngay lập tức trả về phản hồi đã cấu hình trong trigger cho hệ thống bên thứ ba, sau đó mới thực thi luồng công việc. Trong khi đó, luồng công việc đồng bộ cần được xử lý bằng cách thêm node phản hồi trong luồng theo yêu cầu nghiệp vụ (Chi tiết xem tại: [Node phản hồi](#node-phản-hồi)).

Thông thường, phản hồi cho sự kiện Webhook được kích hoạt bất đồng bộ có mã trạng thái `200` và phần thân phản hồi là `ok`. Bạn cũng có thể tùy chỉnh mã trạng thái, header và phần thân của phản hồi tùy theo tình huống.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Node phản hồi

Tham khảo: [Node phản hồi](../nodes/response.md)

## Ví dụ

Trong luồng công việc Webhook, bạn có thể trả về các phản hồi khác nhau tùy thuộc vào các điều kiện nghiệp vụ, như hình dưới đây:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Sử dụng node phân nhánh điều kiện để kiểm tra xem một trạng thái nghiệp vụ cụ thể có được đáp ứng hay không. Nếu đáp ứng, hệ thống sẽ trả về thành công; ngược lại, sẽ trả về thất bại.