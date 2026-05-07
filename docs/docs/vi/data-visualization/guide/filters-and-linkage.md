---
title: "Page Filter và liên kết"
description: "Filter Block nhận các điều kiện lọc đầu vào thống nhất, tự động hợp nhất vào truy vấn biểu đồ, thực hiện lọc nhất quán nhiều biểu đồ và refresh liên kết, hỗ trợ chế độ Builder/SQL."
keywords: "Page Filter,Filter Block,liên kết lọc,liên kết biểu đồ,lọc nhiều biểu đồ,NocoBase"
---

# Page Filter và liên kết

Page Filter (Filter Block) dùng để nhận các điều kiện lọc đầu vào thống nhất ở cấp page, và hợp nhất chúng vào truy vấn biểu đồ, thực hiện lọc nhất quán và liên kết nhiều biểu đồ.

## Tổng quan tính năng
- Thêm "Filter Block" trên trang để cung cấp đầu vào lọc thống nhất cho tất cả các biểu đồ trên trang hiện tại.
- Thực hiện các thao tác áp dụng, xóa và thu gọn thông qua các nút "Lọc", "Đặt lại", "Thu gọn".
- Nếu trong filter có chọn các field liên quan đến biểu đồ, các giá trị của chúng sẽ tự động được hợp nhất vào yêu cầu truy vấn của biểu đồ, kích hoạt refresh biểu đồ.
- Filter cũng có thể tạo các field tùy chỉnh, đăng ký trong các biến context, có thể chọn tham chiếu trong các data block như chart, table, form, v.v.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Để biết thêm về cách sử dụng Page Filter và sự liên kết với các data block như chart, vui lòng tham khảo tài liệu Page Filter.

## Sử dụng giá trị Page Filter trong truy vấn biểu đồ
- Chế độ Builder (Khuyến nghị)
  - Tự động hợp nhất: Khi cùng data source và collection, không cần viết thêm biến trong truy vấn biểu đồ, page filter sẽ được hợp nhất bằng `$and`.
  - Chọn thủ công: Cũng có thể chủ động chọn giá trị "field tùy chỉnh" của Page Filter trong điều kiện lọc.

- Chế độ SQL (Inject qua biến)
  - Trong câu lệnh SQL, "chọn biến" để chèn giá trị của "field tùy chỉnh" của Page Filter.
