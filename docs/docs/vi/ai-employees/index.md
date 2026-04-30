---
pkg: '@nocobase/plugin-ai'
title: 'Tổng quan về Nhân viên AI'
description: 'Nhân viên AI là khả năng Agent được tích hợp sâu vào hệ thống nghiệp vụ của NocoBase, hỗ trợ hiểu ngữ cảnh nghiệp vụ, trực tiếp thực thi thao tác, cộng tác theo vai trò, có thể cấu hình dịch vụ LLM, Skills và Knowledge Base.'
keywords: 'Nhân viên AI,AI Employees,NocoBase Agent,LLM,mô hình lớn,cộng tác,Skills,Knowledge Base'
---

# Tổng quan

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Nhân viên AI (`AI Employees`) là khả năng Agent được tích hợp sâu vào hệ thống nghiệp vụ của NocoBase.

Đây không phải là robot "chỉ biết trò chuyện", mà là "đồng nghiệp số" có thể trực tiếp hiểu ngữ cảnh và thực thi thao tác trong giao diện nghiệp vụ:

- **Hiểu ngữ cảnh nghiệp vụ**: Nhận biết trang hiện tại, Block, cấu trúc dữ liệu và nội dung đã chọn.
- **Trực tiếp thực thi hành động**: Có thể gọi Skills để hoàn thành các tác vụ truy vấn, phân tích, điền dữ liệu, cấu hình, tạo nội dung, v.v.
- **Cộng tác theo vai trò**: Cấu hình các nhân viên khác nhau theo vị trí công việc, và chuyển đổi mô hình để cộng tác trong phiên hội thoại.

## Lộ trình bắt đầu trong 5 phút

Trước tiên hãy xem [Bắt đầu nhanh](/ai-employees/quick-start), thực hiện cấu hình tối thiểu khả dụng theo thứ tự sau:

1. Cấu hình ít nhất một [dịch vụ LLM](/ai-employees/features/llm-service).
2. Kích hoạt ít nhất một [Nhân viên AI](/ai-employees/features/enable-ai-employee).
3. Mở phiên hội thoại và bắt đầu [Cộng tác với Nhân viên AI](/ai-employees/features/collaborate).
4. Bật [Tìm kiếm trên web](/ai-employees/features/web-search) và [Tác vụ nhanh](/ai-employees/features/task) khi cần.

## Bản đồ tính năng

### A. Cấu hình cơ bản (Quản trị viên)

- [Cấu hình dịch vụ LLM](/ai-employees/features/llm-service): Tích hợp Provider, cấu hình và quản lý các mô hình khả dụng.
- [Kích hoạt Nhân viên AI](/ai-employees/features/enable-ai-employee): Bật/tắt nhân viên tích hợp sẵn, kiểm soát phạm vi khả dụng.
- [Tạo Nhân viên AI mới](/ai-employees/features/new-ai-employees): Định nghĩa vai trò, persona, lời chào và ranh giới năng lực.
- [Sử dụng Skills](/ai-employees/features/tools): Cấu hình quyền Skill (`Ask` / `Allow`), kiểm soát rủi ro thực thi.

### B. Cộng tác hàng ngày (Người dùng nghiệp vụ)

- [Cộng tác với Nhân viên AI](/ai-employees/features/collaborate): Chuyển đổi nhân viên và mô hình trong phiên hội thoại, cộng tác liên tục.
- [Thêm ngữ cảnh - Block](/ai-employees/features/pick-block): Gửi Block trên trang làm ngữ cảnh cho AI.
- [Tác vụ nhanh](/ai-employees/features/task): Cài đặt sẵn các tác vụ thường dùng trên trang/Block, thực thi bằng một cú nhấp.
- [Tìm kiếm trên web](/ai-employees/features/web-search): Bật tăng cường truy xuất khi cần thông tin mới nhất.

### C. Năng lực nâng cao (Mở rộng)

- [Nhân viên AI tích hợp sẵn](/ai-employees/features/built-in-employee): Tìm hiểu định vị và kịch bản phù hợp của các nhân viên có sẵn.
- [Kiểm soát quyền](/ai-employees/permission): Kiểm soát quyền truy cập nhân viên, Skills và dữ liệu theo mô hình quyền tổ chức.
- [Knowledge Base AI](/ai-employees/knowledge-base/index): Đưa kiến thức doanh nghiệp vào, nâng cao tính ổn định và khả năng truy nguyên của câu trả lời.
- [Node Nhân viên AI trong Workflow](/ai-employees/workflow/nodes/employee/configuration): Tích hợp năng lực Nhân viên AI vào các quy trình tự động hóa.

## Khái niệm cốt lõi

Các thuật ngữ sau được giữ thống nhất với bảng thuật ngữ, khuyến nghị sử dụng đồng nhất trong nhóm:

- **Nhân viên AI (AI Employee)**: Agent có thể thực thi, cấu thành từ persona (Role setting) và Skills (Tool / Skill).
- **Dịch vụ LLM (LLM Service)**: Đơn vị tích hợp mô hình và cấu hình năng lực, dùng để quản lý Provider và danh sách mô hình.
- **Nhà cung cấp (Provider)**: Bên cung cấp mô hình đứng sau dịch vụ LLM.
- **Mô hình đã kích hoạt (Enabled Models)**: Tập hợp mô hình mà dịch vụ LLM hiện tại cho phép chọn trong phiên hội thoại.
- **Bộ chuyển đổi nhân viên (AI Employee Switcher)**: Chuyển đổi nhân viên cộng tác hiện tại trong phiên hội thoại.
- **Bộ chuyển đổi mô hình (Model Switcher)**: Chuyển đổi mô hình trong phiên hội thoại, và ghi nhớ tùy chọn theo từng nhân viên.
- **Skill (Tool / Skill)**: Đơn vị năng lực thực thi mà AI có thể gọi.
- **Quyền Skill (Permission: Ask / Allow)**: Có cần xác nhận thủ công trước khi gọi Skill hay không.
- **Ngữ cảnh (Context)**: Thông tin môi trường nghiệp vụ như trang, Block, cấu trúc dữ liệu.
- **Phiên hội thoại (Chat)**: Một quá trình tương tác liên tục giữa người dùng và Nhân viên AI.
- **Tìm kiếm trên web (Web Search)**: Năng lực bổ sung thông tin thời gian thực dựa trên truy xuất bên ngoài.
- **Knowledge Base (Knowledge Base / RAG)**: Đưa kiến thức doanh nghiệp vào thông qua tăng cường truy xuất tạo sinh.
- **Lưu trữ vector (Vector Store)**: Lưu trữ vector hóa cung cấp năng lực tìm kiếm ngữ nghĩa cho Knowledge Base.

## Hướng dẫn cài đặt

Nhân viên AI là Plugin tích hợp sẵn của NocoBase (`@nocobase/plugin-ai`), sẵn sàng sử dụng ngay, không cần cài đặt riêng.
