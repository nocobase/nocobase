:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Điều kiện

## Giới thiệu

Tương tự như câu lệnh `if` trong các ngôn ngữ lập trình, điều kiện sẽ xác định hướng đi tiếp theo của luồng công việc dựa trên kết quả đánh giá của điều kiện đã cấu hình.

## Tạo nút

Nút Điều kiện có hai chế độ: "Tiếp tục nếu đúng" và "Phân nhánh theo đúng/sai". Bạn cần chọn một trong hai chế độ này khi tạo nút và không thể thay đổi sau khi nút đã được cấu hình.

![Lựa chọn chế độ Điều kiện](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

Ở chế độ "Tiếp tục nếu đúng", khi kết quả của điều kiện là "đúng", luồng công việc sẽ tiếp tục thực hiện các nút tiếp theo. Ngược lại, luồng công việc sẽ dừng lại và thoát sớm với trạng thái thất bại.

!["Chế độ Tiếp tục nếu đúng"](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Chế độ này phù hợp với các trường hợp luồng công việc không nên tiếp tục nếu điều kiện không được đáp ứng. Ví dụ, một nút gửi biểu mẫu để đặt hàng được liên kết với "Sự kiện trước hành động". Nếu số lượng sản phẩm trong kho không đủ cho đơn hàng, quá trình tạo đơn hàng sẽ không tiếp tục mà sẽ thất bại và thoát.

Ở chế độ "Phân nhánh theo đúng/sai", nút điều kiện sẽ tạo ra hai nhánh luồng công việc tiếp theo, tương ứng với kết quả "đúng" và "sai" của điều kiện. Mỗi nhánh có thể được cấu hình với các nút tiếp theo riêng. Sau khi một trong hai nhánh hoàn tất thực hiện, chúng sẽ tự động hợp nhất trở lại vào nhánh cha của nút điều kiện để tiếp tục thực hiện các nút tiếp theo.

!["Chế độ Phân nhánh theo đúng/sai"](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Chế độ này phù hợp với các trường hợp cần thực hiện các hành động khác nhau tùy thuộc vào việc điều kiện được đáp ứng hay không. Ví dụ, kiểm tra xem một dữ liệu có tồn tại hay không: nếu không tồn tại, hãy tạo mới; nếu tồn tại, hãy cập nhật.

## Cấu hình nút

### Công cụ tính toán

Hiện tại, có ba công cụ được hỗ trợ:

- **Cơ bản**: Đưa ra kết quả logic thông qua các phép tính nhị phân đơn giản và nhóm "VÀ"/"HOẶC".
- **Math.js**: Tính toán các biểu thức được hỗ trợ bởi công cụ [Math.js](https://mathjs.org/) để đưa ra kết quả logic.
- **Formula.js**: Tính toán các biểu thức được hỗ trợ bởi công cụ [Formula.js](https://formulajs.info/) để đưa ra kết quả logic.

Trong cả ba loại tính toán, bạn có thể sử dụng các biến từ ngữ cảnh của luồng công việc làm tham số.