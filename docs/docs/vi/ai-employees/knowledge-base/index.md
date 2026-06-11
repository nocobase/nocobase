---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Tổng quan về Knowledge Base AI"
description: "Knowledge Base AI cung cấp năng lực truy xuất RAG cho Nhân viên AI, nâng cao tính chính xác và khả năng truy nguyên của câu trả lời thông qua Embedding và truy xuất vector, cần kích hoạt Plugin AI: Knowledge base."
keywords: "Knowledge Base AI,RAG,Tăng cường truy xuất tạo sinh,Embedding,NocoBase"
---

# Tổng quan

## Giới thiệu

Plugin Knowledge Base AI cung cấp năng lực truy xuất RAG cho Nhân viên AI.

Năng lực truy xuất RAG cho phép Nhân viên AI khi trả lời câu hỏi của người dùng có thể cung cấp câu trả lời chính xác hơn, chuyên nghiệp hơn và có liên quan cao hơn với nội bộ doanh nghiệp.

Thông qua tài liệu chuyên ngành và tài liệu nội bộ doanh nghiệp do Quản trị viên duy trì trong Knowledge Base, nâng cao tính chính xác và khả năng truy nguyên của câu trả lời từ Nhân viên AI.

### RAG là gì

RAG (Retrieval Augmented Generation) có nghĩa là "Truy xuất - Tăng cường - Tạo sinh"

- Truy xuất: Câu hỏi của người dùng được mô hình Embedding (như BERT) chuyển đổi thành vector, trong cơ sở dữ liệu vector thông qua truy xuất dày đặc (độ tương đồng ngữ nghĩa) hoặc truy xuất thưa (khớp từ khóa) thu hồi Top-K khối văn bản liên quan.
- Tăng cường: Kết quả truy xuất kết hợp với câu hỏi gốc thành Prompt tăng cường, đưa vào cửa sổ ngữ cảnh của LLM.
- Tạo sinh: LLM kết hợp Prompt tăng cường để tạo câu trả lời cuối cùng, đảm bảo tính sự thật và khả năng truy nguyên.

## Cài đặt

1. Vào trang quản lý Plugin
2. Tìm Plugin `AI: Knowledge base`, và kích hoạt

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)
