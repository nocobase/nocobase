---
title: "Preview và Lưu"
description: "Preview render tạm thời cấu hình để xác minh hiệu quả, lưu ghi vào database để có hiệu lực; chế độ trực quan tự động preview, chế độ SQL/Custom cần preview thủ công; debounce và thông báo lỗi."
keywords: "preview,lưu,cấu hình có hiệu lực,debounce,cấu hình biểu đồ,NocoBase"
---

# Preview và Lưu

* Preview: Render tạm thời các thay đổi trong panel cấu hình lên biểu đồ trên trang để xác minh hiệu quả.
* Lưu: Thực sự lưu các thay đổi trong panel cấu hình vào database.

## Điểm vào thao tác

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

- Tất cả các thay đổi của chế độ cấu hình trực quan mặc định sẽ tự động thực hiện preview có hiệu lực.
- Sau khi sửa chế độ SQL, chế độ Custom, có thể click nút Preview ở bên phải để thực hiện preview có hiệu lực.
- Ở phía dưới toàn bộ panel cấu hình, cung cấp nút "Preview" thống nhất.

## Hành vi preview
- Hiển thị cấu hình tạm thời lên trang nhưng không ghi vào database. Sau khi refresh trang hoặc hủy thao tác, kết quả preview sẽ không được giữ lại.
- Có sẵn debounce: Trong thời gian ngắn kích hoạt nhiều lần refresh, chỉ thực hiện lần cuối cùng, tránh request thường xuyên.
- Click "Preview" lại sẽ ghi đè kết quả preview lần trước.

## Thông báo lỗi
- Lỗi truy vấn hoặc xác thực thất bại: Hiển thị thông tin lỗi trong khu vực "Xem dữ liệu".
- Lỗi cấu hình biểu đồ (thiếu ánh xạ Basic, lỗi JS Custom): Hiển thị lỗi trong khu vực biểu đồ hoặc console, giữ trang có thể thao tác.
- Trước tiên xác nhận tên cột và kiểu dữ liệu trong "Xem dữ liệu", sau đó tiến hành ánh xạ field hoặc viết code Custom có thể giảm hiệu quả các lỗi.

## Lưu và Hủy
- Lưu: Ghi các thay đổi của panel hiện tại vào cấu hình block và lập tức có hiệu lực trên trang.
- Hủy: Hoàn tác các thay đổi chưa lưu của panel hiện tại, khôi phục về trạng thái lưu lần trước.
- Phạm vi lưu:
  - Truy vấn dữ liệu: Tham số truy vấn của Builder; trong chế độ SQL đồng thời lưu cả văn bản SQL.
  - Tùy chọn biểu đồ: Loại và ánh xạ field của Basic, các thuộc tính; văn bản JS của Custom.
  - Sự kiện tương tác: Văn bản JS của sự kiện và logic binding.
- Sau khi lưu, block sẽ có hiệu lực với tất cả người truy cập (tùy theo cài đặt quyền của trang).

## Đường dẫn thao tác khuyến nghị
- Cấu hình truy vấn dữ liệu → Chạy truy vấn → Truy vấn dữ liệu xác nhận tên cột và kiểu → Cấu hình tùy chọn biểu đồ ánh xạ field cốt lõi → Preview xác minh → Lưu có hiệu lực.
