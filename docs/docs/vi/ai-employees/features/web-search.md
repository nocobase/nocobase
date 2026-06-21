---
pkg: "@nocobase/plugin-ai"
title: "Tìm kiếm trên web cho Nhân viên AI"
description: "Tìm kiếm trên web bổ sung thông tin mới nhất ngoài dữ liệu đào tạo của mô hình, phụ thuộc vào việc mô hình có hỗ trợ Web Search hay không, bật/tắt trong khu vực nhập hội thoại."
keywords: "Tìm kiếm trên web,Web Search,Truy xuất AI,NocoBase"
---

# Tìm kiếm trên web

Tìm kiếm trên web được dùng để bổ sung thông tin mới nhất ngoài dữ liệu đào tạo của mô hình.

## Cách hoạt động

Khả năng sử dụng tìm kiếm trên web phụ thuộc vào việc dịch vụ mô hình được chọn trong phiên hội thoại hiện tại có hỗ trợ Web Search hay không.

- Hỗ trợ: Hiển thị công tắc tìm kiếm trên web, có thể bật/tắt theo nhu cầu.
- Không hỗ trợ: Không hiển thị công tắc đó, và sẽ tự động tắt trạng thái tìm kiếm.

## Sử dụng trong phiên hội thoại

Sử dụng công tắc tìm kiếm trên web trong khu vực nhập hội thoại:

- Sau khi bật, AI sẽ trích xuất từ khóa dựa trên ngữ cảnh, sau đó gọi công cụ để tìm kiếm, cuối cùng kết hợp kết quả tìm kiếm để phản hồi.

![20260420155024](https://static-docs.nocobase.com/20260420155024.png)

- Sau khi tắt, AI chỉ trả lời dựa trên ngữ cảnh đã có.

![20260420154948](https://static-docs.nocobase.com/20260420154948.png)

## Sự khác biệt giữa các nền tảng

Các nền tảng dịch vụ LLM khác nhau có khả năng hỗ trợ Web Search khác nhau, vui lòng sử dụng theo tình huống thực tế.

Các dịch vụ LLM sau đây hỗ trợ tìm kiếm trên web:

- OpenAI (lưu ý OpenAI (completions) không hỗ trợ)
- Google Generative AI
- Dashscope
