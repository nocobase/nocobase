---
pkg: "@nocobase/plugin-calendar"
title: "Block lịch"
description: "Block lịch hiển thị dữ liệu sự kiện và ngày dưới dạng giao diện lịch, phù hợp với việc lên lịch họp, lập kế hoạch sự kiện, cấu hình field tiêu đề, thời gian bắt đầu/kết thúc, lịch âm, phạm vi dữ liệu."
keywords: "Block lịch,giao diện lịch,sự kiện,lên lịch họp,Calendar,NocoBase"
---
# Block lịch

## Giới thiệu

Block lịch hiển thị dữ liệu sự kiện và ngày dưới dạng giao diện lịch, phù hợp với các tình huống như lên lịch họp, lập kế hoạch sự kiện.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Thêm block

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Field tiêu đề: Dùng để hiển thị thông tin trên thanh lịch; hiện hỗ trợ các loại field như `input`, `select`, `phone`, `email`, `radioGroup`, `sequence`, có thể mở rộng các loại field tiêu đề mà block lịch hỗ trợ thông qua plugin.
2. Thời gian bắt đầu: Thời gian bắt đầu của tác vụ.
3. Thời gian kết thúc: Thời gian kết thúc của tác vụ.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Khi bạn nhấp vào thanh tác vụ, thanh tác vụ cùng loại sẽ được làm nổi bật và xuất hiện popup.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Mục cấu hình block

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Hiển thị lịch âm

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

- 
- 

### Thiết lập phạm vi dữ liệu

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Tham khảo thêm tại 

### Thiết lập chiều cao block

Ví dụ: Điều chỉnh chiều cao của block lịch đơn hàng, bên trong block lịch sẽ không xuất hiện thanh cuộn.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Tham khảo thêm tại 

### Field màu nền

:::info{title=Mẹo}
Yêu cầu phiên bản NocoBase v1.4.0-beta trở lên.
:::

Tùy chọn này có thể được sử dụng để cấu hình màu nền của sự kiện lịch. Cách sử dụng như sau:

1. Trong bảng lịch cần có một field kiểu **Dropdown chọn một (Single select)** hoặc **Radio (Radio group)**, field này cần được cấu hình màu sắc.
2. Sau đó, quay lại giao diện cấu hình block lịch, chọn field vừa được cấu hình màu trong **Field màu nền**.
3. Cuối cùng, bạn có thể thử chọn một màu cho sự kiện lịch, sau đó nhấp vào gửi để thấy màu đã có hiệu lực.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Ngày bắt đầu tuần

> Hỗ trợ từ phiên bản v1.7.7 trở lên 

Block lịch hỗ trợ thiết lập ngày bắt đầu của mỗi tuần, có thể chọn **Chủ Nhật** hoặc **Thứ Hai** làm ngày đầu tiên của tuần.  
Ngày bắt đầu mặc định là **Thứ Hai**, giúp bạn điều chỉnh hiển thị lịch theo thói quen của các khu vực khác nhau, phù hợp hơn với nhu cầu sử dụng thực tế.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Cấu hình thao tác

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hôm nay

Nút "Hôm nay" của block lịch cung cấp chức năng điều hướng tiện lợi, cho phép bạn nhanh chóng quay về trang lịch của ngày hiện tại sau khi đã chuyển sang ngày khác.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Chuyển đổi giao diện

Mặc định là tháng

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)
