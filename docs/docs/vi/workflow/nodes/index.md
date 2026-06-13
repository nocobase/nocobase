---
title: "Tổng quan Node Workflow"
description: "Node Workflow: 29 loại Node như điều khiển luồng, tính toán, thao tác dữ liệu, trí tuệ nhân tạo, phán đoán điều kiện, vòng lặp, xử lý thủ công, LLM."
keywords: "node workflow,điều khiển luồng,phán đoán điều kiện,vòng lặp,xử lý thủ công,thao tác dữ liệu,NocoBase"
---

# Tổng quan

Một Workflow thường được kết nối từ một số bước thao tác, mỗi Node đại diện cho một bước thao tác và là đơn vị logic cơ bản trong quy trình. Giống như ngôn ngữ lập trình, các loại Node khác nhau đại diện cho các instruction khác nhau và quyết định hành vi của Node. Khi quy trình chạy, hệ thống sẽ lần lượt vào mỗi Node và thực thi instruction của Node đó.

:::info{title=Mẹo}
Trigger của Workflow không thuộc về Node, chỉ được hiển thị trong sơ đồ quy trình dưới dạng Node cổng vào, nhưng là khái niệm khác với Node, xem chi tiết tại [Trigger](../triggers/index.md).
:::

Từ góc độ chức năng, các Node hiện đã được triển khai có thể chia thành các nhóm lớn (tổng cộng 29 loại Node):

- Trí tuệ nhân tạo
  - [Mô hình ngôn ngữ lớn](../../ai-employees/workflow/nodes/llm/chat.md) (do plugin @nocobase/plugin-workflow-llm cung cấp)
- Điều khiển luồng
  - [Phán đoán điều kiện](./condition.md)
  - [Nhánh đa điều kiện](./multi-conditions.md)
  - [Vòng lặp](./loop.md) (do plugin @nocobase/plugin-workflow-loop cung cấp)
  - [Biến](./variable.md) (do plugin @nocobase/plugin-workflow-variable cung cấp)
  - [Nhánh song song](./parallel.md) (do plugin @nocobase/plugin-workflow-parallel cung cấp)
  - [Gọi Workflow](./subflow.md) (do plugin @nocobase/plugin-workflow-subflow cung cấp)
  - [Đầu ra luồng](./output.md) (do plugin @nocobase/plugin-workflow-subflow cung cấp)
  - [Ánh xạ biến JSON](./json-variable-mapping.md) (do plugin @nocobase/plugin-workflow-json-variable-mapping cung cấp)
  - [Trì hoãn](./delay.md) (do plugin @nocobase/plugin-workflow-delay cung cấp)
  - [Kết thúc quy trình](./end.md)
- Tính toán
  - [Tính toán](./calculation.md)
  - [Tính toán ngày tháng](./date-calculation.md) (do plugin @nocobase/plugin-workflow-date-calculation cung cấp)
  - [Tính toán JSON](./json-query.md) (do plugin @nocobase/plugin-workflow-json-query cung cấp)
- Thao tác bảng dữ liệu
  - [Thêm dữ liệu](./create.md)
  - [Cập nhật dữ liệu](./update.md)
  - [Xóa dữ liệu](./destroy.md)
  - [Truy vấn dữ liệu](./query.md)
  - [Truy vấn tổng hợp](./aggregate.md) (do plugin @nocobase/plugin-workflow-aggregate cung cấp)
  - [Thao tác SQL](./sql.md) (do plugin @nocobase/plugin-workflow-sql cung cấp)
- Xử lý thủ công
  - [Xử lý thủ công](./manual.md) (do plugin @nocobase/plugin-workflow-manual cung cấp)
  - [Phê duyệt](./approval.md) (do plugin @nocobase/plugin-workflow-approval cung cấp)
  - [Sao gửi](./cc.md) (do plugin @nocobase/plugin-workflow-cc cung cấp)
- Mở rộng khác
  - [HTTP Request](./request.md) (do plugin @nocobase/plugin-workflow-request cung cấp)
  - [JavaScript](./javascript.md) (do plugin @nocobase/plugin-workflow-javascript cung cấp)
  - [Gửi email](./mailer.md) (do plugin @nocobase/plugin-workflow-mailer cung cấp)
  - [Thông báo](../../notification-manager/index.md#node-thong-bao-workflow) (do plugin @nocobase/plugin-workflow-notification cung cấp)
  - [Phản hồi](./response.md) (do plugin @nocobase/plugin-workflow-webhook cung cấp)
  - [Thông báo phản hồi](./response-message.md) (do plugin @nocobase/plugin-workflow-response-message cung cấp)
