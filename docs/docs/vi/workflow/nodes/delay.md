:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Độ trễ

## Giới thiệu

Nút Độ trễ cho phép thêm một khoảng thời gian trễ vào luồng công việc. Sau khi khoảng thời gian trễ này kết thúc, luồng công việc có thể tiếp tục thực thi các nút tiếp theo hoặc kết thúc sớm, tùy thuộc vào cấu hình.

Nút Độ trễ thường được sử dụng kết hợp với Nút Nhánh song song. Bằng cách thêm Nút Độ trễ vào một trong các nhánh, chúng ta có thể xử lý các tình huống sau khi hết thời gian. Ví dụ, trong một nhánh song song, một nhánh bao gồm xử lý thủ công và nhánh còn lại chứa Nút Độ trễ. Khi xử lý thủ công hết thời gian:
- Nếu cấu hình là "thất bại khi hết thời gian", điều này có nghĩa là xử lý thủ công phải được hoàn thành trong thời gian giới hạn.
- Nếu cấu hình là "tiếp tục khi hết thời gian", điều này có nghĩa là xử lý thủ công có thể bị bỏ qua sau khi hết thời gian.

## Cài đặt

Đây là một plugin tích hợp sẵn, không cần cài đặt.

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Độ trễ":

![Tạo nút Độ trễ](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Cấu hình nút

![Nút Độ trễ_Cấu hình nút](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Thời gian độ trễ

Bạn có thể nhập một số và chọn đơn vị thời gian cho khoảng thời gian độ trễ. Các đơn vị thời gian được hỗ trợ bao gồm: giây, phút, giờ, ngày và tuần.

### Trạng thái khi hết thời gian

Đối với trạng thái khi hết thời gian, bạn có thể chọn "Vượt qua và tiếp tục" hoặc "Thất bại và thoát".
- "Vượt qua và tiếp tục" có nghĩa là sau khi khoảng thời gian độ trễ kết thúc, luồng công việc sẽ tiếp tục thực thi các nút tiếp theo.
- "Thất bại và thoát" có nghĩa là sau khi khoảng thời gian độ trễ kết thúc, luồng công việc sẽ kết thúc sớm với trạng thái thất bại.

## Ví dụ

Hãy xem xét kịch bản một yêu cầu công việc cần được phản hồi trong một thời gian giới hạn sau khi được khởi tạo. Chúng ta cần thêm một nút xử lý thủ công vào một trong hai nhánh song song và một Nút Độ trễ vào nhánh còn lại. Nếu xử lý thủ công không được phản hồi trong vòng 10 phút, trạng thái yêu cầu công việc sẽ được cập nhật thành "hết thời gian và chưa xử lý".

![Nút Độ trễ_Ví dụ_Tổ chức luồng](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)