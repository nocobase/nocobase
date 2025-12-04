:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Truy vấn Dữ liệu

Dùng để truy vấn và lấy các bản ghi dữ liệu từ một **bộ sưu tập** thỏa mãn các điều kiện cụ thể.

Bạn có thể cấu hình để truy vấn một bản ghi hoặc nhiều bản ghi. Kết quả truy vấn có thể được sử dụng làm biến trong các nút tiếp theo. Khi truy vấn nhiều bản ghi, kết quả sẽ là một mảng. Khi kết quả truy vấn trống, bạn có thể chọn có tiếp tục thực thi các nút tiếp theo hay không.

## Tạo Nút

Trong giao diện cấu hình **luồng công việc**, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Truy vấn Dữ liệu":

![Thêm Nút Truy vấn Dữ liệu](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Cấu hình Nút

![Cấu hình Nút Truy vấn](https://static-docs.nocobase.com/20240520131324.png)

### Bộ sưu tập

Chọn **bộ sưu tập** mà bạn muốn truy vấn dữ liệu.

### Loại Kết quả

Loại kết quả được chia thành hai dạng: "Một bản ghi" và "Nhiều bản ghi":

- Một bản ghi: Kết quả là một đối tượng, chỉ là bản ghi đầu tiên khớp hoặc giá trị `null`.
- Nhiều bản ghi: Kết quả sẽ là một mảng chứa các bản ghi khớp với điều kiện. Nếu không có bản ghi nào khớp, kết quả sẽ là một mảng trống. Bạn có thể xử lý từng bản ghi một bằng cách sử dụng nút Lặp (Loop node).

### Điều kiện Lọc

Tương tự như các điều kiện lọc trong truy vấn **bộ sưu tập** thông thường, bạn có thể sử dụng các biến ngữ cảnh của **luồng công việc**.

### Sắp xếp

Khi truy vấn một hoặc nhiều bản ghi, bạn có thể sử dụng các quy tắc sắp xếp để kiểm soát kết quả mong muốn. Ví dụ, để truy vấn bản ghi mới nhất, bạn có thể sắp xếp theo trường "Thời gian tạo" theo thứ tự giảm dần.

### Phân trang

Khi tập hợp kết quả có thể rất lớn, bạn có thể sử dụng phân trang để kiểm soát số lượng kết quả truy vấn. Ví dụ, để truy vấn 10 bản ghi mới nhất, bạn có thể sắp xếp theo trường "Thời gian tạo" theo thứ tự giảm dần, sau đó thiết lập phân trang là 1 trang với 10 bản ghi.

### Xử lý Kết quả Trống

Ở chế độ một bản ghi, nếu không có dữ liệu nào khớp với điều kiện, kết quả truy vấn sẽ là `null`. Ở chế độ nhiều bản ghi, kết quả sẽ là một mảng trống (`[]`). Bạn có thể chọn có đánh dấu tùy chọn "Thoát **luồng công việc** khi kết quả truy vấn trống" hay không. Nếu được đánh dấu và kết quả truy vấn trống, các nút tiếp theo sẽ không được thực thi và **luồng công việc** sẽ thoát sớm với trạng thái thất bại.