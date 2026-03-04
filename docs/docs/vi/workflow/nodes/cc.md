---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/workflow/nodes/cc).
:::

# Sao chép <Badge>v1.8.2+</Badge>

## Giới thiệu

Nút sao chép được sử dụng để gửi một số nội dung ngữ cảnh trong quá trình thực thi luồng công việc đến những người dùng được chỉ định để tìm hiểu và tra cứu. Ví dụ, trong quy trình phê duyệt hoặc các quy trình khác, thông tin liên quan có thể được sao chép cho các bên tham gia khác để họ kịp thời nắm bắt tiến độ công việc.

Có thể thiết lập nhiều nút sao chép trong luồng công việc để khi luồng công việc thực thi đến nút đó, thông tin liên quan sẽ được gửi đến những người nhận được chỉ định.

Nội dung sao chép sẽ được hiển thị trong menu "Sao chép cho tôi" của Trung tâm việc cần làm, nơi người dùng có thể xem tất cả nội dung được sao chép cho mình. Đồng thời, hệ thống sẽ dựa trên trạng thái chưa đọc để nhắc nhở người dùng về các nội dung sao chép chưa xem, người dùng có thể chủ động đánh dấu là đã đọc sau khi xem.

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng ("+") trong quy trình để thêm nút "Sao chép":

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Cấu hình nút

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

Trong giao diện cấu hình nút, bạn có thể thiết lập các tham số sau:

### Người nhận

Người nhận là tập hợp các người dùng đối tượng sao chép, có thể là một hoặc nhiều người dùng. Nguồn lựa chọn có thể là giá trị tĩnh từ danh sách người dùng, giá trị động được chỉ định bởi biến, hoặc kết quả truy vấn từ bộ sưu tập người dùng.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Giao diện người dùng

Người nhận cần xem nội dung sao chép trong menu "Sao chép cho tôi" của Trung tâm việc cần làm. Có thể cấu hình kết quả của trình kích hoạt và bất kỳ nút nào trong ngữ cảnh luồng công việc làm khối nội dung.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Thẻ việc cần làm <Badge>2.0+</Badge>

Có thể được sử dụng để cấu hình thẻ nhiệm vụ trong danh sách "Sao chép cho tôi" của Trung tâm việc cần làm.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Trong thẻ có thể tự do cấu hình các trường nghiệp vụ muốn hiển thị (ngoại trừ các trường quan hệ).

Sau khi nhiệm vụ sao chép luồng công việc được tạo, danh sách Trung tâm việc cần làm sẽ hiển thị thẻ nhiệm vụ tùy chỉnh:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Tiêu đề nhiệm vụ

Tiêu đề nhiệm vụ là tiêu đề hiển thị trong Trung tâm việc cần làm, có thể sử dụng các biến trong ngữ cảnh luồng công việc để tạo tiêu đề động.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Trung tâm việc cần làm

Người dùng có thể xem và quản lý tất cả nội dung được sao chép cho mình trong Trung tâm việc cần làm, đồng thời lọc và xem theo trạng thái đọc.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Sau khi xem có thể đánh dấu là đã đọc, số lượng chưa đọc sẽ giảm theo đó.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)