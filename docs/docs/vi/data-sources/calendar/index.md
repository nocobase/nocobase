---
pkg: "@nocobase/plugin-calendar"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Khối Lịch

## Giới thiệu

Khối Lịch hiển thị các sự kiện và dữ liệu liên quan đến ngày tháng dưới dạng lịch, rất phù hợp cho việc sắp xếp cuộc họp, lên kế hoạch sự kiện và quản lý thời gian hiệu quả.

## Cài đặt

Đây là một plugin được tích hợp sẵn, bạn không cần cài đặt thêm.

## Thêm Khối

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Trường Tiêu đề: Dùng để hiển thị thông tin trên các thanh sự kiện của lịch. Hiện tại, trường này hỗ trợ các loại trường như `input` (Văn bản một dòng), `select` (Chọn một), `phone` (Số điện thoại), `email` (Email), `radioGroup` (Nhóm tùy chọn) và `sequence` (Số thứ tự). Bạn có thể mở rộng các loại trường tiêu đề được hỗ trợ bởi khối lịch thông qua các plugin.
2. Thời gian Bắt đầu: Thời gian bắt đầu của công việc.
3. Thời gian Kết thúc: Thời gian kết thúc của công việc.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Khi nhấp vào một thanh công việc, thanh đó sẽ được làm nổi bật và một cửa sổ bật lên hiển thị chi tiết sẽ xuất hiện.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Cấu hình Khối

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Hiển thị Lịch Âm

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Đặt Phạm vi Dữ liệu

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Để biết thêm thông tin, vui lòng tham khảo [liên kết trống].

### Đặt Chiều cao Khối

Ví dụ: Điều chỉnh chiều cao của khối lịch đơn hàng. Thanh cuộn sẽ không xuất hiện bên trong khối lịch.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Để biết thêm thông tin, vui lòng tham khảo [liên kết trống].

### Trường Màu nền

:::info{title=Mẹo}
Phiên bản NocoBase cần phải là v1.4.0-beta trở lên.
:::

Tùy chọn này dùng để cấu hình màu nền cho các sự kiện trên lịch. Cách sử dụng như sau:

1. Bảng dữ liệu lịch cần có một trường thuộc loại **Chọn một (Single select)** hoặc **Nhóm tùy chọn (Radio group)**, và trường này cần được cấu hình màu sắc.
2. Sau đó, quay lại giao diện cấu hình khối lịch và chọn trường bạn vừa cấu hình màu sắc trong mục **Trường Màu nền**.
3. Cuối cùng, bạn có thể thử chọn một màu cho một sự kiện trên lịch, sau đó nhấp vào gửi. Bạn sẽ thấy màu sắc đã được áp dụng.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Ngày Bắt đầu Tuần

> Hỗ trợ từ phiên bản v1.7.7 trở lên

Khối lịch hỗ trợ cài đặt ngày bắt đầu của tuần, cho phép bạn chọn **Chủ Nhật** hoặc **Thứ Hai** làm ngày đầu tiên trong tuần.
Ngày bắt đầu mặc định là **Thứ Hai**, giúp người dùng dễ dàng điều chỉnh hiển thị lịch theo thói quen của từng khu vực, phù hợp hơn với nhu cầu sử dụng thực tế.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Cấu hình Thao tác

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hôm nay

Nút "Hôm nay" trong Khối Lịch cung cấp chức năng điều hướng tiện lợi, cho phép người dùng nhanh chóng quay lại trang lịch của ngày hiện tại sau khi đã chuyển sang các ngày khác.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Chuyển đổi Chế độ xem

Chế độ xem mặc định là Tháng.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)