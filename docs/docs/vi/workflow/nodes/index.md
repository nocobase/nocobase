:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan

Một luồng công việc thường được tạo thành từ nhiều bước thao tác được kết nối với nhau. Mỗi nút đại diện cho một bước thao tác và là một đơn vị logic cơ bản trong quy trình. Giống như trong ngôn ngữ lập trình, các loại nút khác nhau đại diện cho các chỉ thị khác nhau, quyết định hành vi của nút. Khi luồng công việc chạy, hệ thống sẽ lần lượt đi vào từng nút và thực thi các chỉ thị của nút đó.

:::info{title=Lưu ý}
Trình kích hoạt của một luồng công việc không phải là một nút. Nó chỉ được hiển thị dưới dạng một nút đầu vào trong sơ đồ luồng, nhưng là một khái niệm khác với nút. Để biết chi tiết, vui lòng tham khảo nội dung [Trình kích hoạt](../triggers/index.md).
:::

Từ góc độ chức năng, các nút đã được triển khai hiện tại có thể được chia thành một số loại chính (tổng cộng 29 loại nút):

- Trí tuệ nhân tạo
  - [Mô hình ngôn ngữ lớn](../../ai-employees/workflow/nodes/llm/chat.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-llm)
- Điều khiển luồng
  - [Điều kiện](./condition.md)
  - [Nhiều điều kiện](./multi-conditions.md)
  - [Vòng lặp](./loop.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-loop)
  - [Biến](./variable.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-variable)
  - [Nhánh song song](./parallel.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-parallel)
  - [Gọi luồng công việc](./subflow.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-subflow)
  - [Đầu ra luồng công việc](./output.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-subflow)
  - [Ánh xạ biến JSON](./json-variable-mapping.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-json-variable-mapping)
  - [Trì hoãn](./delay.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-delay)
  - [Kết thúc luồng công việc](./end.md)
- Tính toán
  - [Tính toán](./calculation.md)
  - [Tính toán ngày](./date-calculation.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-date-calculation)
  - [Truy vấn JSON](./json-query.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-json-query)
- Thao tác bộ sưu tập
  - [Tạo dữ liệu mới](./create.md)
  - [Cập nhật dữ liệu](./update.md)
  - [Xóa dữ liệu](./destroy.md)
  - [Truy vấn dữ liệu](./query.md)
  - [Truy vấn tổng hợp](./aggregate.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-aggregate)
  - [Thao tác SQL](./sql.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-sql)
- Xử lý thủ công
  - [Xử lý thủ công](./manual.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-manual)
  - [Phê duyệt](./approval.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-approval)
  - [Gửi CC](./cc.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-cc)
- Các tiện ích mở rộng khác
  - [Yêu cầu HTTP](./request.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-javascript)
  - [Gửi email](./mailer.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-mailer)
  - [Thông báo](../../notification-manager/index.md#Nút thông báo luồng công việc) (được cung cấp bởi plugin @nocobase/plugin-workflow-notification)
  - [Phản hồi](./response.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-webhook)
  - [Tin nhắn phản hồi](./response-message.md) (được cung cấp bởi plugin @nocobase/plugin-workflow-response-message)