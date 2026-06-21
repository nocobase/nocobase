---
title: "Bắt đầu nhanh với Trực quan hóa Dữ liệu"
description: "Cấu hình biểu đồ từ đầu: thêm chart block, cấu hình truy vấn dữ liệu (measure/dimension), chạy truy vấn, ánh xạ field, preview và lưu, hoàn thành dashboard đầu tiên trong 5 bước."
keywords: "Bắt đầu nhanh trực quan hóa dữ liệu,cấu hình biểu đồ,measure,dimension,ánh xạ field,bắt đầu nhanh,NocoBase"
---

# Bắt đầu nhanh

Hãy bắt đầu cấu hình một biểu đồ từ đầu, sẽ sử dụng các tính năng cơ bản cần thiết, các khả năng tùy chọn khác sẽ được trình bày trong các chương sau.

Chuẩn bị trước:
- Đã cấu hình data source và collection (bảng dữ liệu), và có quyền đọc.

## Thêm chart block

Trong page designer, click "Thêm block", chọn "Biểu đồ", thêm một chart block.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Sau khi thêm, click "Cấu hình" ở góc trên bên phải block.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Mở panel cấu hình biểu đồ ở bên phải. Bao gồm ba phần: Truy vấn dữ liệu, Tùy chọn biểu đồ, Sự kiện.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Cấu hình truy vấn dữ liệu
Trong panel "Truy vấn dữ liệu", có thể cấu hình data source, điều kiện lọc truy vấn, v.v.

- Đầu tiên chọn data source và collection
  - Chọn data source và collection trong panel "Truy vấn dữ liệu" làm nền tảng truy vấn.
  - Nếu collection không thể chọn hoặc rỗng, hãy ưu tiên kiểm tra xem đã được tạo và quyền của người dùng hiện tại.

- Cấu hình Measures
  - Chọn một hoặc nhiều field số làm measure.
  - Đặt tổng hợp cho mỗi measure: Sum / Count / Avg / Max / Min.

- Cấu hình Dimensions
  - Chọn một hoặc nhiều field làm dimension nhóm (ngày, danh mục, khu vực, v.v.).
  - Field ngày/giờ có thể đặt định dạng (như `YYYY-MM`, `YYYY-MM-DD`) để dễ dàng hiển thị nhất quán.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Các điều kiện khác: Lọc, Sắp xếp, Phân trang là tùy chọn.


## Chạy truy vấn và xem dữ liệu

- Click "Chạy truy vấn" để yêu cầu dữ liệu và render biểu đồ preview (preview trực tiếp ở trang bên trái).
- Có thể click "Xem dữ liệu" để preview kết quả dữ liệu trả về, hỗ trợ chuyển đổi giữa định dạng Table/JSON. Click lại để thu gọn preview dữ liệu.
- Khi kết quả dữ liệu trống hoặc không đúng như mong đợi, hãy quay lại panel truy vấn để kiểm tra quyền collection, ánh xạ field measure/dimension và kiểu dữ liệu.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Cấu hình tùy chọn biểu đồ

Trong panel "Tùy chọn biểu đồ", có thể chọn biểu đồ và cấu hình các tùy chọn biểu đồ.

- Đầu tiên chọn loại biểu đồ (line/area, bar/column, pie/doughnut, scatter, v.v.).
- Hoàn thành ánh xạ field cốt lõi:
  - line/area/bar/column: `xField` (dimension), `yField` (measure), `seriesField` (series, tùy chọn)
  - pie/doughnut: `Category` (dimension phân loại), `Value` (measure)
  - scatter: `xField`, `yField` (hai measure hoặc dimension)
  - Có thể tham khảo tài liệu Echarts [Axis](https://echarts.apache.org/handbook/en/concepts/axis) để xem thêm các cấu hình
- Sau khi click "Chạy truy vấn" trước đó, ánh xạ field sẽ tự động hoàn thành mặc định; sau khi thay đổi dimension/measure vui lòng xác nhận lại ánh xạ.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Preview và lưu
Các thay đổi cấu hình mặc định sẽ tự động cập nhật preview theo thời gian thực, có thể xem biểu đồ ở trang bên trái. Tuy nhiên hãy lưu ý rằng trước khi click nút "Lưu", tất cả các thay đổi chưa thực sự được lưu.

Bạn cũng có thể click các nút ở phía dưới:

- Preview: Các thay đổi cấu hình sẽ tự động refresh preview theo thời gian thực, bạn cũng có thể click nút "Preview" ở phía dưới để kích hoạt refresh thủ công.
- Hủy: Nếu bạn không muốn các thay đổi cấu hình hiện tại, có thể click nút "Hủy" ở phía dưới hoặc refresh trang, các thay đổi sẽ được hoàn tác về trạng thái lưu lần trước.
- Lưu: Click "Lưu" để thực sự lưu tất cả các cấu hình truy vấn và biểu đồ hiện tại vào database, có hiệu lực với tất cả người dùng.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Lưu ý thường gặp

- Cấu hình tối thiểu khả dụng: Chọn collection + ít nhất một measure; khuyến nghị thêm dimension để dễ dàng hiển thị nhóm.
- Khuyến nghị đặt định dạng phù hợp cho dimension ngày (như chọn `YYYY-MM` cho thống kê theo tháng), tránh trục ngang không liên tục hoặc lộn xộn.
- Truy vấn trống hoặc biểu đồ không hiển thị:
  - Kiểm tra collection/quyền và ánh xạ field;
  - Trong "Xem dữ liệu" xác nhận tên cột và kiểu có khớp với ánh xạ biểu đồ không.
- Preview là trạng thái tạm thời: chỉ dùng để xác minh và điều chỉnh, sau khi click "Lưu" mới chính thức có hiệu lực.
