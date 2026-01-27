---
pkg: "@nocobase/plugin-ai"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Đối thoại văn bản

## Giới thiệu

Sử dụng nút LLM trong một luồng công việc, bạn có thể bắt đầu một cuộc đối thoại với dịch vụ LLM trực tuyến, tận dụng khả năng của các mô hình lớn để hỗ trợ hoàn thành một loạt các quy trình nghiệp vụ.

![](https://static-docs.nocobase.com/202503041012091.png)

## Tạo nút LLM

Vì việc đối thoại với các dịch vụ LLM thường tốn thời gian, nút LLM chỉ có thể được sử dụng trong các luồng công việc không đồng bộ.

![](https://static-docs.nocobase.com/202503041013363.png)

## Chọn mô hình

Đầu tiên, hãy chọn một dịch vụ LLM đã được kết nối. Nếu chưa có dịch vụ LLM nào được kết nối, bạn cần thêm cấu hình dịch vụ LLM trước. Tham khảo: [Quản lý dịch vụ LLM](/ai-employees/quick-start/llm-service)

Sau khi chọn dịch vụ, ứng dụng sẽ cố gắng lấy danh sách các mô hình khả dụng từ dịch vụ LLM để bạn lựa chọn. Một số dịch vụ LLM trực tuyến có thể có API để lấy mô hình không tuân thủ các giao thức API tiêu chuẩn; trong những trường hợp như vậy, người dùng cũng có thể nhập thủ công ID mô hình.

![](https://static-docs.nocobase.com/202503041013084.png)

## Thiết lập tham số gọi

Bạn có thể điều chỉnh các tham số để gọi mô hình LLM theo nhu cầu.

![](https://static-docs.nocobase.com/202503041014778.png)

### Định dạng phản hồi

Một điểm đáng chú ý là cài đặt **Định dạng phản hồi** (Response format). Tùy chọn này được sử dụng để gợi ý cho mô hình lớn về định dạng nội dung phản hồi của nó, có thể là văn bản hoặc JSON. Nếu bạn chọn chế độ JSON, hãy lưu ý những điều sau:

- Mô hình LLM tương ứng phải hỗ trợ được gọi ở chế độ JSON. Ngoài ra, người dùng cần gợi ý rõ ràng cho LLM phản hồi ở định dạng JSON trong Prompt, ví dụ: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Nếu không, có thể không có phản hồi, dẫn đến lỗi `400 status code (no body)`.
- Kết quả phản hồi sẽ là một chuỗi JSON. Người dùng cần phân tích cú pháp nó bằng cách sử dụng khả năng của các nút luồng công việc khác trước khi có thể sử dụng nội dung có cấu trúc bên trong. Bạn cũng có thể sử dụng tính năng [Đầu ra có cấu trúc](/ai-employees/workflow/nodes/llm/structured-output).

## Tin nhắn

Mảng tin nhắn được gửi đến mô hình LLM có thể bao gồm một tập hợp các tin nhắn lịch sử. Tin nhắn hỗ trợ ba loại:

- System - Thường được sử dụng để định nghĩa vai trò và hành vi của mô hình LLM trong cuộc đối thoại.
- User - Nội dung do người dùng nhập.
- Assistant - Nội dung phản hồi của mô hình.

Đối với tin nhắn người dùng, với điều kiện mô hình hỗ trợ, bạn có thể thêm nhiều nội dung trong một lời nhắc duy nhất, tương ứng với tham số `content`. Nếu mô hình bạn đang sử dụng chỉ hỗ trợ tham số `content` dưới dạng chuỗi (điều này đúng với hầu hết các mô hình không hỗ trợ đối thoại đa phương thức), vui lòng chia tin nhắn thành nhiều lời nhắc, với mỗi lời nhắc chỉ chứa một nội dung. Bằng cách này, nút sẽ gửi nội dung dưới dạng chuỗi.

![](https://static-docs.nocobase.com/202503041016140.png)

Bạn có thể sử dụng các biến trong nội dung tin nhắn để tham chiếu ngữ cảnh của luồng công việc.

![](https://static-docs.nocobase.com/202503041017879.png)

## Sử dụng nội dung phản hồi của nút LLM

Bạn có thể sử dụng nội dung phản hồi của nút LLM làm biến trong các nút khác.

![](https://static-docs.nocobase.com/202503041018508.png)