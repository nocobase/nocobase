:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tính toán

Nút Tính toán có thể đánh giá một biểu thức, và kết quả tính toán sẽ được lưu trữ trong kết quả của nút tương ứng để các nút tiếp theo sử dụng. Đây là một công cụ dùng để tính toán, xử lý và chuyển đổi dữ liệu, ở một mức độ nhất định, nó có thể thay thế chức năng gọi hàm trên một giá trị và gán kết quả cho biến trong các ngôn ngữ lập trình.

## Tạo nút

Trong giao diện cấu hình luồng công việc, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Tính toán":

![Nút Tính toán_Thêm](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Cấu hình nút

![Nút Tính toán_Cấu hình](https://static-docs.nocobase.com/6a155de3f883d8cd1881b2d9c33874.png)

### Công cụ tính toán

Công cụ tính toán quy định cú pháp mà biểu thức hỗ trợ. Hiện tại, các công cụ tính toán được hỗ trợ bao gồm [Math.js](https://mathjs.org/) và [Formula.js](https://formulajs.info/). Mỗi công cụ đều tích hợp sẵn nhiều hàm thông dụng và phương thức thao tác dữ liệu. Để biết cách sử dụng cụ thể, quý vị có thể tham khảo tài liệu chính thức của chúng.

:::info{title=Lưu ý}
Cần lưu ý rằng các công cụ khác nhau có sự khác biệt trong việc truy cập chỉ mục mảng. Chỉ mục của Math.js bắt đầu từ `1`, trong khi Formula.js bắt đầu từ `0`.
:::

Ngoài ra, nếu quý vị cần nối chuỗi đơn giản, có thể trực tiếp sử dụng "Mẫu chuỗi" (String Template). Công cụ này sẽ thay thế các biến trong biểu thức bằng giá trị tương ứng, sau đó trả về chuỗi đã được nối.

### Biểu thức

Biểu thức là một chuỗi thể hiện công thức tính toán, có thể bao gồm các biến, hằng số, toán tử và các hàm được hỗ trợ. Quý vị có thể sử dụng các biến từ ngữ cảnh của luồng công việc, chẳng hạn như kết quả của nút đứng trước nút tính toán, hoặc các biến cục bộ của một vòng lặp.

Nếu biểu thức nhập vào không tuân thủ cú pháp, lỗi sẽ được hiển thị trong cấu hình nút. Trong trường hợp thực thi, nếu biến không tồn tại hoặc kiểu dữ liệu không khớp, hoặc nếu sử dụng một hàm không tồn tại, nút tính toán sẽ dừng lại sớm với trạng thái lỗi.

## Ví dụ

### Tính tổng giá trị đơn hàng

Thông thường, một đơn hàng có thể chứa nhiều mặt hàng, mỗi mặt hàng có giá và số lượng khác nhau. Tổng giá trị của đơn hàng cần được tính bằng tổng của tích giá và số lượng của tất cả các mặt hàng. Sau khi tải danh sách chi tiết đơn hàng (đối với tập dữ liệu quan hệ một-nhiều), quý vị có thể sử dụng nút tính toán để tính tổng giá trị đơn hàng:

![Nút Tính toán_Ví dụ_Cấu hình](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Trong đó, hàm `SUMPRODUCT` của Formula.js có thể tính tổng các tích của từng cặp phần tử trong hai mảng có cùng độ dài, từ đó cho ra tổng giá trị của đơn hàng.