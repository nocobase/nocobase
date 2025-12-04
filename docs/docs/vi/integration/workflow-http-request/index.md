:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tích hợp Yêu cầu HTTP trong luồng công việc

Thông qua nút Yêu cầu HTTP, các luồng công việc của NocoBase có thể chủ động gửi yêu cầu đến bất kỳ dịch vụ HTTP nào, giúp trao đổi dữ liệu và tích hợp nghiệp vụ với các hệ thống bên ngoài.

## Tổng quan

Nút Yêu cầu HTTP là một thành phần tích hợp cốt lõi trong các luồng công việc, cho phép bạn gọi các API của bên thứ ba, giao diện dịch vụ nội bộ hoặc các dịch vụ web khác trong quá trình thực thi luồng công việc để truy xuất dữ liệu hoặc kích hoạt các hoạt động bên ngoài.

## Các trường hợp sử dụng điển hình

### Truy xuất dữ liệu

- **Truy vấn dữ liệu bên thứ ba**: Lấy dữ liệu thời gian thực từ các API thời tiết, API tỷ giá hối đoái, v.v.
- **Phân giải địa chỉ**: Gọi các API dịch vụ bản đồ để phân giải địa chỉ và mã hóa địa lý.
- **Đồng bộ hóa dữ liệu doanh nghiệp**: Lấy dữ liệu khách hàng, đơn hàng từ các hệ thống CRM, ERP.

### Kích hoạt nghiệp vụ

- **Gửi thông báo**: Gọi các dịch vụ SMS, email, WeCom để gửi thông báo.
- **Yêu cầu thanh toán**: Khởi tạo các hoạt động thanh toán, hoàn tiền với cổng thanh toán.
- **Xử lý đơn hàng**: Gửi vận đơn, truy vấn trạng thái logistics với các hệ thống vận chuyển.

### Tích hợp hệ thống

- **Gọi vi dịch vụ**: Gọi các API của dịch vụ khác trong kiến trúc vi dịch vụ.
- **Báo cáo dữ liệu**: Báo cáo dữ liệu nghiệp vụ cho các nền tảng phân tích, hệ thống giám sát.
- **Dịch vụ bên thứ ba**: Tích hợp các dịch vụ AI, nhận dạng OCR, tổng hợp giọng nói.

### Tự động hóa

- **Tác vụ theo lịch**: Định kỳ gọi các API bên ngoài để đồng bộ dữ liệu.
- **Phản hồi sự kiện**: Tự động gọi các API bên ngoài khi dữ liệu thay đổi để thông báo cho các hệ thống liên quan.
- **Quy trình phê duyệt**: Gửi yêu cầu phê duyệt thông qua các API của hệ thống phê duyệt.

## Tính năng

### Hỗ trợ HTTP đầy đủ

- Hỗ trợ tất cả các phương thức HTTP: GET, POST, PUT, PATCH, DELETE
- Hỗ trợ tiêu đề yêu cầu (Headers) tùy chỉnh
- Hỗ trợ nhiều định dạng dữ liệu: JSON, dữ liệu biểu mẫu, XML, v.v.
- Hỗ trợ nhiều cách truyền tham số: tham số URL, tham số đường dẫn, thân yêu cầu, v.v.

### Xử lý dữ liệu linh hoạt

- **Tham chiếu biến**: Sử dụng các biến của luồng công việc để xây dựng yêu cầu một cách linh hoạt.
- **Phân tích phản hồi**: Tự động phân tích phản hồi JSON và trích xuất dữ liệu cần thiết.
- **Chuyển đổi dữ liệu**: Chuyển đổi định dạng cho dữ liệu yêu cầu và dữ liệu phản hồi.
- **Xử lý lỗi**: Cấu hình chiến lược thử lại, cài đặt thời gian chờ và logic xử lý lỗi.

### Xác thực bảo mật

- **Basic Auth**: Xác thực HTTP cơ bản
- **Bearer Token**: Xác thực bằng mã thông báo
- **API Key**: Xác thực bằng khóa API tùy chỉnh
- **Headers tùy chỉnh**: Hỗ trợ bất kỳ phương thức xác thực nào

## Các bước sử dụng

### 1. Xác nhận đã bật plugin

Nút Yêu cầu HTTP là một tính năng tích hợp của **plugin luồng công việc**. Đảm bảo **[plugin luồng công việc](/plugins/@nocobase/plugin-workflow/)** đã được bật.

### 2. Thêm nút Yêu cầu HTTP vào luồng công việc

1. Tạo hoặc chỉnh sửa một luồng công việc.
2. Thêm nút **Yêu cầu HTTP** vào vị trí mong muốn.

![HTTP Request - Add Node](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Cấu hình các tham số yêu cầu.

### 3. Cấu hình các tham số yêu cầu

![HTTP Request Node - Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Cấu hình cơ bản

- **URL yêu cầu**: Địa chỉ API mục tiêu, hỗ trợ sử dụng biến.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Phương thức yêu cầu**: Chọn GET, POST, PUT, DELETE, v.v.

- **Tiêu đề yêu cầu**: Cấu hình HTTP Headers.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Tham số yêu cầu**:
  - **Tham số Query**: Tham số truy vấn URL.
  - **Tham số Body**: Dữ liệu thân yêu cầu (POST/PUT).

#### Cấu hình nâng cao

- **Thời gian chờ**: Đặt thời gian chờ cho yêu cầu (mặc định 30 giây).
- **Thử lại khi thất bại**: Cấu hình số lần thử lại và khoảng thời gian giữa các lần thử lại.
- **Bỏ qua lỗi**: Luồng công việc vẫn tiếp tục thực thi ngay cả khi yêu cầu thất bại.
- **Cài đặt proxy**: Cấu hình proxy HTTP (nếu cần).

### 4. Sử dụng dữ liệu phản hồi

Sau khi nút Yêu cầu HTTP được thực thi, dữ liệu phản hồi có thể được sử dụng trong các nút tiếp theo:

- `{{$node.data.status}}`: Mã trạng thái HTTP
- `{{$node.data.headers}}`: Tiêu đề phản hồi
- `{{$node.data.data}}`: Dữ liệu thân phản hồi
- `{{$node.data.error}}`: Thông báo lỗi (nếu yêu cầu thất bại)

![HTTP Request Node - Response Usage](https://static-docs.nocobase.com/20240529110610.png)

## Các tình huống ví dụ

### Ví dụ 1: Lấy thông tin thời tiết

```javascript
// Cấu hình
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Sử dụng phản hồi
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Ví dụ 2: Gửi tin nhắn WeCom

```javascript
// Cấu hình
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Đơn hàng {{$context.orderId}} đã được giao"
  }
}
```

### Ví dụ 3: Truy vấn trạng thái thanh toán

```javascript
// Cấu hình
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Điều kiện kiểm tra
Nếu {{$node.data.data.status}} bằng "paid"
  - Cập nhật trạng thái đơn hàng thành "Đã thanh toán"
  - Gửi thông báo thanh toán thành công
Ngược lại nếu {{$node.data.data.status}} bằng "pending"
  - Giữ trạng thái đơn hàng là "Chờ thanh toán"
Ngược lại
  - Ghi nhật ký thanh toán thất bại
  - Thông báo cho quản trị viên để xử lý ngoại lệ
```

### Ví dụ 4: Đồng bộ dữ liệu vào CRM

```javascript
// Cấu hình
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Cấu hình phương thức xác thực

### Xác thực cơ bản (Basic Authentication)

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Mã thông báo Bearer (Bearer Token)

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### Khóa API (API Key)

```javascript
// Trong Header
Headers:
  X-API-Key: your-api-key

// Hoặc trong Query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Trước tiên, cần lấy `access_token`, sau đó sử dụng:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Xử lý lỗi và gỡ lỗi

### Các lỗi thường gặp

1. **Hết thời gian chờ kết nối**: Kiểm tra kết nối mạng, tăng thời gian chờ.
2. **401 Không được ủy quyền**: Kiểm tra thông tin xác thực có chính xác không.
3. **404 Không tìm thấy**: Kiểm tra URL có đúng không.
4. **500 Lỗi máy chủ**: Kiểm tra trạng thái dịch vụ của nhà cung cấp API.

### Mẹo gỡ lỗi

1. **Sử dụng nút nhật ký**: Thêm nút nhật ký trước và sau yêu cầu HTTP để ghi lại dữ liệu yêu cầu và phản hồi.

2. **Xem nhật ký thực thi**: Nhật ký thực thi luồng công việc chứa thông tin chi tiết về yêu cầu và phản hồi.

3. **Công cụ kiểm thử**: Sử dụng các công cụ như Postman, cURL để kiểm thử API trước.

4. **Xử lý lỗi**: Thêm logic điều kiện để xử lý các trạng thái phản hồi khác nhau.

```javascript
Nếu {{$node.data.status}} >= 200 và {{$node.data.status}} < 300
  - Xử lý logic thành công
Ngược lại
  - Xử lý logic thất bại
  - Ghi lại lỗi: {{$node.data.error}}
```

## Đề xuất tối ưu hiệu suất

### 1. Sử dụng xử lý bất đồng bộ

Đối với các yêu cầu không cần kết quả ngay lập tức, hãy cân nhắc sử dụng các luồng công việc bất đồng bộ.

### 2. Cấu hình thời gian chờ hợp lý

Đặt thời gian chờ dựa trên thời gian phản hồi thực tế của API để tránh chờ đợi quá lâu.

### 3. Triển khai chiến lược bộ nhớ đệm

Đối với dữ liệu ít thay đổi (như cấu hình, từ điển), hãy cân nhắc lưu trữ kết quả phản hồi vào bộ nhớ đệm.

### 4. Xử lý theo lô

Nếu cần gọi cùng một API nhiều lần, hãy cân nhắc sử dụng các giao diện API xử lý theo lô (nếu được hỗ trợ).

### 5. Thử lại khi lỗi

Cấu hình chiến lược thử lại hợp lý, nhưng tránh thử lại quá mức có thể dẫn đến việc API bị giới hạn tốc độ.

## Các phương pháp bảo mật tốt nhất

### 1. Bảo vệ thông tin nhạy cảm

- Không để lộ thông tin nhạy cảm trong URL.
- Sử dụng HTTPS để truyền dữ liệu được mã hóa.
- Sử dụng biến môi trường hoặc quản lý cấu hình để lưu trữ các thông tin nhạy cảm như khóa API.

### 2. Xác thực dữ liệu phản hồi

```javascript
// Xác thực trạng thái phản hồi
if (![200, 201].includes($node.data.status)) {
  throw new Error('API request failed');
}

// Xác thực định dạng dữ liệu
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Invalid response data');
}
```

### 3. Giới hạn tần suất yêu cầu

Tuân thủ giới hạn tốc độ của API bên thứ ba để tránh bị chặn.

### 4. Che giấu thông tin nhạy cảm trong nhật ký

Khi ghi nhật ký, hãy chú ý che giấu thông tin nhạy cảm (mật khẩu, khóa, v.v.).

## So sánh với Webhook

| Tính năng | Nút Yêu cầu HTTP | Bộ kích hoạt Webhook |
|-----------|-------------------|----------------------|
| Hướng | NocoBase chủ động gọi bên ngoài | Bên ngoài chủ động gọi NocoBase |
| Thời điểm | Khi luồng công việc thực thi | Khi sự kiện bên ngoài xảy ra |
| Mục đích | Lấy dữ liệu, kích hoạt hoạt động bên ngoài | Nhận thông báo, sự kiện từ bên ngoài |
| Tình huống điển hình | Gọi API thanh toán, truy vấn thời tiết | Phản hồi thanh toán, thông báo tin nhắn |

Hai tính năng này bổ trợ cho nhau, cùng xây dựng một giải pháp tích hợp hệ thống hoàn chỉnh.

## Tài nguyên liên quan

- [Tài liệu plugin luồng công việc](/plugins/@nocobase/plugin-workflow/)
- [Luồng công việc: Nút Yêu cầu HTTP](/workflow/nodes/request)
- [Luồng công việc: Bộ kích hoạt Webhook](/integration/workflow-webhook/)
- [Xác thực bằng khóa API](/integration/api-keys/)
- [Plugin tài liệu API](/plugins/@nocobase/plugin-api-doc/)