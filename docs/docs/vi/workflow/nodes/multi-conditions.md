:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Phân nhánh đa điều kiện <Badge>v2.0.0+</Badge>

## Giới thiệu

Tương tự như các câu lệnh `switch / case` hoặc `if / else if` trong ngôn ngữ lập trình. Hệ thống sẽ đánh giá từng điều kiện đã cấu hình theo thứ tự. Ngay khi một điều kiện được đáp ứng, luồng công việc sẽ thực thi nhánh tương ứng và bỏ qua việc kiểm tra các điều kiện tiếp theo. Nếu không có điều kiện nào được đáp ứng, nhánh "Nếu không" sẽ được thực thi.

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng ("+") trong luồng để thêm nút "Phân nhánh đa điều kiện":

![Tạo nút Phân nhánh đa điều kiện](https://static-docs.nocobase.com/20251123222134.png)

## Quản lý nhánh

### Nhánh mặc định

Sau khi tạo, nút sẽ bao gồm hai nhánh mặc định:

1. **Nhánh điều kiện**: Dùng để cấu hình các điều kiện kiểm tra cụ thể.
2. **Nhánh "Nếu không"**: Được thực thi khi không có nhánh điều kiện nào được đáp ứng; không cần cấu hình điều kiện.

Nhấp vào nút "Thêm nhánh" bên dưới nút để thêm các nhánh điều kiện khác.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Thêm nhánh

Sau khi nhấp vào "Thêm nhánh", nhánh mới sẽ được thêm vào trước nhánh "Nếu không".

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Xóa nhánh

Khi có nhiều nhánh điều kiện, nhấp vào biểu tượng thùng rác ở bên phải của nhánh để xóa nó. Nếu chỉ còn một nhánh điều kiện, bạn không thể xóa.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Lưu ý}
Việc xóa một nhánh cũng sẽ xóa tất cả các nút bên trong nhánh đó; vui lòng thực hiện cẩn thận.

Nhánh "Nếu không" là nhánh tích hợp và không thể xóa.
:::

## Cấu hình nút

### Cấu hình điều kiện

Nhấp vào tên điều kiện ở đầu nhánh để chỉnh sửa chi tiết điều kiện cụ thể:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Nhãn điều kiện

Hỗ trợ nhãn tùy chỉnh. Sau khi điền, nhãn sẽ được hiển thị làm tên điều kiện trong sơ đồ luồng. Nếu không được cấu hình (hoặc để trống), mặc định sẽ hiển thị theo thứ tự là "Điều kiện 1", "Điều kiện 2", v.v.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Công cụ tính toán

Hiện tại hỗ trợ ba công cụ:

- **Cơ bản**: Sử dụng các phép so sánh logic đơn giản (ví dụ: bằng, chứa, v.v.) và kết hợp "VÀ", "HOẶC" để xác định kết quả.
- **Math.js**: Hỗ trợ tính toán biểu thức sử dụng cú pháp [Math.js](https://mathjs.org/).
- **Formula.js**: Hỗ trợ tính toán biểu thức sử dụng cú pháp [Formula.js](https://formulajs.info/) (tương tự công thức Excel).

Cả ba chế độ đều hỗ trợ sử dụng biến ngữ cảnh của luồng công việc làm tham số.

### Khi không có điều kiện nào được đáp ứng

Trong bảng cấu hình nút, bạn có thể đặt hành động tiếp theo khi không có điều kiện nào được đáp ứng:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Kết thúc luồng công việc với trạng thái thất bại (Mặc định)**: Đánh dấu trạng thái luồng công việc là thất bại và chấm dứt quá trình.
*   **Tiếp tục thực thi các nút tiếp theo**: Sau khi nút hiện tại hoàn tất, tiếp tục thực thi các nút tiếp theo trong luồng công việc.

:::info{title=Lưu ý}
Bất kể phương pháp xử lý nào được chọn, khi không có điều kiện nào được đáp ứng, luồng công việc sẽ luôn đi vào nhánh "Nếu không" trước để thực thi các nút bên trong đó.
:::

## Lịch sử thực thi

Trong lịch sử thực thi của luồng công việc, nút Phân nhánh đa điều kiện sẽ đánh dấu kết quả kiểm tra của mỗi điều kiện bằng các màu khác nhau:

-   **Màu xanh lá**: Điều kiện được đáp ứng, đi vào nhánh này để thực thi.
-   **Màu đỏ**: Điều kiện không được đáp ứng (hoặc lỗi tính toán), bỏ qua nhánh này.
-   **Màu xanh dương**: Không thực hiện kiểm tra (bỏ qua do điều kiện trước đó đã được đáp ứng).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Nếu lỗi cấu hình dẫn đến ngoại lệ trong tính toán điều kiện, ngoài việc hiển thị màu đỏ, khi di chuột qua tên điều kiện, thông tin lỗi cụ thể sẽ được hiển thị:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Khi xảy ra ngoại lệ trong tính toán điều kiện, nút Phân nhánh đa điều kiện sẽ kết thúc với trạng thái "Lỗi" và không tiếp tục thực thi các nút tiếp theo.