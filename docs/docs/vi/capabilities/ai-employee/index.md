---
title: 'Tổng quan AI Employee'
---

# Tổng quan AI Employee

AI Employee là trợ lý trong ứng dụng với trách nhiệm được xác định rõ. AI Employee có thể dùng ngữ cảnh trang, truy vấn dữ liệu nghiệp vụ, gọi các thao tác được phép theo chỉ dẫn công việc và trả lời dựa trên tri thức của công ty. Hãy yêu cầu Agent phát triển của bạn kết nối các năng lực này và xây dựng giao diện hội thoại cùng giao diện kết quả mà người dùng cần.

## Các năng lực sẵn có

| Năng lực | Mục đích |
| --- | --- |
| [Ngữ cảnh trang](./page-context.md) | Trả lời về đơn hàng, khách hàng hoặc biểu mẫu đang mở. |
| [Truy vấn nghiệp vụ](./business-data.md) | Tìm bản ghi bằng ngôn ngữ tự nhiên và liên kết kết quả đến các trang trong ứng dụng. |
| [Thao tác nghiệp vụ](./business-actions.md) | Kết nối thao tác nghiệp vụ với cơ chế cấp quyền phía server và bản ghi thực thi. |
| [Trách nhiệm và quy tắc làm việc](./work-rules.md) | Xác định nhiệm vụ, phong cách phản hồi và các thao tác được phép. |
| [Tri thức công ty](../ai-knowledge-base/answers.md) | Tìm tài liệu hỗ trợ và liên kết câu trả lời đến nguồn có thể đọc được. |

Cuộc hội thoại có thể xuất hiện trên một trang riêng, trong một block nghiệp vụ hoặc bên cạnh trang hiện tại.

## Chuẩn bị AI Employee

Ứng dụng cần năng lực Agents và một dịch vụ mô hình khả dụng. Agent phát triển có thể kết nối mô hình, chỉ dẫn và thao tác nghiệp vụ; biểu mẫu tạo AI Employee riêng là không bắt buộc.

```text
Connect a Transport assistant to the Northstar application using my configured model service.
It explains orders, finds records awaiting dispatch and offers advice using transport procedures.
Connect order-reading actions within the current user's access scope. Start with queries; do not automatically change orders or send notifications.
Provide conversation entry points on order lists and details, with follow-up questions and links to returned orders.
```

Dịch vụ mô hình có thể dùng nhà cung cấp đám mây hoặc một dịch vụ cục bộ sẵn có. Hãy chỉ định endpoint, các mô hình khả dụng và cấu hình thông tin xác thực. Thao tác nghiệp vụ kiểm soát quyền truy cập ở phía server.

Hãy bắt đầu với [ngữ cảnh trang](./page-context.md), sau đó đến [truy vấn nghiệp vụ](./business-data.md).
