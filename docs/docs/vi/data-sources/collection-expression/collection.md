:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Bộ sưu tập Biểu thức

## Tạo mẫu bộ sưu tập "Biểu thức"

Trước khi sử dụng các nút thao tác biểu thức động trong luồng công việc, bạn cần tạo một mẫu bộ sưu tập "Biểu thức" trong công cụ quản lý bộ sưu tập. Mẫu này sẽ dùng để lưu trữ các biểu thức khác nhau:

![Creating an Expression Collection](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Nhập dữ liệu Biểu thức

Tiếp theo, bạn có thể thiết lập một khối bảng và nhập một số mục công thức vào mẫu bộ sưu tập này. Mỗi hàng trong mẫu bộ sưu tập "Biểu thức" có thể được xem là một quy tắc tính toán được thiết kế cho một mô hình dữ liệu cụ thể trong bộ sưu tập. Bạn có thể sử dụng các trường khác nhau từ các mô hình dữ liệu của nhiều bộ sưu tập làm biến số, để tạo ra các biểu thức độc đáo làm quy tắc tính toán. Hơn nữa, bạn có thể tận dụng các công cụ tính toán khác nhau khi cần.

![Entering Expression Data](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Mẹo}
Sau khi tạo công thức, chúng cần được liên kết với dữ liệu nghiệp vụ. Việc liên kết trực tiếp từng hàng dữ liệu nghiệp vụ với dữ liệu công thức có thể khá tẻ nhạt. Vì vậy, một cách tiếp cận phổ biến là sử dụng một bộ sưu tập siêu dữ liệu, tương tự như bộ sưu tập phân loại, để tạo mối quan hệ nhiều-một (hoặc một-một) với bộ sưu tập công thức. Sau đó, dữ liệu nghiệp vụ được liên kết với siêu dữ liệu đã phân loại theo mối quan hệ nhiều-một. Cách này cho phép bạn chỉ cần chỉ định siêu dữ liệu phân loại liên quan khi tạo dữ liệu nghiệp vụ, giúp dễ dàng tìm và sử dụng dữ liệu công thức tương ứng thông qua đường dẫn liên kết đã thiết lập.
:::

## Tải dữ liệu liên quan vào Luồng

Lấy ví dụ về sự kiện bộ sưu tập, hãy tạo một luồng công việc. Khi một đơn hàng được tạo, luồng công việc sẽ được kích hoạt và cần tải trước dữ liệu sản phẩm liên quan đến đơn hàng cùng với dữ liệu biểu thức liên quan đến sản phẩm:

![Collection Event_Trigger Configuration](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)