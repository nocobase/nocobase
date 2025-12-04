---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Gửi email

## Giới thiệu

Dùng để gửi email, hỗ trợ nội dung ở định dạng văn bản và HTML.

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Gửi email":

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Cấu hình nút

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Mỗi tùy chọn có thể sử dụng các biến từ ngữ cảnh của luồng công việc. Đối với thông tin nhạy cảm, quý vị cũng có thể sử dụng các biến toàn cục và khóa bí mật.

## Câu hỏi thường gặp

### Giới hạn tần suất gửi email của Gmail

Khi gửi một số email, quý vị có thể gặp lỗi sau:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Điều này là do Gmail giới hạn tần suất các yêu cầu gửi từ các miền chưa được chỉ định. Khi triển khai ứng dụng, quý vị cần cấu hình hostname của máy chủ thành miền đã liên kết trong Gmail. Ví dụ, khi triển khai bằng Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Đặt thành miền gửi đã liên kết của quý vị
```

Tham khảo: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)