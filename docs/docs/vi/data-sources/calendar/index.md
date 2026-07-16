---
pkg: "@nocobase/plugin-calendar"
title: "Khối lịch"
description: "Khối lịch hiển thị dữ liệu sự kiện và ngày tháng dưới dạng lịch, phù hợp với việc sắp xếp cuộc họp, lập kế hoạch hoạt động, cấu hình trường tiêu đề, thời gian bắt đầu/kết thúc, âm lịch và phạm vi dữ liệu."
keywords: "Khối lịch, chế độ xem lịch, sự kiện, sắp xếp cuộc họp, Calendar,NocoBase"
---
# Khối lịch

## Giới thiệu

Khối lịch hiển thị dữ liệu liên quan đến sự kiện và ngày tháng dưới dạng lịch, phù hợp với các tình huống như sắp xếp cuộc họp và lập kế hoạch hoạt động.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Thêm khối

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Trường tiêu đề: Dùng để hiển thị thông tin trên thanh lịch; hiện hỗ trợ các loại trường `input`, `select`, `phone`, `email`, `radioGroup`,`sequence` và có thể mở rộng các loại trường tiêu đề được khối lịch hỗ trợ thông qua plugin.
2. Thời gian bắt đầu: Thời gian bắt đầu của tác vụ;
3. Thời gian kết thúc: Thời gian kết thúc của tác vụ;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Nhấp vào thanh tác vụ, thanh tác vụ của cùng một tác vụ sẽ được tô sáng và một cửa sổ bật lên sẽ xuất hiện.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Các mục cấu hình khối

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Hiển thị âm lịch

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Cài đặt phạm vi dữ liệu

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Tham khảo thêm

### Cài đặt chiều cao khối

Ví dụ: điều chỉnh chiều cao của khối lịch đơn hàng để bên trong khối lịch không xuất hiện thanh cuộn.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Tham khảo thêm

### Trường màu nền

:::info{title=提示}
Cần sử dụng phiên bản NocoBase v1.4.0-beta trở lên.
:::

Tùy chọn này dùng để cấu hình màu nền cho các sự kiện trên lịch. Cách sử dụng như sau:

1. Trong bảng dữ liệu lịch cần có một trường kiểu **Danh sách chọn một (Single select)** hoặc **Nhóm nút radio (Radio group)**; trường này cần được cấu hình màu.
2. Sau đó, quay lại giao diện cấu hình khối lịch và chọn trường đã được cấu hình màu trong **Trường màu nền**.
3. Cuối cùng, hãy thử chọn một màu cho một sự kiện trên lịch rồi nhấp vào gửi; bạn sẽ thấy màu đã có hiệu lực.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Ngày bắt đầu tuần

> Phiên bản v1.7.7 trở lên hỗ trợ

Khối lịch hỗ trợ thiết lập ngày bắt đầu của mỗi tuần, có thể chọn **Chủ nhật** hoặc **Thứ hai** làm ngày đầu tiên trong tuần.
Ngày bắt đầu mặc định là **Thứ hai**, giúp người dùng điều chỉnh cách hiển thị lịch theo thói quen của từng khu vực và phù hợp hơn với nhu cầu sử dụng thực tế.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Cấu hình thao tác

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hôm nay

Nút "Hôm nay" của khối lịch cung cấp chức năng điều hướng tiện lợi, cho phép người dùng nhanh chóng quay lại trang lịch chứa ngày hiện tại sau khi chuyển sang các ngày khác.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Chuyển đổi chế độ xem

Mặc định là tháng

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)
