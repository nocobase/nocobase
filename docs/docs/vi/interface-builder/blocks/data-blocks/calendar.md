---
pkg: "@nocobase/plugin-calendar"
title: "Block Calendar"
description: "Block Calendar hiển thị dữ liệu sự kiện và ngày tháng theo dạng xem lịch, phù hợp với các tình huống như sắp xếp cuộc họp, kế hoạch hoạt động, hỗ trợ cấu hình Field tiêu đề, thời gian bắt đầu/kết thúc, hiển thị âm lịch và phạm vi dữ liệu."
keywords: "Block Calendar, dạng xem lịch, quản lý sự kiện, sắp xếp cuộc họp, Calendar, NocoBase"
---

# Block Calendar

## Giới thiệu

Block Calendar hiển thị sự kiện và dữ liệu liên quan đến ngày tháng theo dạng xem lịch trực quan, phù hợp với các tình huống điển hình như sắp xếp cuộc họp, kế hoạch hoạt động.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)

## Cài đặt

Block này là Plugin tích hợp sẵn, không cần cài đặt thêm.

## Thêm Block

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

Chọn Block "Calendar" và chỉ định bảng dữ liệu tương ứng để hoàn thành việc tạo.

## Cấu hình Block

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### Field tiêu đề

Dùng để hiển thị thông tin tiêu đề trên thanh sự kiện lịch.

Các loại Field hiện được hỗ trợ bao gồm: `input`, `select`, `phone`, `email`, `radioGroup`, `sequence` v.v., cũng hỗ trợ mở rộng thêm các loại khác thông qua Plugin.

### Field ngày bắt đầu

Dùng để chỉ định thời gian bắt đầu của sự kiện.

### Field ngày kết thúc

Dùng để chỉ định thời gian kết thúc của sự kiện.

### Tạo sự kiện nhanh

Nhấp vào khu vực ngày trống trong lịch, có thể nhanh chóng bật lớp phủ để tạo sự kiện.

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

Khi nhấp vào sự kiện hiện có:
- Sự kiện hiện tại sẽ được làm nổi bật
- Đồng thời bật cửa sổ chi tiết, thuận tiện cho việc xem hoặc chỉnh sửa

### Hiển thị âm lịch

Sau khi bật, lịch sẽ hiển thị thông tin âm lịch tương ứng.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### Phạm vi dữ liệu

Dùng để giới hạn phạm vi dữ liệu được hiển thị trong Block Calendar.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

Để biết thêm thông tin, vui lòng tham khảo: [Cấu hình phạm vi dữ liệu](/interface-builder/blocks/block-settings/data-scope)

### Chiều cao Block

Có thể tùy chỉnh chiều cao Block Calendar, tránh xuất hiện thanh cuộn bên trong, nâng cao trải nghiệm bố cục tổng thể.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

Để biết thêm thông tin, vui lòng tham khảo: [Chiều cao Block](/interface-builder/blocks/block-settings/block-height)

### Field màu

Dùng để cấu hình màu nền của sự kiện lịch, nâng cao khả năng phân biệt hình ảnh.

Các bước sử dụng:

1. Trong bảng dữ liệu, thêm một Field **Single select** hoặc **Radio group**, và cấu hình màu cho các tùy chọn;
2. Trong cấu hình Block Calendar, đặt Field đó làm "Field màu";
3. Khi tạo hoặc chỉnh sửa sự kiện, chọn màu, và sẽ có hiệu lực trong lịch.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### Ngày bắt đầu tuần

Hỗ trợ thiết lập ngày bắt đầu của mỗi tuần, có thể chọn:
- Chủ nhật
- Thứ hai (mặc định)

Có thể điều chỉnh theo thói quen sử dụng của các khu vực khác nhau, để hiển thị lịch phù hợp hơn với nhu cầu thực tế.


## Cấu hình Action

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### Hôm nay

Nhấp nút "Hôm nay", có thể nhanh chóng nhảy về dạng xem lịch của ngày hiện tại.

### Chuyển trang

Chuyển đổi thời gian theo chế độ xem hiện tại:
- Dạng xem tháng: Tháng trước / Tháng sau
- Dạng xem tuần: Tuần trước / Tuần sau
- Dạng xem ngày: Hôm qua / Ngày mai

### Chọn dạng xem

Hỗ trợ chuyển đổi giữa các dạng xem sau:
- Dạng xem tháng (mặc định)
- Dạng xem tuần
- Dạng xem ngày

### Tiêu đề

Dùng để hiển thị ngày tương ứng với dạng xem hiện tại.
