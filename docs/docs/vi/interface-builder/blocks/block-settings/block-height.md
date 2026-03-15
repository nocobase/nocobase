:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/blocks/block-settings/block-height).
:::

# Chiều cao khối

## Giới thiệu

Chiều cao khối hỗ trợ ba chế độ: **Chiều cao mặc định**, **Chiều cao chỉ định**, và **Toàn màn hình**. Hầu hết các khối đều hỗ trợ thiết lập chiều cao.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Các chế độ chiều cao

### Chiều cao mặc định

Chiến lược chiều cao mặc định khác nhau tùy theo từng loại khối. Ví dụ, các khối Bảng và Biểu mẫu sẽ tự động điều chỉnh chiều cao dựa trên nội dung, và thanh cuộn sẽ không xuất hiện bên trong khối.

### Chiều cao chỉ định

Bạn có thể chỉ định thủ công tổng chiều cao cho khung bên ngoài của khối. Khối sẽ tự động tính toán và phân bổ chiều cao khả dụng bên trong.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Toàn màn hình

Chế độ toàn màn hình tương tự như chiều cao chỉ định, nhưng chiều cao khối sẽ được tính toán dựa trên **vùng hiển thị (viewport)** của trình duyệt hiện tại để đạt được chiều cao tối đa của màn hình. Thanh cuộn sẽ không xuất hiện trên trang trình duyệt, thanh cuộn chỉ xuất hiện bên trong khối.

Cách xử lý cuộn nội bộ trong chế độ toàn màn hình có sự khác biệt nhỏ giữa các khối:

- **Bảng**: Cuộn bên trong `tbody`;
- **Biểu mẫu / Chi tiết**: Cuộn bên trong Grid (cuộn nội dung ngoại trừ khu vực thao tác);
- **Danh sách / Thẻ lưới**: Cuộn bên trong Grid (cuộn nội dung ngoại trừ khu vực thao tác và thanh phân trang);
- **Bản đồ / Lịch**: Chiều cao tự thích ứng tổng thể, không có thanh cuộn;
- **Iframe / Markdown**: Giới hạn tổng chiều cao của khung khối, thanh cuộn xuất hiện bên trong khối.

#### Bảng toàn màn hình

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Biểu mẫu toàn màn hình

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)