:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Khối Biểu mẫu

## Giới thiệu

Khối Biểu mẫu là một khối quan trọng dùng để xây dựng giao diện nhập liệu và chỉnh sửa dữ liệu. Khối này có khả năng tùy chỉnh cao, sử dụng các thành phần tương ứng để hiển thị các trường cần thiết dựa trên mô hình dữ liệu. Thông qua các luồng sự kiện như quy tắc liên kết, Khối Biểu mẫu có thể hiển thị các trường một cách linh hoạt. Ngoài ra, khối này còn có thể kết hợp với các luồng công việc để kích hoạt các quy trình tự động và xử lý dữ liệu, từ đó nâng cao hiệu quả công việc hoặc sắp xếp logic.

## Thêm Khối Biểu mẫu

- **Chỉnh sửa biểu mẫu**: Dùng để sửa đổi dữ liệu hiện có.
- **Thêm biểu mẫu**: Dùng để tạo các mục dữ liệu mới.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Cấu hình Khối

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Quy tắc liên kết khối

Kiểm soát hành vi của khối (ví dụ: có hiển thị hay thực thi JavaScript hay không) thông qua các quy tắc liên kết.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Để biết thêm chi tiết, tham khảo [Quy tắc liên kết khối](/interface-builder/blocks/block-settings/block-linkage-rule)

### Quy tắc liên kết trường

Kiểm soát hành vi của trường biểu mẫu thông qua các quy tắc liên kết.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Để biết thêm chi tiết, tham khảo [Quy tắc liên kết trường](/interface-builder/blocks/block-settings/field-linkage-rule)

### Bố cục

Khối Biểu mẫu hỗ trợ hai chế độ bố cục, có thể được thiết lập thông qua thuộc tính `layout`:

- **horizontal** (bố cục ngang): Bố cục này hiển thị nhãn và nội dung trên cùng một hàng, giúp tiết kiệm không gian dọc, phù hợp với các biểu mẫu đơn giản hoặc trường hợp có ít thông tin.
- **vertical** (bố cục dọc) (mặc định): Nhãn được đặt phía trên trường. Bố cục này giúp biểu mẫu dễ đọc và điền hơn, đặc biệt phù hợp với các biểu mẫu có nhiều trường hoặc các mục nhập phức tạp.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Cấu hình Trường

### Trường của bộ sưu tập này

> **Lưu ý**: Các trường từ các bộ sưu tập kế thừa (tức là các trường của bộ sưu tập cha) sẽ tự động được hợp nhất và hiển thị trong danh sách trường hiện tại.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Các trường khác

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Viết JavaScript để tùy chỉnh nội dung hiển thị và trình bày thông tin phức tạp.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Cấu hình Thao tác

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Gửi](/interface-builder/actions/types/submit)
- [Kích hoạt luồng công việc](/interface-builder/actions/types/trigger-workflow)
- [Thao tác JS](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)