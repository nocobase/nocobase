:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan về Mở rộng Block

Trong NocoBase 2.0, cơ chế mở rộng block đã được đơn giản hóa đáng kể. Các nhà phát triển chỉ cần kế thừa lớp cơ sở **FlowModel** tương ứng và triển khai các phương thức giao diện liên quan (chủ yếu là phương thức `renderComponent()`) là có thể nhanh chóng tùy chỉnh block.

## Phân loại Block

NocoBase phân loại block thành ba loại, được hiển thị theo nhóm trong giao diện cấu hình:

- **Block Dữ liệu (Data blocks)**: Các block kế thừa từ `DataBlockModel` hoặc `CollectionBlockModel`
- **Block Lọc (Filter blocks)**: Các block kế thừa từ `FilterBlockModel`
- **Block Khác (Other blocks)**: Các block kế thừa trực tiếp từ `BlockModel`

> Việc phân nhóm block được xác định bởi lớp cơ sở tương ứng. Logic phân loại dựa trên quan hệ kế thừa và không yêu cầu cấu hình bổ sung.

## Mô tả Lớp Cơ sở

Hệ thống cung cấp bốn lớp cơ sở để mở rộng:

### BlockModel

**Mô hình Block Cơ bản**, là lớp cơ sở block linh hoạt nhất.

- Phù hợp cho các block chỉ hiển thị và không phụ thuộc vào dữ liệu.
- Được phân loại vào nhóm **Other blocks**.
- Áp dụng cho các kịch bản cá nhân hóa.

### DataBlockModel

**Mô hình Block Dữ liệu (không ràng buộc với bảng dữ liệu)**, dành cho các block có nguồn dữ liệu tùy chỉnh.

- Không trực tiếp ràng buộc với bảng dữ liệu, có thể tùy chỉnh logic truy xuất dữ liệu.
- Được phân loại vào nhóm **Data blocks**.
- Áp dụng cho: gọi API bên ngoài, xử lý dữ liệu tùy chỉnh, biểu đồ thống kê, v.v.

### CollectionBlockModel

**Mô hình Block Bộ sưu tập (Collection Block Model)**, dành cho các block cần ràng buộc với bảng dữ liệu.

- Lớp cơ sở mô hình yêu cầu ràng buộc với bảng dữ liệu.
- Được phân loại vào nhóm **Data blocks**.
- Áp dụng cho: danh sách, biểu mẫu, bảng Kanban và các block khác phụ thuộc rõ ràng vào một bảng dữ liệu cụ thể.

### FilterBlockModel

**Mô hình Block Lọc (Filter Block Model)**, dùng để xây dựng các block điều kiện lọc.

- Lớp cơ sở mô hình dùng để xây dựng các điều kiện lọc.
- Được phân loại vào nhóm **Filter blocks**.
- Thường hoạt động cùng với các block dữ liệu.

## Cách Chọn Lớp Cơ sở

Khi chọn lớp cơ sở, bạn có thể tuân theo các nguyên tắc sau:

- **Cần ràng buộc với một bảng dữ liệu**: Ưu tiên chọn `CollectionBlockModel`.
- **Nguồn dữ liệu tùy chỉnh**: Chọn `DataBlockModel`.
- **Dùng để thiết lập điều kiện lọc và hoạt động cùng với các block dữ liệu**: Chọn `FilterBlockModel`.
- **Không chắc chắn cách phân loại**: Chọn `BlockModel`.

## Bắt đầu Nhanh

Để tạo một block tùy chỉnh, bạn chỉ cần thực hiện ba bước:

1. Kế thừa lớp cơ sở tương ứng (ví dụ: `BlockModel`).
2. Triển khai phương thức `renderComponent()` để trả về một React component.
3. Đăng ký mô hình block trong plugin.

Để xem ví dụ chi tiết, vui lòng tham khảo [Viết một Plugin Block](./write-a-block-plugin).