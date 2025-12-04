:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Kết thúc luồng công việc

Khi nút này được kích hoạt, nó sẽ kết thúc ngay lập tức luồng công việc đang chạy với trạng thái được cấu hình tại nút. Nút này thường được sử dụng để kiểm soát luồng dựa trên các logic cụ thể, thoát khỏi luồng công việc hiện tại khi đáp ứng các điều kiện logic nhất định, và không tiếp tục thực thi các quy trình tiếp theo. Có thể hình dung nó tương tự như lệnh `return` trong các ngôn ngữ lập trình, dùng để thoát khỏi hàm đang thực thi.

## Thêm nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng ("+") trong luồng để thêm nút "Kết thúc luồng công việc":

![Kết thúc luồng công việc_Thêm](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Cấu hình nút

![Kết thúc luồng công việc_Cấu hình nút](https://static-docs.nocobase.com/bb6a57f25e9afb72836a14a0fe0683e.png)

### Trạng thái kết thúc

Trạng thái kết thúc sẽ ảnh hưởng đến trạng thái cuối cùng của quá trình thực thi luồng công việc. Có thể cấu hình là "Thành công" hoặc "Thất bại". Khi luồng công việc chạy đến nút này, nó sẽ thoát ngay lập tức với trạng thái đã được cấu hình.

:::info{title=Lưu ý}
Khi được sử dụng trong các luồng công việc loại "Sự kiện trước hành động", nút này sẽ chặn yêu cầu đã khởi tạo hành động. Để biết chi tiết, vui lòng tham khảo [Hướng dẫn sử dụng "Sự kiện trước hành động"](../triggers/pre-action).

Đồng thời, ngoài việc chặn yêu cầu đã khởi tạo hành động, cấu hình trạng thái kết thúc còn ảnh hưởng đến trạng thái của thông tin phản hồi trong "thông báo phản hồi" đối với loại luồng công việc này.
:::