---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/ai-employees/workflow/nodes/llm/chat).
:::

# Đối thoại văn bản

## Giới thiệu

Sử dụng nút LLM của luồng công việc có thể khởi tạo đối thoại với dịch vụ LLM trực tuyến, tận dụng khả năng của mô hình lớn để hỗ trợ hoàn thành một loạt các quy trình nghiệp vụ.

![](https://static-docs.nocobase.com/202503041012091.png)

## 新建 LLM 节点

Do việc đối thoại với dịch vụ LLM thường tốn thời gian, nút LLM chỉ có thể được sử dụng trong các luồng công việc không đồng bộ.

![](https://static-docs.nocobase.com/202503041013363.png)

## Chọn mô hình

Trước tiên, hãy chọn dịch vụ LLM đã kết nối, nếu chưa kết nối dịch vụ LLM, bạn cần thêm cấu hình dịch vụ LLM trước. Tham khảo: [Quản lý dịch vụ LLM](/ai-employees/features/llm-service)

Sau khi chọn dịch vụ, ứng dụng sẽ cố gắng lấy danh sách các mô hình khả dụng từ dịch vụ LLM để lựa chọn. Giao diện lấy mô hình của một số dịch vụ LLM trực tuyến có thể không tuân thủ giao thức API tiêu chuẩn, người dùng cũng có thể nhập ID mô hình theo cách thủ công.

![](https://static-docs.nocobase.com/202503041013084.png)

## Thiết lập tham số gọi

Có thể điều chỉnh các tham số gọi mô hình LLM theo nhu cầu.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Trong đó đáng chú ý là cài đặt **Response format**, mục cài đặt này được sử dụng để gợi ý định dạng nội dung phản hồi của mô hình lớn, có thể là văn bản hoặc JSON. Nếu chọn chế độ JSON, cần lưu ý:

- Mô hình LLM tương ứng cần hỗ trợ gọi ở chế độ JSON, đồng thời người dùng cần gợi ý rõ ràng trong Prompt để LLM phản hồi định dạng JSON, ví dụ: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Nếu không có thể sẽ không có kết quả phản hồi, báo lỗi `400 status code (no body)`.
- Kết quả phản hồi là một chuỗi JSON, người dùng cần sử dụng khả năng của các nút khác trong luồng công việc để phân tích trước khi có thể sử dụng nội dung có cấu trúc bên trong. Cũng có thể sử dụng tính năng [Đầu ra có cấu trúc](/ai-employees/workflow/nodes/llm/structured-output).

## Tin nhắn

Mảng tin nhắn gửi đến mô hình LLM, có thể bao gồm một nhóm tin nhắn lịch sử. Trong đó tin nhắn hỗ trợ ba loại:

- System - Thường được sử dụng để định nghĩa vai trò và hành vi của mô hình LLM trong cuộc đối thoại.
- User - Nội dung người dùng nhập.
- Assistant - Nội dung mô hình phản hồi.

Đối với tin nhắn người dùng, với tiền đề là mô hình hỗ trợ, có thể thêm nhiều nội dung trong một lời nhắc, tương ứng với tham số `content`. Nếu mô hình đang sử dụng chỉ hỗ trợ tham số `content` dưới dạng chuỗi (hầu hết các mô hình không hỗ trợ đối thoại đa phương thức đều thuộc loại này), vui lòng chia tin nhắn thành nhiều lời nhắc, mỗi lời nhắc chỉ giữ lại một nội dung, như vậy nút sẽ gửi nội dung dưới dạng chuỗi.

![](https://static-docs.nocobase.com/202503041016140.png)

Trong nội dung tin nhắn có thể sử dụng biến để tham chiếu ngữ cảnh của luồng công việc.

![](https://static-docs.nocobase.com/202503041017879.png)

## Sử dụng nội dung phản hồi của nút LLM

Có thể sử dụng nội dung phản hồi của nút LLM làm biến trong các nút khác.

![](https://static-docs.nocobase.com/202503041018508.png)