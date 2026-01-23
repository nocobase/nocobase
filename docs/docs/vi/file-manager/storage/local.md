:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Công cụ lưu trữ: Lưu trữ cục bộ

Các tệp được tải lên sẽ được lưu trữ trong một thư mục cục bộ trên ổ cứng của máy chủ. Giải pháp này phù hợp cho các tình huống mà tổng dung lượng tệp tải lên do hệ thống quản lý là nhỏ hoặc cho mục đích thử nghiệm.

## Tham số cấu hình

![Ví dụ cấu hình công cụ lưu trữ tệp](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Lưu ý}
Phần này chỉ giới thiệu các tham số dành riêng cho công cụ lưu trữ cục bộ. Để biết các tham số chung, vui lòng tham khảo [Tham số công cụ chung](./index.md#tham-số-công-cụ-chung).
:::

### Đường dẫn

Thể hiện cả đường dẫn tương đối để lưu trữ tệp trên máy chủ và đường dẫn truy cập URL. Ví dụ, "`user/avatar`" (không cần dấu gạch chéo ở đầu hoặc cuối) thể hiện:

1. Đường dẫn tương đối trên máy chủ nơi các tệp tải lên được lưu trữ: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Tiền tố URL để truy cập các tệp: `http://localhost:13000/storage/uploads/user/avatar`.