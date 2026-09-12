---
pkg: "@nocobase/plugin-ai"
title: "Node LLM trong Workflow - Hội thoại văn bản"
description: "Node hội thoại văn bản LLM trong Workflow: chọn mô hình, thiết lập tham số gọi, Response format, các loại tin nhắn System/User/Assistant, tham chiếu biến."
keywords: "Workflow,Node LLM,Hội thoại văn bản,Workflow AI,NocoBase"
---

# Hội thoại văn bản

<PluginInfo name="ai"></PluginInfo>

## Giới thiệu

Sử dụng Node LLM của Workflow có thể khởi tạo hội thoại với dịch vụ LLM trực tuyến, tận dụng năng lực của mô hình lớn để hỗ trợ hoàn thành một loạt các quy trình nghiệp vụ.

![](https://static-docs.nocobase.com/202503041012091.png)

## Tạo Node LLM mới

Do hội thoại với dịch vụ LLM thường khá tốn thời gian, Node LLM chỉ có thể được sử dụng trong Workflow bất đồng bộ.

![](https://static-docs.nocobase.com/202503041013363.png)

## Chọn mô hình

Trước tiên chọn dịch vụ LLM đã được tích hợp, nếu chưa tích hợp dịch vụ LLM, cần thêm cấu hình dịch vụ LLM trước. Tham khảo: [Quản lý dịch vụ LLM](/ai-employees/features/llm-service)

Sau khi chọn dịch vụ, ứng dụng sẽ cố gắng lấy danh sách mô hình khả dụng từ dịch vụ LLM để chọn. Một số API lấy mô hình của dịch vụ LLM trực tuyến có thể không tuân theo giao thức API chuẩn, người dùng cũng có thể nhập thủ công id mô hình.

![](https://static-docs.nocobase.com/202503041013084.png)

## Thiết lập tham số gọi

Có thể điều chỉnh tham số gọi mô hình LLM theo nhu cầu.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Trong đó đáng chú ý là cài đặt **Response format**, tùy chọn cài đặt này được dùng để gợi ý định dạng nội dung phản hồi của mô hình lớn, có thể là văn bản hoặc JSON. Nếu chọn chế độ JSON, cần lưu ý:

- Mô hình LLM tương ứng cần hỗ trợ gọi ở chế độ JSON, đồng thời người dùng cần gợi ý rõ ràng trong Prompt rằng LLM phản hồi định dạng JSON, ví dụ: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Nếu không có thể không có kết quả phản hồi, báo lỗi `400 status code (no body)`.
- Kết quả phản hồi là một chuỗi JSON, người dùng cần sử dụng năng lực của các Node Workflow khác để phân tích, mới có thể sử dụng nội dung có cấu trúc trong đó. Cũng có thể sử dụng tính năng [Đầu ra có cấu trúc](/ai-employees/workflow/nodes/llm/structured-output).

## Tin nhắn

Mảng tin nhắn gửi cho mô hình LLM, có thể bao gồm một nhóm tin nhắn lịch sử. Trong đó tin nhắn hỗ trợ ba loại:

- System - Thường được dùng để định nghĩa vai trò và hành vi mà mô hình LLM đóng vai trong hội thoại.
- User - Nội dung do người dùng nhập.
- Assistant - Nội dung do mô hình phản hồi.

Đối với tin nhắn người dùng, với tiền đề mô hình hỗ trợ, có thể thêm nhiều mục nội dung trong một Prompt, tương ứng với tham số `content`. Nếu mô hình được sử dụng chỉ hỗ trợ tham số `content` dưới dạng chuỗi (đại đa số mô hình không hỗ trợ hội thoại đa phương thức thuộc loại này), vui lòng chia tin nhắn thành nhiều Prompt, mỗi Prompt chỉ giữ lại một mục nội dung, như vậy Node sẽ gửi nội dung dưới dạng chuỗi.

![](https://static-docs.nocobase.com/202503041016140.png)

Trong nội dung tin nhắn có thể sử dụng biến để tham chiếu ngữ cảnh của Workflow.

![](https://static-docs.nocobase.com/202503041017879.png)

## Sử dụng nội dung phản hồi của Node LLM

Có thể sử dụng nội dung phản hồi của Node LLM làm biến trong các Node khác.

![](https://static-docs.nocobase.com/202503041018508.png)
