:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Thiết lập Phạm vi Dữ liệu

## Giới thiệu

Việc thiết lập phạm vi dữ liệu cho một trường liên kết tương tự như việc thiết lập phạm vi dữ liệu cho một block. Nó đặt các điều kiện lọc mặc định cho dữ liệu liên kết.

## Hướng dẫn sử dụng

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Giá trị tĩnh

Ví dụ: Chỉ những sản phẩm chưa bị xóa mới có thể được chọn để liên kết.

> Danh sách trường bao gồm các trường từ bộ sưu tập mục tiêu của trường liên kết.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Giá trị biến

Ví dụ: Chỉ những sản phẩm có ngày dịch vụ sau ngày đặt hàng mới có thể được chọn để liên kết.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Để biết thêm thông tin về biến, tham khảo [Biến](/interface-builder/variables)

### Liên kết Trường Liên kết

Việc liên kết giữa các trường liên kết được thực hiện bằng cách thiết lập phạm vi dữ liệu.

Ví dụ: Bộ sưu tập Đơn hàng có một trường liên kết Một-nhiều "Sản phẩm Cơ hội" và một trường liên kết Nhiều-một "Cơ hội". Bộ sưu tập Sản phẩm Cơ hội cũng có một trường liên kết Nhiều-một "Cơ hội". Trong block biểu mẫu đơn hàng, dữ liệu có thể chọn cho "Sản phẩm Cơ hội" sẽ được lọc để chỉ hiển thị các sản phẩm cơ hội liên kết với "Cơ hội" đang được chọn trong biểu mẫu.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)