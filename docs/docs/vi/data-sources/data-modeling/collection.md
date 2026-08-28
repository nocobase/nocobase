---
title: "Bảng dữ liệu"
description: "Tìm hiểu vai trò của bảng dữ liệu NocoBase, các loại cấu trúc bảng, sự khác biệt giữa cơ sở dữ liệu chính và bảng dữ liệu bên ngoài, cũng như cách lựa chọn bảng thông thường, bảng kế thừa, bảng cây, bảng tệp, bảng SQL và chế độ xem cơ sở dữ liệu."
keywords: "bảng dữ liệu,Collection,bảng thông thường,bảng kế thừa,bảng cây,bảng tệp,bảng SQL,chế độ xem cơ sở dữ liệu,NocoBase"
---

# Bảng dữ liệu

## Giới thiệu

Trong NocoBase, **Collection (bảng dữ liệu)** là mô hình dữ liệu dùng để mô tả một loại dữ liệu nghiệp vụ. Đây không đơn thuần là tên bảng cơ sở dữ liệu, mà là mô tả thống nhất của NocoBase về một loại dữ liệu.

Một Collection thường định nghĩa ba khía cạnh:

| Định nghĩa | Mô tả |
| --- | --- |
| Dữ liệu được lưu ở đâu | Dữ liệu có thể đến từ bảng cơ sở dữ liệu chính, bảng cơ sở dữ liệu bên ngoài, kết quả truy vấn SQL, chế độ xem cơ sở dữ liệu, tài nguyên REST API hoặc ứng dụng NocoBase bên ngoài. |
| Có những trường nào | Các trường mô tả thông tin có trong mỗi bản ghi, chẳng hạn như tên khách hàng, số điện thoại, số tiền đơn hàng, thời gian tạo và người phụ trách. |
| Được NocoBase sử dụng như thế nào | Các khối giao diện, quyền, quy trình công việc, API và trường quan hệ đều hoạt động dựa trên Collection. |

Bạn có thể hiểu Collection là “cấu trúc dữ liệu của đối tượng nghiệp vụ”. Ví dụ, “khách hàng”, “đơn hàng”, “hợp đồng” và “nhiệm vụ” đều có thể là một Collection.

Sau khi tạo hoặc kết nối bảng dữ liệu, thông thường bạn cần tiếp tục thực hiện ba việc:

- Cấu hình các trường để bảng dữ liệu có thể lưu trữ thông tin cần thiết cho nghiệp vụ
- Trong trang, [thêm khối](../../interface-builder/blocks/index.md#添加区块) để người dùng có thể xem, nhập và xử lý dữ liệu
- Cấu hình quyền, quy trình công việc và API để dữ liệu được truy cập và luân chuyển theo các quy tắc nghiệp vụ

## Các loại cấu trúc bảng

- **Bảng thông thường** — phù hợp để lưu trữ dữ liệu nghiệp vụ thông thường như khách hàng, đơn hàng, hợp đồng, phiếu yêu cầu, phiếu hoàn ứng, dự án và nhiệm vụ
- **Bảng cây** — phù hợp để lưu trữ dữ liệu phân cấp cha-con như cơ cấu tổ chức, danh mục sản phẩm, phân cấp khu vực, danh mục phòng ban và danh mục cơ sở tri thức
- **Bảng lịch** — phù hợp để lưu trữ dữ liệu có phạm vi thời gian như đặt phòng họp, lịch trình dự án, lịch học, kế hoạch trực và lịch sự kiện
- **Bảng bình luận** — phù hợp để lưu trữ nội dung thảo luận phát sinh xung quanh các bản ghi nghiệp vụ như bình luận nhiệm vụ, bình luận bài viết, ý kiến phê duyệt và phản hồi của khách hàng; trong bảng nghiệp vụ (bảng thông thường, bảng cây, bảng lịch), tạo [trường quan hệ](./collection-fields/associations/index.md) để liên kết với bảng bình luận, sử dụng trang bật lên của bảng nghiệp vụ để tạo [khối bình luận](../../plugins/@nocobase/plugin-comments/index.md), từ đó bình luận về dữ liệu nghiệp vụ
- **Bảng tệp** — phù hợp để lưu trữ siêu dữ liệu tệp như tệp đính kèm hợp đồng, tệp hóa đơn, hình ảnh sản phẩm và giấy tờ nhân viên; tệp thực tế được lưu bởi công cụ lưu trữ tệp; trong bảng nghiệp vụ (bảng thông thường, bảng cây, bảng lịch), tạo [trường quan hệ](./collection-fields/associations/index.md) để liên kết với bảng tệp, sử dụng bảng nghiệp vụ để tạo khối và cấu hình trường quan hệ nhằm tải tệp lên, siêu dữ liệu tệp sẽ tự động được lưu vào bảng tệp
- **Chế độ xem cơ sở dữ liệu** — các view đã có trong cơ sở dữ liệu, chẳng hạn như chế độ xem báo cáo tài chính, chế độ xem khách hàng đã lọc và chế độ xem tổng hợp sau khi đồng bộ giữa các hệ thống
- **Bảng SQL** — phù hợp để sử dụng kết quả truy vấn SQL như tổng hợp doanh số, cảnh báo tồn kho, báo cáo thống kê liên bảng và bảng điều khiển vận hành làm bảng dữ liệu
- **Bảng kế thừa** — nhiều loại đối tượng nghiệp vụ dùng chung một nhóm trường chung, đồng thời mỗi loại lại có các trường riêng, chẳng hạn như bảng cha tài sản dẫn xuất thành tài sản máy tính, tài sản xe cộ và nội thất văn phòng
