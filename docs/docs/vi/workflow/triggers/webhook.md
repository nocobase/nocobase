---
pkg: '@nocobase/plugin-workflow-webhook'
title: "Trigger Workflow - Webhook"
description: "Trigger Webhook: cung cấp URL HTTP cho bên thứ ba gọi, callback thanh toán, đẩy thông báo... hệ thống bên ngoài kích hoạt Workflow."
keywords: "workflow,Webhook,Trigger HTTP,callback thanh toán,gọi từ hệ thống bên ngoài,NocoBase"
---

# Webhook

## Giới thiệu

Trigger Webhook được dùng để cung cấp một URL có thể được hệ thống bên thứ ba gọi qua HTTP Request, khi sự kiện của bên thứ ba xảy ra sẽ gửi HTTP Request đến URL đó để kích hoạt việc thực thi quy trình. Phù hợp với việc hệ thống bên ngoài phát thông báo, như callback thanh toán, tin nhắn...

## Tạo Workflow

Khi tạo Workflow, loại chọn "Sự kiện Webhook":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Mẹo"}
Sự khác biệt giữa Workflow "Đồng bộ" và "Bất đồng bộ" là Workflow đồng bộ sẽ chờ Workflow thực thi xong rồi mới trả về phản hồi, còn Workflow bất đồng bộ sẽ trực tiếp trả về phản hồi đã được cấu hình trong Trigger và xếp hàng thực thi ở backend.
:::

## Cấu hình Trigger

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### URL Webhook

URL của Trigger Webhook được hệ thống tự động sinh và liên kết với Workflow đó, có thể bấm nút bên phải để sao chép và dán vào hệ thống bên thứ ba.

Trong đó phương thức HTTP chỉ hỗ trợ POST, các phương thức khác sẽ trả về lỗi `405`.

### Bảo mật

Hiện hỗ trợ HTTP Basic Authentication, có thể bật tùy chọn này và thiết lập tên người dùng và mật khẩu, trong URL Webhook của hệ thống bên thứ ba bao gồm phần tên người dùng và mật khẩu để triển khai xác thực bảo mật cho Webhook (xem chi tiết tiêu chuẩn tại: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Khi đã thiết lập tên người dùng và mật khẩu, hệ thống sẽ kiểm tra tên người dùng và mật khẩu trong request có khớp không, khi không cung cấp hoặc không khớp sẽ trả về lỗi `401`.

### Phân tích dữ liệu request

Khi bên thứ ba gọi Webhook, dữ liệu được mang trong request cần được phân tích mới có thể sử dụng trong Workflow. Sau khi phân tích sẽ trở thành biến của Trigger và có thể tham chiếu trong các Node tiếp theo.

Việc phân tích HTTP Request được chia thành ba phần:

1.  Header request

    Header request thường là cặp khóa - giá trị dạng chuỗi đơn giản, các trường header request cần sử dụng có thể được cấu hình trực tiếp. Như `Date`, `X-Request-Id`...

2.  Tham số request

    Tham số request là phần tham số truy vấn trong URL, như tham số `query` trong `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Có thể qua việc dán URL mẫu đầy đủ hoặc chỉ phần tham số truy vấn mẫu, bấm nút phân tích để tự động phân tích các cặp khóa - giá trị trong đó.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Việc phân tích tự động sẽ chuyển phần tham số trong URL thành cấu trúc JSON và sinh các đường dẫn như `query[0]`, `query[0].a`... dựa trên cấp độ tham số, tên đường dẫn này có thể được sửa thủ công khi không thỏa mãn yêu cầu nhưng thường không cần sửa. Bí danh là tên hiển thị của biến khi được dùng làm biến, là tùy chọn. Đồng thời việc phân tích sẽ sinh bảng tham số đầy đủ trong mẫu, nếu có tham số không cần sử dụng có thể xóa.

3.  Body request

    Body request là phần Body của HTTP Request, hiện chỉ hỗ trợ Body request có định dạng `Content-Type` là `application/json`. Có thể trực tiếp cấu hình đường dẫn cần phân tích hoặc nhập JSON mẫu, bấm nút phân tích để tự động phân tích.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Việc phân tích tự động sẽ chuyển các cặp khóa - giá trị trong cấu trúc JSON thành đường dẫn, ví dụ `{"a": 1, "b": {"c": 2}}` sẽ sinh các đường dẫn như `a`, `b`, `b.c`... Bí danh là tên hiển thị của biến khi được dùng làm biến, là tùy chọn. Đồng thời việc phân tích sẽ sinh bảng tham số đầy đủ trong mẫu, nếu có tham số không cần sử dụng có thể xóa.

### Thiết lập phản hồi

Phần phản hồi của Webhook trong Workflow đồng bộ và bất đồng bộ có cách cấu hình khác nhau, Workflow bất đồng bộ trực tiếp cấu hình trong Trigger, sau khi nhận được request Webhook sẽ ngay lập tức trả về cho hệ thống bên thứ ba theo cấu hình phản hồi trong Trigger rồi mới thực thi Workflow; còn Workflow đồng bộ cần xử lý theo yêu cầu nghiệp vụ trong quy trình bằng cách thêm Node phản hồi (xem chi tiết: [Node phản hồi](#node-phản-hồi)).

Thông thường mã trạng thái của phản hồi của sự kiện Webhook được kích hoạt bất đồng bộ là `200`, body phản hồi là `ok`. Cũng có thể tùy chỉnh mã trạng thái phản hồi, header phản hồi và body phản hồi tùy theo tình huống.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Node phản hồi

Tham khảo: [Node phản hồi](../nodes/response.md)

## Ví dụ

Trong Workflow Webhook, có thể trả về các phản hồi khác nhau dựa trên điều kiện nghiệp vụ khác nhau, như hình:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Thông qua Node nhánh điều kiện, phán đoán một trạng thái nghiệp vụ nào đó có thỏa mãn không, nếu thỏa mãn thì trả về thành công, ngược lại trả về thất bại.
