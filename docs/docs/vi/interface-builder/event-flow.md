:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Luồng sự kiện

## Giới thiệu

Nếu bạn muốn kích hoạt các thao tác tùy chỉnh khi một biểu mẫu thay đổi, bạn có thể sử dụng luồng sự kiện. Ngoài biểu mẫu, các trang, khối, nút và trường đều có thể dùng luồng sự kiện để cấu hình các thao tác tùy chỉnh.

## Cách sử dụng

Chúng ta hãy cùng xem một ví dụ đơn giản để hiểu cách cấu hình luồng sự kiện. Chúng ta sẽ tạo liên kết giữa hai bảng, khi bạn nhấp vào một hàng trong bảng bên trái, dữ liệu trong bảng bên phải sẽ tự động được lọc.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Các bước cấu hình như sau:

1.  Nhấp vào biểu tượng "tia chớp" ở góc trên bên phải của khối bảng bên trái để mở giao diện cấu hình luồng sự kiện.
    ![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2.  Nhấp vào "Thêm luồng sự kiện (Add event flow)", chọn "Nhấp vào hàng (Row click)" làm "Sự kiện kích hoạt (Trigger event)". Điều này có nghĩa là luồng sẽ được kích hoạt khi một hàng trong bảng được nhấp.
    ![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3.  "Điều kiện kích hoạt (Trigger condition)" dùng để cấu hình các điều kiện. Luồng sự kiện chỉ được kích hoạt khi các điều kiện này được đáp ứng. Trong ví dụ này, chúng ta không cần cấu hình bất kỳ điều kiện nào, vì vậy luồng sẽ kích hoạt khi bất kỳ hàng nào được nhấp.
    ![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4.  Di chuột qua "Thêm bước (Add step)" để thêm các bước thao tác. Chúng ta chọn "Đặt phạm vi dữ liệu (Set data scope)" để cấu hình phạm vi dữ liệu cho bảng bên phải.
    ![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5.  Sao chép UID của bảng bên phải và dán vào trường nhập "UID khối mục tiêu (Target block UID)". Một bảng cấu hình điều kiện sẽ xuất hiện ngay bên dưới, nơi bạn có thể cấu hình phạm vi dữ liệu cho bảng bên phải.
    ![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6.  Hãy cấu hình một điều kiện như hình dưới đây:
    ![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7.  Sau khi cấu hình phạm vi dữ liệu, bạn cần làm mới khối để hiển thị kết quả đã lọc. Tiếp theo, hãy cấu hình làm mới khối bảng bên phải. Thêm bước "Làm mới khối mục tiêu (Refresh target blocks)", sau đó nhập UID của bảng bên phải.
    ![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
    ![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8.  Cuối cùng, nhấp vào nút lưu ở góc dưới bên phải để hoàn tất cấu hình.

## Các loại sự kiện

### Trước khi hiển thị (Before render)

Một sự kiện chung có thể được sử dụng trong các trang, khối, nút hoặc trường. Bạn có thể dùng sự kiện này cho các tác vụ khởi tạo, chẳng hạn như cấu hình các phạm vi dữ liệu khác nhau dựa trên các điều kiện khác nhau.

### Nhấp vào hàng (Row click)

Sự kiện dành riêng cho khối bảng. Kích hoạt khi một hàng trong bảng được nhấp. Khi được kích hoạt, nó sẽ thêm một "Clicked row record" vào ngữ cảnh, có thể được sử dụng làm biến trong các điều kiện và bước.

### Giá trị biểu mẫu thay đổi (Form values change)

Sự kiện dành riêng cho khối biểu mẫu. Kích hoạt khi giá trị của các trường biểu mẫu thay đổi. Bạn có thể truy cập các giá trị biểu mẫu thông qua biến "Current form" trong các điều kiện và bước.

### Nhấp (Click)

Sự kiện dành riêng cho nút. Kích hoạt khi nút được nhấp.

## Các loại bước

### Biến tùy chỉnh (Custom variable)

Tạo một biến tùy chỉnh để sử dụng trong ngữ cảnh.

#### Phạm vi

Các biến tùy chỉnh có phạm vi. Ví dụ, một biến được định nghĩa trong luồng sự kiện của một khối chỉ có thể được sử dụng trong khối đó. Nếu bạn muốn biến đó khả dụng trên tất cả các khối trong trang hiện tại, bạn cần cấu hình nó trong luồng sự kiện của trang.

#### Biến biểu mẫu (Form variable)

Sử dụng các giá trị từ một khối biểu mẫu làm biến. Cấu hình cụ thể như sau:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

-   Variable title: Tiêu đề biến
-   Variable identifier: Định danh biến
-   Form UID: UID biểu mẫu

#### Các biến khác

Các loại biến khác sẽ được hỗ trợ trong tương lai. Hãy cùng chờ đón.

### Đặt phạm vi dữ liệu (Set data scope)

Đặt phạm vi dữ liệu cho một khối mục tiêu. Cấu hình cụ thể như sau:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

-   Target block UID: UID khối mục tiêu
-   Condition: Điều kiện lọc

### Làm mới khối mục tiêu (Refresh target blocks)

Làm mới các khối mục tiêu. Có thể cấu hình nhiều khối. Cấu hình cụ thể như sau:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

-   Target block UID: UID khối mục tiêu

### Điều hướng đến URL (Navigate to URL)

Điều hướng đến một URL. Cấu hình cụ thể như sau:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

-   URL: URL đích, hỗ trợ sử dụng biến
-   Search parameters: Tham số truy vấn trong URL
-   Open in new window: Nếu được chọn, sẽ mở URL trong một tab trình duyệt mới khi điều hướng

### Hiển thị thông báo (Show message)

Hiển thị thông báo phản hồi thao tác trên toàn cục.

#### Khi nào sử dụng

-   Cung cấp các thông báo phản hồi như thành công, cảnh báo và lỗi.
-   Hiển thị ở giữa phía trên và tự động biến mất, đây là một cách thông báo nhẹ nhàng, không làm gián đoạn thao tác của người dùng.

#### Cấu hình cụ thể

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

-   Message type: Loại thông báo
-   Message content: Nội dung thông báo
-   Duration: Thời gian hiển thị (tính bằng giây)

### Hiển thị thông báo nhắc nhở (Show notification)

Hiển thị thông báo nhắc nhở trên toàn cục.

#### Khi nào sử dụng

Hiển thị thông báo nhắc nhở ở bốn góc của hệ thống. Thường được sử dụng trong các trường hợp sau:

-   Nội dung thông báo phức tạp.
-   Thông báo có tính tương tác, cung cấp cho người dùng các điểm hành động tiếp theo.
-   Thông báo do hệ thống chủ động đẩy.

#### Cấu hình cụ thể

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

-   Notification type: Loại thông báo
-   Notification title: Tiêu đề thông báo
-   Notification description: Mô tả thông báo
-   Placement: Vị trí, các tùy chọn: trên cùng bên trái, trên cùng bên phải, dưới cùng bên trái, dưới cùng bên phải

### Thực thi JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Thực thi mã JavaScript.