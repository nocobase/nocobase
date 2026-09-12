---
title: "Node HTTP Request trong workflow"
description: "Node HTTP Request trong workflow gọi API ngoài: GET/POST/PUT, tham chiếu biến, xác thực Basic/Bearer/API Key, phân tích response, timeout retry, so sánh với Webhook."
keywords: "HTTP Request workflow,Node HTTP Request,Gọi API ngoài,Bearer Token,API Key,Tích hợp workflow,NocoBase"
---

# Tích hợp HTTP Request trong workflow

Thông qua node HTTP Request, workflow của NocoBase có thể chủ động gửi request đến bất kỳ dịch vụ HTTP nào, đạt được tương tác dữ liệu và tích hợp nghiệp vụ với hệ thống bên ngoài.

## Tổng quan

Node HTTP Request là component tích hợp cốt lõi trong workflow, cho phép bạn gọi API bên thứ ba, interface dịch vụ nội bộ hoặc các dịch vụ web khác trong quá trình thực thi workflow để lấy dữ liệu hoặc kích hoạt các thao tác bên ngoài.

## Các kịch bản ứng dụng điển hình

### Lấy dữ liệu

- **Truy vấn dữ liệu bên thứ ba**: Lấy dữ liệu thời gian thực từ API thời tiết, API tỷ giá, v.v.
- **Phân tích địa chỉ**: Gọi API dịch vụ bản đồ để phân tích địa chỉ và geocoding
- **Đồng bộ dữ liệu doanh nghiệp**: Lấy dữ liệu khách hàng, đơn hàng từ hệ thống CRM, ERP

### Kích hoạt nghiệp vụ

- **Đẩy thông báo**: Gọi dịch vụ SMS, email, WeCom để gửi thông báo
- **Yêu cầu thanh toán**: Khởi tạo thanh toán, hoàn tiền tới payment gateway
- **Xử lý đơn hàng**: Gửi đơn vận đến hệ thống logistics, truy vấn trạng thái logistics

### Tích hợp hệ thống

- **Gọi microservice**: Gọi API của các dịch vụ khác trong kiến trúc microservice
- **Báo cáo dữ liệu**: Báo cáo dữ liệu nghiệp vụ tới nền tảng phân tích dữ liệu, hệ thống giám sát
- **Dịch vụ bên thứ ba**: Tích hợp dịch vụ AI, nhận dạng OCR, tổng hợp giọng nói, v.v.

### Thao tác tự động

- **Tác vụ định kỳ**: Định kỳ gọi API ngoài để đồng bộ dữ liệu
- **Phản ứng sự kiện**: Khi dữ liệu thay đổi, tự động gọi API ngoài để thông báo các hệ thống liên quan
- **Quy trình phê duyệt**: Gọi API hệ thống phê duyệt để gửi yêu cầu phê duyệt

## Đặc điểm chức năng

### Hỗ trợ HTTP đầy đủ

- Hỗ trợ tất cả các phương thức HTTP như GET, POST, PUT, PATCH, DELETE
- Hỗ trợ tùy chỉnh request header
- Hỗ trợ nhiều định dạng dữ liệu: JSON, dữ liệu form, XML, v.v.
- Hỗ trợ nhiều cách truyền tham số: tham số URL, tham số đường dẫn, request body

### Xử lý dữ liệu linh hoạt

- **Tham chiếu biến**: Sử dụng biến workflow để xây dựng request động
- **Phân tích response**: Tự động phân tích response JSON, trích xuất dữ liệu cần thiết
- **Chuyển đổi dữ liệu**: Chuyển đổi định dạng cho dữ liệu request và response
- **Xử lý lỗi**: Cấu hình chiến lược retry, cài đặt timeout, logic xử lý lỗi

### Xác thực bảo mật

- **Basic Auth**: Xác thực HTTP cơ bản
- **Bearer Token**: Xác thực token
- **API Key**: Xác thực API Key tùy chỉnh
- **Header tùy chỉnh**: Hỗ trợ bất kỳ phương thức xác thực nào

## Các bước sử dụng

### 1. Xác nhận plugin đã được bật

Node HTTP Request là tính năng tích hợp sẵn của plugin workflow. Đảm bảo plugin **[Workflow](/plugins/@nocobase/plugin-workflow/index.md)** đã được bật.

### 2. Thêm node HTTP Request vào workflow

1. Tạo hoặc chỉnh sửa workflow
2. Thêm node **HTTP Request** ở vị trí cần thiết

![HTTP Request_thêm](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Cấu hình tham số request

### 3. Cấu hình tham số request

![Node HTTP Request_cấu hình node](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Cấu hình cơ bản

- **URL request**: Địa chỉ API đích, hỗ trợ sử dụng biến
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Phương thức request**: Chọn GET, POST, PUT, DELETE, v.v.

- **Header request**: Cấu hình HTTP Header
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Tham số request**:
  - **Tham số Query**: Tham số query URL
  - **Tham số Body**: Dữ liệu request body (POST/PUT)

#### Cấu hình nâng cao

- **Thời gian timeout**: Cài đặt timeout request (mặc định 30 giây)
- **Retry khi thất bại**: Cấu hình số lần retry và khoảng thời gian retry
- **Bỏ qua thất bại**: Workflow tiếp tục thực thi ngay cả khi request thất bại
- **Cài đặt proxy**: Cấu hình HTTP proxy (nếu cần)

### 4. Sử dụng dữ liệu response

Sau khi node HTTP Request thực thi, dữ liệu response có thể được sử dụng trong các node tiếp theo:

- `{{$node.data.status}}`: Mã trạng thái HTTP
- `{{$node.data.headers}}`: Response header
- `{{$node.data.data}}`: Dữ liệu response body
- `{{$node.data.error}}`: Thông tin lỗi (nếu request thất bại)

![Node HTTP Request_sử dụng kết quả response](https://static-docs.nocobase.com/20240529110610.png)

## Các kịch bản ví dụ

### Ví dụ 1: Lấy thông tin thời tiết

```javascript
// Cấu hình
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Sử dụng response
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
    "content": "Đơn hàng {{$context.orderId}} đã được gửi đi"
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

// Đánh giá điều kiện
Nếu {{$node.data.data.status}} bằng "paid"
  - Cập nhật trạng thái đơn hàng thành "Đã thanh toán"
  - Gửi thông báo thanh toán thành công
Ngược lại nếu {{$node.data.data.status}} bằng "pending"
  - Giữ trạng thái đơn hàng là "Chờ thanh toán"
Ngược lại
  - Ghi log thanh toán thất bại
  - Thông báo admin xử lý ngoại lệ
```

### Ví dụ 4: Đồng bộ dữ liệu sang CRM

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

### Basic Authentication

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API Key

```javascript
// Trong Header
Headers:
  X-API-Key: your-api-key

// Hoặc trong Query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Cần lấy access_token trước, sau đó sử dụng:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Xử lý lỗi và debug

### Các lỗi thường gặp

1. **Connection timeout**: Kiểm tra kết nối mạng, tăng thời gian timeout
2. **401 Unauthorized**: Kiểm tra thông tin xác thực có chính xác không
3. **404 Not Found**: Kiểm tra URL có đúng không
4. **500 Server Error**: Xem trạng thái dịch vụ của bên cung cấp API

### Mẹo debug

1. **Sử dụng node log**: Thêm node log trước và sau HTTP Request, ghi lại dữ liệu request và response

2. **Xem log thực thi**: Log thực thi workflow chứa thông tin chi tiết về request và response

3. **Công cụ kiểm thử**: Dùng công cụ như Postman, cURL để test API trước

4. **Xử lý lỗi**: Thêm đánh giá điều kiện để xử lý các trạng thái response khác nhau

```javascript
Nếu {{$node.data.status}} >= 200 và {{$node.data.status}} < 300
  - Xử lý logic thành công
Ngược lại
  - Xử lý logic thất bại
  - Ghi log lỗi: {{$node.data.error}}
```

## Khuyến nghị tối ưu hiệu suất

### 1. Sử dụng xử lý bất đồng bộ

Đối với các request không cần lấy kết quả ngay, hãy cân nhắc sử dụng workflow bất đồng bộ.

### 2. Cấu hình timeout hợp lý

Đặt timeout dựa trên thời gian response thực tế của API, tránh chờ đợi quá lâu.

### 3. Triển khai chiến lược cache

Đối với dữ liệu ít thay đổi (như cấu hình, dictionary), cân nhắc cache lại kết quả response.

### 4. Xử lý theo batch

Nếu cần gọi cùng một API nhiều lần, cân nhắc sử dụng interface batch của API (nếu có hỗ trợ).

### 5. Retry khi lỗi

Cấu hình chiến lược retry hợp lý, nhưng tránh retry quá mức gây ra giới hạn API.

## Thực hành bảo mật tốt nhất

### 1. Bảo vệ thông tin nhạy cảm

- Không để lộ thông tin nhạy cảm trong URL
- Sử dụng HTTPS để truyền dữ liệu mã hóa
- API Key và các thông tin nhạy cảm khác nên dùng biến môi trường hoặc quản lý cấu hình

### 2. Xác thực dữ liệu response

```javascript
// Xác thực trạng thái response
if (![200, 201].includes($node.data.status)) {
  throw new Error('API request failed');
}

// Xác thực định dạng dữ liệu
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Invalid response data');
}
```

### 3. Giới hạn tốc độ request

Tuân thủ giới hạn tốc độ của API bên thứ ba, tránh bị khóa.

### 4. Khử nhạy log

Khi ghi log, hãy chú ý xử lý khử nhạy thông tin nhạy cảm (mật khẩu, key, v.v.).

## So sánh với Webhook

| Đặc điểm | Node HTTP Request | Webhook trigger |
|------|-------------|---------------|
| Hướng | NocoBase chủ động gọi bên ngoài | Bên ngoài chủ động gọi NocoBase |
| Thời điểm | Khi workflow thực thi | Khi sự kiện bên ngoài xảy ra |
| Mục đích | Lấy dữ liệu, kích hoạt thao tác bên ngoài | Nhận thông báo, sự kiện bên ngoài |
| Kịch bản điển hình | Gọi interface thanh toán, truy vấn thời tiết | Callback thanh toán, thông báo tin nhắn |

Hai chức năng này bổ trợ cho nhau, cùng xây dựng giải pháp tích hợp hệ thống hoàn chỉnh.

## Tài nguyên liên quan

- [Tài liệu plugin Workflow](/plugins/@nocobase/plugin-workflow/index.md)
- [Workflow: Node HTTP Request](/workflow/nodes/request)
- [Workflow: Webhook trigger](/integration/workflow-webhook/index.md)
- [Xác thực API Key](/integration/api-keys/index.md)
- [Plugin tài liệu API](/plugins/@nocobase/plugin-api-doc/index.md)
