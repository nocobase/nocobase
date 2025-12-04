:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Vòng đời

Phần này tổng hợp các hook vòng đời của plugin ở cả phía máy chủ và phía máy khách, giúp nhà phát triển đăng ký và giải phóng tài nguyên một cách chính xác.

Có thể so sánh với vòng đời của FlowModel để làm nổi bật các khái niệm chung.

## Nội dung đề xuất

- Các callback được kích hoạt khi plugin được cài đặt, kích hoạt, vô hiệu hóa hoặc gỡ cài đặt.
- Thời điểm gắn kết, cập nhật và hủy bỏ của các thành phần phía máy khách.
- Các khuyến nghị để xử lý các tác vụ bất đồng bộ và lỗi trong vòng đời.