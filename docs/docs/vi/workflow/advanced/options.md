:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cấu hình nâng cao

## Chế độ thực thi

Các luồng công việc được thực thi theo chế độ "bất đồng bộ" hoặc "đồng bộ", dựa trên loại kích hoạt được chọn khi tạo. Chế độ bất đồng bộ có nghĩa là sau khi một sự kiện cụ thể được kích hoạt, luồng công việc sẽ đi vào hàng đợi và được hệ thống lập lịch nền thực thi lần lượt. Ngược lại, chế độ đồng bộ sẽ không đi vào hàng đợi lập lịch sau khi được kích hoạt; nó sẽ bắt đầu thực thi trực tiếp và cung cấp phản hồi ngay lập tức khi hoàn thành.

Theo mặc định, các sự kiện bộ sưu tập, sự kiện sau hành động, sự kiện hành động tùy chỉnh, sự kiện theo lịch trình và sự kiện phê duyệt sẽ được thực thi bất đồng bộ. Trong khi đó, các sự kiện trước hành động lại được thực thi đồng bộ theo mặc định. Cả sự kiện bộ sưu tập và sự kiện biểu mẫu đều hỗ trợ cả hai chế độ, bạn có thể lựa chọn khi tạo luồng công việc:

![Chế độ Đồng bộ_Tạo luồng công việc đồng bộ](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Lưu ý}
Do đặc thù của chế độ này, các luồng công việc đồng bộ không thể sử dụng các nút tạo ra trạng thái "chờ", ví dụ như "Xử lý thủ công".
:::

## Tự động xóa lịch sử thực thi

Khi một luồng công việc được kích hoạt thường xuyên, bạn có thể cấu hình tự động xóa lịch sử thực thi để giảm thiểu các bản ghi không cần thiết và giảm áp lực lưu trữ lên cơ sở dữ liệu.

Tương tự, bạn cũng có thể cấu hình việc tự động xóa lịch sử thực thi cho một luồng công việc trong cửa sổ tạo và chỉnh sửa của nó:

![Cấu hình tự động xóa lịch sử thực thi](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Tự động xóa có thể được cấu hình dựa trên trạng thái kết quả thực thi. Trong hầu hết các trường hợp, chúng tôi khuyến nghị chỉ chọn trạng thái "Hoàn thành" để giữ lại các bản ghi thực thi thất bại, phục vụ cho việc khắc phục sự cố sau này.

Chúng tôi khuyến nghị không nên bật tính năng tự động xóa lịch sử thực thi khi gỡ lỗi một luồng công việc, để bạn có thể sử dụng lịch sử để kiểm tra xem logic thực thi của luồng công việc có hoạt động đúng như mong đợi hay không.

:::info{title=Lưu ý}
Việc xóa lịch sử của một luồng công việc không làm giảm số lần thực thi của luồng công việc đó.
:::