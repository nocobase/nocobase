:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quy tắc Liên kết Trường

## Giới thiệu

Quy tắc liên kết trường cho phép điều chỉnh trạng thái của các trường trong khối Biểu mẫu/Chi tiết một cách linh hoạt dựa trên hành động của người dùng. Hiện tại, các khối hỗ trợ quy tắc liên kết trường bao gồm:

- [Khối Biểu mẫu](/interface-builder/blocks/data-blocks/form)
- [Khối Chi tiết](/interface-builder/blocks/data-blocks/details)
- [Biểu mẫu con](/interface-builder/fields/specific/sub-form)

## Hướng dẫn sử dụng

### **Khối Biểu mẫu**

Trong khối Biểu mẫu, quy tắc liên kết có thể điều chỉnh linh hoạt hành vi của các trường dựa trên các điều kiện cụ thể:

- **Kiểm soát hiển thị/ẩn trường**: Quyết định xem trường hiện tại có hiển thị hay không dựa trên giá trị của các trường khác.
- **Đặt trường là bắt buộc**: Linh hoạt đặt trường là bắt buộc hoặc không bắt buộc trong các điều kiện cụ thể.
- **Gán giá trị**: Tự động gán giá trị cho một trường dựa trên các điều kiện.
- **Thực thi JavaScript được chỉ định**: Viết JavaScript theo yêu cầu nghiệp vụ.

### **Khối Chi tiết**

Trong khối Chi tiết, quy tắc liên kết chủ yếu được sử dụng để kiểm soát linh hoạt việc hiển thị và ẩn các trường trên khối.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Liên kết thuộc tính

### Gán giá trị

Ví dụ: Khi một đơn hàng được chọn là đơn hàng bổ sung, trạng thái đơn hàng sẽ tự động được gán giá trị "Chờ duyệt".

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Bắt buộc

Ví dụ: Khi trạng thái đơn hàng là "Đã thanh toán", trường số tiền đơn hàng là bắt buộc.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Hiển thị/Ẩn

Ví dụ: Tài khoản thanh toán và tổng số tiền chỉ hiển thị khi trạng thái đơn hàng là "Chờ thanh toán".

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)