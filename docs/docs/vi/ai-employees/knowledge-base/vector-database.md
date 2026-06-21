---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Cơ sở dữ liệu vector"
description: "Cơ sở dữ liệu vector lưu trữ chỉ mục vector hóa của tài liệu Knowledge Base, hỗ trợ PGVector. Cấu hình Host, Port, Database, Table name, dùng cho truy xuất ngữ nghĩa RAG."
keywords: "Cơ sở dữ liệu vector,PGVector,Embedding,RAG,NocoBase"
---

# Cơ sở dữ liệu vector

## Giới thiệu

Trong Knowledge Base, cơ sở dữ liệu vector lưu trữ tài liệu Knowledge Base đã được vector hóa. Tài liệu được vector hóa tương đương với chỉ mục của tài liệu.

Khi truy xuất RAG được kích hoạt trong hội thoại với Nhân viên AI, sẽ vector hóa tin nhắn của người dùng, truy xuất các đoạn tài liệu Knowledge Base trong cơ sở dữ liệu vector, khớp ra các đoạn tài liệu liên quan và bản gốc tài liệu.

Hiện tại Plugin Knowledge Base AI chỉ tích hợp sẵn hỗ trợ cơ sở dữ liệu vector PGVector, đây là một Plugin của cơ sở dữ liệu PostgreSQL.

## Quản lý cơ sở dữ liệu vector

Vào trang cấu hình Plugin Nhân viên AI, nhấp vào tab `Vector store`, chọn `Vector database` để vào trang quản lý cơ sở dữ liệu vector.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Nhấp nút `Add new` ở góc trên bên phải để thêm kết nối cơ sở dữ liệu vector `PGVector`:

- Trong ô nhập `Name` nhập tên kết nối;
- Trong ô nhập `Host` nhập địa chỉ IP của cơ sở dữ liệu vector;
- Trong ô nhập `Port` nhập số cổng của cơ sở dữ liệu vector;
- Trong ô nhập `Username` nhập tài khoản cơ sở dữ liệu vector;
- Trong ô nhập `Password` nhập mật khẩu cơ sở dữ liệu vector;
- Trong ô nhập `Database` nhập tên cơ sở dữ liệu vector;
- Trong ô nhập `Table name` nhập tên bảng dữ liệu, dùng khi tạo bảng lưu trữ dữ liệu vector mới;

Sau khi nhập tất cả thông tin cần thiết, nhấp nút `Test` để kiểm tra dịch vụ cơ sở dữ liệu vector có khả dụng không, nhấp nút `Submit` để lưu thông tin kết nối.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)
