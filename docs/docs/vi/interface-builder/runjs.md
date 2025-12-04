:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Viết & Chạy JS Trực Tuyến

Trong NocoBase, **RunJS** cung cấp một phương pháp mở rộng nhẹ nhàng, phù hợp cho các tình huống **thử nghiệm nhanh và xử lý logic tạm thời**. Không cần tạo **plugin** hoặc sửa đổi mã nguồn, bạn có thể tùy chỉnh giao diện hoặc tương tác một cách cá nhân hóa thông qua JavaScript.

Với **RunJS**, bạn có thể trực tiếp nhập mã JS vào trình thiết kế giao diện người dùng để đạt được:

- Tùy chỉnh nội dung hiển thị (trường, khối, cột, mục, v.v.)  
- Tùy chỉnh logic tương tác (nhấp nút, liên kết sự kiện)  
- Kết hợp dữ liệu ngữ cảnh để tạo hành vi động  

## Các Tình Huống Được Hỗ Trợ

### Khối JS

Tùy chỉnh hiển thị khối thông qua JS, giúp bạn kiểm soát hoàn toàn cấu trúc và kiểu dáng của khối. Phù hợp để hiển thị các thành phần tùy chỉnh, biểu đồ thống kê, nội dung bên thứ ba và các tình huống linh hoạt cao khác.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)  

Tài liệu: [Khối JS](/interface-builder/blocks/other-blocks/js-block)

### Thao Tác JS

Tùy chỉnh logic nhấp chuột của các nút thao tác thông qua JS, cho phép bạn thực thi bất kỳ thao tác frontend hoặc yêu cầu API nào. Ví dụ: tính toán giá trị động, gửi dữ liệu tùy chỉnh, kích hoạt cửa sổ bật lên, v.v.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)  

Tài liệu: [Thao Tác JS](/interface-builder/actions/types/js-action)

### Trường JS

Tùy chỉnh logic hiển thị của trường thông qua JS. Bạn có thể hiển thị động các kiểu dáng, nội dung hoặc trạng thái khác nhau dựa trên giá trị của trường.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)  

Tài liệu: [Trường JS](/interface-builder/fields/specific/js-field)

### Mục JS

Hiển thị các mục độc lập thông qua JS mà không cần liên kết với các trường cụ thể. Thường được sử dụng để hiển thị các khối thông tin tùy chỉnh.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)  

Tài liệu: [Mục JS](/interface-builder/fields/specific/js-item)

### Cột Bảng JS

Tùy chỉnh hiển thị cột bảng thông qua JS. Có thể triển khai logic hiển thị ô phức tạp, như thanh tiến độ, nhãn trạng thái, v.v.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)  

Tài liệu: [Cột Bảng JS](/interface-builder/fields/specific/js-column)

### Quy Tắc Liên Kết

Kiểm soát logic liên kết giữa các trường trong biểu mẫu hoặc trang thông qua JS. Ví dụ: khi một trường thay đổi, bạn có thể sửa đổi động giá trị hoặc khả năng hiển thị của một trường khác.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)  

Tài liệu: [Quy Tắc Liên Kết](/interface-builder/linkage-rule)

### Luồng Sự Kiện

Tùy chỉnh điều kiện kích hoạt và logic thực thi của luồng sự kiện thông qua JS, xây dựng các chuỗi tương tác frontend phức tạp hơn.

![](https://static-docs.nocobase.com/20251031092755.png)  

Tài liệu: [Luồng Sự Kiện](/interface-builder/event-flow)