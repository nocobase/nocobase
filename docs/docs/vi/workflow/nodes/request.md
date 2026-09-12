---
pkg: '@nocobase/plugin-workflow-request'
title: "Node Workflow - HTTP Request"
description: "Node HTTP Request: tương tác với hệ thống web bên ngoài, gửi request định dạng JSON hoặc form-urlencoded."
keywords: "workflow,HTTP Request,Request,hệ thống bên ngoài,gọi API,NocoBase"
---

# HTTP Request

## Giới thiệu

Khi cần tương tác với một hệ thống web khác, có thể sử dụng Node HTTP Request. Khi Node này được thực thi sẽ gửi một HTTP Request đến địa chỉ tương ứng theo cấu hình, có thể mang theo dữ liệu định dạng JSON hoặc `application/x-www-form-urlencoded` để hoàn tất tương tác dữ liệu với hệ thống bên ngoài.

Nếu quen thuộc với các công cụ gửi request như Postman thì có thể nhanh chóng nắm vững cách dùng Node HTTP Request. Khác với các công cụ này, các tham số trong Node HTTP Request đều có thể sử dụng biến ngữ cảnh trong quy trình hiện tại, có thể kết hợp một cách hữu cơ với việc xử lý nghiệp vụ của hệ thống hiện tại.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "HTTP Request":

![HTTP Request_thêm](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Cấu hình Node

![Node HTTP Request_cấu hình Node](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Phương thức request

Các phương thức HTTP Request có thể chọn: `GET`, `POST`, `PUT`, `PATCH` và `DELETE`.

### Địa chỉ request

URL của dịch vụ HTTP, cần bao gồm phần protocol (`http://` hoặc `https://`), khuyến nghị sử dụng `https://`.

### Định dạng dữ liệu request

Tức `Content-Type` trong header request, các định dạng được hỗ trợ xem ở phần "[Body request](#body-request)".

### Cấu hình header request

Cặp khóa - giá trị của phần Header của request, các giá trị liên quan có thể sử dụng biến ngữ cảnh quy trình.

:::info{title=Mẹo}
Đối với header request `Content-Type`, đã được cấu hình qua định dạng dữ liệu request, không cần điền, ghi đè không có hiệu lực.
:::

### Tham số request

Cặp khóa - giá trị của phần query trong request, các giá trị liên quan có thể sử dụng biến ngữ cảnh quy trình.

### Body request

Phần Body của request, hỗ trợ các định dạng khác nhau dựa trên việc chọn `Content-Type`.

#### `application/json`

Hỗ trợ text định dạng JSON tiêu chuẩn, có thể qua nút biến ở góc trên bên phải của ô soạn thảo text để chèn biến trong ngữ cảnh quy trình.

:::info{title=Mẹo}
Biến phải được sử dụng trong chuỗi của JSON, ví dụ: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Định dạng cặp khóa - giá trị, giá trị có thể sử dụng biến trong ngữ cảnh quy trình, khi chứa biến sẽ được phân tích như template chuỗi và ghép thành giá trị chuỗi cuối cùng.

#### `application/xml`

Hỗ trợ text định dạng XML tiêu chuẩn, có thể qua nút biến ở góc trên bên phải của ô soạn thảo text để chèn biến trong ngữ cảnh quy trình.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Hỗ trợ cặp khóa - giá trị của dữ liệu form, khi chọn loại dữ liệu là đối tượng file thì có thể upload file. File chỉ có thể qua biến để chọn đối tượng file đã có trong ngữ cảnh, như kết quả truy vấn bảng file hoặc dữ liệu quan hệ liên kết bảng file.

:::info{title=Mẹo}
Khi chọn dữ liệu file, cần đảm bảo biến tương ứng là một đối tượng file đơn lẻ chứ không phải danh sách file (trong truy vấn quan hệ một - nhiều, giá trị trường quan hệ sẽ là một mảng).
:::

### Thiết lập timeout

Khi request lâu không phản hồi, qua thiết lập timeout để hủy việc thực thi của request đó. Sau khi request bị timeout sẽ dừng sớm quy trình hiện tại với trạng thái thất bại.

### Bỏ qua thất bại

Node Request sẽ coi mã trạng thái HTTP tiêu chuẩn từ `200`~`299` (bao gồm) là trạng thái thành công, các trạng thái khác đều được coi là thất bại. Nếu chọn tùy chọn "Bỏ qua request thất bại và tiếp tục Workflow" thì khi request thất bại vẫn tiếp tục thực thi các Node quy trình tiếp theo.

## Sử dụng kết quả phản hồi

Kết quả phản hồi của HTTP Request có thể qua Node [Phân tích JSON](./json-query.md) để phân tích để các Node tiếp theo sử dụng.

Từ phiên bản `v1.0.0-alpha.16`, ba phần trong phản hồi kết quả của Node Request có thể được sử dụng làm biến riêng:

* Mã trạng thái phản hồi
* Header phản hồi
* Dữ liệu phản hồi

![Node HTTP Request_sử dụng kết quả phản hồi](https://static-docs.nocobase.com/20240529110610.png)

Trong đó mã trạng thái phản hồi thường là mã trạng thái HTTP tiêu chuẩn dạng số như `200`, `403`... (cụ thể do bên cung cấp dịch vụ đưa ra).

Header phản hồi (Response headers) là định dạng JSON, bao gồm dữ liệu phản hồi định dạng JSON, vẫn cần sử dụng Node JSON để phân tích rồi mới dùng.

## Ví dụ

Ví dụ chúng ta có thể sử dụng Node Request để đối ứng với nền tảng cloud gửi tin nhắn SMS thông báo, lấy ví dụ interface gửi SMS của Aliyun cấu hình như sau (các tham số liên quan cần tự tham khảo tài liệu để thích ứng):

![Node HTTP Request_cấu hình Node](https://static-docs.nocobase.com/20240515124004.png)

Khi Workflow kích hoạt Node này thực thi sẽ gọi interface SMS của Aliyun với nội dung được cấu hình, nếu request thành công sẽ qua dịch vụ cloud SMS gửi một tin nhắn SMS.
