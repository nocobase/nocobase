:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/blocks/filter-blocks/form).
:::

# Biểu mẫu lọc

## Giới thiệu

Biểu mẫu lọc cho phép người dùng lọc dữ liệu bằng cách điền vào các trường biểu mẫu. Có thể được sử dụng để lọc các khối bảng, khối biểu đồ, khối danh sách, v.v.

## Cách sử dụng

Hãy cùng tìm hiểu nhanh cách sử dụng biểu mẫu lọc thông qua một ví dụ đơn giản. Giả sử chúng ta có một khối bảng chứa thông tin người dùng, chúng ta muốn có thể lọc dữ liệu thông qua biểu mẫu lọc. Giống như dưới đây:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Các bước cấu hình như sau:

1. Bật chế độ cấu hình, thêm một khối "Biểu mẫu lọc" và một khối "Bảng" vào trang.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Thêm trường “Biệt danh” vào khối bảng và khối biểu mẫu lọc.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Bây giờ đã có thể bắt đầu sử dụng.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Cách sử dụng nâng cao

Khối biểu mẫu lọc hỗ trợ nhiều cấu hình nâng cao hơn, dưới đây là một số cách dùng phổ biến.

### Liên kết nhiều khối

Một trường biểu mẫu duy nhất có thể lọc dữ liệu của nhiều khối cùng lúc. Thao tác cụ thể như sau:

1. Nhấp vào mục cấu hình “Connect fields” của trường.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Thêm khối mục tiêu cần liên kết, ở đây chúng ta chọn khối danh sách trong trang.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Chọn một hoặc nhiều trường trong khối danh sách để liên kết. Ở đây chúng ta chọn trường "Biệt danh".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Nhấp vào nút lưu, hoàn tất cấu hình, hiệu quả như sau:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Liên kết khối biểu đồ

Tham khảo: [Bộ lọc trang và liên kết](../../../data-visualization/guide/filters-and-linkage.md)

### Trường tùy chỉnh

Ngoài việc chọn các trường từ bộ sưu tập (data table), cũng có thể tạo các trường biểu mẫu thông qua “Trường tùy chỉnh”. Ví dụ: có thể tạo một trường hộp chọn thả xuống và tùy chỉnh các tùy chọn. Thao tác cụ thể như sau:

1. Nhấp vào tùy chọn "Trường tùy chỉnh", cửa sổ giao diện cấu hình sẽ hiện ra.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Điền tiêu đề trường, chọn “Chọn” trong “Loại trường” và cấu hình các tùy chọn.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Các trường tùy chỉnh mới thêm cần được liên kết thủ công với các trường của khối mục tiêu, phương pháp thao tác như sau:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Cấu hình hoàn tất, hiệu quả như sau:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Hiện tại các loại trường được hỗ trợ là:

- Ô văn bản
- Số
- Ngày tháng
- Chọn
- Ô chọn một (Radio)
- Ô chọn nhiều (Checkbox)
- Liên kết bản ghi

#### Liên kết bản ghi (Trường quan hệ tùy chỉnh)

“Liên kết bản ghi” phù hợp cho các kịch bản “lọc theo bản ghi của bảng liên kết”. Ví dụ: trong danh sách đơn hàng, lọc đơn hàng theo “Khách hàng”, hoặc trong danh sách công việc, lọc công việc theo “Người phụ trách”.

Mô tả mục cấu hình:

- **Bộ sưu tập mục tiêu**: Cho biết sẽ tải các bản ghi có thể chọn từ bộ sưu tập nào.
- **Trường tiêu đề**: Văn bản hiển thị cho các tùy chọn thả xuống và các thẻ đã chọn (như tên, tiêu đề).
- **Trường giá trị**: Giá trị được gửi khi thực hiện lọc thực tế, thường chọn trường khóa chính (như `id`).
- **Cho phép chọn nhiều**: Sau khi bật, có thể chọn nhiều bản ghi cùng lúc.
- **Toán tử**: Định nghĩa cách khớp các điều kiện lọc (xem phần giải thích “Toán tử” bên dưới).

Cấu hình đề xuất:

1. `Trường tiêu đề` chọn trường có tính dễ đọc cao (như “Tên”), tránh sử dụng ID thuần túy gây ảnh hưởng đến khả năng sử dụng.
2. `Trường giá trị` ưu tiên chọn trường khóa chính để đảm bảo việc lọc ổn định và duy nhất.
3. Kịch bản chọn một thường tắt `Cho phép chọn nhiều`, kịch bản chọn nhiều thì bật `Cho phép chọn nhiều` và phối hợp với `Toán tử` phù hợp.

#### Toán tử

`Toán tử` dùng để định nghĩa mối quan hệ khớp giữa “giá trị trường biểu mẫu lọc” và “giá trị trường khối mục tiêu”.

### Thu gọn

Thêm một nút thu gọn, có thể thu gọn và mở rộng nội dung biểu mẫu lọc, giúp tiết kiệm không gian trang.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Hỗ trợ các cấu hình sau:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Số hàng hiển thị khi thu gọn**: Thiết lập số hàng trường biểu mẫu hiển thị ở trạng thái thu gọn.
- **Mặc định thu gọn**: Sau khi bật, biểu mẫu lọc sẽ hiển thị ở trạng thái thu gọn theo mặc định.