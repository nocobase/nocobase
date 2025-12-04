---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Sao Chép (CC) <Badge>v1.8.2+</Badge>

## Giới thiệu

Nút Sao Chép (CC) dùng để gửi một số nội dung ngữ cảnh từ quá trình thực thi của luồng công việc đến những người dùng được chỉ định, để họ nắm bắt và tham khảo. Ví dụ, trong quy trình phê duyệt hoặc các quy trình khác, bạn có thể gửi kèm thông tin liên quan đến những người tham gia khác để họ kịp thời nắm bắt tiến độ công việc.

Bạn có thể thiết lập nhiều nút Sao Chép (CC) trong một luồng công việc. Khi luồng công việc thực thi đến nút này, thông tin liên quan sẽ được gửi đến người nhận được chỉ định.

Nội dung được gửi kèm sẽ hiển thị trong menu "CC cho tôi" của Trung tâm Việc cần làm. Tại đây, người dùng có thể xem tất cả nội dung được gửi kèm cho mình. Hệ thống cũng sẽ hiển thị thông báo về các nội dung chưa đọc, và sau khi xem, người dùng có thể chủ động đánh dấu là đã đọc.

## Tạo Nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng ("+") trong luồng để thêm nút "Sao Chép (CC)":

![Thêm Sao Chép (CC)](https://static-docs.nocobase.com/20250710222842.png)

## Cấu hình Nút

![Cấu hình Nút](https://static-docs.nocobase.com/20250710224041.png)

Trong giao diện cấu hình nút, bạn có thể thiết lập các tham số sau:

### Người nhận

Người nhận là tập hợp các người dùng được gửi kèm (CC), có thể là một hoặc nhiều người dùng. Nguồn lựa chọn có thể là giá trị tĩnh được chọn từ danh sách người dùng, giá trị động được chỉ định bởi một biến, hoặc kết quả của một truy vấn trên bảng người dùng.

![Cấu hình Người nhận](https://static-docs.nocobase.com/20250710224421.png)

### Giao diện Người dùng

Người nhận cần xem nội dung được gửi kèm trong menu "CC cho tôi" của Trung tâm Việc cần làm. Bạn có thể cấu hình kết quả của trình kích hoạt và bất kỳ nút nào trong ngữ cảnh luồng công việc làm khối nội dung.

![Giao diện Người dùng](https://static-docs.nocobase.com/20250710225400.png)

### Tiêu đề Nhiệm vụ

Tiêu đề nhiệm vụ là tiêu đề hiển thị trong Trung tâm Việc cần làm. Bạn có thể sử dụng các biến từ ngữ cảnh luồng công việc để tạo tiêu đề một cách động.

![Tiêu đề Nhiệm vụ](https://static-docs.nocobase.com/20250710225603.png)

## Trung tâm Việc cần làm

Người dùng có thể xem và quản lý tất cả nội dung được gửi kèm cho mình trong Trung tâm Việc cần làm, đồng thời lọc và xem theo trạng thái đã đọc.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Sau khi xem, bạn có thể đánh dấu là đã đọc, và số lượng mục chưa đọc sẽ giảm đi tương ứng.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)