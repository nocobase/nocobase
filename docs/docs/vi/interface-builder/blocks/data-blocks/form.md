:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/blocks/data-blocks/form).
:::

# Khối biểu mẫu

## Giới thiệu

Khối biểu mẫu là khối quan trọng được sử dụng để xây dựng giao diện nhập và chỉnh sửa dữ liệu. Nó có tính tùy chỉnh cao, dựa trên mô hình dữ liệu để sử dụng các thành phần tương ứng hiển thị các trường cần thiết. Thông qua các luồng sự kiện như quy tắc liên kết, khối biểu mẫu có thể hiển thị các trường một cách động. Ngoài ra, nó còn có thể kết hợp với luồng công việc để kích hoạt quy trình tự động và xử lý dữ liệu, nâng cao hơn nữa hiệu quả công việc hoặc thực hiện điều phối logic.

## Thêm khối biểu mẫu

- **Chỉnh sửa biểu mẫu**: Dùng để sửa đổi dữ liệu hiện có.
- **Thêm mới biểu mẫu**: Dùng để tạo các mục dữ liệu mới.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Các mục cấu hình khối

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Quy tắc liên kết khối

Kiểm soát hành vi của khối thông qua các quy tắc liên kết (như có hiển thị hay thực thi javaScript hay không).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Tham khảo thêm tại [Quy tắc liên kết khối](/interface-builder/blocks/block-settings/block-linkage-rule)

### Quy tắc liên kết trường

Kiểm soát hành vi của trường biểu mẫu thông qua các quy tắc liên kết.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Tham khảo thêm tại [Quy tắc liên kết trường](/interface-builder/blocks/block-settings/field-linkage-rule)

### Bố cục

Khối biểu mẫu hỗ trợ hai cách bố cục, được thiết lập thông qua thuộc tính `layout`:

- **horizontal** (Bố cục ngang): Bố cục này giúp nhãn và nội dung hiển thị trên cùng một hàng, tiết kiệm không gian dọc, phù hợp với các biểu mẫu đơn giản hoặc trường hợp có ít thông tin.
- **vertical** (Bố cục dọc) (Mặc định): Nhãn nằm phía trên trường, bố cục này giúp biểu mẫu dễ đọc và điền hơn, đặc biệt phù hợp với các biểu mẫu chứa nhiều trường hoặc các mục nhập phức tạp.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Cấu hình trường

### Trường của bộ sưu tập này

> **Lưu ý**: Các trường trong bộ sưu tập kế thừa (tức là trường của bộ sưu tập cha) sẽ tự động được hợp nhất và hiển thị trong danh sách trường hiện tại.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Trường của bộ sưu tập liên kết

> Trường của bộ sưu tập liên kết ở chế độ chỉ đọc trong biểu mẫu, thường được sử dụng cùng với các trường liên kết để hiển thị nhiều giá trị trường của dữ liệu liên quan.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Hiện tại chỉ hỗ trợ quan hệ to-one (như belongsTo / hasOne, v.v.).
- Nó thường được sử dụng phối hợp với trường liên kết (dùng để chọn bản ghi liên quan): thành phần trường liên kết chịu trách nhiệm chọn/thay đổi bản ghi liên quan, trường của bộ sưu tập liên kết chịu trách nhiệm hiển thị thêm thông tin của bản ghi đó (chỉ đọc).

**Ví dụ**: Sau khi chọn "Người phụ trách", số điện thoại, email và các thông tin khác của người phụ trách đó sẽ được hiển thị trong biểu mẫu.

> Trong biểu mẫu chỉnh sửa, ngay cả khi không cấu hình trường liên kết "Người phụ trách", thông tin liên quan tương ứng vẫn có thể được hiển thị. Khi cấu hình trường liên kết "Người phụ trách", việc thay đổi người phụ trách sẽ cập nhật thông tin liên quan tương ứng theo bản ghi mới.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Các trường khác

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Viết javaScript có thể thực hiện tùy chỉnh nội dung hiển thị, giúp trình bày các nội dung phức tạp.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Mẫu trường

Mẫu trường được sử dụng để tái sử dụng cấu hình khu vực trường trong khối biểu mẫu. Chi tiết xem tại [Mẫu trường](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Cấu hình thao tác

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Gửi](/interface-builder/actions/types/submit)
- [Kích hoạt luồng công việc](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)