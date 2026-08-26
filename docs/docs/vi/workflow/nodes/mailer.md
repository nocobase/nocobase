---
pkg: '@nocobase/plugin-workflow-mailer'
title: "Node Workflow - Gửi email"
description: "Node gửi email: gửi email, hỗ trợ định dạng text và HTML."
keywords: "workflow,gửi email,Mailer,Email,thông báo,NocoBase"
---

# Gửi email

## Giới thiệu

Được dùng để gửi email, hỗ trợ nội dung email định dạng text và HTML.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Gửi email":

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Cấu hình Node

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Các tùy chọn đều có thể sử dụng biến trong ngữ cảnh quy trình, đối với thông tin nhạy cảm, cũng có thể sử dụng biến toàn cục và khóa bí mật.

## Câu hỏi thường gặp

### Giới hạn tần suất kích hoạt khi gửi qua Gmail

Một số khi gửi email sẽ gặp lỗi như sau:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Đây là do Gmail giới hạn tần suất với các yêu cầu gửi không có gắn nhãn tên miền gửi, cần cấu hình hostname của server thành tên miền gửi đã liên kết với Gmail khi triển khai ứng dụng. Ví dụ khi triển khai bằng Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Đặt thành tên miền gửi đã liên kết
```

Tham khảo: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)
