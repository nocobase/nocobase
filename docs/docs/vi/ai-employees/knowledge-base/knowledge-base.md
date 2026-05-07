---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Quản lý Knowledge Base AI"
description: "Knowledge Base là cơ sở của truy xuất RAG, tổ chức tài liệu và xây dựng chỉ mục. Tạo Knowledge Base Local/Readonly/External, tải tài liệu lên, cấu hình lưu trữ vector và lưu trữ tệp."
keywords: "Knowledge Base,Knowledge Base Local,RAG,Lưu trữ vector,Tải tài liệu,NocoBase"
---

# Knowledge Base

## Giới thiệu

Knowledge Base là cơ sở của truy xuất RAG, Knowledge Base tổ chức tài liệu theo phân loại và xây dựng chỉ mục. Khi Nhân viên AI trả lời câu hỏi, sẽ ưu tiên tìm kiếm câu trả lời từ Knowledge Base.

## Quản lý Knowledge Base

Vào trang cấu hình Plugin Nhân viên AI, nhấp vào tab `Knowledge base` để vào trang quản lý Knowledge Base.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Nhấp nút `Add new` ở góc trên bên phải để thêm Knowledge Base `Local` mới.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Nhập thông tin cần thiết để tạo cơ sở dữ liệu mới:

- Trong ô nhập `Name` nhập tên Knowledge Base;
- Trong `File storage` chọn vị trí lưu trữ tệp;
- Trong `Vector store` chọn lưu trữ vector, tham khảo [Lưu trữ vector](/ai-employees/knowledge-base/vector-store);
- Trong ô nhập `Description` nhập mô tả Knowledge Base;

Nhấp nút `Submit` để tạo thông tin lưu trữ vector.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Quản lý tài liệu Knowledge Base

Sau khi tạo Knowledge Base, trong trang danh sách Knowledge Base, nhấp vào Knowledge Base vừa tạo, để vào trang quản lý tài liệu Knowledge Base.

![20260426233838](https://static-docs.nocobase.com/20260426233838.png)

![20260426233417](https://static-docs.nocobase.com/20260426233417.png)

Nhấp nút `Upload` để tải tài liệu lên, sau khi tài liệu được tải lên, sẽ tự động bắt đầu vector hóa, đợi `Status` chuyển từ trạng thái `Pending` sang trạng thái `Success`.

Hiện tại Knowledge Base hỗ trợ các loại tài liệu: txt, md, json, csv, xls, xlsx, pdf, doc, docx, ppt, pptx; pdf chỉ hỗ trợ văn bản thuần.

Nếu cần tải lên tệp hàng loạt, có thể tạo một gói nén zip, sau đó tải lên trong Knowledge Base. Backend sẽ giải nén gói nén zip rồi tự động nhập và vector hóa tài liệu.

![20260426233711](https://static-docs.nocobase.com/20260426233711.png)

Nếu khi tải lên gói nén zip gặp lỗi báo tệp quá lớn, bạn có thể thiết lập giới hạn kích thước tệp tải lên trong module quản lý tệp.

![20260426234224](https://static-docs.nocobase.com/20260426234224.png)

## Loại Knowledge Base

### Knowledge Base Local

Knowledge Base Local là Knowledge Base lưu trữ cục bộ trong NocoBase, tài liệu, dữ liệu vector của tài liệu đều được NocoBase lưu trữ cục bộ.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Knowledge Base Readonly

Knowledge Base Readonly là Knowledge Base chỉ đọc, tài liệu và dữ liệu vector đều được duy trì bên ngoài, chỉ tạo kết nối cơ sở dữ liệu vector trong NocoBase (hiện tại chỉ hỗ trợ PGVector)

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Knowledge Base External

Knowledge Base External là Knowledge Base bên ngoài, tài liệu và dữ liệu vector đều được duy trì bên ngoài. Truy xuất cơ sở dữ liệu vector cần nhà phát triển mở rộng, có thể sử dụng cơ sở dữ liệu vector hiện không được NocoBase hỗ trợ

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)
