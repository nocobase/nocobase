:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan

## Giới thiệu

Plugin Cơ sở tri thức AI cung cấp khả năng truy xuất RAG cho các trợ lý AI.

Khả năng truy xuất RAG cho phép các trợ lý AI cung cấp những câu trả lời chính xác hơn, chuyên nghiệp hơn và có tính liên quan cao hơn đến nội bộ doanh nghiệp khi phản hồi câu hỏi của người dùng.

Bằng cách sử dụng các tài liệu chuyên ngành và tài liệu nội bộ doanh nghiệp được cung cấp từ cơ sở tri thức do quản trị viên duy trì, độ chính xác và khả năng truy xuất nguồn gốc của các phản hồi từ trợ lý AI được nâng cao.

### RAG là gì

RAG (Retrieval Augmented Generation) là viết tắt của "Truy xuất – Tăng cường – Sinh tạo".

- Truy xuất: Câu hỏi của người dùng được chuyển đổi thành vector bởi một mô hình Embedding (ví dụ: BERT). Các đoạn văn bản liên quan Top-K được truy xuất từ thư viện vector thông qua truy xuất dày đặc (tương đồng ngữ nghĩa) hoặc truy xuất thưa thớt (khớp từ khóa).
- Tăng cường: Kết quả truy xuất được ghép nối với câu hỏi gốc để tạo thành một lời nhắc tăng cường (Prompt), sau đó được đưa vào cửa sổ ngữ cảnh của LLM.
- Sinh tạo: LLM kết hợp lời nhắc tăng cường để sinh tạo câu trả lời cuối cùng, đảm bảo tính xác thực và khả năng truy xuất nguồn gốc.

## Cài đặt

1. Truy cập trang quản lý plugin.
2. Tìm plugin `AI: Knowledge base` và kích hoạt.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)