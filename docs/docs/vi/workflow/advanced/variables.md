:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Sử dụng biến

## Khái niệm cốt lõi

Giống như các biến trong ngôn ngữ lập trình, **biến** trong một luồng công việc là một công cụ quan trọng để kết nối và tổ chức các quy trình.

Khi mỗi nút được thực thi sau khi một luồng công việc được kích hoạt, một số mục cấu hình có thể sử dụng biến. Nguồn gốc của các biến này là dữ liệu từ các nút phía trước của nút hiện tại, bao gồm các loại sau:

-   Dữ liệu ngữ cảnh kích hoạt: Trong các trường hợp như kích hoạt hành động hoặc kích hoạt bộ sưu tập, một đối tượng dữ liệu hàng đơn có thể được tất cả các nút sử dụng làm biến. Chi tiết cụ thể sẽ khác nhau tùy thuộc vào cách triển khai của từng trình kích hoạt.
-   Dữ liệu nút phía trước: Khi quy trình đạt đến bất kỳ nút nào, đây là dữ liệu kết quả của các nút đã hoàn thành trước đó.
-   Biến cục bộ: Khi một nút nằm trong một số cấu trúc nhánh đặc biệt, nó có thể sử dụng các biến cục bộ đặc trưng trong nhánh đó. Ví dụ, trong cấu trúc lặp, đối tượng dữ liệu của mỗi lần lặp có thể được sử dụng.
-   Biến hệ thống: Một số tham số hệ thống tích hợp sẵn, chẳng hạn như thời gian hiện tại.

Chúng ta đã sử dụng tính năng biến nhiều lần trong [Bắt đầu nhanh](../getting-started.md). Ví dụ, trong một nút tính toán, chúng ta có thể sử dụng biến để tham chiếu dữ liệu ngữ cảnh kích hoạt nhằm thực hiện các phép tính:

![Nút tính toán sử dụng hàm và biến](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

Trong một nút cập nhật, sử dụng dữ liệu ngữ cảnh kích hoạt làm biến cho điều kiện lọc, và tham chiếu kết quả của nút tính toán làm biến cho giá trị trường dữ liệu cần cập nhật:

![Biến nút cập nhật dữ liệu](https://static-docs.nocobase.com/2e147c93642e7ebc709b9b7ab4f3af8c.png)

## Cấu trúc dữ liệu

Bên trong một biến là một cấu trúc JSON, và bạn thường có thể sử dụng một phần cụ thể của dữ liệu bằng đường dẫn JSON của nó. Vì nhiều biến dựa trên cấu trúc bộ sưu tập của NocoBase, dữ liệu liên kết sẽ được cấu trúc phân cấp dưới dạng thuộc tính của đối tượng, tạo thành một cấu trúc giống cây. Ví dụ, chúng ta có thể chọn giá trị của một trường cụ thể từ dữ liệu liên kết của dữ liệu đã truy vấn. Ngoài ra, khi dữ liệu liên kết có cấu trúc nhiều-đến-nhiều, biến có thể là một mảng.

Khi chọn một biến, bạn sẽ thường cần chọn thuộc tính giá trị ở cấp cuối cùng, thường là một kiểu dữ liệu đơn giản như số hoặc chuỗi. Tuy nhiên, khi có một mảng trong cấu trúc phân cấp của biến, thuộc tính ở cấp cuối cùng cũng sẽ được ánh xạ thành một mảng. Chỉ khi nút tương ứng hỗ trợ mảng thì dữ liệu mảng mới có thể được xử lý chính xác. Ví dụ, trong một nút tính toán, một số công cụ tính toán có các hàm chuyên biệt để xử lý mảng. Một ví dụ khác là trong một nút lặp, đối tượng lặp cũng có thể trực tiếp chọn một mảng.

Ví dụ, khi một nút truy vấn truy vấn nhiều mục dữ liệu, kết quả của nút sẽ là một mảng chứa nhiều hàng dữ liệu đồng nhất:

```json
[
  {
    "id": 1,
    "title": "Tiêu đề 1"
  },
  {
    "id": 2,
    "title": "Tiêu đề 2"
  }
]
```

Tuy nhiên, khi sử dụng nó làm biến trong các nút tiếp theo, nếu biến được chọn có dạng `Dữ liệu nút/Nút truy vấn/Tiêu đề`, bạn sẽ nhận được một mảng được ánh xạ thành các giá trị trường tương ứng:

```json
["Tiêu đề 1", "Tiêu đề 2"]
```

Nếu đó là một mảng đa chiều (chẳng hạn như trường liên kết nhiều-đến-nhiều), bạn sẽ nhận được một mảng một chiều với trường tương ứng đã được làm phẳng.

## Biến hệ thống tích hợp sẵn

### Thời gian hệ thống

Lấy thời gian hệ thống tại thời điểm nút được thực thi. Múi giờ của thời gian này là múi giờ được cài đặt trên máy chủ.

### Tham số phạm vi ngày

Có thể được sử dụng khi cấu hình điều kiện lọc trường ngày trong các nút truy vấn, cập nhật và xóa. Chỉ hỗ trợ sử dụng khi so sánh "bằng". Cả thời điểm bắt đầu và kết thúc của phạm vi ngày đều dựa trên múi giờ được cài đặt trên máy chủ.

![Tham số phạm vi ngày](https://static-docs.nocobase.com/20240817175354.png)