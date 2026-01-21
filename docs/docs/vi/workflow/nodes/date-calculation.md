---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Tính toán Ngày tháng

## Giới thiệu

Nút Tính toán Ngày tháng cung cấp chín hàm tính toán, bao gồm thêm một khoảng thời gian, bớt một khoảng thời gian, định dạng chuỗi thời gian đầu ra và chuyển đổi đơn vị thời lượng. Mỗi hàm có các kiểu giá trị đầu vào và đầu ra cụ thể, đồng thời có thể nhận kết quả từ các nút khác làm biến tham số. Nút này sử dụng một quy trình tính toán dạng đường ống (pipeline) để xâu chuỗi các kết quả tính toán của các hàm đã cấu hình, cuối cùng cho ra một đầu ra mong muốn.

## Tạo Nút

Trong giao diện cấu hình luồng công việc, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Tính toán Ngày tháng":

![Nút Tính toán Ngày tháng_Tạo nút](https://static-docs.nocobase.com/[图片].png)

## Cấu hình Nút

![Nút Tính toán Ngày tháng_Cấu hình nút](https://static-docs.nocobase.com/20240817184423.png)

### Giá trị Đầu vào

Giá trị đầu vào có thể là một biến hoặc một hằng số ngày tháng. Biến có thể là dữ liệu đã kích hoạt luồng công việc này hoặc kết quả của một nút phía trước trong luồng công việc. Đối với hằng số, bạn có thể chọn bất kỳ ngày tháng nào.

### Kiểu Giá trị Đầu vào

Chỉ loại giá trị đầu vào, có hai giá trị có thể.

*   Kiểu Ngày tháng: Nghĩa là giá trị đầu vào cuối cùng có thể được chuyển đổi thành kiểu ngày giờ, chẳng hạn như dấu thời gian dạng số hoặc một chuỗi đại diện cho thời gian.
*   Kiểu Số: Vì kiểu giá trị đầu vào ảnh hưởng đến việc lựa chọn các bước tính toán thời gian tiếp theo, nên cần phải chọn đúng kiểu giá trị đầu vào.

### Các Bước Tính toán

Mỗi bước tính toán bao gồm một hàm tính toán và cấu hình tham số của nó. Nút này áp dụng thiết kế dạng đường ống (pipeline), trong đó kết quả từ hàm tính toán trước sẽ được sử dụng làm giá trị đầu vào cho hàm tính toán tiếp theo. Bằng cách này, có thể hoàn thành một loạt các phép tính và chuyển đổi thời gian.

Sau mỗi bước tính toán, kiểu đầu ra cũng được cố định và sẽ ảnh hưởng đến các hàm có thể sử dụng cho bước tính toán tiếp theo. Việc tính toán chỉ có thể tiếp tục nếu các kiểu dữ liệu khớp nhau. Nếu không, kết quả của một bước sẽ là đầu ra cuối cùng của nút.

## Các Hàm Tính toán

### Thêm một khoảng thời gian

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Số lượng cần thêm, có thể là một số hoặc một biến có sẵn trong nút.
    -   Đơn vị thời gian.
-   Kiểu giá trị đầu ra: Ngày tháng
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 00:00:00`, số lượng là `1`, và đơn vị là "ngày", kết quả tính toán là `2024-7-16 00:00:00`.

### Bớt một khoảng thời gian

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Số lượng cần bớt, có thể là một số hoặc một biến có sẵn trong nút.
    -   Đơn vị thời gian.
-   Kiểu giá trị đầu ra: Ngày tháng
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 00:00:00`, số lượng là `1`, và đơn vị là "ngày", kết quả tính toán là `2024-7-14 00:00:00`.

### Tính toán sự khác biệt với một thời gian khác

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Ngày tháng cần tính toán sự khác biệt, có thể là một hằng số ngày tháng hoặc một biến từ ngữ cảnh của luồng công việc.
    -   Đơn vị thời gian.
    -   Có lấy giá trị tuyệt đối hay không.
    -   Thao tác làm tròn: Có thể chọn giữ nguyên số thập phân, làm tròn, làm tròn lên và làm tròn xuống.
-   Kiểu giá trị đầu ra: Số
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 00:00:00`, đối tượng so sánh là `2024-7-16 06:00:00`, đơn vị là "ngày", không lấy giá trị tuyệt đối, và giữ nguyên số thập phân, kết quả tính toán là `-1.25`.

:::info{title=Mẹo}
Khi giá trị tuyệt đối và làm tròn được cấu hình đồng thời, giá trị tuyệt đối sẽ được lấy trước, sau đó mới thực hiện làm tròn.
:::

### Lấy giá trị của thời gian theo một đơn vị cụ thể

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Đơn vị thời gian.
-   Kiểu giá trị đầu ra: Số
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 00:00:00` và đơn vị là "ngày", kết quả tính toán là `15`.

### Đặt ngày tháng về thời điểm bắt đầu của một đơn vị cụ thể

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Đơn vị thời gian.
-   Kiểu giá trị đầu ra: Ngày tháng
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 14:26:30` và đơn vị là "ngày", kết quả tính toán là `2024-7-15 00:00:00`.

### Đặt ngày tháng về thời điểm kết thúc của một đơn vị cụ thể

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Đơn vị thời gian.
-   Kiểu giá trị đầu ra: Ngày tháng
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 14:26:30` và đơn vị là "ngày", kết quả tính toán là `2024-7-15 23:59:59`.

### Kiểm tra năm nhuận

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Không có tham số
-   Kiểu giá trị đầu ra: Boolean
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 14:26:30`, kết quả tính toán là `true`.

### Định dạng thành chuỗi

-   Kiểu giá trị đầu vào: Ngày tháng
-   Tham số
    -   Định dạng, tham khảo [Day.js: Format](https://day.js.org/docs/en/display/format)
-   Kiểu giá trị đầu ra: Chuỗi
-   Ví dụ: Khi giá trị đầu vào là `2024-7-15 14:26:30`, định dạng là `the time is YYYY/MM/DD HH:mm:ss`, kết quả tính toán là `the time is 2024/07/15 14:26:30`.

### Chuyển đổi đơn vị

-   Kiểu giá trị đầu vào: Số
-   Tham số
    -   Đơn vị thời gian trước khi chuyển đổi.
    -   Đơn vị thời gian sau khi chuyển đổi.
    -   Thao tác làm tròn, có thể chọn giữ nguyên số thập phân, làm tròn, làm tròn lên và làm tròn xuống.
-   Kiểu giá trị đầu ra: Số
-   Ví dụ: Khi giá trị đầu vào là `2`, đơn vị trước khi chuyển đổi là "tuần", đơn vị sau khi chuyển đổi là "ngày", và không giữ nguyên số thập phân, kết quả tính toán là `14`.

## Ví dụ

![Nút Tính toán Ngày tháng_Ví dụ](https://static-docs.nocobase.com/20240817184137.png)

Giả sử có một sự kiện khuyến mãi, chúng ta muốn thêm thời gian kết thúc khuyến mãi vào trường của sản phẩm khi mỗi sản phẩm được tạo. Thời gian kết thúc này là 23:59:59 vào ngày cuối cùng của tuần tiếp theo sau thời gian tạo sản phẩm. Vì vậy, chúng ta có thể tạo hai hàm thời gian và cho chúng chạy theo dạng đường ống (pipeline):

-   Tính toán thời gian cho tuần tiếp theo
-   Đặt lại kết quả thành 23:59:59 vào ngày cuối cùng của tuần đó

Bằng cách này, chúng ta sẽ nhận được giá trị thời gian mong muốn và truyền nó đến nút tiếp theo, ví dụ như nút sửa đổi bộ sưu tập, để thêm thời gian kết thúc khuyến mãi vào bộ sưu tập.