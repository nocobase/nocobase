:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quy tắc Liên kết Thao tác

## Giới thiệu

Quy tắc liên kết thao tác cho phép người dùng kiểm soát trạng thái của một thao tác (như hiển thị, bật, ẩn, tắt, v.v.) một cách linh hoạt dựa trên các điều kiện cụ thể. Bằng cách cấu hình các quy tắc này, người dùng có thể liên kết hành vi của các nút thao tác với bản ghi hiện tại, vai trò người dùng hoặc dữ liệu ngữ cảnh.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Hướng dẫn sử dụng

Khi điều kiện được đáp ứng (mặc định sẽ được thông qua nếu không có điều kiện nào được đặt), hệ thống sẽ kích hoạt việc thực thi các cài đặt thuộc tính hoặc JavaScript. Hỗ trợ sử dụng hằng số và biến trong phần đánh giá điều kiện.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Quy tắc này hỗ trợ sửa đổi các thuộc tính của nút.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Hằng số

Ví dụ: Không cho phép chỉnh sửa các đơn hàng đã thanh toán.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Biến

### Biến hệ thống

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Ví dụ 1: Kiểm soát hiển thị của nút dựa trên loại thiết bị hiện tại.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Ví dụ 2: Nút cập nhật hàng loạt trên tiêu đề bảng của khối đơn hàng chỉ dành cho vai trò Quản trị viên; các vai trò khác không thể thực hiện thao tác này.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Biến ngữ cảnh

Ví dụ: Nút Thêm trên cơ hội đơn hàng (khối liên kết) chỉ được bật khi trạng thái đơn hàng là "Chờ thanh toán" hoặc "Bản nháp". Trong các trạng thái khác, nút sẽ bị tắt.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Để biết thêm thông tin về biến, vui lòng tham khảo [Biến](/interface-builder/variables).