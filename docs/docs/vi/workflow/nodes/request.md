---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Yêu cầu HTTP

## Giới thiệu

Khi cần tương tác với một hệ thống web khác, bạn có thể sử dụng nút Yêu cầu HTTP. Khi được thực thi, nút này sẽ gửi một yêu cầu HTTP đến địa chỉ được chỉ định theo cấu hình. Nó có thể mang dữ liệu ở định dạng JSON hoặc `application/x-www-form-urlencoded` để tương tác dữ liệu với các hệ thống bên ngoài.

Nếu bạn đã quen thuộc với các công cụ gửi yêu cầu như Postman, bạn có thể nhanh chóng nắm vững cách sử dụng nút Yêu cầu HTTP. Không giống như các công cụ này, tất cả các tham số trong nút Yêu cầu HTTP đều có thể sử dụng các biến ngữ cảnh từ luồng công việc hiện tại, cho phép tích hợp chặt chẽ với các quy trình nghiệp vụ của hệ thống.

## Cài đặt

Đây là một plugin được tích hợp sẵn, không cần cài đặt.

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút “Yêu cầu HTTP”:

![HTTP Request_Add](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Cấu hình nút

![HTTP Request Node_Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Phương thức yêu cầu

Các phương thức yêu cầu HTTP tùy chọn: `GET`, `POST`, `PUT`, `PATCH` và `DELETE`.

### URL yêu cầu

URL của dịch vụ HTTP, cần bao gồm phần giao thức (`http://` hoặc `https://`). Nên sử dụng `https://`.

### Định dạng dữ liệu yêu cầu

Đây là `Content-Type` trong tiêu đề yêu cầu. Các định dạng được hỗ trợ xem trong phần “[Nội dung yêu cầu](#request-body)”.

### Cấu hình tiêu đề yêu cầu

Các cặp khóa-giá trị cho phần Tiêu đề (Header) của yêu cầu. Các giá trị liên quan có thể sử dụng biến từ ngữ cảnh luồng công việc.

:::info{title=Mẹo}
Tiêu đề yêu cầu `Content-Type` đã được cấu hình thông qua định dạng dữ liệu yêu cầu. Bạn không cần điền vào đây, và mọi ghi đè sẽ không có hiệu lực.
:::

### Tham số yêu cầu

Các cặp khóa-giá trị cho phần truy vấn (query) của yêu cầu. Các giá trị liên quan có thể sử dụng biến từ ngữ cảnh luồng công việc.

### Nội dung yêu cầu

Phần Nội dung (Body) của yêu cầu. Các định dạng khác nhau được hỗ trợ tùy thuộc vào `Content-Type` đã chọn.

#### `application/json`

Hỗ trợ văn bản định dạng JSON tiêu chuẩn. Bạn có thể chèn các biến từ ngữ cảnh luồng công việc bằng cách sử dụng nút biến ở góc trên bên phải của trình chỉnh sửa văn bản.

:::info{title=Mẹo}
Các biến phải được sử dụng trong một chuỗi JSON, ví dụ: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Định dạng cặp khóa-giá trị. Các giá trị có thể sử dụng biến từ ngữ cảnh luồng công việc. Khi có biến, chúng sẽ được phân tích cú pháp như một mẫu chuỗi và nối thành giá trị chuỗi cuối cùng.

#### `application/xml`

Hỗ trợ văn bản định dạng XML tiêu chuẩn. Bạn có thể chèn các biến từ ngữ cảnh luồng công việc bằng cách sử dụng nút biến ở góc trên bên phải của trình chỉnh sửa văn bản.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Hỗ trợ các cặp khóa-giá trị cho dữ liệu biểu mẫu. Có thể tải lên tệp khi kiểu dữ liệu được đặt là đối tượng tệp. Tệp chỉ có thể được chọn thông qua các biến từ các đối tượng tệp hiện có trong ngữ cảnh, chẳng hạn như kết quả truy vấn trên một bảng tệp hoặc dữ liệu quan hệ từ một bảng tệp liên kết.

:::info{title=Mẹo}
Khi chọn dữ liệu tệp, hãy đảm bảo rằng biến tương ứng với một đối tượng tệp duy nhất, chứ không phải một danh sách tệp (trong trường hợp truy vấn quan hệ nhiều-nhiều hoặc một-nhiều, giá trị của trường quan hệ sẽ là một mảng).
:::

### Cài đặt thời gian chờ

Khi một yêu cầu không phản hồi trong thời gian dài, cài đặt thời gian chờ có thể được sử dụng để hủy việc thực thi yêu cầu đó. Nếu yêu cầu hết thời gian chờ, luồng công việc hiện tại sẽ bị chấm dứt sớm với trạng thái thất bại.

### Bỏ qua lỗi

Nút yêu cầu coi các mã trạng thái HTTP tiêu chuẩn từ `200` đến `299` (bao gồm) là trạng thái thành công, và tất cả các mã khác là thất bại. Nếu tùy chọn “Bỏ qua các yêu cầu thất bại và tiếp tục luồng công việc” được chọn, thì các nút luồng công việc tiếp theo vẫn sẽ tiếp tục thực thi ngay cả khi yêu cầu thất bại.

## Sử dụng kết quả phản hồi

Kết quả phản hồi của yêu cầu HTTP có thể được phân tích cú pháp bởi nút [Phân tích JSON](./json-query.md) để các nút tiếp theo sử dụng.

Kể từ phiên bản `v1.0.0-alpha.16`, ba phần trong phản hồi kết quả của nút yêu cầu có thể được sử dụng làm các biến riêng biệt:

*   Mã trạng thái phản hồi
*   Tiêu đề phản hồi
*   Dữ liệu phản hồi

![HTTP Request Node_Using Response Result](https://static-docs.nocobase.com/20240529110610.png)

Trong đó, mã trạng thái phản hồi thường là mã trạng thái HTTP tiêu chuẩn ở dạng số, ví dụ như `200`, `403`, v.v. (do nhà cung cấp dịch vụ đưa ra).

Tiêu đề phản hồi (Response headers) có định dạng JSON. Cả tiêu đề và dữ liệu phản hồi định dạng JSON đều cần được phân tích cú pháp bằng nút JSON trước khi sử dụng.

## Ví dụ

Ví dụ, chúng ta có thể sử dụng nút yêu cầu để tích hợp với nền tảng đám mây để gửi tin nhắn SMS thông báo. Cấu hình cho API gửi tin nhắn SMS của Alibaba Cloud có thể trông như sau (các tham số liên quan cần được tra cứu tài liệu và điều chỉnh cho phù hợp):

![HTTP Request Node_Configuration](https://static-docs.nocobase.com/20240515124004.png)

Khi luồng công việc kích hoạt nút này, nó sẽ gọi API SMS của Alibaba Cloud với nội dung đã cấu hình. Nếu yêu cầu thành công, một tin nhắn SMS sẽ được gửi thông qua dịch vụ SMS đám mây.