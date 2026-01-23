:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Biểu mẫu lọc

## Giới thiệu

Biểu mẫu lọc cho phép người dùng lọc dữ liệu bằng cách điền vào các trường biểu mẫu. Bạn có thể sử dụng nó để lọc các khối bảng, khối biểu đồ, khối danh sách và nhiều loại khối khác.

## Cách sử dụng

Hãy cùng bắt đầu với một ví dụ đơn giản để nhanh chóng hiểu cách sử dụng biểu mẫu lọc. Giả sử chúng ta có một khối bảng chứa thông tin người dùng và muốn lọc dữ liệu bằng biểu mẫu lọc, như sau:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Các bước cấu hình như sau:

1. Bật chế độ chỉnh sửa và thêm một khối "Biểu mẫu lọc" cùng một khối "Bảng" vào trang.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Thêm trường "Biệt danh" vào cả khối bảng và khối biểu mẫu lọc.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Bây giờ bạn có thể bắt đầu sử dụng.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Cách sử dụng nâng cao

Khối biểu mẫu lọc hỗ trợ nhiều cấu hình nâng cao hơn. Dưới đây là một số trường hợp sử dụng phổ biến.

### Liên kết nhiều khối

Một trường biểu mẫu có thể lọc dữ liệu trên nhiều khối cùng lúc. Cách thực hiện như sau:

1. Nhấp vào tùy chọn cấu hình "Connect fields" (Kết nối trường) của trường.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Thêm các khối đích mà bạn muốn liên kết. Trong ví dụ này, chúng ta sẽ chọn khối danh sách trên trang.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Chọn một hoặc nhiều trường từ khối danh sách để liên kết. Ở đây chúng ta chọn trường "Biệt danh".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Nhấp vào nút lưu để hoàn tất cấu hình. Kết quả sẽ hiển thị như sau:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Liên kết khối biểu đồ

Tham khảo: [Bộ lọc trang và liên kết](../../../data-visualization/guide/filters-and-linkage.md)

### Trường tùy chỉnh

Ngoài việc chọn các trường từ các bộ sưu tập, bạn cũng có thể tạo các trường biểu mẫu bằng cách sử dụng "Trường tùy chỉnh". Ví dụ, bạn có thể tạo một trường chọn thả xuống và tùy chỉnh các tùy chọn. Cách thực hiện như sau:

1. Nhấp vào tùy chọn "Trường tùy chỉnh" để mở bảng cấu hình.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Điền tiêu đề trường, chọn "Select" (Chọn) làm kiểu trường và cấu hình các tùy chọn.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Các trường tùy chỉnh mới thêm cần được liên kết thủ công với các trường trong khối đích. Cách thực hiện như sau:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Cấu hình hoàn tất. Kết quả sẽ hiển thị như sau:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Các kiểu trường hiện được hỗ trợ bao gồm:

- Input: Trường nhập văn bản một dòng
- Number: Trường nhập số
- Date: Bộ chọn ngày
- Select: Trường thả xuống (có thể cấu hình chọn một hoặc nhiều tùy chọn)
- Radio group: Nhóm nút chọn (radio button)
- Checkbox group: Nhóm hộp kiểm (checkbox)

### Thu gọn

Thêm một nút thu gọn để có thể thu gọn và mở rộng nội dung biểu mẫu lọc, giúp tiết kiệm không gian trang.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Các cấu hình được hỗ trợ:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Số hàng hiển thị khi thu gọn**: Đặt số hàng trường biểu mẫu được hiển thị khi ở trạng thái thu gọn.
- **Mặc định thu gọn**: Khi bật, biểu mẫu lọc sẽ hiển thị ở trạng thái thu gọn theo mặc định.