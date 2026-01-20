:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Xóa dữ liệu

Dùng để xóa dữ liệu từ một bộ sưu tập thỏa mãn các điều kiện nhất định.

Cách sử dụng cơ bản của nút xóa tương tự như nút cập nhật, chỉ khác là nút xóa không yêu cầu gán giá trị cho trường. Bạn chỉ cần chọn bộ sưu tập và các điều kiện lọc. Kết quả của nút xóa sẽ trả về số hàng dữ liệu đã được xóa thành công, chỉ có thể xem trong lịch sử thực thi và không thể dùng làm biến trong các nút tiếp theo.

:::info{title=Lưu ý}
Hiện tại, nút xóa không hỗ trợ xóa từng hàng mà thực hiện xóa hàng loạt. Do đó, nó sẽ không kích hoạt các sự kiện khác cho từng lần xóa dữ liệu riêng lẻ.
:::

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút “Xóa dữ liệu”:

![Tạo nút xóa dữ liệu](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Cấu hình nút

![Nút xóa_Cấu hình nút](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Bộ sưu tập

Chọn bộ sưu tập mà bạn muốn xóa dữ liệu.

### Điều kiện lọc

Tương tự như các điều kiện lọc khi truy vấn bộ sưu tập thông thường, bạn có thể sử dụng các biến ngữ cảnh của luồng công việc.

## Ví dụ

Ví dụ, để định kỳ dọn dẹp dữ liệu đơn hàng lịch sử đã hủy và không hợp lệ, bạn có thể sử dụng nút xóa để thực hiện:

![Nút xóa_Ví dụ_Cấu hình nút](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Luồng công việc sẽ được kích hoạt định kỳ và thực hiện xóa tất cả dữ liệu đơn hàng lịch sử đã hủy và không hợp lệ.