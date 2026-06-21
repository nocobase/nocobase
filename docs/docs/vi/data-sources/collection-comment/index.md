---
pkg: "@nocobase/plugin-comments"
title: "Bảng bình luận"
description: "Bảng bình luận lưu trữ bình luận và phản hồi của người dùng, hỗ trợ văn bản giàu định dạng, liên kết với bất kỳ Collection nào, bình luận đa cấp, theo dõi người dùng, thêm khả năng thảo luận cho các bản ghi dữ liệu."
keywords: "Bảng bình luận,chức năng bình luận,bình luận giàu định dạng,bình luận đa cấp,Collection Comment,NocoBase"
---
# Bảng bình luận

## Giới thiệu

Bảng bình luận là một mẫu Collection chuyên dụng để lưu trữ bình luận và phản hồi của người dùng. Thông qua chức năng bình luận, bạn có thể thêm khả năng bình luận cho bất kỳ Collection nào, cho phép người dùng thảo luận, phản hồi hoặc ghi chú về các bản ghi cụ thể. Bảng bình luận hỗ trợ chỉnh sửa văn bản giàu định dạng, cung cấp khả năng tạo nội dung linh hoạt.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Đặc điểm chức năng

- **Chỉnh sửa giàu định dạng**: Mặc định bao gồm trình chỉnh sửa Markdown (vditor), hỗ trợ tạo nội dung giàu định dạng
- **Liên kết với bất kỳ Collection nào**: Có thể liên kết bình luận với bản ghi của bất kỳ Collection nào thông qua Field quan hệ
- **Bình luận đa cấp**: Hỗ trợ trả lời bình luận, xây dựng cấu trúc cây bình luận
- **Theo dõi người dùng**: Tự động ghi lại người tạo bình luận và thời gian tạo

## Hướng dẫn sử dụng

### Tạo bảng bình luận

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Vào trang quản lý Collection
2. Nhấp vào nút "Tạo Collection mới"
3. Chọn mẫu "Bảng bình luận"
4. Nhập tên bảng (ví dụ: "Bình luận tác vụ", "Bình luận bài viết", v.v.)
5. Hệ thống sẽ tự động tạo bảng bình luận với các Field mặc định sau:
   - Nội dung bình luận (kiểu Markdown vditor)
   - Người tạo (liên kết với bảng người dùng)
   - Thời gian tạo (kiểu datetime)

### Cấu hình quan hệ liên kết

Để bình luận có thể liên kết với Collection mục tiêu, cần cấu hình Field quan hệ:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Thêm Field quan hệ "ManyToOne" vào bảng bình luận
2. Chọn Collection mục tiêu cần liên kết (ví dụ: bảng tác vụ, bảng bài viết, v.v.)
3. Đặt tên Field (ví dụ: "Thuộc tác vụ", "Thuộc bài viết", v.v.)

### Sử dụng block bình luận trong trang

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Vào trang cần thêm chức năng bình luận
2. Thêm block trong chi tiết hoặc popup của bản ghi mục tiêu
3. Chọn loại block "Bình luận"
4. Chọn Collection bình luận vừa tạo


### Các tình huống ứng dụng điển hình

- **Hệ thống quản lý tác vụ**: Thành viên nhóm thảo luận và phản hồi về tác vụ
- **Hệ thống quản lý nội dung**: Độc giả bình luận và tương tác với bài viết
- **Quy trình phê duyệt**: Người phê duyệt thêm chú thích và ý kiến vào đơn yêu cầu
- **Phản hồi của khách hàng**: Thu thập đánh giá của khách hàng về sản phẩm hoặc dịch vụ

## Lưu ý

- Bảng bình luận là tính năng plugin thương mại, cần kích hoạt plugin bình luận để sử dụng
- Khuyến nghị thiết lập quyền phù hợp cho bảng bình luận, kiểm soát ai có thể xem, tạo và xóa bình luận
- Đối với các tình huống có nhiều bình luận, khuyến nghị bật tải phân trang để cải thiện hiệu suất
