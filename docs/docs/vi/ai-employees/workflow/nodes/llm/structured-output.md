---
pkg: "@nocobase/plugin-ai"
title: "Node LLM Workflow - Đầu ra có cấu trúc"
description: "Đầu ra có cấu trúc LLM trong Workflow: cấu hình JSON Schema để quy định cấu trúc phản hồi, hỗ trợ các chế độ text/json_object/json_schema, tham số format cho mô hình cục bộ Ollama."
keywords: "Workflow,Node LLM,Đầu ra có cấu trúc,JSON Schema,NocoBase"
---

# Đầu ra có cấu trúc

<PluginInfo name="ai-ee" licenseBundled="true"></PluginInfo>

## Giới thiệu

Trong một số tình huống ứng dụng, người dùng có thể muốn mô hình LLM phản hồi nội dung có cấu trúc theo định dạng JSON. Điều này có thể được thực hiện bằng cách cấu hình "Đầu ra có cấu trúc".

![](https://static-docs.nocobase.com/202503041306405.png)

## Hướng dẫn cấu hình

- **JSON Schema** - Người dùng có thể cấu hình [JSON Schema](https://json-schema.org/) để quy định cấu trúc phản hồi mong muốn từ mô hình.
- **Tên (Name)** - _Không bắt buộc_, dùng để giúp mô hình hiểu rõ hơn về đối tượng mà JSON Schema biểu thị.
- **Mô tả (Description)** - _Không bắt buộc_, dùng để giúp mô hình hiểu rõ hơn về mục đích của JSON Schema.
- **Strict** - Yêu cầu mô hình tạo phản hồi tuân thủ nghiêm ngặt theo cấu trúc JSON Schema. Hiện tại, chỉ một số mô hình mới của OpenAI hỗ trợ tham số này, vui lòng xác nhận khả năng tương thích của mô hình trước khi đánh dấu chọn.

## Phương thức tạo nội dung có cấu trúc

Phương thức tạo nội dung có cấu trúc của mô hình phụ thuộc vào **mô hình** được sử dụng và cấu hình **Response format** của nó:

1. Mô hình chỉ hỗ trợ Response format là `text`

   - Khi gọi, Node sẽ liên kết một Tools tạo nội dung định dạng JSON dựa trên JSON Schema, hướng dẫn mô hình tạo phản hồi có cấu trúc thông qua việc gọi Tools này.

2. Mô hình hỗ trợ Response format chế độ JSON (`json_object`)

   - Nếu chọn chế độ JSON khi gọi, người dùng cần chỉ thị rõ ràng trong Prompt để mô hình trả về theo định dạng JSON và cung cấp mô tả các Field phản hồi.
   - Trong chế độ này, JSON Schema chỉ được dùng để phân tích chuỗi JSON do mô hình trả về và chuyển đổi thành đối tượng JSON mục tiêu.

3. Mô hình hỗ trợ Response format JSON Schema (`json_schema`)

   - JSON Schema được sử dụng trực tiếp để chỉ định cấu trúc phản hồi mục tiêu của mô hình.
   - Tham số tùy chọn **Strict** yêu cầu mô hình tạo phản hồi tuân thủ nghiêm ngặt JSON Schema.

4. Mô hình cục bộ Ollama
   - Nếu đã cấu hình JSON Schema, khi gọi, Node sẽ truyền nó vào mô hình dưới dạng tham số `format`.

## Sử dụng kết quả đầu ra có cấu trúc

Nội dung có cấu trúc do mô hình phản hồi được lưu trong Field Structured content của Node dưới dạng đối tượng JSON, có thể được sử dụng bởi các Node tiếp theo.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)
