---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Tạo sinh tăng cường truy xuất (RAG)"
description: "Kích hoạt RAG cho Nhân viên AI, cấu hình Knowledge Base, Retrieval strategy, Top K và Score, đồng thời kiểm soát quyền truy cập cơ sở tri thức theo vai trò người dùng."
keywords: "RAG,tạo sinh tăng cường truy xuất,truy xuất cơ sở tri thức,Retrieval strategy,quyền cơ sở tri thức,Top K,NocoBase"
---

# Truy xuất RAG

## Giới thiệu

Trong NocoBase, **RAG (tạo sinh tăng cường truy xuất)** cho phép Nhân viên AI lấy nội dung liên quan từ cơ sở tri thức trước khi trả lời câu hỏi.

Các cơ sở tri thức mà Nhân viên AI thực sự có thể sử dụng được xác định bởi cả cấu hình `Knowledge Base` của Nhân viên AI và quyền truy cập cơ sở tri thức của các vai trò thuộc người dùng hiện tại. Chỉ các cơ sở tri thức nằm trong cả hai phạm vi mới được tìm kiếm.

## Cấu hình cơ sở tri thức cho Nhân viên AI

Mở trang cấu hình `AI employees`, chọn Nhân viên AI cần kích hoạt RAG rồi nhấp `Edit`. Trong bảng chỉnh sửa, mở tab `Knowledge Base` và bật `Enable`.

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

Các tùy chọn gồm có:

- `Knowledge Base` — Không bắt buộc. Nếu để trống, Nhân viên AI sẽ tìm kiếm trong tất cả cơ sở tri thức đã bật mà các vai trò của người dùng hiện tại có thể truy cập. Nếu chọn cơ sở tri thức, hệ thống chỉ tìm kiếm trong các cơ sở đã chọn mà người dùng có quyền truy cập
- `Retrieval strategy` — Xác định thời điểm chạy truy xuất cơ sở tri thức:
  - `Retrieve on demand` — Nhân viên AI chỉ truy xuất nội dung khi xác định câu hỏi hiện tại cần đến nội dung đó. Nhân viên AI mới sử dụng chiến lược này theo mặc định và đây là lựa chọn được đề xuất cho hầu hết trường hợp
  - `Automatically retrieve for every question` — Truy xuất được chạy trước khi mỗi câu hỏi của người dùng được gửi đến Nhân viên AI. Sử dụng tùy chọn này khi mọi lượt trò chuyện đều phụ thuộc vào nội dung cơ sở tri thức
- `Knowledge Base Prompt` — Xác định cách cung cấp nội dung truy xuất cho Nhân viên AI. `{knowledgeBaseData}` là placeholder cố định; không xóa hoặc sửa đổi
- `Top K` — Số lượng kết quả cơ sở tri thức tối đa được trả về trong mỗi lần truy xuất. Phạm vi là 1–100 và giá trị mặc định là 3
- `Score` — Điểm tương đồng tối thiểu mà một kết quả phải đạt. Phạm vi là 0–1 và giá trị mặc định là 0,6. Giá trị cao hơn trả về nội dung liên quan hơn nhưng có thể làm giảm số lượng kết quả

Nhấp `Submit` để lưu cấu hình.

## Cấu hình quyền truy cập cơ sở tri thức

Việc chọn cơ sở tri thức cho Nhân viên AI không tự động cấp quyền truy cập cho mọi người dùng. Mở `Users & Permissions / Roles & Permissions`, chọn vai trò được gán cho người dùng rồi mở `Permissions / Knowledge bases`.

Chọn `Available` cho từng cơ sở tri thức mà vai trò được phép truy cập. Để tự động cấp cho vai trò này quyền truy cập các cơ sở tri thức được tạo sau này, chọn `New knowledge bases are allowed by default`.

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning Lưu ý

Phạm vi cơ sở tri thức mà Nhân viên AI có thể sử dụng là phần giao giữa cấu hình `Knowledge Base` và quyền của các vai trò thuộc người dùng hiện tại. Các cơ sở tri thức không được cấp quyền sẽ tự động bị loại trừ.

:::

## Khi người dùng không có quyền truy cập cơ sở tri thức

Nếu Nhân viên AI đã bật cơ sở tri thức nhưng phạm vi được cấu hình không giao với quyền của các vai trò thuộc người dùng hiện tại, Nhân viên AI sẽ trả lời trước bằng thông tin không phụ thuộc vào cơ sở tri thức. Sau đó, Nhân viên AI thêm một thông báo nổi bật cho biết nội dung cơ sở tri thức không được sử dụng vì người dùng không có quyền truy cập và đề nghị liên hệ quản trị viên.

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

Nếu người dùng có thể truy cập ít nhất một cơ sở tri thức nhưng câu hỏi hiện tại không trả về nội dung liên quan, thông báo không có quyền sẽ không xuất hiện.

## Liên kết liên quan

- [Cơ sở tri thức](./knowledge-base/index.md) — Tạo và duy trì các cơ sở tri thức dùng cho truy xuất RAG
- [Vai trò và quyền](../../users-permissions/acl/permissions.md) — Cấu hình quyền truy cập hệ thống, menu và dữ liệu cho từng vai trò
