---
title: "Tổng quan Trigger Workflow"
description: "Trigger Workflow: các cổng vào thực thi như sự kiện bảng dữ liệu, tác vụ định kỳ, sự kiện trước/sau Action, Action tùy chỉnh, phê duyệt, Webhook..."
keywords: "trigger workflow,sự kiện bảng dữ liệu,tác vụ định kỳ,Webhook,sự kiện action,phê duyệt,NocoBase"
---

# Tổng quan

Trigger là cổng vào thực thi của Workflow. Trong quá trình ứng dụng đang chạy, khi sự kiện thỏa mãn điều kiện của Trigger được sinh ra, Workflow sẽ được kích hoạt thực thi. Loại Trigger cũng chính là loại của Workflow, được chọn khi tạo Workflow và không thể thay đổi sau khi tạo. Các loại Trigger hiện đã được hỗ trợ như sau:

- [Sự kiện bảng dữ liệu](./collection) (tích hợp sẵn)
- [Tác vụ định kỳ](./schedule) (tích hợp sẵn)
- [Sự kiện trước Action](./pre-action) (do plugin @nocobase/plugin-workflow-request-interceptor cung cấp)
- [Sự kiện sau Action](./post-action) (do plugin @nocobase/plugin-workflow-action-trigger cung cấp)
- [Sự kiện Action tùy chỉnh](./custom-action) (do plugin @nocobase/plugin-workflow-custom-action-trigger cung cấp)
- [Phê duyệt](./approval) (do plugin @nocobase/plugin-workflow-approval cung cấp)
- [Webhook](./webhook) (do plugin @nocobase/plugin-workflow-webhook cung cấp)

Thời điểm kích hoạt của các sự kiện như hình dưới đây:

![Sự kiện của Workflow](https://static-docs.nocobase.com/20251029221709.png)

Ví dụ khi người dùng gửi một form, hoặc dữ liệu trong bảng dữ liệu phát sinh thay đổi do thao tác của người dùng hoặc gọi từ chương trình, hoặc tác vụ định kỳ đến thời gian thực thi, đều có thể kích hoạt Workflow đã được cấu hình thực thi.

Các Trigger liên quan đến dữ liệu (như Action, sự kiện bảng dữ liệu) thường mang theo dữ liệu ngữ cảnh kích hoạt, các dữ liệu này sẽ được dùng làm biến để Node trong Workflow sử dụng làm tham số xử lý nhằm triển khai xử lý tự động dữ liệu. Ví dụ khi người dùng gửi một form, nếu nút gửi được liên kết với Workflow thì sẽ kích hoạt và thực thi Workflow đó, dữ liệu được gửi sẽ được inject vào môi trường ngữ cảnh của kế hoạch thực thi để các Node sau dùng làm biến.

Sau khi tạo Workflow, trong trang xem Workflow, Trigger sẽ được hiển thị ở vị trí bắt đầu của quy trình theo dạng Node cổng vào, bấm vào thẻ đó sẽ mở ngăn cấu hình. Tùy theo loại Trigger khác nhau, có thể cấu hình các điều kiện liên quan của Trigger.

![Trigger_Node cổng vào](https://static-docs.nocobase.com/20251029222231.png)
