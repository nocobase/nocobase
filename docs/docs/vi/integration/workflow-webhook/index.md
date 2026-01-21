:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tích hợp Webhook vào luồng công việc

Với trình kích hoạt Webhook, NocoBase có thể nhận các lệnh gọi HTTP từ các hệ thống bên thứ ba và tự động kích hoạt các luồng công việc, giúp tích hợp liền mạch với các hệ thống bên ngoài.

## Tổng quan

Webhook là một cơ chế "API đảo ngược", cho phép các hệ thống bên ngoài chủ động gửi dữ liệu đến NocoBase khi có các sự kiện cụ thể xảy ra. So với việc chủ động thăm dò (polling), Webhook cung cấp một phương pháp tích hợp theo thời gian thực và hiệu quả hơn.

## Các trường hợp sử dụng điển hình

### Gửi dữ liệu biểu mẫu

Các hệ thống khảo sát bên ngoài, biểu mẫu đăng ký, biểu mẫu phản hồi khách hàng, v.v., sau khi người dùng gửi dữ liệu, sẽ đẩy dữ liệu đó đến NocoBase thông qua Webhook. NocoBase sẽ tự động tạo các bản ghi và kích hoạt các quy trình xử lý tiếp theo (như gửi email xác nhận, phân công nhiệm vụ, v.v.).

### Thông báo tin nhắn

Các sự kiện từ các nền tảng nhắn tin bên thứ ba (như WeCom, DingTalk, Slack) như tin nhắn mới, nhắc nhở (@), hoặc hoàn tất phê duyệt có thể kích hoạt các quy trình xử lý tự động trong NocoBase thông qua Webhook.

### Đồng bộ hóa dữ liệu

Khi dữ liệu trong các hệ thống bên ngoài (như CRM, ERP) thay đổi, Webhook sẽ đẩy các cập nhật đó đến NocoBase theo thời gian thực để duy trì đồng bộ hóa dữ liệu.

### Tích hợp dịch vụ bên thứ ba

- **GitHub**: Các sự kiện như đẩy mã (code push), tạo yêu cầu kéo (PR creation) sẽ kích hoạt các luồng công việc tự động.
- **GitLab**: Thông báo trạng thái quy trình CI/CD.
- **Gửi biểu mẫu**: Các hệ thống biểu mẫu bên ngoài gửi dữ liệu đến NocoBase.
- **Thiết bị IoT**: Thay đổi trạng thái thiết bị, báo cáo dữ liệu cảm biến.

## Tính năng nổi bật

### Cơ chế kích hoạt linh hoạt

- Hỗ trợ các phương thức HTTP như GET, POST, PUT, DELETE.
- Tự động phân tích cú pháp các định dạng phổ biến như JSON, dữ liệu biểu mẫu.
- Có thể cấu hình xác thực yêu cầu để đảm bảo nguồn đáng tin cậy.

### Khả năng xử lý dữ liệu

- Dữ liệu nhận được có thể được sử dụng làm biến trong các luồng công việc.
- Hỗ trợ logic chuyển đổi và xử lý dữ liệu phức tạp.
- Có thể kết hợp với các nút luồng công việc khác để triển khai logic nghiệp vụ phức tạp.

### Đảm bảo an toàn bảo mật

- Hỗ trợ xác minh chữ ký để ngăn chặn các yêu cầu giả mạo.
- Có thể cấu hình danh sách trắng IP (IP whitelist).
- Truyền dữ liệu được mã hóa bằng HTTPS.

## Các bước sử dụng

### 1. Cài đặt plugin

Tìm và cài đặt plugin **[Luồng công việc: Trình kích hoạt Webhook](/plugins/@nocobase/plugin-workflow-webhook/)** trong trình quản lý plugin.

> Lưu ý: Đây là một plugin thương mại, yêu cầu mua riêng hoặc đăng ký.

### 2. Tạo luồng công việc Webhook

1. Truy cập trang **Quản lý luồng công việc**.
2. Nhấp vào **Tạo luồng công việc**.
3. Chọn **Trình kích hoạt Webhook** làm phương thức kích hoạt.

![Tạo luồng công việc Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Cấu hình các tham số Webhook.

![Cấu hình trình kích hoạt Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Đường dẫn yêu cầu**: Tùy chỉnh đường dẫn URL của Webhook.
   - **Phương thức yêu cầu**: Chọn các phương thức HTTP được phép (GET/POST/PUT/DELETE).
   - **Đồng bộ/Bất đồng bộ**: Chọn có đợi luồng công việc hoàn tất rồi mới trả về kết quả hay không.
   - **Phương thức xác thực**: Cấu hình xác minh chữ ký hoặc các cơ chế bảo mật khác.

### 3. Cấu hình các nút luồng công việc

Thêm các nút luồng công việc dựa trên yêu cầu nghiệp vụ, ví dụ:

- **Thao tác bộ sưu tập**: Tạo, cập nhật, xóa bản ghi.
- **Logic điều kiện**: Phân nhánh dựa trên dữ liệu nhận được.
- **Yêu cầu HTTP**: Gọi các API khác.
- **Thông báo**: Gửi email, SMS, v.v.
- **Mã tùy chỉnh**: Thực thi mã JavaScript.

### 4. Lấy URL Webhook

Sau khi tạo luồng công việc, hệ thống sẽ tạo một URL Webhook duy nhất, thường có định dạng:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Cấu hình trong hệ thống bên thứ ba

Cấu hình URL Webhook đã tạo vào hệ thống bên thứ ba:

- Đặt địa chỉ gọi lại (callback address) gửi dữ liệu trong các hệ thống biểu mẫu.
- Cấu hình Webhook trong GitHub/GitLab.
- Cấu hình địa chỉ đẩy sự kiện trong WeCom/DingTalk.

### 6. Kiểm tra Webhook

Sử dụng các công cụ (như Postman, cURL) để kiểm tra Webhook:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Truy cập dữ liệu yêu cầu

Trong các luồng công việc, bạn có thể truy cập dữ liệu mà Webhook nhận được thông qua các biến:

- `{{$context.data}}`: Dữ liệu phần thân yêu cầu (request body).
- `{{$context.headers}}`: Thông tin tiêu đề yêu cầu (request headers).
- `{{$context.query}}`: Tham số truy vấn URL (URL query parameters).
- `{{$context.params}}`: Tham số đường dẫn (path parameters).

![Phân tích tham số yêu cầu](https://static-docs.nocobase.com/20241210111155.png)

![Phân tích phần thân yêu cầu](https://static-docs.nocobase.com/20241210112529.png)

## Cấu hình phản hồi

![Cài đặt phản hồi](https://static-docs.nocobase.com/20241210114312.png)

### Chế độ đồng bộ

Trả về kết quả sau khi luồng công việc hoàn tất thực thi, có thể cấu hình:

- **Mã trạng thái phản hồi**: 200, 201, v.v.
- **Dữ liệu phản hồi**: Dữ liệu JSON tùy chỉnh được trả về.
- **Tiêu đề phản hồi**: Tiêu đề HTTP tùy chỉnh.

### Chế độ bất đồng bộ

Trả về xác nhận ngay lập tức, luồng công việc sẽ thực thi ở chế độ nền. Phù hợp cho:

- Các luồng công việc chạy trong thời gian dài.
- Các trường hợp không yêu cầu trả về kết quả thực thi.
- Các tình huống có độ đồng thời cao.

## Các thực hành bảo mật tốt nhất

### 1. Bật xác minh chữ ký

Hầu hết các dịch vụ bên thứ ba đều hỗ trợ cơ chế chữ ký:

```javascript
// Ví dụ: Xác minh chữ ký Webhook của GitHub
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

Đảm bảo NocoBase được triển khai trong môi trường HTTPS để bảo vệ an toàn truyền dữ liệu.

### 3. Hạn chế nguồn yêu cầu

Cấu hình danh sách trắng IP (IP whitelist) để chỉ cho phép các yêu cầu từ các nguồn đáng tin cậy.

### 4. Xác thực dữ liệu

Thêm logic xác thực dữ liệu vào các luồng công việc để đảm bảo dữ liệu nhận được có định dạng chính xác và nội dung hợp lệ.

### 5. Ghi nhật ký kiểm tra

Ghi lại tất cả các yêu cầu Webhook để dễ dàng theo dõi và khắc phục sự cố.

## Khắc phục sự cố

### Webhook không kích hoạt?

1. Kiểm tra xem URL Webhook có đúng không.
2. Xác nhận trạng thái của luồng công việc là "Đã bật".
3. Xem nhật ký gửi của hệ thống bên thứ ba.
4. Kiểm tra cấu hình tường lửa và mạng.

### Làm thế nào để gỡ lỗi Webhook?

1. Xem nhật ký thực thi luồng công việc để biết thông tin chi tiết về các yêu cầu và kết quả gọi.
2. Sử dụng các công cụ kiểm tra Webhook (như Webhook.site) để xác minh các yêu cầu.
3. Kiểm tra dữ liệu quan trọng và thông báo lỗi trong nhật ký thực thi.

### Làm thế nào để xử lý việc thử lại?

Một số dịch vụ bên thứ ba sẽ thử gửi lại nếu không nhận được phản hồi thành công:

- Đảm bảo luồng công việc có tính chất lũy đẳng (idempotent).
- Sử dụng các định danh duy nhất để loại bỏ trùng lặp.
- Ghi lại các ID yêu cầu đã được xử lý.

### Mẹo tối ưu hóa hiệu suất

- Sử dụng chế độ bất đồng bộ để xử lý các thao tác tốn thời gian.
- Thêm logic điều kiện để lọc bỏ các yêu cầu không cần xử lý.
- Cân nhắc sử dụng hàng đợi tin nhắn (message queues) để xử lý các tình huống có độ đồng thời cao.

## Các kịch bản ví dụ

### Xử lý gửi biểu mẫu bên ngoài

```javascript
// 1. Xác minh nguồn dữ liệu
// 2. Phân tích dữ liệu biểu mẫu
const formData = context.data;

// 3. Tạo bản ghi khách hàng
// 4. Phân công cho người phụ trách liên quan
// 5. Gửi email xác nhận cho người gửi
if (formData.email) {
  // Gửi thông báo qua email
}
```

### Thông báo đẩy mã GitHub

```javascript
// 1. Phân tích dữ liệu đẩy
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Nếu là nhánh chính
if (branch === 'main') {
  // 3. Kích hoạt quy trình triển khai
  // 4. Thông báo cho các thành viên nhóm
}
```

![Ví dụ luồng công việc Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Tài nguyên liên quan

- [Tài liệu plugin luồng công việc](/plugins/@nocobase/plugin-workflow/)
- [Luồng công việc: Trình kích hoạt Webhook](/workflow/triggers/webhook)
- [Luồng công việc: Nút yêu cầu HTTP](/integration/workflow-http-request/)
- [Xác thực bằng khóa API](/integration/api-keys/)