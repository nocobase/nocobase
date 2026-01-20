---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Đầu ra có cấu trúc

## Giới thiệu

Trong một số trường hợp sử dụng, người dùng có thể muốn mô hình LLM phản hồi nội dung có cấu trúc dưới định dạng JSON. Bạn có thể đạt được điều này bằng cách cấu hình tính năng "Đầu ra có cấu trúc".

![](https://static-docs.nocobase.com/202503041306405.png)

## Cấu hình

- **JSON Schema** - Người dùng có thể chỉ định cấu trúc phản hồi mong muốn của mô hình bằng cách cấu hình [JSON Schema](https://json-schema.org/).
- **Tên (Name)** - _Tùy chọn_, dùng để giúp mô hình hiểu rõ hơn về đối tượng mà JSON Schema đại diện.
- **Mô tả (Description)** - _Tùy chọn_, dùng để giúp mô hình hiểu rõ hơn về mục đích của JSON Schema.
- **Strict** - Yêu cầu mô hình tạo phản hồi tuân thủ nghiêm ngặt cấu trúc JSON Schema. Hiện tại, chỉ một số mô hình mới của OpenAI hỗ trợ tham số này. Vui lòng xác nhận mô hình của bạn có tương thích hay không trước khi chọn.

## Phương thức tạo nội dung có cấu trúc

Cách mô hình tạo nội dung có cấu trúc phụ thuộc vào **mô hình** được sử dụng và cấu hình **định dạng phản hồi (Response format)** của nó:

1. Các mô hình mà định dạng phản hồi (Response format) chỉ hỗ trợ `text`

   - Khi được gọi, nút sẽ liên kết một Tool (công cụ) tạo nội dung định dạng JSON dựa trên JSON Schema, hướng dẫn mô hình tạo phản hồi có cấu trúc thông qua việc gọi Tool này.

2. Các mô hình mà định dạng phản hồi (Response format) hỗ trợ chế độ JSON (`json_object`)

   - Nếu chọn chế độ JSON khi gọi, người dùng cần chỉ dẫn rõ ràng cho mô hình trong Prompt để trả về dưới định dạng JSON và cung cấp mô tả cho các trường phản hồi.
   - Ở chế độ này, JSON Schema chỉ được dùng để phân tích chuỗi JSON mà mô hình trả về, sau đó chuyển đổi nó thành đối tượng JSON mục tiêu.

3. Các mô hình mà định dạng phản hồi (Response format) hỗ trợ JSON Schema (`json_schema`)

   - JSON Schema được sử dụng trực tiếp để chỉ định cấu trúc phản hồi mục tiêu cho mô hình.
   - Tham số **Strict** tùy chọn yêu cầu mô hình tuân thủ nghiêm ngặt JSON Schema khi tạo phản hồi.

4. Các mô hình cục bộ của Ollama
   - Nếu đã cấu hình JSON Schema, khi được gọi, nút sẽ truyền nó dưới dạng tham số `format` vào mô hình.

## Sử dụng kết quả đầu ra có cấu trúc

Nội dung có cấu trúc trong phản hồi của mô hình được lưu dưới dạng đối tượng JSON trong trường Structured content của nút, và có thể được sử dụng bởi các nút tiếp theo.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)