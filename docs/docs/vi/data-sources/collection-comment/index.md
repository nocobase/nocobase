---
pkg: "@nocobase/plugin-comments"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Bộ sưu tập Bình luận

## Giới thiệu

Bộ sưu tập Bình luận là một mẫu bảng dữ liệu chuyên biệt, được thiết kế để lưu trữ các bình luận và phản hồi từ người dùng. Với tính năng bình luận, bạn có thể thêm khả năng bình luận vào bất kỳ bảng dữ liệu nào, cho phép người dùng thảo luận, cung cấp phản hồi hoặc chú thích về các bản ghi cụ thể. Bộ sưu tập Bình luận hỗ trợ chỉnh sửa văn bản đa dạng, mang lại khả năng tạo nội dung linh hoạt.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Tính năng nổi bật

- **Chỉnh sửa văn bản đa dạng**: Mặc định bao gồm trình soạn thảo Markdown (vditor), hỗ trợ tạo nội dung văn bản đa dạng.
- **Liên kết với bất kỳ bảng dữ liệu nào**: Bạn có thể liên kết các bình luận với các bản ghi trong bất kỳ bảng dữ liệu nào thông qua các trường quan hệ.
- **Bình luận đa cấp**: Hỗ trợ trả lời bình luận, xây dựng cấu trúc cây bình luận.
- **Theo dõi người dùng**: Tự động ghi lại người tạo bình luận và thời gian tạo.

## Hướng dẫn sử dụng

### Tạo bộ sưu tập Bình luận

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Truy cập trang quản lý bảng dữ liệu.
2. Nhấp vào nút 「Tạo bộ sưu tập」.
3. Chọn mẫu 「Bộ sưu tập Bình luận」.
4. Nhập tên bảng (ví dụ: 「Bình luận Nhiệm vụ」, 「Bình luận Bài viết」, v.v.).
5. Hệ thống sẽ tự động tạo một bộ sưu tập bình luận với các trường mặc định sau:
   - Nội dung bình luận (kiểu Markdown vditor)
   - Người tạo (liên kết với bảng người dùng)
   - Thời gian tạo (kiểu ngày giờ)

### Cấu hình quan hệ liên kết

Để liên kết các bình luận với bảng dữ liệu mục tiêu, bạn cần cấu hình các trường quan hệ:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Trong bộ sưu tập Bình luận, thêm trường quan hệ 「Nhiều-một」.
2. Chọn bảng dữ liệu mục tiêu để liên kết (ví dụ: bảng nhiệm vụ, bảng bài viết, v.v.).
3. Đặt tên trường (ví dụ: 「Thuộc Nhiệm vụ」, 「Thuộc Bài viết」, v.v.).

### Sử dụng khối Bình luận trên trang

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Truy cập trang bạn muốn thêm tính năng bình luận.
2. Thêm một khối trong chi tiết hoặc cửa sổ bật lên của bản ghi mục tiêu.
3. Chọn kiểu khối 「Bình luận」.
4. Chọn bộ sưu tập bình luận mà bạn vừa tạo.

### Các trường hợp sử dụng điển hình

- **Hệ thống quản lý nhiệm vụ**: Thành viên nhóm thảo luận và cung cấp phản hồi về nhiệm vụ.
- **Hệ thống quản lý nội dung**: Độc giả bình luận và tương tác với bài viết.
- **Luồng công việc phê duyệt**: Người phê duyệt chú thích và đưa ra ý kiến về các đơn đăng ký.
- **Phản hồi của khách hàng**: Thu thập đánh giá của khách hàng về sản phẩm hoặc dịch vụ.

## Lưu ý

- Bộ sưu tập Bình luận là một tính năng của plugin thương mại và yêu cầu plugin bình luận phải được bật để sử dụng.
- Nên đặt quyền phù hợp cho bộ sưu tập bình luận để kiểm soát ai có thể xem, tạo và xóa bình luận.
- Đối với các trường hợp có số lượng bình luận lớn, nên bật phân trang để cải thiện hiệu suất.