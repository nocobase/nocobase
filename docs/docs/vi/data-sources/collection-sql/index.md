---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Bộ sưu tập SQL

## Giới thiệu

Bộ sưu tập SQL cung cấp một phương pháp mạnh mẽ để truy xuất dữ liệu bằng các truy vấn SQL. Bằng cách trích xuất các trường dữ liệu thông qua các truy vấn SQL và cấu hình siêu dữ liệu trường liên quan, người dùng có thể sử dụng các trường này như thể chúng là một bảng thông thường. Tính năng này đặc biệt hữu ích cho các kịch bản liên quan đến truy vấn kết nối phức tạp, phân tích thống kê và nhiều hơn nữa.

## Hướng dẫn sử dụng

### Tạo mới bộ sưu tập SQL

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

<p>1. Nhập truy vấn SQL của bạn vào ô nhập liệu SQL và nhấp vào nút Thực thi (Execute). Hệ thống sẽ phân tích truy vấn để xác định các bảng và trường liên quan, tự động trích xuất siêu dữ liệu trường có liên quan từ các bảng nguồn.</p>

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

<p>2. Nếu phân tích của hệ thống về các bảng và trường nguồn không chính xác, bạn có thể chọn thủ công các bảng và trường phù hợp để đảm bảo siêu dữ liệu chính xác được sử dụng. Bắt đầu bằng cách chọn bảng nguồn, sau đó chọn các trường tương ứng trong phần nguồn trường bên dưới.</p>

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

<p>3. Đối với các trường không có nguồn trực tiếp, hệ thống sẽ suy luận loại trường dựa trên kiểu dữ liệu. Nếu suy luận này không chính xác, bạn có thể chọn thủ công loại trường phù hợp.</p>

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

<p>4. Khi bạn cấu hình từng trường, bạn có thể xem trước hiển thị của nó trong khu vực xem trước, cho phép bạn thấy ngay tác động của các cài đặt của mình.</p>

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

<p>5. Sau khi bạn đã hoàn tất cấu hình và xác nhận mọi thứ đều chính xác, hãy nhấp vào nút Xác nhận (Confirm) bên dưới ô nhập liệu SQL để hoàn tất việc gửi.</p>

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Chỉnh sửa

1. Nếu bạn cần sửa đổi truy vấn SQL, hãy nhấp vào nút Chỉnh sửa (Edit) để trực tiếp thay đổi câu lệnh SQL và cấu hình lại các trường theo yêu cầu.

2. Để điều chỉnh siêu dữ liệu trường, hãy sử dụng tùy chọn Cấu hình Trường (Configure fields), cho phép bạn cập nhật cài đặt trường giống như đối với một bảng thông thường.

### Đồng bộ hóa

Nếu truy vấn SQL không thay đổi nhưng cấu trúc bảng cơ sở dữ liệu cơ bản đã được sửa đổi, bạn có thể đồng bộ hóa và cấu hình lại các trường bằng cách chọn Cấu hình Trường (Configure fields) - Đồng bộ từ cơ sở dữ liệu (Sync from database).

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Bộ sưu tập SQL so với Chế độ xem cơ sở dữ liệu được liên kết

| Loại mẫu                       | Phù hợp nhất cho                                                                                             | Phương pháp triển khai      | Hỗ trợ thao tác CRUD |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------- | :-------------------------- | :------------------- |
| SQL                            | Các mô hình đơn giản, trường hợp sử dụng nhẹ<br />Tương tác hạn chế với cơ sở dữ liệu<br />Tránh bảo trì các chế độ xem<br />Ưu tiên các thao tác dựa trên giao diện người dùng | Truy vấn con SQL            | Không hỗ trợ         |
| Kết nối với chế độ xem cơ sở dữ liệu | Các mô hình phức tạp<br />Yêu cầu tương tác với cơ sở dữ liệu<br />Cần sửa đổi dữ liệu<br />Yêu cầu hỗ trợ cơ sở dữ liệu mạnh mẽ và ổn định hơn | Chế độ xem cơ sở dữ liệu | Hỗ trợ một phần      |

:::warning
Khi sử dụng bộ sưu tập SQL, hãy đảm bảo chọn các bảng có thể quản lý được trong NocoBase. Việc sử dụng các bảng từ cùng một cơ sở dữ liệu nhưng không được kết nối với NocoBase có thể dẫn đến việc phân tích truy vấn SQL không chính xác. Nếu đây là một mối lo ngại, hãy cân nhắc tạo và liên kết với một chế độ xem.
:::