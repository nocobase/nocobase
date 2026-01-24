:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan

Bộ kích hoạt là điểm khởi đầu để thực thi một luồng công việc. Khi một sự kiện thỏa mãn các điều kiện của bộ kích hoạt xảy ra trong quá trình ứng dụng đang chạy, luồng công việc sẽ được kích hoạt và thực thi. Loại bộ kích hoạt cũng chính là loại luồng công việc, được chọn khi tạo luồng công việc và không thể thay đổi sau khi tạo. Các loại bộ kích hoạt hiện được hỗ trợ bao gồm:

- [Sự kiện bộ sưu tập](./collection) (Tích hợp sẵn)
- [Lịch trình](./schedule) (Tích hợp sẵn)
- [Trước hành động](./pre-action) (Được cung cấp bởi plugin @nocobase/plugin-workflow-request-interceptor)
- [Sau hành động](./post-action) (Được cung cấp bởi plugin @nocobase/plugin-workflow-action-trigger)
- [Hành động tùy chỉnh](./custom-action) (Được cung cấp bởi plugin @nocobase/plugin-workflow-custom-action-trigger)
- [Phê duyệt](./approval) (Được cung cấp bởi plugin @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (Được cung cấp bởi plugin @nocobase/plugin-workflow-webhook)

Thời điểm kích hoạt của từng sự kiện được thể hiện trong hình dưới đây:

![Các sự kiện của luồng công việc](https://static-docs.nocobase.com/20251029221709.png)

Ví dụ, khi người dùng gửi một biểu mẫu, hoặc khi dữ liệu trong một bộ sưu tập thay đổi do hành động của người dùng hoặc lệnh gọi chương trình, hoặc khi một tác vụ theo lịch trình đến thời gian thực thi, một luồng công việc đã cấu hình có thể được kích hoạt.

Các bộ kích hoạt liên quan đến dữ liệu (chẳng hạn như hành động, sự kiện bộ sưu tập) thường mang theo dữ liệu ngữ cảnh kích hoạt. Dữ liệu này hoạt động như các biến và có thể được các nút trong luồng công việc sử dụng làm tham số xử lý để đạt được quá trình xử lý dữ liệu tự động. Ví dụ, khi người dùng gửi một biểu mẫu, nếu nút gửi được liên kết với một luồng công việc, luồng công việc đó sẽ được kích hoạt và thực thi. Dữ liệu đã gửi sẽ được đưa vào môi trường ngữ cảnh của kế hoạch thực thi để các nút tiếp theo sử dụng làm biến.

Sau khi tạo một luồng công việc, trên trang xem luồng công việc, bộ kích hoạt sẽ được hiển thị dưới dạng một nút đầu vào ở vị trí bắt đầu của quy trình. Nhấp vào thẻ này sẽ mở ngăn cấu hình. Tùy thuộc vào loại bộ kích hoạt, bạn có thể cấu hình các điều kiện liên quan của nó.

![Bộ kích hoạt_Nút đầu vào](https://static-docs.nocobase.com/20251029222231.png)