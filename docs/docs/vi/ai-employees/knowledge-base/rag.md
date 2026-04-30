---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "RAG - Tăng cường truy xuất tạo sinh"
description: "Kích hoạt RAG trong cài đặt Nhân viên AI, cấu hình Knowledge Base Prompt, chọn Knowledge Base, Top K, ngưỡng Score, AI phản hồi dựa trên tài liệu được truy xuất."
keywords: "RAG,Tăng cường truy xuất,Truy xuất Knowledge Base,Top K,NocoBase"
---

# Truy xuất RAG

## Giới thiệu

Sau khi cấu hình tốt Knowledge Base, bạn có thể kích hoạt tính năng RAG trong cài đặt Nhân viên AI.

Sau khi kích hoạt RAG, khi người dùng trò chuyện với Nhân viên AI, Nhân viên AI sẽ sử dụng truy xuất RAG, dùng tin nhắn của người dùng để lấy tài liệu từ Knowledge Base và phản hồi dựa trên tài liệu được truy xuất.

## Kích hoạt RAG

Vào trang cấu hình Plugin Nhân viên AI, nhấp vào tab `AI employees` để vào trang quản lý Nhân viên AI.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Chọn Nhân viên AI cần kích hoạt RAG, nhấp nút `Edit` để vào trang chỉnh sửa Nhân viên AI.

Trong tab `Knowledge base`, bật công tắc `Enable`.

- Trong `Knowledge Base Prompt` nhập câu Prompt trích dẫn Knowledge Base, `{knowledgeBaseData}` là placeholder cố định, không sửa đổi;
- Trong `Knowledge Base` chọn Knowledge Base đã cấu hình, tham khảo: [Knowledge Base](/ai-employees/knowledge-base/knowledge-base);
- Trong ô nhập `Top K` nhập số lượng tài liệu cần truy xuất, mặc định là 3;
- Trong ô nhập `Score` ngưỡng độ liên quan tài liệu khi truy xuất;

Nhấp nút `Submit` để lưu cài đặt Nhân viên AI.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)
