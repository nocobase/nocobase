---
title: "Tích hợp Workflow Webhook"
description: "Webhook trigger nhận HTTP call bên ngoài để kích hoạt workflow: gửi form, thông báo, đồng bộ dữ liệu, sự kiện GitHub/GitLab, cấu hình xác thực chữ ký, chế độ đồng bộ/bất đồng bộ, thực hành bảo mật."
keywords: "Workflow Webhook,Webhook trigger,Tích hợp hệ thống ngoài,Gửi form,GitHub Webhook,Xác thực chữ ký,NocoBase"
---

# Tích hợp Workflow Webhook

Thông qua Webhook trigger, NocoBase có thể nhận HTTP call từ hệ thống bên thứ ba và tự động kích hoạt workflow, đạt được sự tích hợp liền mạch với các hệ thống bên ngoài.

## Tổng quan

Webhook là một cơ chế "API ngược", cho phép hệ thống bên ngoài chủ động gửi dữ liệu đến NocoBase khi xảy ra một sự kiện cụ thể. So với polling chủ động, Webhook cung cấp cách tích hợp thời gian thực và hiệu quả hơn.

## Các kịch bản ứng dụng điển hình

### Gửi dữ liệu form

Hệ thống khảo sát, biểu mẫu đăng ký, biểu mẫu phản hồi khách hàng bên ngoài, sau khi người dùng gửi dữ liệu, sẽ đẩy dữ liệu đến NocoBase qua Webhook, tự động tạo bản ghi và kích hoạt các quy trình xử lý tiếp theo (như gửi email xác nhận, phân công công việc, v.v.).

### Thông báo tin nhắn

Sự kiện từ các nền tảng tin nhắn của bên thứ ba (như WeCom, DingTalk, Slack) như tin nhắn mới, nhắc @, hoàn thành phê duyệt có thể kích hoạt quy trình tự động hóa trong NocoBase qua Webhook.

### Đồng bộ dữ liệu

Khi dữ liệu trong hệ thống bên ngoài (như CRM, ERP) thay đổi, đẩy theo thời gian thực đến NocoBase qua Webhook để giữ đồng bộ dữ liệu.

### Tích hợp dịch vụ bên thứ ba

- **GitHub**: Sự kiện đẩy mã nguồn, tạo PR kích hoạt quy trình tự động hóa
- **GitLab**: Thông báo trạng thái CI/CD
- **Gửi form**: Hệ thống biểu mẫu bên ngoài gửi dữ liệu đến NocoBase
- **Thiết bị IoT**: Thay đổi trạng thái thiết bị, báo cáo dữ liệu cảm biến

## Đặc điểm chức năng

### Cơ chế kích hoạt linh hoạt

- Hỗ trợ các phương thức HTTP như GET, POST, PUT, DELETE
- Tự động phân tích các định dạng phổ biến như JSON, dữ liệu form
- Có thể cấu hình xác thực request, đảm bảo nguồn đáng tin cậy

### Khả năng xử lý dữ liệu

- Dữ liệu nhận được có thể được sử dụng làm biến trong workflow
- Hỗ trợ logic chuyển đổi và xử lý dữ liệu phức tạp
- Có thể kết hợp với các node workflow khác để triển khai logic kinh doanh phức tạp

### Đảm bảo bảo mật

- Hỗ trợ xác thực chữ ký, ngăn chặn request giả mạo
- Có thể cấu hình IP whitelist
- Truyền dữ liệu mã hóa HTTPS

## Các bước sử dụng

### 1. Cài đặt plugin

Tìm và cài đặt plugin **[Workflow: Webhook trigger](/plugins/@nocobase/plugin-workflow-webhook/index.md)** trong trình quản lý plugin.

> Lưu ý: Plugin này là plugin thương mại, cần mua hoặc đăng ký riêng.

### 2. Tạo workflow Webhook

1. Vào trang **Quản lý workflow**
2. Nhấp **Tạo workflow**
3. Chọn **Webhook trigger** làm phương thức kích hoạt

![Tạo workflow Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Cấu hình tham số Webhook

![Cấu hình Webhook trigger](https://static-docs.nocobase.com/20241210105441.png)
   - **Đường dẫn request**: Tùy chỉnh đường dẫn URL Webhook
   - **Phương thức request**: Chọn phương thức HTTP được phép (GET/POST/PUT/DELETE)
   - **Đồng bộ/bất đồng bộ**: Chọn có chờ workflow thực thi xong rồi mới trả kết quả hay không
   - **Phương thức xác thực**: Cấu hình xác thực chữ ký hoặc cơ chế bảo mật khác

### 3. Cấu hình node workflow

Thêm các node workflow dựa trên nhu cầu kinh doanh, ví dụ:

- **Thao tác bảng dữ liệu**: Tạo, cập nhật, xóa dữ liệu
- **Đánh giá điều kiện**: Phân nhánh điều kiện dựa trên dữ liệu nhận được
- **HTTP request**: Gọi các API khác
- **Thông báo tin nhắn**: Gửi email, SMS, v.v.
- **Mã tùy chỉnh**: Thực thi mã JavaScript

### 4. Lấy URL Webhook

Sau khi workflow được tạo, hệ thống sẽ tạo URL Webhook duy nhất, định dạng thường là:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Cấu hình trong hệ thống bên thứ ba

Cấu hình URL Webhook đã tạo vào hệ thống bên thứ ba:

- Đặt địa chỉ callback gửi dữ liệu trong hệ thống biểu mẫu
- Cấu hình Webhook trong GitHub/GitLab
- Cấu hình địa chỉ đẩy sự kiện trong WeCom/DingTalk

### 6. Kiểm thử Webhook

Sử dụng công cụ (như Postman, cURL) để kiểm thử Webhook:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Truy cập dữ liệu request

Trong workflow, bạn có thể truy cập dữ liệu Webhook nhận được thông qua các biến:

- `{{$context.data}}`: Dữ liệu request body
- `{{$context.headers}}`: Thông tin request header
- `{{$context.query}}`: Tham số query URL
- `{{$context.params}}`: Tham số đường dẫn

![Phân tích tham số request](https://static-docs.nocobase.com/20241210111155.png)

![Phân tích request body](https://static-docs.nocobase.com/20241210112529.png)

## Cấu hình response

![Cài đặt response](https://static-docs.nocobase.com/20241210114312.png)

### Chế độ đồng bộ

Trả về kết quả sau khi workflow thực thi xong, có thể cấu hình:

- **Mã trạng thái response**: 200, 201, v.v.
- **Dữ liệu response**: Tùy chỉnh dữ liệu JSON trả về
- **Header response**: Tùy chỉnh HTTP header

### Chế độ bất đồng bộ

Trả về response xác nhận ngay lập tức, workflow thực thi ở background, phù hợp với:

- Workflow chạy trong thời gian dài
- Kịch bản không cần trả về kết quả thực thi
- Kịch bản đồng thời cao

## Thực hành bảo mật tốt nhất

### 1. Bật xác thực chữ ký

Hầu hết các dịch vụ bên thứ ba đều hỗ trợ cơ chế chữ ký:

```javascript
// Ví dụ: Xác thực chữ ký Webhook GitHub
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Sử dụng HTTPS

Đảm bảo NocoBase được triển khai trong môi trường HTTPS, bảo vệ an toàn truyền dữ liệu.

### 3. Hạn chế nguồn request

Cấu hình IP whitelist, chỉ cho phép request từ các nguồn đáng tin cậy.

### 4. Xác thực dữ liệu

Thêm logic xác thực dữ liệu trong workflow, đảm bảo dữ liệu nhận được có định dạng đúng và nội dung hợp lệ.

### 5. Audit log

Ghi lại tất cả request Webhook để dễ theo dõi và xử lý sự cố.

## Câu hỏi thường gặp

### Webhook không kích hoạt?

1. Kiểm tra URL Webhook có chính xác không
2. Xác nhận trạng thái workflow là "đã bật"
3. Xem log gửi của hệ thống bên thứ ba
4. Kiểm tra firewall và cấu hình mạng

### Cách debug Webhook?

1. Xem bản ghi thực thi workflow để biết thông tin chi tiết về request và kết quả gọi
2. Sử dụng công cụ kiểm thử Webhook (như Webhook.site) để xác thực request
3. Kiểm tra dữ liệu chính và thông tin lỗi trong bản ghi thực thi

### Cách xử lý retry?

Một số dịch vụ bên thứ ba sẽ retry gửi khi không nhận được response thành công:

- Đảm bảo workflow có tính idempotent
- Sử dụng định danh duy nhất để loại bỏ trùng lặp
- Ghi lại ID request đã xử lý

### Khuyến nghị tối ưu hiệu suất

- Sử dụng chế độ bất đồng bộ để xử lý các thao tác tốn thời gian
- Thêm đánh giá điều kiện, lọc các request không cần xử lý
- Cân nhắc sử dụng message queue cho kịch bản đồng thời cao

## Kịch bản ví dụ

### Xử lý gửi form bên ngoài

```javascript
// 1. Xác thực nguồn dữ liệu
// 2. Phân tích dữ liệu form
const formData = context.data;

// 3. Tạo bản ghi khách hàng
// 4. Phân công cho người phụ trách liên quan
// 5. Gửi email xác nhận cho người gửi
if (formData.email) {
  // Gửi thông báo email
}
```

### Thông báo đẩy mã nguồn GitHub

```javascript
// 1. Phân tích dữ liệu push
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Nếu là nhánh chính
if (branch === 'main') {
  // 3. Kích hoạt quy trình deploy
  // 4. Thông báo thành viên team
}
```

![Ví dụ workflow Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Tài nguyên liên quan

- [Tài liệu plugin Workflow](/plugins/@nocobase/plugin-workflow/index.md)
- [Workflow: Webhook trigger](/workflow/triggers/webhook)
- [Workflow: Node HTTP request](/integration/workflow-http-request/index.md)
- [Xác thực API Key](/integration/api-keys/index.md)
