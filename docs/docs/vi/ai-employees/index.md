---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/ai-employees/index).
:::

# Tổng quan

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Nhân viên AI (`AI Employees`) là năng lực tác nhân thông minh được tích hợp sâu trong hệ thống nghiệp vụ của NocoBase.

Đây không phải là những robot "chỉ biết trò chuyện", mà là những "đồng nghiệp kỹ thuật số" có thể hiểu ngữ cảnh và thực hiện các thao tác trực tiếp trong giao diện nghiệp vụ:

- **Hiểu ngữ cảnh nghiệp vụ**: Nhận biết trang hiện tại, khối, cấu trúc dữ liệu và nội dung được chọn.
- **Có thể trực tiếp thực hiện hành động**: Có thể gọi các kỹ năng để hoàn thành các tác vụ như truy vấn, phân tích, điền thông tin, cấu hình, tạo nội dung, v.v.
- **Cộng tác theo vai trò**: Cấu hình các nhân viên khác nhau theo vị trí công việc và chuyển đổi mô hình để cộng tác trong hội thoại.

## Lộ trình 5 phút bắt đầu

Xem trước [Bắt đầu nhanh](/ai-employees/quick-start), hoàn thành cấu hình khả dụng tối thiểu theo thứ tự sau:

1. Cấu hình ít nhất một [Dịch vụ LLM](/ai-employees/features/llm-service).
2. Bật ít nhất một [Nhân viên AI](/ai-employees/features/enable-ai-employee).
3. Mở hội thoại và bắt đầu [Cộng tác với Nhân viên AI](/ai-employees/features/collaborate).
4. Bật [Tìm kiếm trực tuyến](/ai-employees/features/web-search) và [Tác vụ nhanh](/ai-employees/features/task) khi cần thiết.

## Bản đồ tính năng

### A. Cấu hình cơ bản (Quản trị viên)

- [Cấu hình Dịch vụ LLM](/ai-employees/features/llm-service): Kết nối Provider, cấu hình và quản lý danh sách mô hình khả dụng.
- [Bật Nhân viên AI](/ai-employees/features/enable-ai-employee): Bật/tắt nhân viên tích hợp, kiểm soát phạm vi khả dụng.
- [Tạo mới Nhân viên AI](/ai-employees/features/new-ai-employees): Định nghĩa vai trò, thiết lập nhân vật, lời chào và ranh giới năng lực.
- [Sử dụng kỹ năng](/ai-employees/features/tool): Cấu hình quyền kỹ năng (`Ask` / `Allow`), kiểm soát rủi ro thực thi.

### B. Cộng tác hàng ngày (Người dùng nghiệp vụ)

- [Cộng tác với Nhân viên AI](/ai-employees/features/collaborate): Chuyển đổi nhân viên và mô hình trong hội thoại để cộng tác liên tục.
- [Thêm ngữ cảnh - Khối](/ai-employees/features/pick-block): Gửi các khối trang làm ngữ cảnh cho AI.
- [Tác vụ nhanh](/ai-employees/features/task): Thiết lập sẵn các tác vụ thường dùng trên trang/khối, thực hiện bằng một cú nhấp chuột.
- [Tìm kiếm trực tuyến](/ai-employees/features/web-search): Bật truy xuất tăng cường câu trả lời khi cần thông tin mới nhất.

### C. Năng lực nâng cao (Mở rộng)

- [Nhân viên AI tích hợp](/ai-employees/features/built-in-employee): Tìm hiểu định vị và kịch bản áp dụng của các nhân viên được thiết lập sẵn.
- [Kiểm soát quyền hạn](/ai-employees/permission): Kiểm soát quyền truy cập nhân viên, kỹ năng và dữ liệu theo mô hình quyền của tổ chức.
- [Cơ sở kiến thức AI](/ai-employees/knowledge-base/index): Đưa kiến thức doanh nghiệp vào để nâng cao tính ổn định và khả năng truy xuất nguồn gốc của câu trả lời.
- [Nút LLM trong luồng công việc](/ai-employees/workflow/nodes/llm/chat): Sắp xếp năng lực AI vào các quy trình tự động hóa.

## Khái niệm cốt lõi (Khuyến nghị thống nhất trước)

Các thuật ngữ sau đây nhất quán với bảng thuật ngữ, khuyến nghị sử dụng thống nhất trong nhóm:

- **Nhân viên AI (AI Employee)**: Một tác nhân có thể thực thi được cấu thành từ thiết lập nhân vật (Role setting) và kỹ năng (Tool / Skill).
- **Dịch vụ LLM (LLM Service)**: Đơn vị cấu hình năng lực và kết nối mô hình, dùng để quản lý Provider và danh sách mô hình.
- **Nhà cung cấp (Provider)**: Bên cung cấp mô hình đứng sau dịch vụ LLM.
- **Mô hình được bật (Enabled Models)**: Tập hợp các mô hình hiện tại mà dịch vụ LLM cho phép chọn trong hội thoại.
- **Trình chuyển đổi nhân viên AI (AI Employee Switcher)**: Chuyển đổi nhân viên cộng tác hiện tại trong hội thoại.
- **Trình chuyển đổi mô hình (Model Switcher)**: Chuyển đổi mô hình trong hội thoại và ghi nhớ tùy chọn theo từng nhân viên.
- **Kỹ năng (Tool / Skill)**: Đơn vị năng lực thực thi mà AI có thể gọi.
- **Quyền kỹ năng (Permission: Ask / Allow)**: Có cần xác nhận thủ công trước khi gọi kỹ năng hay không.
- **Ngữ cảnh (Context)**: Thông tin môi trường nghiệp vụ như trang, khối, cấu trúc dữ liệu, v.v.
- **Hội thoại (Chat)**: Một quá trình tương tác liên tục giữa người dùng và nhân viên AI.
- **Tìm kiếm trực tuyến (Web Search)**: Năng lực bổ sung thông tin thời gian thực dựa trên truy xuất bên ngoài.
- **Cơ sở kiến thức (Knowledge Base / RAG)**: Đưa kiến thức doanh nghiệp vào thông qua thế hệ tăng cường truy xuất.
- **Kho lưu trữ vector (Vector Store)**: Lưu trữ vector hóa cung cấp khả năng truy xuất ngữ nghĩa cho cơ sở kiến thức.

## Hướng dẫn cài đặt

Nhân viên AI là plugin tích hợp sẵn của NocoBase (`@nocobase/plugin-ai`), có thể sử dụng ngay mà không cần cài đặt riêng.