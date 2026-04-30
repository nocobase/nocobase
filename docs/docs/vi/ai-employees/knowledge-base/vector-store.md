---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Lưu trữ vector"
description: "Lưu trữ vector là sự ràng buộc giữa Embedding model và cơ sở dữ liệu vector, dùng cho vector hóa tài liệu và truy xuất. Cấu hình Vector store, LLM service, Embedding model."
keywords: "Lưu trữ vector,Embedding model,Cơ sở dữ liệu vector,NocoBase"
---

# Lưu trữ vector

## Giới thiệu

Trong Knowledge Base, khi lưu trữ tài liệu thì vector hóa tài liệu, khi truy xuất tài liệu thì vector hóa từ khóa truy xuất, đều cần sử dụng `Embedding model` để xử lý vector hóa văn bản gốc.

Trong Plugin Knowledge Base AI, lưu trữ vector chính là sự ràng buộc giữa `Embedding model` và cơ sở dữ liệu vector.

## Quản lý lưu trữ vector

Vào trang cấu hình Plugin Nhân viên AI, nhấp vào tab `Vector store`, chọn `Vector store` để vào trang quản lý lưu trữ vector.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Nhấp nút `Add new` ở góc trên bên phải để thêm lưu trữ vector mới:

- Trong ô nhập `Name` nhập tên lưu trữ vector;
- Trong `Vector store` chọn cơ sở dữ liệu vector đã được cấu hình, tham khảo: [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database);
- Trong `LLM service` chọn dịch vụ LLM đã được cấu hình, tham khảo: [Quản lý dịch vụ LLM](/ai-employees/features/llm-service);
- Trong ô nhập `Embedding model` nhập tên mô hình `Embedding` cần sử dụng;

Nhấp nút `Submit` để lưu thông tin lưu trữ vector.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)
