---
title: "Nhập bằng Quét mã"
description: "Cài đặt trường: bật nhập bằng quét mã cho các trường biểu mẫu văn bản và hỗ trợ ghi giá trị trường bằng mã QR hoặc mã vạch."
keywords: "nhập bằng quét mã,mã QR,mã vạch,cài đặt trường,trình dựng giao diện,NocoBase"
---

# Nhập bằng Quét mã

## Giới thiệu

Nhập bằng quét mã được dùng cho các trường văn bản trong biểu mẫu có thể chỉnh sửa. Sau khi bật, một nút quét sẽ xuất hiện ở bên phải ô nhập của trường. Người dùng có thể quét mã QR hoặc mã vạch, hoặc chọn một hình ảnh từ album để nhận diện, rồi ghi kết quả nhận diện vào trường hiện tại.

Thông thường, tính năng này phù hợp để nhập số thiết bị, mã tài sản, số đơn hàng, mã vận đơn và các giá trị khác không thuận tiện để nhập thủ công.

## Trường được hỗ trợ

Nhập bằng quét mã chủ yếu được dùng cho các trường dạng văn bản, chẳng hạn:

- Văn bản một dòng
- Số điện thoại di động
- Email
- URL
- UUID
- Nano ID

Nếu trường ở chế độ chỉ đọc, chế độ xem, hoặc bản thân trường không hỗ trợ nhập có thể chỉnh sửa, cấu hình nhập bằng quét mã sẽ không được hiển thị.

## Cấu hình

Chọn trường tương ứng trong khối biểu mẫu, mở menu cấu hình trường, rồi tìm `Cài đặt nhập bằng quét mã`.

Bao gồm:

- `Bật nhập bằng quét mã`: sau khi bật, nút quét sẽ hiển thị ở bên phải ô nhập
- `Tắt nhập thủ công`: sau khi bật, người dùng chỉ có thể ghi giá trị trường bằng cách quét và không thể chỉnh sửa ô nhập thủ công

Sau khi tắt `Bật nhập bằng quét mã`, `Tắt nhập thủ công` cũng sẽ mất hiệu lực.

## Cách sử dụng

Sau khi người dùng nhấp vào nút quét ở bên phải trường, họ có thể dùng camera để nhận diện mã QR hoặc mã vạch. Việc quét trong trình duyệt yêu cầu trang được cấp quyền truy cập camera. Trong môi trường di động hỗ trợ khả năng quét gốc, khả năng quét gốc của thiết bị sẽ được ưu tiên sử dụng.

Nếu không thuận tiện dùng trực tiếp camera, người dùng cũng có thể nhấp vào `Album` để chọn hình ảnh nhận diện.
